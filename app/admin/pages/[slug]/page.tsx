import {makeRoute} from '@/components/route-view'
const view=makeRoute('admin/pages/[slug]')
export const generateMetadata=view.metadata
export default view.Page
