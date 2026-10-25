import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {json,cors} from '../_shared/http.ts';
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const auth=req.headers.get('authorization');if(!auth)return json({error:'Sign in first'},401);
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
 const {data:{user},error}=await client.auth.getUser();if(error||!user)return json({error:'Invalid session'},401);
 let body;try{body=await req.json()}catch{return json({error:'Invalid request'},400)}if(body.action!=='delete')return json({error:'Unsupported action'},400);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const deleted=await admin.auth.admin.deleteUser(user.id);if(deleted.error)return json({error:'Account deletion failed. Contact the operator.'},500);
 return json({deleted:true});
});
