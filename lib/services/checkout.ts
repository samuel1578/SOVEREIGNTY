import 'server-only'
import {result,store,identity} from './store'
import {price} from '../editorial'
// TODO(backend): server-only — Stripe Checkout with server-side GBP price and tax; fulfil via webhook only.
export const startCheckout=(tierId:string)=>result(()=>{const id=identity();const t=store.tiers.find(t=>t.id===tierId);if(id==='visitor'||!t?.pricePence)throw Error('Price coming soon');if(!store.lessons.some(l=>l.tierId===tierId&&l.status==='published'))throw Error('Set a price and publish at least one lesson before this tier can go live.');const receipt=`${t.name} · ${price(t.pricePence)} · ${new Date().toLocaleDateString('en-GB')}`;setTimeout(()=>{if(store.access[id]?.includes(tierId))return;(store.purchaseHistory[id]??=[]).push(receipt);store.access[id]=Array.from(new Set([...(store.access[id]||[]),tierId]))},3000);return {url:`/checkout/success?mock=1&tier=${tierId}`}})
