import 'server-only'
import {result,store} from './store'
import {pages} from '../editorial'
export type PageCopy={title:string;body:string;seoTitle:string;seoDescription:string}
// TODO(backend): server-only — fetch approved public Markdown and SEO fields from Supabase (cookie-less client, D7).
export const getPublishedPage=(slug:string)=>result(():PageCopy=>store.pages[slug]||{title:'',body:pages[slug]||'',seoTitle:'',seoDescription:''})
