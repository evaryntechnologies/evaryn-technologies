"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/db/prisma";
import {ensureClientProfile} from "../../../clients/actions";
export async function rateDelivery(form:FormData){const client=await ensureClientProfile();
 const id=String(form.get("id")??""),rating=Number(form.get("rating")),feedback=String(form.get("feedback")??"").trim();
 if(!Number.isInteger(rating)||rating<1||rating>5||feedback.length>2000)throw new Error("Select 1–5 stars and keep feedback under 2,000 characters.");
 const result=await prisma.$transaction(async tx=>{
  const current=await tx.clientDelivery.findFirst({where:{id,clientId:client.id},select:{taskId:true,rating:true}});
  if(!current||current.rating!==null)return false;
  const changed=await tx.clientDelivery.updateMany({where:{id,clientId:client.id,rating:null},data:{rating,feedback:feedback||null,ratedAt:new Date()}});
  if(changed.count!==1)return false;
  // Existing employee ratings use WorkTask.clientRating. Do not touch settlement, payment or status.
  await tx.workTask.update({where:{id:current.taskId},data:{clientRating:rating}});
  return true;
 });
 if(!result)throw new Error("Rating already submitted or delivery unavailable.");
 revalidatePath("/client-portal/delivered");revalidatePath(`/client-portal/delivered/${id}`);revalidatePath("/portal/ratings");
 redirect(`/client-portal/delivered/${id}?rated=1`);
}
