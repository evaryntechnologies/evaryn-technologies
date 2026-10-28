"use server";
import { prisma } from "@/lib/db/prisma";
import { getOpenCareerSlugs } from "@/lib/recruitment-openings";
export type ApplicationState = { message:string; success:boolean };
export async function submitApplication(_previous:ApplicationState, form:FormData):Promise<ApplicationState> {
 const fail = (message:string):ApplicationState => ({success:false,message});
 // Honeypot blocks ordinary bot submissions. Do not echo private data.
 if (String(form.get("companyWebsite") ?? "").trim()) return fail("Application could not be submitted.");
 const name=String(form.get("name")??"").trim();
 const email=String(form.get("email")??"").trim().toLowerCase();
 const phone=String(form.get("phone")??"").trim();
 const role=String(form.get("role")??"");
 const experience=String(form.get("experience")??"");
 const portfolioLink=String(form.get("portfolio")??"").trim();
 const note=String(form.get("note")??"").trim();
 if(name.length<2||name.length>150||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length<6||phone.length>50||note.length<20||note.length>3000||!['0-1','1-3','3-5','5+'].includes(experience)) return fail("Please review your application details.");
 if(portfolioLink && (portfolioLink.length>500 || !/^https?:\/\//i.test(portfolioLink))) return fail("Portfolio must be a valid HTTPS or HTTP URL.");
 if(!(await getOpenCareerSlugs()).includes(role)) return fail("This vacancy is no longer accepting applications.");
 // CV upload deliberately not accepted until private object storage is configured.
 try {
  await prisma.jobApplication.create({data:{name,email,phone,role,experience,portfolioLink:portfolioLink||null,note,status:"NEW"}});
  return {success:true,message:"Your application has been received. Thank you for your interest in Evaryn."};
 } catch (error) { console.error("[Application submission]",error);return fail("We couldn't receive your application right now. Please try again."); }
}
