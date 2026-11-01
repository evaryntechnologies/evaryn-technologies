# Evaryn Pay Team patch

This implements a separate `/portal/super-admin/payroll/pay-team` tab. The previous earnings approvals page remains. Each card groups approved PENDING `WorkforcePayLedger` rows by employee and payout date.

- Pay in full: no reason; external payment reference mandatory.
- Enter amount: a final adjusted settlement of the displayed balance; amount must be > 0 and <= balance, and a reason of 10–1000 characters is mandatory. Difference does not carry forward.
- The database transaction records `PayTeamSettlement` + per-entry `PayTeamAllocation`, marks selected entries PAID, and notifies the employee. This **records** an external payment, does NOT transfer money.
- Only Super Admin, due items, completed-client-action orders, and employees with stored payment methods are permitted.
- Earnings report uses actual paid allocation for Pay Team entries, preserving original approved gross and fines for audit.

## Important limitations / prerequisites

This integrates the `WorkforcePayLedger` pathway, not legacy `PayrollEntry` or other payout tools. The migration adds two new tables and MUST be deployed before the app code. Users should not click both legacy per-entry payout actions and Pay Team for the same entries. The table's unique `ledgerId` prevents a Pay Team item being settled twice; the transaction also locks pending rows.

The original ledger stores the full approved amount while the allocation stores actual paid. This release does not build an employee dispute button or automatic recovery system. A custom adjusted settlement closes that payout period's current PENDING entries, not a partial installment with outstanding remainder.

## Linux

```bash
cd ~/Documents/evaryn-technologies
git status
git switch main
git pull --ff-only origin main
unzip -o ~/Downloads/evaryn-pay-team-tab.zip -d .
git diff --check
npx prisma migrate status
# After confirming backup, migration history, and production DATABASE_URL:
npx prisma migrate deploy
npm ci
npx prisma generate
npm run build
git add app/portal/super-admin/payroll/page.tsx app/portal/super-admin/payroll/pay-team app/portal/super-admin/payroll/pay-team-actions.ts lib/earnings/report.ts prisma/migrations/20261031193000_pay_team_settlements
git commit -m "Add employee-level Pay Team settlements and adjusted payments"
git push origin main
```

Please confirm `.env` targets correct production Supabase before migrating. If the migration fails, stop; don't push the app because it depends on the new tables.
