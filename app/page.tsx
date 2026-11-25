import {Home} from '@/components/home'
import {getPublicPage} from '@/lib/services/public'
import {text} from '@/lib/editorial'
import {seo} from '@/lib/seo'
import {MockErrorGate} from '@/components/retry'
export async function generateMetadata(){const r=await getPublicPage('home');return seo({title:r.ok&&r.data.seoTitle||text(78),description:r.ok&&r.data.seoDescription||text(79),path:'/'})}
export default async function Page(){const r=await getPublicPage('home');return <MockErrorGate><Home welcome={r.ok?r.data.body:undefined}/></MockErrorGate>}
