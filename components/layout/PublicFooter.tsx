import LinkedInMark from "@/components/ui/LinkedInMark";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import { site } from "@/lib/site";
import { Mail, MessageCircle, Phone } from "lucide-react";
const links = [
  {name:"Explore",items:[["Services","/services"],["Our Work","/projects"],["Feedback & Reviews","/reviews"],["About Us","/about"]]},
  {name:"Collaborate",items:[["Work With Us","/work-with-us"],["Partnerships","/work-with-us#partnerships"],["Investors","/work-with-us#investors"],["Careers","/careers"]]},
  {name:"Access",items:[["Client sign up","/clients/register"],["Client login","/clients/login"],["Expert sign up","/experts/register"],["Expert login","/experts/login"]]},
] as const;
export default function PublicFooter(){return <footer className="ev2-footer"><div className="ev2-shell ev2-footer-grid"><div className="ev2-footer-about"><Link href="/" aria-label="Evaryn home"><BrandLogo tone="dark-surface"/></Link><p>People, process and technology working together to deliver dependable data, content and digital services.</p><div className="ev2-social"><a href="https://wa.me/254712798426" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={19}/></a><a href="mailto:contact@evaryninc.com" aria-label="Email"><Mail size={19}/></a>{site.linkedinUrl && <a href={site.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedInMark size={19}/></a>}</div></div>{links.map(g=><nav key={g.name} aria-label={g.name}><h2>{g.name}</h2>{g.items.map(([t,url])=><Link href={url} key={t}>{t}</Link>)}</nav>)}<div className="ev2-footer-contact"><h2>Get in touch</h2><a href="mailto:contact@evaryninc.com"><Mail size={16}/> contact@evaryninc.com</a><a href="tel:+254712798426"><Phone size={16}/> +254 712 798 426</a><a href="https://wa.me/254712798426" target="_blank" rel="noreferrer">WhatsApp our team</a><Link href="/contact#consultation">Schedule a consultation</Link></div></div><div className="ev2-shell ev2-footer-bottom">© {new Date().getFullYear()} Evaryn Technologies Limited · Nairobi, Kenya</div></footer>}
