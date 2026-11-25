import type {MetadataRoute} from 'next'
import {SITE_URL} from '@/lib/config'
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/account','/checkout','/courses/*/learn','/sign-in','/sign-up','/api','/auth']},sitemap:`${SITE_URL}/sitemap.xml`,host:SITE_URL}}
