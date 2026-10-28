import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getEarningsReport, cleanFilters, applyEarningsFilters, summarize } from "@/lib/earnings/report";

const money = (n:number) => n.toFixed(2);
export async function GET(request: Request) {
  // The report is always generated for the authenticated employee, never a supplied user ID.
  const { employee, rows } = await getEarningsReport();
  const url = new URL(request.url);
  const filters = cleanFilters({
    month: url.searchParams.get("month") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  const chosen = applyEarningsFilters(rows, filters);
  const totals = summarize(chosen);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.03,0.07,0.15), gray=rgb(0.35,0.4,0.5);
  let page = pdf.addPage([595,842]);
  let y = 810;
  const newPage = () => { page = pdf.addPage([595,842]); y=810; };
  const write = (text:string,x:number,size=10,isBold=false,color=navy) => {
    // Standard PDF fonts support WinAnsi; normalize unusual characters.
    const safe=text.replace(/[^\x20-\x7E]/g,"?");
    page.drawText(safe,{x,y,size,font:isBold?bold:font,color,maxWidth:515});
  };
  try {
    const bytes = await readFile(path.join(process.cwd(),"public","brand","evaryn-full-trimmed.png"));
    const logo = await pdf.embedPng(bytes);
    const scale = Math.min(230/logo.width,75/logo.height);
    page.drawImage(logo,{x:(595-logo.width*scale)/2,y:738,width:logo.width*scale,height:logo.height*scale});
    y=715;
  } catch {
    write("EVARYN TECHNOLOGIES LIMITED",185,16,true); y-=40;
  }
  write("EMPLOYEE EARNINGS STATEMENT",170,15,true);y-=30;
  write(`Employee: ${employee.fullName}`,40,11,true);y-=19;
  write(`Level: ${employee.role}   Generated: ${new Date().toISOString().slice(0,10)}`,40,10);y-=18;
  write(`Filters: month ${filters.month||"all"} | category ${filters.category||"all"} | level ${filters.role||"all"} | status ${filters.status||"all"}`,40,9,false,gray);y-=24;
  write(`Gross: ${money(totals.gross)}    Deductions: ${money(totals.fines)}    Net: ${money(totals.net)}`,40,11,true); y-=20;
  write(`Pending: ${money(totals.pending)}    Paid: ${money(totals.paid)}`,40,10,true);y-=28;
  write("PAYOUT DATE       LEVEL          CATEGORY / DESCRIPTION                         NET",40,9,true);y-=15;
  page.drawLine({start:{x:40,y},end:{x:555,y},thickness:.8,color:gray});y-=16;
  for (const row of chosen) {
    if (y<65) {newPage(); write("EVARYN EARNINGS STATEMENT (continued)",40,11,true);y-=25;}
    write(row.cycle,40,9);
    write(row.sourceType.slice(0,13),129,9);
    write(`${row.category.slice(0,16)} / ${row.label.slice(0,24)}`,236,9);
    write(money(row.net),505,9,true);
    y-=16;
  }
  if (!chosen.length) {write("No earnings matched these filters.",40,11);y-=20;}
  if (y<90)newPage();
  y-=15;write("This statement reports recorded payroll ledger entries, not a proof of bank transfer.",40,9,false,gray);
  const out=await pdf.save();
  return new Response(new Uint8Array(out).buffer as ArrayBuffer, {
    headers:{ "Content-Type":"application/pdf", "Content-Disposition":"attachment; filename=evaryn-earnings-statement.pdf", "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff" },
  });
}
