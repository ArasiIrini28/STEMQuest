create table private.unsubscribe_tokens(user_id uuid primary key references public.profiles on delete cascade,token text unique not null default gen_random_uuid()::text||gen_random_uuid()::text);
revoke all on private.unsubscribe_tokens from public,anon,authenticated;
create function public.claim_reminders() returns table(delivery_id uuid,email text,display_name text,kind text,period text,token text,weekly_xp bigint) language plpgsql security definer set search_path='' as $$declare r record; local_now timestamp; local_day date; local_hour integer; quiet boolean; period_key text; logrow private.email_delivery_logs;begin
 for r in select p.*,rp.enabled,rp.frequency,rp.quiet_start,rp.quiet_end,rp.unsubscribed_at,u.email as auth_email,u.email_confirmed_at from public.profiles p join public.reminder_preferences rp on rp.user_id=p.id join auth.users u on u.id=p.id where rp.enabled and rp.unsubscribed_at is null and p.consent_verified and u.email_confirmed_at is not null order by p.id limit 1000 loop
  local_now:=now() at time zone coalesce(r.settings->>'timezone','UTC');local_day:=local_now::date;local_hour:=extract(hour from local_now);
  quiet:=case when r.quiet_start=r.quiet_end then true when r.quiet_start>r.quiet_end then local_hour>=r.quiet_start or local_hour<r.quiet_end else local_hour>=r.quiet_start and local_hour<r.quiet_end end;
  if quiet or local_hour<>18 then continue;end if;
  if r.frequency='weekly' and extract(isodow from local_now)<>7 then continue;end if;
  if r.frequency='daily' and exists(select 1 from public.daily_activity da where da.student_id=r.id and da.day=local_day) then continue;end if;
  if exists(select 1 from private.email_delivery_logs el where el.user_id=r.id and el.sent_at>now()-interval '23 hours') then continue;end if;
  period_key:=case when r.frequency='weekly' then to_char(local_day,'IYYY-IW') else local_day::text end;
  insert into private.email_delivery_logs(user_id,kind,period) values(r.id,r.frequency,period_key) on conflict do nothing;
  select * into logrow from private.email_delivery_logs el where el.user_id=r.id and el.kind=r.frequency and el.period=period_key for update skip locked;
  if not found or logrow.status='sent' or logrow.attempts>=3 or (logrow.status='sending' and logrow.claimed_at>now()-interval '15 minutes') then continue;end if;
  update private.email_delivery_logs set status='sending',claimed_at=now(),attempts=attempts+1 where id=logrow.id;
  insert into private.unsubscribe_tokens(user_id) values(r.id) on conflict do nothing;
  delivery_id:=logrow.id;email:=r.auth_email;display_name:=r.display_name;kind:=r.frequency;period:=period_key;
  select ut.token into token from private.unsubscribe_tokens ut where ut.user_id=r.id;
  select coalesce(sum(x.amount),0) into weekly_xp from public.xp_transactions x where x.student_id=r.id and x.created_at>=now()-interval '7 days';
  return next;
 end loop;
end$$;
create function public.finish_delivery(delivery uuid,provider_message_id text,error_message text) returns void language plpgsql security definer set search_path='' as $$begin
 update private.email_delivery_logs set status=case when provider_message_id is not null then 'sent' else 'failed' end,provider_id=provider_message_id,error=left(error_message,500),sent_at=case when provider_message_id is not null then now() else null end where id=delivery and status='sending';
end$$;
create function public.unsubscribe_reminders(unsubscribe_token text) returns boolean language plpgsql security definer set search_path='' as $$declare uid uuid;begin
 select user_id into uid from private.unsubscribe_tokens where token=unsubscribe_token;
 if uid is null then return false;end if;
 update public.reminder_preferences set enabled=false,unsubscribed_at=now() where user_id=uid;
 update public.profiles set settings=jsonb_set(settings,'{reminders}','false') where id=uid;
 return true;
end$$;
create function public.reserve_ai_use() returns jsonb language plpgsql security definer set search_path='' as $$declare p public.profiles;begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 select * into p from public.profiles where id=auth.uid() for update;
 if not p.consent_verified then raise exception 'Verified consent is required for AI features';end if;
 if (select count(*) from private.ai_usage_logs where user_id=p.id and created_at>now()-interval '24 hours')>=5 then raise exception 'You have used today’s five tutor questions. Try the built-in lesson hints.';end if;
 insert into private.ai_usage_logs(user_id) values(p.id);
 return jsonb_build_object('level',p.settings->>'level','ageBand',p.settings->>'ageBand');
end$$;
revoke execute on function public.claim_reminders(),public.finish_delivery(uuid,text,text),public.unsubscribe_reminders(text),public.reserve_ai_use() from public,anon,authenticated;
grant execute on function public.claim_reminders(),public.finish_delivery(uuid,text,text),public.unsubscribe_reminders(text) to service_role;
grant execute on function public.reserve_ai_use() to authenticated;
