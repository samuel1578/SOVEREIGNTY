import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {SlidersHorizontal} from 'lucide-react'
import {REVIEW} from '@/lib/config'
import {brand} from '@/lib/editorial'
import type {ReviewIdentity} from '@/lib/types'
import {TryMode} from '@/components/guide-mode'

// Review only (D4): a one-page guide for the owner to the preview, its demo modes and the plan to launch.
// It doesn't exist outside review builds and is never indexed or listed in the sitemap.
export const metadata:Metadata={title:{absolute:`Preview guide — ${brand}`},robots:{index:false,follow:false}}

type Mode={id:ReviewIdentity;name:string;short:string;who:string;sees:string[];tryThis:[string,string][];start:string}
const modes:Mode[]=[
  {id:'visitor',name:'Visitor',short:'Visitor',start:'/',
    who:'Anyone who finds the site and hasn’t signed in. This is how most people will first meet your work.',
    sees:['The home page with the opening film and the scrolling story','Philosophy, About, Coaching and Contact','Free audio sessions they can play straight away','The three course tiers with prices, and a button to buy that asks them to sign in first'],
    tryThis:[['Watch the opening film with sound','/'],['Play a free audio session','/listen'],['Open a course tier and press buy','/courses'],['Send a message from the contact form','/contact']]},
  {id:'member',name:'Member who owns Tier 1',short:'Member (Tier 1)',start:'/account/library',
    who:'Someone who has signed up and bought Tier 1. This is what a paying member sees every time they come back.',
    sees:['My library: a greeting, a “Continue your practice” card and their progress','Every Tier 1 lesson unlocked, with the full audio player and transcript','Tiers 2 and 3 still locked, with an option to buy','Their account: photo, name, purchases, theme and text size'],
    tryThis:[['Resume a lesson from My library','/account/library'],['Open the Tier 1 course','/courses/tier-1'],['Change the text size in your account','/account']]},
  {id:'empty',name:'Member with no tiers yet',short:'Member (no tiers)',start:'/account/library',
    who:'Someone who has made a free account but hasn’t bought anything yet.',
    sees:['A welcome card with three simple first steps instead of empty shelves','Free audio, ready to play','Every tier locked, each with its price and a buy button','The checkout and “Welcome, member” screens (no real payment is taken)'],
    tryThis:[['See the welcome card in My library','/account/library'],['Buy a tier and follow the checkout','/courses']]},
  {id:'assistant',name:'Assistant',short:'Assistant',start:'/admin',
    who:'A helper you trust with the day-to-day running of the site. Assistants can prepare and edit, but only you can publish.',
    sees:['The dashboard: messages waiting, transcripts to review, and members','Messages from the contact form, which they can read and answer','Free audio and course lessons, which they can edit but not publish, unpublish, archive or delete','Transcripts, which they can approve','Members and coaching settings. Prices, pages, site settings, team and activity are hidden from them'],
    tryThis:[['Open the dashboard (any 6 digits passes the security check)','/admin'],['Approve a transcript','/admin/transcripts'],['Read a message','/admin/messages']]},
  {id:'owner',name:'Owner (you)',short:'Owner',start:'/admin',
    who:'You. The owner has every permission and the final say over what goes live.',
    sees:['Everything the assistant sees, plus tier purchases on the dashboard','Publishing: putting audio and lessons live, or taking them down','Tiers & prices, and the editors for Philosophy, About and the legal pages','Site settings, your team (adding or removing assistants) and a full activity log'],
    tryThis:[['Open the dashboard (any 6 digits passes the security check)','/admin'],['Edit the Philosophy page','/admin/pages'],['Publish or unpublish a free audio session','/admin/audio'],['Look at the activity log','/admin/activity']]},
]

const previewOnly:[string,string][]=[
  ['Any 6 digits pass the security check.','On the live site you and your assistant will use a code from an authenticator app on your phone.'],
  ['Tier 1 shows a sample price of £49.00.','It carries a “Review price” badge. You will set the real prices before launch.'],
  ['No payments are taken and no emails are sent.','Checkout, booking and email alerts are shown as they will look, but nothing leaves the site yet.'],
  ['Your changes don’t last.','Edits you make in the admin are kept only for a while. They disappear whenever the preview restarts, so experiment freely.'],
  ['Words in [square brackets] are placeholders.','For example [CONTACT EMAIL] or [Owner name]. Each one marks something we still need from you.'],
  ['Some numbers say “coming”.','Audio plays, revenue and listening time start counting once the site is live. We never show made-up figures.'],
]

