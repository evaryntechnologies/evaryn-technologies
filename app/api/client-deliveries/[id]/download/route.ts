import {NextRequest,NextResponse} from "next/server";
import {createClient as createServerClient} from "@/lib/supabase/server";
import {createClient as createAdmin} from "@supabase/supabase-js";
import {prisma} from "@/lib/db/prisma";
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const supabase=await createServerClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return new NextResponse("Sign in required",{status:401,headers:{"Cache-Control":"no-store"}});
 const {id}=await params;
 const d=await prisma.clientDelivery.findFirst({where:{id,client:{authUserId:user.id,status:"ACTIVE"}},select:{storageKey:true}});
 if(!d)return new NextResponse("Not found",{status:404,headers:{"Cache-Control":"no-store"}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return new NextResponse("Delivery storage unavailable",{status:503});
 const admin=createAdmin(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data,error}=await admin.storage.from("task-attachments").createSignedUrl(d.storageKey,60);
 if(error||!data?.signedUrl)return new NextResponse("Could not open delivery",{status:503});
 const response=NextResponse.redirect(data.signedUrl);response.headers.set("Cache-Control","private, no-store");return response;
}
