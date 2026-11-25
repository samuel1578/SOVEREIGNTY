// D12 — only same-origin relative paths are accepted as a post-auth destination.
// Rejects absolute URLs, protocol-relative (`//x`), backslash tricks (`/\x`) and control characters.
export function safeNext(next:string|null|undefined,fallback='/account/library'){
  if(!next||next.length>512||!next.startsWith('/')||next.startsWith('//')||next.includes('\\')||/[\u0000-\u001f\u007f]/.test(next))return fallback
  try{const u=new URL(next,'http://x.invalid');return u.origin==='http://x.invalid'?u.pathname+u.search+u.hash:fallback}catch{return fallback}
}
