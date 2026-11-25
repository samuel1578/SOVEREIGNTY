// F-008 — upload validation shared by the browser (instant feedback) and the server action (authoritative).
export type UploadFile={name:string;type:string;size:number}
export const MAX_UPLOAD_BYTES=300*1024*1024
export const UPLOAD_MIME=['audio/mpeg','audio/mp4','audio/x-m4a'] as const
export const UPLOAD_ERRORS={type:"This file type isn't supported. Please upload an MP3 or M4A.",size:'This file is larger than 300 MB.',stopped:'The upload stopped. Check your connection and try again.'} as const
export function validateUpload(f:UploadFile):string|null{
  if(!/\.(mp3|m4a)$/i.test(f.name)||!(UPLOAD_MIME as readonly string[]).includes(f.type))return UPLOAD_ERRORS.type
  if(f.size>MAX_UPLOAD_BYTES)return UPLOAD_ERRORS.size
  return null
}
