create function public.class_performance() returns table(class_name text,display_name text,xp bigint,completed bigint,last_activity timestamptz) language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')) then raise exception 'Teacher permission required';end if;
 return query select c.name,p.display_name,(select coalesce(sum(x.amount),0) from public.xp_transactions x where x.student_id=p.id),(select count(*) from public.learning_progress lp where lp.student_id=p.id),(select max(a.created_at) from public.assessment_attempts a where a.student_id=p.id) from public.classes c join public.class_memberships m on m.class_id=c.id join public.profiles p on p.id=m.student_id where c.teacher_id=auth.uid() order by c.name,p.display_name;
end$$;
create function public.save_custom_lesson(document jsonb,is_published boolean) returns void language plpgsql security definer set search_path='' as $$declare doc_id text; a jsonb; course_key text;begin
 if not private.is_admin() then raise exception 'Administrator permission required';end if;
 if document is null or is_published is null or octet_length(document::text)>20000 then raise exception 'Invalid lesson document';end if;
 doc_id:=document->>'id';a:=document->'activities'->0;
 if doc_id is null or doc_id !~ '^custom-[a-f0-9-]{36}$' then raise exception 'Invalid custom lesson ID';end if;
 if char_length(trim(coalesce(document->>'title',''))) not between 1 and 100 or char_length(coalesce(document->>'concept','')) not between 20 and 3000 then raise exception 'Add a title and a learning explanation';end if;
 if not exists(select 1 from public.subjects where id=document->>'world') or not exists(select 1 from public.grade_levels where id=document->>'level') then raise exception 'Invalid subject or level';end if;
 if jsonb_typeof(document->'activities') is distinct from 'array' or jsonb_array_length(document->'activities')<>1 or a->>'kind' is distinct from 'choice' or a->>'id' is distinct from 'question' then raise exception 'One multiple-choice question is required';end if;
 if char_length(coalesce(a->>'prompt','')) not between 1 and 500 or char_length(coalesce(a->>'explanation','')) not between 10 and 1000 then raise exception 'Add a question and answer explanation';end if;
 if jsonb_typeof(a->'options') is distinct from 'array' or jsonb_array_length(a->'options')<>3 then raise exception 'Three answer choices are required';end if;
 if exists(select 1 from jsonb_array_elements_text(a->'options') o where char_length(trim(o)) not between 1 and 200) or (select count(distinct o) from jsonb_array_elements_text(a->'options') o)<>3 then raise exception 'Use three distinct nonempty choices';end if;
 if not exists(select 1 from jsonb_array_elements_text(a->'options') o where o=a->>'answer') then raise exception 'Correct answer must be one of the choices';end if;
 course_key:=(document->>'world')||'-'||(document->>'level');
 insert into public.courses(id,subject_id,level_id,title) values(course_key,document->>'world',document->>'level',course_key) on conflict do nothing;
 insert into public.topics(id,course_id,title) values(doc_id,course_key,document->>'title') on conflict(id) do update set course_id=excluded.course_id,title=excluded.title;
 insert into public.lessons(id,topic_id,title,content,published) values(doc_id,doc_id,document->>'title',document-'activities',is_published) on conflict(id) do update set title=excluded.title,content=excluded.content,published=excluded.published;
 insert into public.activities(id,lesson_id,kind,content,xp) values('question',doc_id,'choice',(a-'answer')||'{"xp":25}'::jsonb,25) on conflict(lesson_id,id) do update set content=excluded.content,xp=25;
 insert into private.answer_keys(lesson_id,activity_id,answer) values(doc_id,'question',a->'answer') on conflict(lesson_id,activity_id) do update set answer=excluded.answer;
end$$;
revoke execute on function public.class_performance(),public.save_custom_lesson(jsonb,boolean) from public,anon;
grant execute on function public.class_performance(),public.save_custom_lesson(jsonb,boolean) to authenticated;
