import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {json,escape} from '../_shared/http.ts';
Deno.serve(async(req:Request)=>{
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const url=new URL(req.url);
 if(url.searchParams.has('unsubscribe')){
  const token=url.searchParams.get('unsubscribe')||'';
  if(!/^[a-f0-9-]{72}$/.test(token))return new Response('Invalid unsubscribe link',{status:400});
  if(req.method==='GET')return new Response('<!doctype html><title>STEMQuest preferences</title><main style="font-family:system-ui;max-width:500px;margin:80px auto"><h1>Pause learning reminders?</h1><p>You can turn them on again in Settings.</p><form method="post"><button type="submit">Unsubscribe from reminders</button></form></main>',{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}});
  if(req.method!=='POST')return new Response('Method not allowed',{status:405});
  const {data,error}=await db.rpc('unsubscribe_reminders',{unsubscribe_token:token});
  return new Response(error||!data?'This link is invalid.':'You are unsubscribed from STEMQuest reminders.',{status:error||!data?400:200,headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}});
 }
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const secret=Deno.env.get('CRON_SECRET');if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return json({error:'Unauthorized'},401);
 const key=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('EMAIL_FROM'),app=Deno.env.get('APP_URL');
 if(!key||!from||!app)return json({error:'Configure RESEND_API_KEY, EMAIL_FROM, and APP_URL before enabling reminders.'},503);
 const {data,error}=await db.rpc('claim_reminders');if(error)return json({error:'Could not claim reminders'},500);
 let sent=0,failed=0;
 for(const row of data||[]){
  const unsubscribe=`${Deno.env.get('SUPABASE_URL')}/functions/v1/reminders?unsubscribe=${encodeURIComponent(row.token)}`;
  const body=row.kind==='weekly'?`You earned ${row.weekly_xp} XP this week. Every small discovery counts.`:'Your next discovery is waiting. A short lesson is a lovely way to keep learning. Rest days are okay, too.';
  try{
   const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`stemquest-${row.delivery_id}`},body:JSON.stringify({from,to:[row.email],subject:row.kind==='weekly'?'Your STEMQuest learning week':'A little curiosity for your day',html:`<h1>Hi, ${escape(row.display_name)}!</h1><p>${escape(body)}</p><p><a href="${escape(app)}">Continue your adventure</a></p><p><a href="${escape(unsubscribe)}">Unsubscribe</a> or manage preferences in Settings.</p>`}),signal:AbortSignal.timeout(12000)});
   const payload=await result.json();if(!result.ok||!payload.id)throw new Error(`Provider response ${result.status}`);
   const finished=await db.rpc('finish_delivery',{delivery:row.delivery_id,provider_message_id:payload.id,error_message:null});if(finished.error)throw new Error('Delivery log confirmation failed');sent++;
  }catch(e){failed++;await db.rpc('finish_delivery',{delivery:row.delivery_id,provider_message_id:null,error_message:e instanceof Error?e.message:'Delivery failed'})}
 }
 return json({sent,failed,claimed:data?.length||0});
});
