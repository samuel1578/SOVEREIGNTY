
export type Role = 'visitor' | 'member' | 'assistant' | 'owner'
/** Mock review identities (D4). `empty` is a member who owns no tiers. */
export type ReviewIdentity = 'visitor' | 'member' | 'empty' | 'assistant' | 'owner'
/** Review identities plus mock sign-ups created by onboarding (`u-…`). */
export type Identity = ReviewIdentity | `u-${string}`
export type ContentStatus = 'draft' | 'published' | 'archived'
export type TranscriptStatus = 'none' | 'processing' | 'draft' | 'approved' | 'failed'
export type TierKey = 'tier-1' | 'tier-2' | 'tier-3'
export type TierTheme = 'brown' | 'white' | 'blue'

export interface AudioCategory { id: string; slug: string; title: string; description: string; sortOrder: number; status: ContentStatus }
export interface AudioItem {
  id: string; slug: string; categoryId: string; title: string; description: string
  durationSeconds: number; coverUrl?: string; coverAlt?: string
  transcriptMd?: string            // approved only — never expose drafts publicly
  transcriptStatus: TranscriptStatus; status: ContentStatus; sortOrder: number; publishedAt?: string
}
export interface Tier {
  id: string; key: TierKey; theme: TierTheme; label: string; name: string; tagline: string
  descriptionMd: string; pricePence: number | null; currency: 'GBP'; status: ContentStatus
}
export interface CourseModule { id: string; tierId: string; title: string; description?: string; sortOrder: number; status: ContentStatus }
export interface Lesson {
  id: string; slug: string; tierId: string; moduleId: string; title: string; summary: string
  durationSeconds: number; isPreview: boolean; transcriptMd?: string; transcriptStatus: TranscriptStatus
  status: ContentStatus; sortOrder: number
}
/** Answers collected during sign-up (onboarding). Visible to staff in A06. No health data is asked for. */
export interface OnboardingAnswers {
  preferredName?: string; country?: string; ageRange?: string; reasons: string[]
  practice?: string; heardFrom?: string; notes?: string; marketing: boolean
}
export interface MemberProfile {
  id: string; name: string; email: string; role: Role; joinedAt: string
  /** Small square JPEG/PNG/WebP data URL (mock). TODO(backend): Supabase Storage public URL. */
  avatarUrl?: string
  onboarding?: OnboardingAnswers
}
export interface Entitlement { memberId: string; tierId: string; source: 'purchase' | 'manual_grant'; grantedAt: string; revokedAt?: string }
export interface LessonProgress { memberId: string; lessonId: string; positionSeconds: number; completedAt?: string; updatedAt: string }
export interface Purchase { id: string; memberId: string; tierId: string; amountPence: number; currency: 'GBP'; createdAt: string }
export interface CoachingSettings { calLink: string; introMd: string; sessionLength: string; pricePence: number | null; location: string; cancellationPolicy: string }
/** D14 — a message sent from the contact page (P15), read in the admin inbox (A12). */
export type MessageStatus = 'new' | 'read' | 'archived'
export interface ContactMessage { id: string; name: string; email: string; topic: string; message: string; status: MessageStatus; createdAt: string }
export interface ActivityEntry { id: string; actorName: string; action: string; target: string; createdAt: string }

/** Tier plus derived catalogue counts. */
export type TierSummary = Tier & { lessonCount: number; totalSeconds: number; samplePrice: boolean }
/** Owned tier plus the member's progress (M01). */
export type OwnedTier = TierSummary & { completedCount: number; publishedCount: number; percent: number }
export interface ContinueListening { lessonTitle: string; lessonSlug: string; tierKey: TierKey; tierName: string; positionSeconds: number; durationSeconds: number }

export type Result<T> = {ok:true;data:T} | {ok:false;error:string;fieldErrors?:Record<string,string>}
