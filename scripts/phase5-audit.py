#!/usr/bin/env python3
"""Non-mutating Evaryn Phase 5 repository and optional production smoke audit."""
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import argparse, json, os, re, sys, time

parser = argparse.ArgumentParser()
parser.add_argument('--root', default='.')
parser.add_argument('--production-url', default='')
parser.add_argument('--output', default='')
a = parser.parse_args()
root = Path(a.root).resolve()
checks = []

def check(name, ok, detail, level='fail'):
    checks.append({'check': name, 'status': 'PASS' if ok else ('WARN' if level=='warn' else 'FAIL'), 'detail':detail})

def find(name):
    matches = [p for p in root.glob('app/**/'+name) if p.is_file() and 'node_modules' not in p.parts]
    return matches

def route(routepath):
    rel = routepath.strip('/')
    matches=[]
    for file in find('page.tsx'):
        pieces=[x for x in file.parent.relative_to(root / 'app').parts if not (x.startswith('(') and x.endswith(')'))]
        if '/'.join(pieces)==rel: matches.append(file)
    return matches

def read(path):
    p=root / path
    return p.read_text(errors='replace') if p.is_file() else ''

# User-visible routes: missing pages are release blockers.
for label, target in [
    ('Public projects page', 'projects'), ('Public client reviews page', 'reviews'),
    ('Work With Us page', 'work-with-us'), ('Client signup', 'clients/register'),
    ('Client sign-in', 'clients/login'), ('Client dashboard', 'client-portal'),
    ('Client request submission', 'client-portal/requests/new'),
    ('Expert signup', 'experts/register'), ('Expert application page', 'experts/application'),
    ('Super Admin client requests', 'super-admin/client-requests'),
    ('Super Admin expert approvals', 'super-admin/expert-applications'),
    ('Super Admin company email', 'super-admin/emails'),
    ('Super Admin payroll', 'super-admin/payroll'),
    ('QA queue', 'qa/queue'), ('Reviewer queue', 'reviewer/queue')]:
    paths=route(target)
    check(label, bool(paths), f'/{target}: '+(', '.join(str(p.relative_to(root)) for p in paths) if paths else 'page.tsx not found'))

header=read('components/layout/PublicHeader.tsx')
for label, href in [('Public header: Work With Us','/work-with-us'),('Public header: Our Work','/projects'),('Public header: Reviews','/reviews'),('Public header: Expert entry','/experts')]:
    check(label, href in header, f'Expected link {href} in PublicHeader.tsx',level='warn')

shell=read('app/(portal)/PortalShell.tsx')
check('Client Requests declared in sidebar', 'Client Requests' in shell and '/super-admin/client-requests' in shell, 'Sidebar contains Client Requests link',level='warn')
# Detect the exact known bug (created item excluded by both grouped and remaining paths).
excluded = bool(re.search(r'item\.name\s*!==\s*["\']Client Requests["\']', shell))
assigned = bool(re.search(r'single\(["\']Client Requests["\']\)',shell)) or bool(re.search(r'section\([^\n]*["\']Client Requests["\']',shell))
check('Client Requests is reachable in rendered menu', not (excluded and not assigned),
      'Group consumption or remaining-list filtering: '+('Client Requests may be silently excluded' if excluded and not assigned else 'No known exclusion pattern'), level='warn')

employee=read('lib/auth/require-employee.ts')
check('Employee access uses authenticated Supabase session', 'auth.getUser()' in employee, 'require-employee.ts uses Supabase getUser')
check('Employee access validates profile status and role', 'employee.status' in employee and 'employee.role' in employee and 'ACTIVE' in employee, 'require-employee.ts status/role checks present')

client_layout=route('client-portal')
layout_files=[p.parent/'layout.tsx' for p in client_layout]
clientguard=any('ensureClientProfile' in p.read_text(errors='replace') or 'requireClient' in p.read_text(errors='replace') for p in layout_files if p.is_file())
check('Client portal has server-side access guard', clientguard, 'Client portal layout must validate authenticated client')

admin_files=route('super-admin/client-requests')
admin_guard=any('requireEmployee' in p.read_text(errors='replace') and 'SUPER_ADMIN' in p.read_text(errors='replace') for p in admin_files)
check('Client requests admin page checks Super Admin', admin_guard, 'Admin page should call requireEmployee with SUPER_ADMIN')

webhook=read('app/api/webhooks/resend/route.ts')
check('Inbound mail webhook verifies signature', 'verify(' in webhook and 'RESEND_WEBHOOK_SECRET' in webhook, 'Signed Resend webhook required')
check('Inbound mail webhook handles email.received', 'email.received' in webhook, 'Inbound webhook event expected')

# Non-destructive checks on Prisma definitions.
schema=read('prisma/schema.prisma')
for entity in ['ExpertApplication', 'ClientProfile', 'ClientProjectAccess','ClientProjectRequest','EmployeeProfile']:
    check(f'Prisma model: {entity}', f'model {entity}' in schema, f'Model {entity} should be present in Prisma schema')

# Optional production smoke tests: never send emails, register users, or mutate database.
url=a.production_url.strip().rstrip('/')
if url:
    parsed=urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        check('Production URL uses HTTPS',False,'Provide an HTTPS production URL')
    else:
        check('Production URL uses HTTPS',True,parsed.hostname)
        for routeurl in ['/', '/projects','/reviews','/work-with-us','/clients/register','/clients/login','/experts']:
            try:
                req=Request(url+routeurl,headers={'User-Agent':'Evaryn-Phase5-Smoke/1.0'})
                with urlopen(req, timeout=12) as res:
                    code=res.status
                    final=res.url
                check(f'Production route {routeurl}', 200 <= code < 400,
                      f'HTTP {code}; final URL {final}',level='warn')
            except HTTPError as exc:
                check(f'Production route {routeurl}', False, f'HTTP {exc.code}', level='warn')
            except (URLError, TimeoutError, OSError) as exc:
                check(f'Production route {routeurl}', False, f'Connection error: {type(exc).__name__}', level='warn')
    # Protected endpoints are deliberately NOT fetched here: manual auth checks required.
else:
    check('Production smoke test',False,'Not run: supply --production-url https://your-production-domain',level='warn')

summary={s:sum(c['status']==s for c in checks) for s in ('PASS','WARN','FAIL')}
report={'phase':'Phase 5 - integration regression audit', 'root':str(root), 'production_url':url or None, 'summary':summary, 'checks':checks, 'manual_tests_required':[
    'Verify a fresh client can register, confirm email, and access only their own requests.',
    'Verify a pending expert cannot access any employee page or API; approve a test expert and verify role assignment.',
    'Verify Super Admin can find Client Requests, Expert Applications, Company Email, and process a client request.',
    'Send a real test email with a PDF attachment: check inbox, preview/download, and Gmail forwarding.',
    'Run a contact-form inquiry and verify it reaches Super Admin Inquiries.',
    'With test accounts, validate Tasker→Reviewer→QA transition and payroll ledger behavior without altering real records.',
    'Match GitHub main commit SHA to the active Vercel production deployment; undo any active rollback.'
]}
output=a.output or str(root/'.phase5-audit.json')
Path(output).write_text(json.dumps(report,indent=2)+'\n')
for c in checks:
    print(f"[{c['status']}] {c['check']}: {c['detail']}")
print(f"\nSUMMARY: {summary['PASS']} pass / {summary['WARN']} warnings / {summary['FAIL']} failures")
print(f'Full report: {output}')
if summary['FAIL']:
    sys.exit(1)
