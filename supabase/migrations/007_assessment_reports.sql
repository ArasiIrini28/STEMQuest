-- Fixed-length attempts and immutable report snapshots. All scoring stays server-side.
create table public.quiz_runs(
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles on delete cascade,
 lesson_id text not null references public.lessons, title text not null, subject text not null, level text not null,
 started_at timestamptz not null default clock_timestamp(), ended_at timestamptz,
 questions jsonb not null, responses jsonb not null default '{}', report jsonb,
 check(jsonb_typeof(questions)='array' and jsonb_array_length(questions)>0)
);
create unique index quiz_one_active on public.quiz_runs(student_id,lesson_id) where ended_at is null;
create index quiz_owner_date on public.quiz_runs(student_id,started_at desc);
create table public.learning_reports(
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles on delete cascade,
 report_key text not null, document jsonb not null, created_at timestamptz not null default clock_timestamp(),
 unique(student_id,report_key)
);
create index reports_owner_date on public.learning_reports(student_id,created_at desc);
alter table public.quiz_runs enable row level security;
alter table public.learning_reports enable row level security;
create policy quiz_own on public.quiz_runs for select to authenticated using(student_id=auth.uid());
create policy reports_own on public.learning_reports for select to authenticated using(student_id=auth.uid());
grant select on public.quiz_runs,public.learning_reports to authenticated;
revoke insert,update,delete on public.quiz_runs,public.learning_reports from anon,authenticated;

create function public.start_quiz(lesson_key text) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.quiz_runs; l public.lessons; questions jsonb; subject_key text; level_key text;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 select * into q from public.quiz_runs where student_id=auth.uid() and lesson_id=lesson_key and ended_at is null;
 if found then return to_jsonb(q)-'student_id';end if;
 select * into l from public.lessons where id=lesson_key and published;
 if not found then raise exception 'Published lesson unavailable';end if;
 select c.subject_id,c.level_id into subject_key,level_key from public.topics t join public.courses c on c.id=t.course_id where t.id=l.topic_id;
 select jsonb_agg((a.content-'answer')||jsonb_build_object('id',a.id,'kind',a.kind,'xp',a.xp) order by a.id) into questions from public.activities a where a.lesson_id=lesson_key and a.xp>0;
 if questions is null then raise exception 'This lesson has no scored quiz activities';end if;
 insert into public.quiz_runs(student_id,lesson_id,title,subject,level,questions) values(auth.uid(),lesson_key,l.title,subject_key,level_key,questions) returning * into q;
 return to_jsonb(q)-'student_id';
end$$;

