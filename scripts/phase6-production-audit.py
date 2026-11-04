#!/usr/bin/env python3
"""Read-only Phase 6 smoke checks. Does not mutate production data or call private APIs."""
import argparse, json, re, ssl, sys
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

p=argparse.ArgumentParser()
p.add_argument('--url',default='')
p.add_argument('--output',required=True)
p.add_argument('--commit',default='')
a=p.parse_args()
results=[]
def add(name,status,detail):
    results.append({'name':name,'status':status,'detail':detail})
base=a.url.strip().rstrip('/')
if not base:
    add('Production URL','WARN','No EVARYN_PRODUCTION_URL supplied; online tests not run')
else:
    u=urlparse(base)
    if u.scheme!='https' or not u.netloc or u.username or u.password or u.query or u.fragment or u.path not in ('','/'):
        add('Production URL','FAIL','Use an HTTPS origin only (e.g., https://example.com)')
    else:
        add('Production URL','PASS',base)
        paths=['/','/contact','/projects','/reviews','/work-with-us','/clients/register','/clients/login','/experts','/experts/register']
        for path in paths:
            try:
                request=Request(base+path,headers={'User-Agent':'Evaryn-Phase6-ReadOnly-Audit/1.0','Accept':'text/html'})
                with urlopen(request,timeout=14) as res:
                    code=res.status
                    final=res.geturl()
                    ct=res.headers.get('content-type','')
                    body=res.read(200000).decode('utf-8','replace')
                ok=(code==200 and 'text/html' in ct.lower())
                add('Public '+path,'PASS' if ok else 'WARN',f'HTTP {code}; {final}; content-type={ct}')
                if path=='/' and ok:
                    for label,marker in [('Our Work','/projects'),('Client Reviews','/reviews'),('Work With Us','/work-with-us')]:
                        add('Homepage navigation: '+label,'PASS' if marker in body else 'WARN',f'HTML contains {marker}: {marker in body}')
            except HTTPError as e:
                add('Public '+path,'WARN',f'HTTP {e.code} from production')
            except (URLError,TimeoutError,OSError) as e:
                add('Public '+path,'WARN',f'Request failed: {type(e).__name__}: {str(e)[:180]}')
        # Protected pages should never expose private data to anonymous clients.
        for path in ['/client-portal','/super-admin/client-requests','/super-admin/payroll']:
            try:
                request=Request(base+path,headers={'User-Agent':'Evaryn-Phase6-ReadOnly-Audit/1.0'})
                with urlopen(request,timeout=14) as res:
                    final=res.geturl()
                    code=res.status
                    body=res.read(12000).decode('utf-8','replace').lower()
                redirected=(urlparse(final).path != path)
                # A 200 could be a login interstitial; do not assert security based on HTML guessing.
                add('Anonymous protected route '+path,'PASS' if redirected else 'WARN',f'HTTP {code}; final path={urlparse(final).path}; manual authorization review required if not redirected')
            except HTTPError as e:
                add('Anonymous protected route '+path,'PASS' if e.code in (401,403) else 'WARN',f'HTTP {e.code}')
            except (URLError,TimeoutError,OSError) as e:
                add('Anonymous protected route '+path,'WARN',f'Could not verify: {type(e).__name__}')
summary={k:sum(x['status']==k for x in results) for k in ('PASS','WARN','FAIL')}
report={'phase':'Phase 6 - production release readiness','timestamp_utc':datetime.now(timezone.utc).isoformat(),'github_commit':a.commit,'production_origin':base or None,'summary':summary,'checks':results,'manual_verification_required':['Confirm active Vercel Production deployment commit equals GitHub main and rollback is undone','Submit real contact inquiry and confirm Super Admin Inquiries','Client signup + email confirmation + login + request access isolation','Expert signup + confirmation + pending approval + Super Admin assignment','Incoming email + attachment download + forwarding to Gmail','Tasker/Reviewer/QA transitions and payroll using test accounts and safe fixtures']}
Path(a.output).parent.mkdir(parents=True,exist_ok=True)
Path(a.output).write_text(json.dumps(report,indent=2)+'\n')
for x in results: print(f"[{x['status']}] {x['name']}: {x['detail']}")
print('Summary:',summary,'Report:',a.output)
if summary['FAIL']: sys.exit(1)
