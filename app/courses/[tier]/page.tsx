import {makeRoute,staticParams} from '@/components/route-view'
const pattern='courses/[tier]'
const view=makeRoute(pattern)
export const generateStaticParams=()=>staticParams(pattern)
export const generateMetadata=view.metadata
export default view.Page
