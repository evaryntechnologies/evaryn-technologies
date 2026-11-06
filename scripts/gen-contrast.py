import re,glob,colorsys
files=[f for f in glob.glob('app/**/*.tsx',recursive=True)+glob.glob('components/**/*.tsx',recursive=True)]
txt=set(); bg=set()
for f in files:
    s=open(f).read()
    for m in re.finditer(r'(?<![\w:-])text-\[#([0-9a-fA-F]{6})\](/\d+)?',s): txt.add((m.group(1),m.group(2) or ''))
    for m in re.finditer(r'(?<![\w:-])bg-\[#([0-9a-fA-F]{6})\](/\d+)?',s): bg.add((m.group(1),m.group(2) or ''))
def rgb(h): h=h.lower(); return [int(h[i:i+2],16)/255 for i in (0,2,4)]
def lin(c): return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def lum(h): r,g,b=[lin(x) for x in rgb(h)]; return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    a,b=(a,b) if a>=b else (b,a); return (a+.05)/(b+.05)
LIGHT_BG=lum('e9f3fb'); DARK_BG=lum('0d2b60')
def hue(h):
    r,g,b=rgb(h); hh,l,s=colorsys.rgb_to_hls(r,g,b); return hh*360,s
def esc(cls): return re.sub(r'([#\[\]/.:])',r'\\\1',cls)
def sat_solid(h):
    hu,sat=hue(h); return 0.065<=lum(h)<0.3 and sat>0.3
X=[f'[class~="bg-[#{h}]"]' for h,a in sorted(bg) if not a and sat_solid(h)]
X+=[f'[class~="bg-{c}-{n}"]' for c in ('blue','violet','purple','indigo','rose','red','emerald','cyan','sky','teal','fuchsia') for n in (500,600,700,800,900)]
X+=['[class*="bg-gradient"]','.ev-hero','[class~="bg-[#0052CC]"]']
Y=[f'[class~="bg-[#{h}]"]' for h,a in sorted(bg) if not a and 0.35<lum(h)<=0.8]
Y+=['[class~="bg-cyan-300"]','[class~="bg-sky-300"]','[class~="bg-cyan-200"]']
def notx(L): return ''.join(f':not(:is({",".join(L)}))' + f':not(:is({",".join(L)}) *)' for _ in [0])
out=[]
out.append("/* AUTO-GENERATED contrast safety net (do not edit by hand; regenerate with scripts/gen-contrast.py).\n   Every arbitrary text/background colour found in the code gets a light-mode and dark-mode counterpart\n   whenever the original value would fall below WCAG AA on the theme's surfaces. */")
S=":is(.ev-portal, .ev-public)"
# TEXT
light=[];dark=[]
for h,a in sorted(txt):
    L=lum(h); cls=f"text-[#{h}]{a}"
    hu,sat=hue(h)
    if cr(L,LIGHT_BG)<4.6 and not a:
        if sat>0.35 and 255<=hu<=320: tok='var(--ev-amethyst-text)'
        elif sat>0.35 and 170<=hu<=235 and L<0.55: tok='var(--ev-accent-text)'
        elif sat>0.35 and 170<=hu<=235: tok='var(--ev-accent-text)'
        elif L>=0.55: tok='var(--ev-ink)'
        else: tok='var(--ev-muted)'
        light.append((cls,tok))
    if cr(L,DARK_BG)<4.6 and not a:
        if sat>0.3 and 250<=hu<=320: tok='var(--ev-amethyst-text)'
        elif sat>0.3 and 170<=hu<=240: tok='var(--ev-accent-text)'
        else: tok='var(--ev-ink)'
        dark.append((cls,tok))
if light:
    
    for tok in sorted(set(t for _,t in light)):
        sel=",\n  ".join('.'+esc(c)+notx(X) for c,t in light if t==tok)
        out.append("html:not(.dark) "+S+" :is("+sel+") { color: "+tok+"; }")
if dark:
    for tok in sorted(set(t for _,t in dark)):
        sel=",\n  ".join('.'+esc(c)+':not([class*="dark:text-"])'+notx(Y) for c,t in dark if t==tok)
        out.append(".dark "+S+" :is("+sel+") { color: "+tok+"; }")
