-- STEMQuest schema. Apply with Supabase CLI, in order. Never run with a browser key.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create type public.app_role as enum ('student','teacher','guardian','admin');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Explorer' check (char_length(display_name) between 1 and 30),
 role public.app_role not null default 'student',
 settings jsonb not null default '{"level":"Middle school","grade":"Grade 7","timezone":"Asia/Kolkata","ageBand":"16–17","goal":15,"leaderboard":false,"reminders":false,"quietStart":20,"quietEnd":8}',
 onboarded boolean not null default false, consent_verified boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.subjects(id text primary key,title text not null,color text not null);
create table public.grade_levels(id text primary key,title text not null);
create table public.courses(id text primary key,subject_id text not null references public.subjects,level_id text not null references public.grade_levels,title text not null);
create table public.topics(id text primary key,course_id text not null references public.courses,title text not null);
create table public.lessons(id text primary key,topic_id text not null references public.topics,title text not null,content jsonb not null,published boolean not null default false);
create table public.activities(id text not null,lesson_id text not null references public.lessons on delete cascade,kind text not null,content jsonb not null,xp integer not null check(xp between 0 and 100),primary key(lesson_id,id));
create table private.answer_keys(lesson_id text not null,activity_id text not null,answer jsonb not null,primary key(lesson_id,activity_id),foreign key(lesson_id,activity_id) references public.activities(lesson_id,id) on delete cascade);
create table public.classes(id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.profiles on delete cascade,name text not null check(char_length(name) between 1 and 80),created_at timestamptz default now());
create table public.class_memberships(class_id uuid references public.classes on delete cascade,student_id uuid references public.profiles on delete cascade,joined_at timestamptz default now(),primary key(class_id,student_id));
create table public.guardian_students(guardian_id uuid references public.profiles on delete cascade,student_id uuid references public.profiles on delete cascade,consent_verified_by uuid references public.profiles on delete set null,created_at timestamptz default now(),primary key(guardian_id,student_id),check(guardian_id<>student_id));
create table private.invitations(token text primary key default gen_random_uuid()::text||gen_random_uuid()::text,kind text not null check(kind in ('class','guardian')),class_id uuid references public.classes on delete cascade,student_id uuid references public.profiles on delete cascade,created_by uuid not null references public.profiles on delete cascade,expires_at timestamptz not null default now()+interval '48 hours',used_by uuid references public.profiles,used_at timestamptz);
create table public.assessment_attempts(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles on delete cascade,lesson_id text not null,activity_id text not null,correct boolean not null,score integer not null check(score between 0 and 100),xp integer not null default 0,created_at timestamptz not null default now(),foreign key(lesson_id,activity_id) references public.activities(lesson_id,id));
create index attempts_student_date on public.assessment_attempts(student_id,created_at desc);
create table public.student_answers(attempt_id uuid primary key references public.assessment_attempts on delete cascade,student_id uuid not null references public.profiles on delete cascade,answer jsonb not null);
create table public.learning_progress(student_id uuid references public.profiles on delete cascade,lesson_id text,activity_id text,completed_at timestamptz not null default now(),primary key(student_id,lesson_id,activity_id),foreign key(lesson_id,activity_id) references public.activities(lesson_id,id));
create table public.xp_transactions(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles on delete cascade,lesson_id text not null,activity_id text not null,amount integer not null check(amount>0),created_at timestamptz not null default now(),unique(student_id,lesson_id,activity_id),foreign key(lesson_id,activity_id) references public.activities(lesson_id,id));
create index xp_student_date on public.xp_transactions(student_id,created_at desc);
create table public.coin_transactions(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles on delete cascade,xp_transaction_id uuid unique not null references public.xp_transactions on delete cascade,amount integer not null check(amount>=0),created_at timestamptz default now());
create table public.daily_activity(student_id uuid references public.profiles on delete cascade,day date not null,timezone text not null,first_completed_at timestamptz not null default now(),primary key(student_id,day));
create table public.achievements(id text primary key,title text not null,threshold integer not null check(threshold>0));
create table public.student_achievements(student_id uuid references public.profiles on delete cascade,achievement_id text references public.achievements,earned_at timestamptz default now(),primary key(student_id,achievement_id));
create table public.assignments(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes on delete cascade,lesson_id text not null references public.lessons,title text not null check(char_length(title)<=150),due_at timestamptz not null,created_by uuid not null references public.profiles on delete cascade,created_at timestamptz default now());
create table public.submissions(id uuid primary key default gen_random_uuid(),assignment_id uuid not null references public.assignments on delete cascade,student_id uuid not null references public.profiles on delete cascade,content text not null check(char_length(content)<=5000),feedback text,submitted_at timestamptz default now(),unique(assignment_id,student_id));
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,title text not null,body text not null,read_at timestamptz,created_at timestamptz default now());
create table public.announcements(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes on delete cascade,author_id uuid not null references public.profiles on delete cascade,body text not null check(char_length(body) between 1 and 2000),created_at timestamptz default now());
create table public.reminder_preferences(user_id uuid primary key references public.profiles on delete cascade,enabled boolean not null default false,frequency text not null default 'daily' check(frequency in ('daily','weekly')),quiet_start integer not null default 20 check(quiet_start between 0 and 23),quiet_end integer not null default 8 check(quiet_end between 0 and 23),unsubscribed_at timestamptz);
create table private.email_delivery_logs(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,kind text not null,period text not null,status text not null default 'pending' check(status in ('pending','sending','sent','failed')),attempts integer not null default 0,provider_id text,error text,claimed_at timestamptz,sent_at timestamptz,created_at timestamptz default now(),unique(user_id,kind,period));
create table private.ai_usage_logs(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles on delete cascade,created_at timestamptz not null default now(),status text not null default 'reserved');
create index ai_usage_user_time on private.ai_usage_logs(user_id,created_at);
create table public.moderation_reports(id uuid primary key default gen_random_uuid(),reporter_id uuid references public.profiles on delete set null,description text not null check(char_length(description) between 10 and 2000),status text not null default 'open',created_at timestamptz default now());

