// D14 — contact form rules, shared by the browser form and the server action (which re-checks).
// TODO(backend): move to the zod schemas in lib/schemas/ (roadmap S0.P3); keep these messages.
import {text} from './editorial'
export const TOPICS=text(577).split(' · ')
export const MESSAGE_MIN=10,MESSAGE_MAX=5000
export type ContactInput={name:string;email:string;topic:string;message:string;/** Spam trap: humans never see or fill it. */website?:string}
export type ContactField='name'|'email'|'topic'|'message'
// Deliberately strict so the address is also safe inside a `mailto:` link in the admin inbox.
const EMAIL=/^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
export function validateContact(i:Partial<ContactInput>):Partial<Record<ContactField,string>>{
  const e:Partial<Record<ContactField,string>>={}
  const name=(i.name||'').trim(),email=(i.email||'').trim(),message=(i.message||'').trim()
  if(!name||name.length>120)e.name=text(582)
  if(!EMAIL.test(email)||email.length>254)e.email=text(583)
  if(!TOPICS.includes(i.topic||''))e.topic=text(584)
  if(message.length<MESSAGE_MIN)e.message=text(585);else if(message.length>MESSAGE_MAX)e.message=text(586)
  return e
}
