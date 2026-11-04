export const stageNames=["Queued","Tasking","Review","QA","Approved"];
export function clientOrderStage(status:string):{label:string;step:number;note:string}{
 const steps:Record<string,{label:string;step:number;note:string}>={
 QUEUED:{label:"Order received",step:0,note:"Waiting for production"},
 TASKING:{label:"Tasking stage",step:1,note:"Work is in progress"},
 REVIEW:{label:"Review stage",step:2,note:"Review in progress"},
 QA:{label:"Quality assurance",step:3,note:"Quality checks in progress"},
 APPROVED:{label:"QA approved",step:4,note:"Approved for delivery"},
 DELIVERED:{label:"Delivered",step:4,note:"Your files are ready"},
 };
 return steps[status]??steps.QUEUED;
}
