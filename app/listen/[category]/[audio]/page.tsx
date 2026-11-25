import {makeRoute,staticParams} from '@/components/route-view'
const pattern='listen/[category]/[audio]'
const view=makeRoute(pattern)
export const generateStaticParams=()=>staticParams(pattern)
export const generateMetadata=view.metadata
export default view.Page
