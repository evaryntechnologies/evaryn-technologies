# Evaryn Pay Team: early settlements + working submission feedback

This **replaces three files** from the preceding `evaryn-pay-team-tab.zip`; apply that original ZIP first if you have not already done so. This is NOT a full payroll system.

- Removes the payout-date disable condition from the Pay Team UI and settlement transaction; **early recording is allowed** after funds have already been externally sent.
- Keeps the approved-payment-method requirement. Missing approved payment details still disables payment recording.
- Displays clear validation and migration error feedback, with a submitting indicator.
- Filters already allocated, explicitly declined and duplicate already-paid order entries out of the Pay Team balance; uses matching conditions server-side.
- Both full and custom payments close **only the selected current approved, unpaid ledger entries**; when successful, the list refreshes and their pending balance becomes zero. Custom amount requires a reason and settles the balance finally; the withheld difference is not a future installment.
- Keeps an immutable PayTeamSettlement/PayTeamAllocation record, and sends the employee a notification.

## Critical prerequisites

The prior Pay Team SQL migration (`20261031193000_pay_team_settlements`) must already have succeeded on your production Supabase, with `PayTeamSettlement` and `PayTeamAllocation` present. If not, first apply the original migration after a backup and a migration-history review. Do not paste the original SQL into the database twice.

This page **records external transfers only** and does not actually send money. Do not click a record-payment button until the transaction has happened. This repair does not resolve other legacy payroll paths or historical double-payment reconciliation.

## Linux steps (main branch)

```bash
cd ~/Documents/evaryn-technologies
git status
git switch main
git pull --ff-only origin main
unzip -o ~/Downloads/evaryn-pay-team-early-payment-fix.zip -d .
git diff --check
npm run build
# Only if the build passes and migration exists in Supabase:
git add app/portal/super-admin/payroll/pay-team-actions.ts app/portal/super-admin/payroll/pay-team
 git commit -m "Enable early Pay Team settlements and payment feedback"
git push origin main
```

Test with one **approved, unpaid employee with an approved payment method**, preferably in a controlled test first. If the card still has a disabled button, it is because the method is not recognized as approved; investigate the method query before overriding it. If a submission fails, inspect the visible message and Vercel runtime logs. Never mark an unpaid transfer as completed.