const plan:[string,string,string][]=[
  ['1','Foundations','Code storage, safety checks and the basic plumbing every later step builds on.'],
  ['2','The database','A secure home for members, lessons, audio, messages and settings, with rules about who may see what.'],
  ['3','Real sign-in','Email sign-in links and Google sign-in for members. A second security step for you and your assistant. Profiles, photos and account deletion.'],
  ['4','Saving for real','Everything you edit in the admin is saved permanently and shows on the public site.'],
  ['5','Audio','Uploading audio files, private streaming for paid lessons, and automatic transcripts for your team to review.'],
  ['6','Payments','Real prices and secure Stripe checkout, with access granted the moment someone pays. Refunds are handled too.'],
  ['7','Coaching, email and insights','Cal.com bookings, sign-in and alert emails, and visitor statistics.'],
  ['8','Polish and protection','Security hardening, speed, search engines, accessibility and privacy.'],
  ['9','Going live','A private test copy on Hostinger, a full check from start to finish, and then launch at resettosovereignty.com.'],
]

const needs=[
  'Your photos for the home page, About, Coaching, the course tiers and the member pages (the current ones are stand-ins).',
  'The portrait (phone-shaped) still images for the opening film.',
  'The real price for each tier.',
  'Your contact email, your social media links and how quickly you usually reply.',
  'Your approval of the Contact page wording.',
  'Later on: access to a few accounts (Stripe, Cal.com, email and hosting). We’ll walk you through each one when we get there.',
]

export default function GuidePage(){
  if(!REVIEW)notFound()
  return <div className="guide">
    <header className="guide-hero"><div className="wrap">
      <small className="eyebrow">Preview guide</small>
      <h1>Welcome to your preview of {brand}.</h1>
      <p className="guide-lede">This is a working preview of your site. Everything can be clicked, played and tried, but it runs on sample content, so nothing you do here reaches real people. This page explains the demo modes, what only happens in the preview, and the plan from here to launch.</p>
      <nav className="guide-toc" aria-label="On this page"><a href="#modes">Demo modes</a><a href="#preview-only">Preview only</a><a href="#plan">The plan</a><a href="#needs">What we need from you</a></nav>
    </div></header>

    <section className="wrap guide-section" id="switch" aria-labelledby="switch-h">
      <h2 id="switch-h">How to switch demo modes</h2>
      <p>A demo mode lets you see the site through someone else&rsquo;s eyes. You can switch in two ways:</p>
      <ol className="guide-steps">
        <li>Press the small dark button in the <b>bottom-left corner</b> of any page <span className="guide-chip" aria-hidden><SlidersHorizontal size={12}/>Visitor</span>. It shows the mode you&rsquo;re in. Pick another one from the list.</li>
        <li>Or press a <b>Try</b> button below. It switches the mode and takes you to the best page to start from.</li>
      </ol>
      <p>The <b>Preview guide</b> button in the bottom-right corner always brings you back here.</p>
    </section>

    <section className="wrap guide-section" id="modes" aria-labelledby="modes-h">
      <h2 id="modes-h">The five demo modes</h2>
      <div className="guide-modes">
        {modes.map((m,i)=><article key={m.id} className="guide-mode" aria-labelledby={`mode-${m.id}`}>
          <small className="guide-num">{String(i+1).padStart(2,'0')}</small>
          <h3 id={`mode-${m.id}`}>{m.name}</h3>
          <p>{m.who}</p>
          <h4>What they see</h4>
          <ul>{m.sees.map(s=><li key={s}>{s}</li>)}</ul>
          <h4>Things to try</h4>
          <ul className="guide-links">{m.tryThis.map(([t,h])=><li key={t}><Link href={h}>{t}</Link></li>)}</ul>
          <TryMode mode={m.id} start={m.start} label={m.short}/>
        </article>)}
      </div>
      <p className="guide-note">Links under &ldquo;Things to try&rdquo; open the page in the mode you&rsquo;re in now. Use the Try button to switch first.</p>
    </section>

    <section className="guide-band" id="preview-only" aria-labelledby="preview-h"><div className="wrap guide-section">
      <h2 id="preview-h">Things that only happen in the preview</h2>
      <dl className="guide-facts">{previewOnly.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </div></section>

    <section className="wrap guide-section" id="plan" aria-labelledby="plan-h">
      <h2 id="plan-h">The plan: from preview to live site</h2>
      <p><b>Where we are:</b> every page and screen is designed and built, and you&rsquo;ve approved the look. What&rsquo;s left is connecting it all to real services, so that sign-ins, payments, audio and your edits work for real. That happens in nine stages, in this order:</p>
      <ol className="guide-plan">{plan.map(([n,t,d])=><li key={n}><span className="guide-num">{n}</span><div><b>{t}</b><p>{d}</p></div></li>)}</ol>
      <p className="guide-note">You&rsquo;ll keep this preview the whole way through, so you can see each stage as it lands.</p>
    </section>

    <section className="guide-band" id="needs" aria-labelledby="needs-h"><div className="wrap guide-section">
      <h2 id="needs-h">What we need from you</h2>
      <ul className="guide-needs">{needs.map(n=><li key={n}>{n}</li>)}</ul>
      <p>Spot something you&rsquo;d like changed while you look around? Note the page and the mode you were in, and send it to your developer. That makes it quick to find.</p>
      <div className="actions"><Link className="pill" href="/">Start exploring</Link><a className="outline" href="#modes">Back to the demo modes</a></div>
    </div></section>
  </div>
}