create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
create function private.teaches(cid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.classes where id=cid and teacher_id=auth.uid())$$;
create function private.member_of(cid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.class_memberships where class_id=cid and student_id=auth.uid())$$;
create function private.can_read_student(sid uuid) returns boolean language sql stable security definer set search_path='' as $$select sid=auth.uid() or private.is_admin() or exists(select 1 from public.class_memberships m join public.classes c on c.id=m.class_id where m.student_id=sid and c.teacher_id=auth.uid()) or exists(select 1 from public.guardian_students where student_id=sid and guardian_id=auth.uid())$$;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(),private.teaches(uuid),private.member_of(uuid),private.can_read_student(uuid) to authenticated;
-- Helpers are fixed-search-path security-definer functions, avoiding recursive policies.
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(private.can_read_student(id));
-- No client UPDATE/INSERT policy: settings and roles use separate validated RPCs.
create policy profiles_admin on public.profiles for update to authenticated using(private.is_admin()) with check(private.is_admin());
DO $$declare t text; begin foreach t in array array['subjects','grade_levels','courses','topics','lessons','activities','achievements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy content_read on public.%I for select to authenticated using (true)',t);
 execute format('create policy content_admin on public.%I for all to authenticated using (private.is_admin()) with check(private.is_admin())',t);
