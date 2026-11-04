"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {prisma} from "@/lib/db/prisma";

export async function registerExpert(form: FormData) {
  const fullName = String(form.get("fullName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (
    fullName.length < 2 || fullName.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 || password.length > 128 ||
    password !== confirm
  ) {
    redirect("/experts/register?error=invalid");
  }

  // Never use a request Host header to build authentication links.
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const candidate = configuredOrigin || (vercelHost ? `https://${vercelHost}` : "");
  let siteOrigin: string | null = null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) {
      siteOrigin = parsed.origin;
    }
  } catch {
    // Invalid deployment configuration should produce a visible form error.
  }
  if (!siteOrigin) {
    console.error("Expert signup: missing or invalid production site origin");
    redirect("/experts/register?error=configuration");
  }

  let signupError: "failed" | "unavailable" | null = null;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteOrigin}/auth/confirm?next=experts`,
        data: { full_name: fullName, evaryn_account_type: "EXPERT" },
      },
    });
    if (error) {
      console.error("Expert signup rejected:", error.code ?? "auth_error");
      signupError = "failed";
    }
  } catch (error) {
    console.error("Expert signup unavailable:", error instanceof Error ? error.name : "unknown");
    signupError = "unavailable";
  }

  // Next.js redirect() intentionally throws. Keep redirects outside try/catch.
  if (signupError) redirect(`/experts/register?error=${signupError}`);
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
