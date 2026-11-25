import {makeRoute} from '@/components/route-view'
const view=makeRoute('admin/courses/[tier]')
export const generateMetadata=view.metadata
export default view.Page