end loop;end$$;
drop policy content_read on public.lessons;
create policy lessons_read on public.lessons for select to authenticated using(published or private.is_admin());
drop policy content_read on public.activities;
create policy activities_read on public.activities for select to authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id and l.published) or private.is_admin());
DO $$declare t text;begin foreach t in array array['assessment_attempts','learning_progress','xp_transactions','coin_transactions','daily_activity','student_achievements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy progress_read on public.%I for select to authenticated using(private.can_read_student(student_id))',t);
end loop;end$$;
alter table public.student_answers enable row level security;
create policy answers_read on public.student_answers for select to authenticated using(private.can_read_student(student_id));
alter table public.classes enable row level security;
create policy classes_read on public.classes for select to authenticated using(teacher_id=auth.uid() or private.member_of(id) or private.is_admin());
alter table public.class_memberships enable row level security;
create policy members_read on public.class_memberships for select to authenticated using(student_id=auth.uid() or private.teaches(class_id) or private.is_admin());
alter table public.guardian_students enable row level security;
create policy guardians_read on public.guardian_students for select to authenticated using(guardian_id=auth.uid() or student_id=auth.uid() or private.is_admin());
alter table public.assignments enable row level security;
create policy assignments_read on public.assignments for select to authenticated using(private.teaches(class_id) or private.member_of(class_id) or private.is_admin());
create policy assignments_write on public.assignments for insert to authenticated with check(created_by=auth.uid() and private.teaches(class_id));
create policy assignments_update on public.assignments for update to authenticated using(private.teaches(class_id)) with check(private.teaches(class_id) and created_by=auth.uid());
alter table public.submissions enable row level security;
create policy submissions_read on public.submissions for select to authenticated using(student_id=auth.uid() or exists(select 1 from public.assignments a where a.id=assignment_id and private.teaches(a.class_id)));
create policy submissions_insert on public.submissions for insert to authenticated with check(student_id=auth.uid() and exists(select 1 from public.assignments a where a.id=assignment_id and private.member_of(a.class_id)));
alter table public.notifications enable row level security;
create policy notification_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy notification_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.announcements enable row level security;
create policy announcement_read on public.announcements for select to authenticated using(private.teaches(class_id) or private.member_of(class_id));
create policy announcement_write on public.announcements for insert to authenticated with check(author_id=auth.uid() and private.teaches(class_id));
alter table public.reminder_preferences enable row level security;
create policy reminders_read on public.reminder_preferences for select to authenticated using(user_id=auth.uid());
alter table public.moderation_reports enable row level security;
create policy report_insert on public.moderation_reports for insert to authenticated with check(reporter_id=auth.uid());
create policy report_read on public.moderation_reports for select to authenticated using(reporter_id=auth.uid() or private.is_admin());
-- All private tables are inaccessible directly, even where public schema defaults are permissive.
revoke all on all tables in schema private from public,anon,authenticated;
revoke all on all tables in schema public from anon;
grant select on all tables in schema public to authenticated;
grant insert,update on public.assignments to authenticated;
grant insert on public.submissions,public.announcements,public.moderation_reports to authenticated;
grant update(read_at) on public.notifications to authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.profiles(id) values(new.id);
 insert into public.reminder_preferences(user_id) values(new.id);
 return new;
end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public,anon,authenticated;

create function public.save_profile(settings jsonb) returns void language plpgsql security definer set search_path='' as $$declare uid uuid:=auth.uid(); tz text; cleaned jsonb;begin
 if uid is null then raise exception 'Sign in first';end if;
 if char_length(trim(settings->>'name')) not between 1 and 30 then raise exception 'Nickname must contain 1–30 characters';end if;
 if settings->>'level' not in ('Primary','Middle school','Secondary','Higher secondary','College') then raise exception 'Invalid learning level';end if;
 tz:=settings->>'timezone'; if not exists(select 1 from pg_timezone_names where name=tz) then raise exception 'Invalid timezone';end if;
 if (settings->>'goal')::int not in (5,15,30) or (settings->>'quietStart')::int not between 0 and 23 or (settings->>'quietEnd')::int not between 0 and 23 then raise exception 'Invalid preference';end if;
 cleaned:=jsonb_build_object('name',trim(settings->>'name'),'level',settings->>'level','grade',left(settings->>'grade',30),'ageBand',left(settings->>'ageBand',10),'country',left(settings->>'country',60),'curriculum',left(settings->>'curriculum',60),'language','English','interests',settings->'interests','goal',(settings->>'goal')::int,'timezone',tz,'quietStart',(settings->>'quietStart')::int,'quietEnd',(settings->>'quietEnd')::int,'leaderboard',coalesce((settings->>'leaderboard')::boolean,false),'reminders',coalesce((settings->>'reminders')::boolean,false),'reducedMotion',coalesce((settings->>'reducedMotion')::boolean,false),'sound',coalesce((settings->>'sound')::boolean,false));
 update public.profiles set display_name=trim(settings->>'name'),settings=cleaned,onboarded=true where id=uid;
 insert into public.reminder_preferences(user_id,enabled,quiet_start,quiet_end) values(uid,coalesce((settings->>'reminders')::boolean,false),(settings->>'quietStart')::int,(settings->>'quietEnd')::int) on conflict(user_id) do update set enabled=excluded.enabled,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,unsubscribed_at=case when excluded.enabled then null else now() end;
end$$;

