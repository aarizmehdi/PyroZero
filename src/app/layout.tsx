import type { Metadata } from 'next';
import './globals.css';
import './desktop-refinements.css';
import './advisor-flow.css';
import './spinoff-workbench.css';
import './scientific-spacing.css';
import './final-experience.css';
import './material-flow.css';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://pyrozero-zentrix-labs.urbanbay8.chatgpt.site');
export const metadata: Metadata = {
 metadataBase: new URL(siteUrl),
 title: { default: 'PyroZero — Spacecraft Fire Research | Zentrix Labs', template: '%s | PyroZero' },
 description: 'Explore NASA combustion evidence, compare spacecraft materials in partial gravity, trace fire incidents, and ask cited engineering questions. Built by Zentrix Labs.',
 applicationName: 'PyroZero', authors: [{name:'Zentrix Labs'}], creator: 'Zentrix Labs',
 keywords: ['PyroZero','Zentrix Labs','NASA Space Apps','Flame in Freefall','spacecraft fire safety','microgravity combustion','GraphRAG','NASA PSI'],
 alternates: {canonical:'/'},
 icons: {icon:[{url:'/icon.svg',type:'image/svg+xml'}],shortcut:'/icon.svg',apple:'/apple-touch-icon.png'},
 openGraph:{title:'PyroZero — Flame in Freefall',description:'From NASA combustion evidence to transparent mission trade studies. A research workspace by Zentrix Labs.',siteName:'PyroZero',url:'/',locale:'en_US',type:'website',images:[{url:'/social-card.png',width:1200,height:630,alt:'PyroZero — Spacecraft fire research by Zentrix Labs'}]},
 twitter:{card:'summary_large_image',title:'PyroZero — Flame in Freefall',description:'NASA combustion evidence, partial-gravity material screens and cited engineering answers.',images:['/social-card.png']},
 robots:{index:true,follow:true}, category:'science',
};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en" data-type="software"><head><meta name="page-type" content="software"/><meta name="site-kind" content="software"/><meta name="theme-color" content="#F8FAFC"/></head><body><a className="skip-link" href="#workspace">Skip to workspace</a>{children}</body></html>}