# BG: dark navy backgrounds in light mode -> light surface; text-white on them -> ink
darkbg=[(h,a) for h,a in sorted(bg) if lum(h)<0.065]
if darkbg:
    sel=",\n  ".join('.'+esc(f"bg-[#{h}]{a}") for h,a in darkbg)
    out.append("html:not(.dark) "+S+" :is("+sel+") { background-color: var(--ev-surface-2); border-color: var(--ev-border-soft); }")
    sel2=",\n  ".join('.'+esc(f"bg-[#{h}]{a}")+':is(.text-white, [class*="text-white/"])' for h,a in darkbg)
    out.append("html:not(.dark) "+S+" :is("+sel2+") { color: var(--ev-ink); }")
# very light backgrounds in dark mode (without dark: partner) -> dark surface
lightbg=[(h,a) for h,a in sorted(bg) if lum(h)>0.8]
out.append(".dark "+S+" :is(.bg-white, [class*=\"bg-white/\"]):not([class*=\"dark:bg-\"]) { background-color: var(--ev-surface); border-color: var(--ev-border-soft); color: var(--ev-ink); }")
if lightbg:
    sel=",\n  ".join('.'+esc(f"bg-[#{h}]{a}")+':not([class*="dark:bg-"])' for h,a in lightbg)
    out.append(".dark "+S+" :is("+sel+") { background-color: var(--ev-surface-2); color: var(--ev-ink); }")
# Amethyst fills always carry white text
out.append(".ev-portal .bg-\\[\\#7956AF\\], .ev-public .bg-\\[\\#7956AF\\], .ev-portal .bg-\\[\\#674698\\], .ev-public .bg-\\[\\#674698\\] { color: #ffffff; }")
# Tailwind palette fixes
out.append("""
/* palette status colours: dark shades on light surfaces, light shades on dark surfaces */
html:not(.dark) :is(.ev-portal, .ev-public) :is(.text-sky-100, .text-sky-200, .text-sky-300) { color: var(--ev-accent-text); }
html:not(.dark) :is(.ev-portal, .ev-public) :is(.text-emerald-500, .text-emerald-600) { color: #047857; }
html:not(.dark) :is(.ev-portal, .ev-public) :is(.text-red-500, .text-rose-500, .text-rose-600) { color: #be123c; }
html:not(.dark) :is(.ev-portal, .ev-public) :is(.text-amber-500, .text-amber-600) { color: #92400e; }
html:not(.dark) :is(.ev-portal, .ev-public) .bg-red-950 { background-color: #fee2e2; color: #991b1b; }
html:not(.dark) :is(.ev-portal, .ev-public) :is(.bg-amber-900\\/30, .bg-amber-950\\/30) { background-color: #fef3c7; color: #78350f; }
html:not(.dark) :is(.ev-portal, .ev-public) :is(.bg-rose-500) { background-color: #be123c; color: #fff; }
.dark :is(.ev-portal, .ev-public) :is(.bg-rose-500) { background-color: #be123c; color: #fff; }
.dark :is(.ev-portal, .ev-public) :is(.text-slate-950, .text-slate-900, .text-slate-800, .text-black) { color: var(--ev-ink); }
.dark :is(.ev-portal, .ev-public) :is(.text-cyan-700, .text-cyan-600, .text-sky-700, .text-blue-700, .text-blue-600) { color: var(--ev-accent-text); }
.dark :is(.ev-portal, .ev-public) :is(.text-red-500, .text-red-600, .text-red-700, .text-rose-500, .text-rose-600) { color: #fecdd3; }
.dark :is(.ev-portal, .ev-public) :is(.text-emerald-600, .text-emerald-700, .text-emerald-500) { color: #6ee7b7; }
.dark :is(.ev-portal, .ev-public) :is(.text-amber-600, .text-amber-700, .text-amber-500) { color: #fcd34d; }
.dark :is(.ev-portal, .ev-public) [class*="group-hover:text-[#0052CC]"] { color: inherit; }
""")
open('app/contrast-safety.css','w').write("\n".join(out)+"\n")
print('text light',len(light),'dark',len(dark),'darkbg',len(darkbg),'lightbg',len(lightbg))