create function public.submit_activity(lesson_key text,activity_key text,answer jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); a public.activities; expected jsonb; ok boolean:=false; earned integer:=0; inserted integer; tx uuid; att uuid; tz text; x integer:=0; y integer:=4; cmd text; n integer; code text; m text[]; count_done integer;
begin
 if uid is null then raise exception 'Sign in first';end if;
 if octet_length(answer::text)>8000 then raise exception 'Answer is too large';end if;
 select coalesce(settings->>'timezone','UTC') into tz from public.profiles where id=uid for update;
 if (select count(*) from public.assessment_attempts where student_id=uid and created_at>now()-interval '1 minute')>=30 then raise exception 'Take a breath and try again in a minute';end if;
 select aa.* into a from public.activities aa join public.lessons l on l.id=aa.lesson_id where aa.lesson_id=lesson_key and aa.id=activity_key and l.published;
 if not found then raise exception 'Activity not available';end if;
 select k.answer into expected from private.answer_keys k where k.lesson_id=lesson_key and k.activity_id=activity_key;
 if a.kind='maze' then
  if jsonb_typeof(answer)='array' and jsonb_array_length(answer) between 1 and 40 then
   ok:=true;
   for cmd in select jsonb_array_elements_text(answer) loop
    if cmd='up' then y:=y-1;elsif cmd='down' then y:=y+1;elsif cmd='left' then x:=x-1;elsif cmd='right' then x:=x+1;else ok:=false;exit;end if;
    if x<0 or x>4 or y<0 or y>4 or (y*5+x)=any(array[1,6,8,16,13,18,21]) then ok:=false;exit;end if;
   end loop;
   ok:=ok and x=4 and y=0;
  end if;
 elsif a.kind='code' then
  code:=trim(answer#>>'{}');
  m:=regexp_match(code,E'^for\\s+i\\s+in\\s+range\\(([0-9]{1,2})\\):\\s*\\n[ \\t]+print\\(i\\)\\s*$');
  if m is not null then n:=m[1]::int;ok:=n<=30 and n=(expected#>>'{}')::int;end if;
 elsif a.kind='multi' then
  if jsonb_typeof(answer)='array' then ok:=(select array_agg(v order by v) from jsonb_array_elements_text(answer) v)=(select array_agg(v order by v) from jsonb_array_elements_text(expected) v);end if;
 elsif a.kind in ('order','match') then ok:=answer=expected;
 elsif a.kind in ('project','flashcard') then raise exception 'This activity is ungraded practice';
 else ok:=lower(trim(answer#>>'{}'))=lower(trim(expected#>>'{}'));
 end if;
 ok:=coalesce(ok,false);
 if ok then
  insert into public.learning_progress(student_id,lesson_id,activity_id) values(uid,lesson_key,activity_key) on conflict do nothing;
  get diagnostics inserted=row_count;
  if inserted=1 and a.xp>0 then
   earned:=a.xp;
   insert into public.xp_transactions(student_id,lesson_id,activity_id,amount) values(uid,lesson_key,activity_key,earned) returning id into tx;
   insert into public.coin_transactions(student_id,xp_transaction_id,amount) values(uid,tx,earned/5);
   insert into public.daily_activity(student_id,day,timezone) values(uid,(now() at time zone tz)::date,tz) on conflict do nothing;
   select count(*) into count_done from public.learning_progress where student_id=uid;
   insert into public.student_achievements(student_id,achievement_id) select uid,id from public.achievements where threshold<=count_done on conflict do nothing;
  end if;
 end if;
 insert into public.assessment_attempts(student_id,lesson_id,activity_id,correct,score,xp) values(uid,lesson_key,activity_key,ok,case when ok then 100 else 0 end,earned) returning id into att;
 insert into public.student_answers(attempt_id,student_id,answer) values(att,uid,answer);
 return jsonb_build_object('correct',ok,'xp',earned);
end$$;

create function public.learning_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$declare uid uuid:=auth.uid(); p public.profiles;begin
 if uid is null then raise exception 'Sign in first';end if;
 select * into p from public.profiles where id=uid;
 return jsonb_build_object('profile',p.settings||jsonb_build_object('name',p.display_name,'role',p.role),'onboarded',p.onboarded,
 'xp',coalesce((select sum(amount) from public.xp_transactions where student_id=uid),0),
 'coins',coalesce((select sum(amount) from public.coin_transactions where student_id=uid),0),
 'completed',coalesce((select jsonb_agg(lesson_id||':'||activity_id) from public.learning_progress where student_id=uid),'[]'),
 'days',coalesce((select jsonb_agg(day::text order by day) from public.daily_activity where student_id=uid),'[]'),
 'attempts',coalesce((select jsonb_agg(jsonb_build_object('lessonId',lesson_id,'activityId',activity_id,'correct',correct,'score',score,'xp',xp,'at',created_at) order by created_at) from public.assessment_attempts where student_id=uid),'[]'),
 'readNotifications','[]'::jsonb);
end$$;

create function public.class_leaderboard(period text default 'weekly') returns table(display_name text,xp bigint) language plpgsql security definer set search_path='' as $$declare since timestamptz;begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 since:=case period when 'daily' then date_trunc('day',now() at time zone 'UTC') at time zone 'UTC' when 'weekly' then now()-interval '7 days' when 'monthly' then now()-interval '30 days' when 'all time' then '-infinity'::timestamptz else now()-interval '7 days' end;
 return query select p.display_name,sum(x.amount)::bigint from public.profiles p join public.xp_transactions x on x.student_id=p.id where x.created_at>=since and coalesce((p.settings->>'leaderboard')::boolean,false) and exists(select 1 from public.class_memberships m where m.student_id=p.id and (private.member_of(m.class_id) or private.teaches(m.class_id))) group by p.id,p.display_name order by sum(x.amount) desc,p.id limit 50;
end$$;

create function public.create_class(class_name text) returns jsonb language plpgsql security definer set search_path='' as $$declare c public.classes;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')) then raise exception 'Verified teacher role required';end if;
 insert into public.classes(teacher_id,name) values(auth.uid(),trim(class_name)) returning * into c;
 return to_jsonb(c);
end$$;
create function public.create_class_invite(target_class uuid) returns text language plpgsql security definer set search_path='' as $$declare tok text;begin
 if not private.teaches(target_class) then raise exception 'Teacher permission required';end if;
 insert into private.invitations(kind,class_id,created_by) values('class',target_class,auth.uid()) returning token into tok;return tok;
end$$;
create function public.accept_class_invite(invite_token text) returns void language plpgsql security definer set search_path='' as $$declare inv private.invitations;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='student') then raise exception 'Student account required';end if;
 select * into inv from private.invitations where token=invite_token and kind='class' and used_at is null and expires_at>now() for update;
 if not found then raise exception 'Invitation is invalid or expired';end if;
 insert into public.class_memberships(class_id,student_id) values(inv.class_id,auth.uid()) on conflict do nothing;
 update private.invitations set used_at=now(),used_by=auth.uid() where token=invite_token;
end$$;
create function public.create_guardian_invite(target_student uuid) returns text language plpgsql security definer set search_path='' as $$declare tok text;begin
 if not private.is_admin() then raise exception 'Administrator consent review required';end if;
 if not exists(select 1 from public.profiles where id=target_student and consent_verified) then raise exception 'Verified consent required';end if;
 insert into private.invitations(kind,student_id,created_by) values('guardian',target_student,auth.uid()) returning token into tok;return tok;
end$$;
create function public.accept_guardian_invite(invite_token text) returns void language plpgsql security definer set search_path='' as $$declare inv private.invitations;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='guardian') then raise exception 'Verified guardian account required';end if;
 select * into inv from private.invitations where token=invite_token and kind='guardian' and used_at is null and expires_at>now() for update;
 if not found then raise exception 'Invitation is invalid or expired';end if;
 insert into public.guardian_students(guardian_id,student_id,consent_verified_by) values(auth.uid(),inv.student_id,inv.created_by) on conflict do nothing;
 update private.invitations set used_at=now(),used_by=auth.uid() where token=invite_token;
end$$;
create function public.guardian_summary() returns table(display_name text,xp bigint,completed bigint) language sql stable security definer set search_path='' as $$select p.display_name,(select coalesce(sum(amount),0) from public.xp_transactions where student_id=p.id),(select count(*) from public.learning_progress where student_id=p.id) from public.profiles p join public.guardian_students g on g.student_id=p.id where g.guardian_id=auth.uid()$$;
-- Explicit function grants: no anonymous writes and no public execution of definer functions.
revoke execute on all functions in schema public from public,anon;
grant execute on function public.save_profile(jsonb),public.submit_activity(text,text,jsonb),public.learning_snapshot(),public.class_leaderboard(text),public.create_class(text),public.create_class_invite(uuid),public.accept_class_invite(text),public.create_guardian_invite(uuid),public.accept_guardian_invite(text),public.guardian_summary() to authenticated;
insert into public.achievements values('first','First steps',1),('curious','Curious mind',5),('explorer','World explorer',10),('star','Supernova',20);
