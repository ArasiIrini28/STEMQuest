-- Additive session boundaries. Rewards continue to use submit_activity.
create table public.study_sessions(id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles on delete cascade, started_at timestamptz not null default clock_timestamp(),ended_at timestamptz,check(ended_at is null or ended_at>=started_at));
create unique index one_open_study_session on public.study_sessions(student_id) where ended_at is null;
create index study_sessions_owner_date on public.study_sessions(student_id,started_at desc);
alter table public.study_sessions enable row level security;
create policy study_sessions_own on public.study_sessions for select to authenticated using(student_id=auth.uid());
grant select on public.study_sessions to authenticated;
revoke insert,update,delete on public.study_sessions from authenticated,anon;
create function public.start_study_session() returns jsonb language plpgsql security definer set search_path='' as $$declare s public.study_sessions;begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 select * into s from public.study_sessions where student_id=auth.uid() and ended_at is null;
 if not found then insert into public.study_sessions(student_id) values(auth.uid()) returning * into s;end if;
 return to_jsonb(s)-'student_id';end$$;
create function public.finish_study_session(session_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare s public.study_sessions;begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 update public.study_sessions set ended_at=coalesce(ended_at,clock_timestamp()) where id=session_id and student_id=auth.uid() returning * into s;
 if not found then raise exception 'Session unavailable';end if;
 return to_jsonb(s)-'student_id';end$$;
revoke execute on function public.start_study_session(),public.finish_study_session(uuid) from public,anon;
grant execute on function public.start_study_session(),public.finish_study_session(uuid) to authenticated;
