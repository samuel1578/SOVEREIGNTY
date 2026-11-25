import {makeRoute} from '@/components/route-view'
const view=makeRoute('admin/transcripts/[id]')
export const generateMetadata=view.metadata
export default view.Page
