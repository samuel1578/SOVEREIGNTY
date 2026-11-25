import {makeRoute} from '@/components/route-view'
const view=makeRoute('courses/[tier]/learn/[lesson]')
export const generateMetadata=view.metadata
export default view.Page
