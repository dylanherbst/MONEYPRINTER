// Visual labels follow the October master guide; established authoring URLs stay intact.
export const pages = [
 {title:'Home',href:'/',icon:'home',description:'Your next useful action'},
 {title:'Services',href:'/services',icon:'grid',description:'Find tools, services and guidance'},
 {title:'Create',href:'/create',icon:'plus',description:'Start a local website, offer, course or content draft'},
 {title:'Clients',href:'/customers',icon:'people',description:'Customers, local contacts, enquiries and opportunities'},
 {title:'Marketing',href:'/grow',icon:'chart',description:'Grow with organic research, content and campaign plans'},
 {title:'Automation',href:'/grow?tab=automations',icon:'bolt',description:'Workflow availability; no execution connected'},
 {title:'Sales',href:'/sales',icon:'sales',description:'Appointments, orders and invoice drafts'},
 {title:'Products',href:'/business',icon:'box',description:'Business, website, offers, courses and delivery'},
 {title:'Analytics',href:'/insights',icon:'trend',description:'Insights and manual Growth Audit'},
] as const;
const extraPages=[{title:'Inbox',href:'/inbox',icon:'phone',description:'Messages, calls and receptionist availability'}, {title:'Settings',href:'/settings',icon:'settings',description:'Profile, integrations, billing, team and help'}, {title:'Original tools',href:'/tools',icon:'grid',description:'Existing local authoring and labelled demo'}];
export function searchPages(query:string) { const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean); return [...pages,...extraPages].filter(p=>terms.every(t=>(p.title+' '+p.description).toLowerCase().includes(t))); }
export function activePage(pathname:string,tab:string|null,href:string){if(href==='/grow?tab=automations')return pathname==='/grow'&&tab==='automations';if(href==='/grow')return pathname==='/grow'&&tab!=='automations';if(href==='/services')return pathname==='/services'||pathname.startsWith('/services/');return pathname===href;}
export const createOptions = [
 {title:'Service',href:'/business?tab=offers&create=service',detail:'Local service and pricing draft.'},
 {title:'Product',href:'/business?tab=offers&create=product',detail:'Local product and delivery draft.'},
 {title:'Course',href:'/business?tab=delivery&create=course',detail:'Local course outline and lesson editor.'},
 {title:'Website / Page',href:'/business?tab=website',detail:'Local page editor and preview.'},
 {title:'Marketing content',href:'/grow?tab=content',detail:'Manually authored local content concept. Not published.'},
 {title:'Automation',href:'/grow?tab=automations',detail:'Unavailable: workflow execution is not connected.'},
] as const;
export const serviceCategories=['All Services','Marketing','Automation','Sales','Clients','Content'] as const;
export type ServiceCategory=typeof serviceCategories[number];
export const services=[
 {title:'Growth Audit',description:'Find your next opportunities with a manual review.',href:'/services/growth-audit',icon:'chart',category:'Marketing',status:'Manual · browser-local'},
 {title:'Automation Setup',description:'Review workflow availability and requirements.',href:'/grow?tab=automations',icon:'bolt',category:'Automation',status:'Execution unavailable'},
 {title:'Customer Acquisition',description:'Record public research and plan a local follow-up.',href:'/grow?tab=leads',icon:'people',category:'Clients',status:'Manual · no outreach'},
 {title:'Personalised Plan',description:'Write a practical, evidence-led 30-day plan.',href:'/insights?tab=audit',icon:'edit',category:'Marketing',status:'Manual · browser-local'},
 {title:'Content concepts',description:'Draft and preview your own channel copy.',href:'/grow?tab=content',icon:'edit',category:'Content',status:'No generation or publishing'},
 {title:'Bookings',description:'Review calendar connection requirements.',href:'/sales?tab=appointments',icon:'calendar',category:'Sales',status:'Not connected'},
 {title:'Website builder',description:'Create and preview a local website draft.',href:'/business?tab=website',icon:'grid',category:'Content',status:'Local draft · not hosted'},
 {title:'Products & courses',description:'Shape an offer or course with your own content.',href:'/business',icon:'box',category:'Sales',status:'Local drafts'},
 {title:'Receptionist availability',description:'View current messaging and call availability.',href:'/inbox',icon:'phone',category:'Clients',status:'Unavailable · no test calls'},
] as const;
export function filterServices(category:ServiceCategory,query=''){const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);return services.filter(s=>(category==='All Services'||s.category===category)&&terms.every(t=>(s.title+' '+s.description).toLowerCase().includes(t)));}
