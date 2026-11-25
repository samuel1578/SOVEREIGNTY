import type {MetadataRoute} from 'next'
import {SITE_URL,REVIEW} from '@/lib/config'
// Review builds (preview links with mock data) are never indexed.
export default function robots():MetadataRoute.Robots{if(REVIEW)return {rules:{userAgent:'*',disallow:'/'}};return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/account','/checkout','/courses/*/learn','/sign-in','/sign-up','/api','/auth']},sitemap:`${SITE_URL}/sitemap.xml`,host:SITE_URL}}