create function public.submit_quiz_answer(quiz_id uuid,question_id text,answer jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.quiz_runs; result jsonb; report_doc jsonb; total integer; right_count integer; answered integer; earned integer; mastered integer; today_xp integer; tz text; finished timestamptz; accuracy numeric; attempt_no integer; items jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 -- Same lock order as rewards/start: profile first, attempt second.
 perform 1 from public.profiles where id=auth.uid() for update;
 select * into q from public.quiz_runs where id=quiz_id and student_id=auth.uid() for update;
 if not found then raise exception 'Quiz unavailable';end if;
 if q.responses ? question_id then return to_jsonb(q)-'student_id';end if;
 if q.ended_at is not null then raise exception 'Quiz already complete';end if;
 if not exists(select 1 from jsonb_array_elements(q.questions) x where x->>'id'=question_id) then raise exception 'Question not part of this quiz';end if;
 result:=public.submit_activity(q.lesson_id,question_id,answer)||jsonb_build_object('at',clock_timestamp());
 q.responses:=q.responses||jsonb_build_object(question_id,result);
 select count(*),count(*) filter(where (value->>'correct')::boolean),coalesce(sum((value->>'xp')::integer),0),count(*) filter(where (value->>'xp')::integer>0) into answered,right_count,earned,mastered from jsonb_each(q.responses);
 total:=jsonb_array_length(q.questions);
 if answered=total then
  finished:=clock_timestamp();accuracy:=round(100.0*right_count/total,1);
  select coalesce(settings->>'timezone','UTC') into tz from public.profiles where id=auth.uid();
  select coalesce(sum(amount),0) into today_xp from public.xp_transactions where student_id=auth.uid() and (created_at at time zone tz)::date=(finished at time zone tz)::date;
  select count(*)+1 into attempt_no from public.quiz_runs where student_id=auth.uid() and lesson_id=q.lesson_id and ended_at is not null;
  select jsonb_agg(jsonb_build_object('id',x->>'id','prompt',x->>'prompt','explanation',x->>'explanation','correct',(q.responses->(x->>'id')->>'correct')::boolean)) into items from jsonb_array_elements(q.questions) x;
  report_doc:=jsonb_build_object('id',q.id,'kind','assessment','lessonId',q.lesson_id,'subject',q.subject,'title',q.title,'level',q.level,'completedAt',finished,'timezone',tz,'attempt',attempt_no,'total',total,'correct',right_count,'incorrect',answered-right_count,'unanswered',total-answered,'accuracy',accuracy,'xp',earned,'todayXp',today_xp,'completed',mastered,'required',total,'items',items,'recommendation',case when accuracy<50 then 'Review the foundation and worked explanation, then try guided practice.' when accuracy<70 then 'Try guided practice and review each missed question.' when accuracy<85 then 'Revise the missed questions, then reassess.' else 'Consider a related challenge; sustained mastery needs evidence across questions.' end);
  q.ended_at:=finished;q.report:=report_doc;
  insert into public.learning_reports(id,student_id,report_key,document) values(q.id,auth.uid(),'quiz:'||q.id,report_doc) on conflict(student_id,report_key) do nothing;
 end if;
 update public.quiz_runs set responses=q.responses,ended_at=q.ended_at,report=q.report where id=q.id;
 return to_jsonb(q)-'student_id';
end$$;

create function public.sync_subject_reports() returns jsonb language plpgsql security definer set search_path='' as $$
declare g record; required_keys text[]; mastered integer; total integer; right_count integer; earned integer; today_xp integer; tz text; stamp timestamptz:=clock_timestamp(); report_key_value text; doc jsonb; new_id uuid; added jsonb:='[]';
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 select coalesce(settings->>'timezone','UTC') into tz from public.profiles where id=auth.uid();
 for g in select c.subject_id,c.level_id from public.lessons l join public.topics t on t.id=l.topic_id join public.courses c on c.id=t.course_id where l.published group by c.subject_id,c.level_id loop
  select array_agg(a.lesson_id||':'||a.id order by a.lesson_id,a.id) into required_keys from public.activities a join public.lessons l on l.id=a.lesson_id join public.topics t on t.id=l.topic_id join public.courses c on c.id=t.course_id where l.published and a.xp>0 and c.subject_id=g.subject_id and c.level_id=g.level_id;
  if required_keys is null then continue;end if;
  select count(*) into mastered from public.learning_progress where student_id=auth.uid() and (lesson_id||':'||activity_id)=any(required_keys);
  if mastered<>cardinality(required_keys) then continue;end if;
  report_key_value:='subject:'||g.subject_id||':'||g.level_id||':'||md5(array_to_string(required_keys,'|'));
  if exists(select 1 from public.learning_reports where student_id=auth.uid() and report_key=report_key_value) then continue;end if;
  select count(*),count(*) filter(where correct),coalesce(sum(xp),0) into total,right_count,earned from public.assessment_attempts where student_id=auth.uid() and (lesson_id||':'||activity_id)=any(required_keys);
  select coalesce(sum(amount),0) into today_xp from public.xp_transactions where student_id=auth.uid() and (created_at at time zone tz)::date=(stamp at time zone tz)::date;
  new_id:=gen_random_uuid();
  doc:=jsonb_build_object('id',new_id,'kind','subject','subject',g.subject_id,'title',g.subject_id||' · '||g.level_id,'level',g.level_id,'completedAt',stamp,'timezone',tz,'attempt',1,'total',total,'correct',right_count,'incorrect',total-right_count,'unanswered',0,'accuracy',case when total>0 then round(100.0*right_count/total,1) else null end,'xp',earned,'todayXp',today_xp,'completed',mastered,'required',cardinality(required_keys),'items','[]'::jsonb,'recommendation','All configured scored activities at this subject and level are mastered. Explore another subject or revisit a quiz to check retention.');
  insert into public.learning_reports(id,student_id,report_key,document) values(new_id,auth.uid(),report_key_value,doc);
  added:=added||jsonb_build_array(doc);
 end loop;
 return added;
end$$;
revoke execute on function public.start_quiz(text),public.submit_quiz_answer(uuid,text,jsonb),public.sync_subject_reports() from public,anon;
grant execute on function public.start_quiz(text),public.submit_quiz_answer(uuid,text,jsonb),public.sync_subject_reports() to authenticated;
