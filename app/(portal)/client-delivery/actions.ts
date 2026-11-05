"use server";
import {revalidatePath} from "next/cache";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";
import {createClient as createAdmin} from "@supabase/supabase-js";
import {randomUUID} from "node:crypto";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const stages=["QUEUED","TASKING","REVIEW","QA","APPROVED"] as const;
async function staff(){const user=await requireEmployee(["QA","ADMIN","SUPER_ADMIN"]);const actor=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});if(!actor||actor.status!=="ACTIVE"||!["QA","ADMIN","SUPER_ADMIN"].includes(actor.role))throw new Error("Not authorized");return actor;}
function refresh(){revalidatePath("/portal/post-qa");revalidatePath("/client-portal/delivered/awaiting");revalidatePath("/portal/client-delivery");revalidatePath("/client-portal");revalidatePath("/client-portal/orders");revalidatePath("/client-portal/delivered");}
function storage(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Private delivery storage is not configured.");return createAdmin(url,key,{auth:{autoRefreshToken:false,persistSession:false}}).storage.from("task-attachments");}
export async function assignOrder(form:FormData){
 const actor=await staff();if(!["ADMIN","SUPER_ADMIN"].includes(actor.role))throw new Error("Only administrators can assign order recipients.");
 const taskId=String(form.get("taskId")??""),clientId=String(form.get("clientId")??"");if(!uuid.test(taskId)||!uuid.test(clientId))throw new Error("Invalid order or client");
 const [task,client]=await Promise.all([prisma.workTask.findUnique({where:{id:taskId},select:{id:true}}),prisma.clientProfile.findUnique({where:{id:clientId},select:{id:true,status:true}})]);
 if(!task||!client||client.status!=="ACTIVE")throw new Error("Order or active client not found");
 // Assignment is immutable here: a task cannot silently become visible to another client.
 await prisma.clientOrderAssignment.create({data:{taskId,clientId,assignedById:actor.id,updates:{create:{stage:"QUEUED",message:"Your order has been registered and will be scheduled for production.",postedById:actor.id}}}});
 refresh();
}
export async function postClientUpdate(form:FormData){
 const actor=await staff();const taskId=String(form.get("taskId")??""),stage=String(form.get("stage")??""),message=String(form.get("message")??"").trim();
 if(!uuid.test(taskId)||!stages.some(s=>s===stage)||message.length<5||message.length>1500)throw new Error("Provide a valid order, stage and progress update (5–1,500 characters).");
 const assignment=await prisma.clientOrderAssignment.findUnique({where:{taskId},select:{id:true,clientId:true,task:{select:{clientDelivery:{select:{id:true}},submissions:{where:{reviews:{some:{stage:"QA",decision:"APPROVED"}}},select:{id:true},take:1}}}}});
 if(!assignment)throw new Error("Assign an order to a client before posting updates.");
 if(assignment.task.clientDelivery)throw new Error("The order has already been delivered.");
 if(stage==="APPROVED"&&!assignment.task.submissions.length)throw new Error("Only orders that passed QA may be marked approved for the client.");
 await prisma.clientOrderUpdate.create({data:{assignmentId:assignment.id,stage,message,postedById:actor.id}});
 refresh();
}
export async function publishDelivery(form:FormData){
 const actor=await staff(),taskId=String(form.get("taskId")??"");if(!["ADMIN","SUPER_ADMIN"].includes(actor.role))throw new Error("Only administrators may send final copies to clients.");if(!uuid.test(taskId))throw new Error("Invalid order");
 const file=form.get("file");if(!(file instanceof File)||!file.size||file.size>3*1024*1024||file.name.length>200||/[\x00-\x1f]/.test(file.name))throw new Error("Provide a valid file up to 3 MB.");
 const assignment=await prisma.clientOrderAssignment.findUnique({where:{taskId},select:{id:true,clientId:true,client:{select:{status:true}},task:{select:{clientDelivery:{select:{id:true}},status:true,submissions:{where:{reviews:{some:{stage:"QA",decision:"APPROVED"}}},select:{id:true},take:1}}}}});
 if(!assignment||assignment.client.status!=="ACTIVE"||assignment.task.clientDelivery||assignment.task.status!=="POST_QA_APPROVED"||!assignment.task.submissions.length)throw new Error("The order must be assigned to one active client and pass QA before delivery.");
 const key=`client-deliveries/${taskId}/${randomUUID()}`;const store=storage();const uploaded=await store.upload(key,new Uint8Array(await file.arrayBuffer()),{contentType:file.type||"application/octet-stream",upsert:false});if(uploaded.error)throw new Error("Delivery upload failed: "+uploaded.error.message);
 try{await prisma.$transaction(async tx=>{
  const transitioned=await tx.workTask.updateMany({where:{id:taskId,status:"POST_QA_APPROVED"},data:{status:"DELIVERED_AWAITING_CLIENT"}});
  if(transitioned.count!==1)throw new Error("This post-QA order was already processed.");
  await tx.taskSubmission.updateMany({where:{taskId,status:"POST_QA_APPROVED"},data:{status:"DELIVERED_AWAITING_CLIENT"}});
  // Stable delivery ID; a revised final copy replaces the currently visible version only.
  const previousDelivery = await tx.clientDelivery.findUnique({ where: { taskId }, select: { clientId: true } });
  if (previousDelivery && previousDelivery.clientId !== assignment.clientId) throw new Error("Delivery ownership mismatch.");
  const delivered = await tx.clientDelivery.upsert({
    where: { taskId },
    update: { publishedById: actor.id, storageKey: key, fileName: file.name, publishedAt: new Date() },
    create: { taskId, clientId: assignment.clientId, publishedById: actor.id, storageKey: key, fileName: file.name },
  });
  await tx.$executeRaw`INSERT INTO public."ClientDeliveryVersion"("deliveryId","storageKey","fileName","publishedById") VALUES (${delivered.id}::uuid, ${key}, ${file.name}, ${actor.id}::uuid)`;
  await tx.clientOrderUpdate.create({data:{assignmentId:assignment.id,stage:"DELIVERED",message:"Administrative checks completed; the final copy is now available to your client account.",postedById:actor.id}});
  // Link this same task to the same client in the older ClientOrderLink register.
  await tx.$executeRaw`INSERT INTO public."ClientOrderLink" ("taskId","clientId","linkedById") VALUES (${taskId}::uuid, ${assignment.clientId}::uuid, ${actor.id}::uuid) ON CONFLICT ("taskId") DO NOTHING`;
  const linked=await tx.$executeRaw`UPDATE public."ClientOrderLink" SET "deliveredAt"=now(), "deliveredById"=${actor.id}::uuid, "updatedAt"=now() WHERE "taskId"=${taskId}::uuid AND "clientId"=${assignment.clientId}::uuid`;
  if(linked!==1) throw new Error("An existing client-order link points to a different client. Delivery stopped.");
});}
 catch(err){await store.remove([key]);throw err;}
 refresh();
}
