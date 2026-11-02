"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {prisma} from "@/lib/db/prisma";

export async function registerExpert(form:FormData){
 const fullName=String(form.get("fullName")??"").trim();
 const email=String(form.get("email")??"").trim().toLowerCase();
 const password=String(form.get("password")??"");
 if(fullName.length<2||fullName.length>150||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>128||password!==String(form.get("confirm")??""))redirect("/experts/register?error=invalid");
 const siteUrl=process.env.NEXT_PUBLIC_SITE_URL;
 if(!siteUrl||!/^https:\/\//.test(siteUrl))throw new Error("NEXT_PUBLIC_SITE_URL must be configured as a secure absolute URL");
 const supabase=await createClient();
 const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${siteUrl.replace(/\/$/,"")}/auth/confirm?next=experts`,data:{full_name:fullName}}});
 if(error)redirect("/experts/register?error=failed");
 redirect("/experts/register?result=check-email");
}

export async function signInExpert(form:FormData){
 const supabase=await createClient();
 const {error}=await supabase.auth.signInWithPassword({email:String(form.get("email")??"").trim(),password:String(form.get("password")??"")});
 if(error)redirect("/experts/login?error=invalid");
 redirect("/experts/application");
}

export async function submitExpertApplication(form:FormData){
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)redirect("/experts/login");
 if(!user.email_confirmed_at)redirect("/experts/verify-email");
 if(user.app_metadata?.role)redirect("/portal");
 const email=user.email;
 if(!email)redirect("/experts/login");
 const existingEmployee=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
 if(existingEmployee)redirect("/portal");
 const expertise=String(form.get("expertise")??"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,12);
 const country=String(form.get("country")??"").trim().slice(0,100);
 const experience=String(form.get("experience")??"").trim().slice(0,3000);
 const portfolioUrl=String(form.get("portfolioUrl")??"").trim();
 if(!expertise.length||experience.length<20||portfolioUrl.length>500)redirect("/experts/application?error=invalid");
 if(portfolioUrl){try{const parsed=new URL(portfolioUrl);if(!["https:","http:"].includes(parsed.protocol))throw Error();}catch{redirect("/experts/application?error=invalid");}}
 const current=await prisma.expertApplication.findUnique({where:{authUserId:user.id},select:{id:true}});
 if(current)redirect("/experts/application");
 await prisma.expertApplication.create({data:{authUserId:user.id,email,fullName:String(user.user_metadata?.full_name??email.split("@")[0]).slice(0,150),expertise,country,experience,portfolioUrl:portfolioUrl||null}});
 redirect("/experts/application?submitted=1");
}
