/**
 * Home page image slots (UI revamp, 2026-11-24).
 * Hard-coded placeholder photos for now.
 * TODO(backend): move these into site settings so the owner can swap each image from the admin
 * (upload to R2, store url + alt). Keep the slot keys stable so the swap is a data change only.
 */
export type ImageSlot = { src: string; alt: string }

const u = (id: string, w = 2000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`

export const homeChapters: Record<'philosophy' | 'courses' | 'coaching', ImageSlot> = {
  philosophy: { src: u('photo-1544367567-0f2fcb009e0b'), alt: 'A person sitting quietly in meditation' },
  // Pexels originals are very large, so ask for a 2000px compressed copy.
  courses: { src: 'https://images.pexels.com/photos/73759/sea-ocean-water-light-73759.jpeg?auto=compress&cs=tinysrgb&w=2000', alt: 'Sunlight shining down through clear ocean water' },
  coaching: { src: 'https://images.pexels.com/photos/5699454/pexels-photo-5699454.jpeg?auto=compress&cs=tinysrgb&w=2000', alt: '' },
}

/** Fallback artwork for audio without its own cover, picked by sort position (same art everywhere it appears). */
export const audioArt: string[] = [
  'https://images.pexels.com/photos/73759/sea-ocean-water-light-73759.jpeg?auto=compress&cs=tinysrgb&w=1000',
  u('photo-1507400492013-162706c8c05e', 1000),
  u('photo-1441974231531-c6227db76b6e', 1000),
]

/** An audio item's cover: its own `coverUrl` when set (admin upload), else placeholder art by sort order. */
export const coverFor = (a: { coverUrl?: string; sortOrder: number }) => a.coverUrl || audioArt[Math.abs(a.sortOrder) % audioArt.length]

/** Photo for the "Ready to go deeper?" link on the listening pages. */
export const listenUpsell: ImageSlot = { src: homeChapters.courses.src, alt: '' }

/** One photo per course tier (UI revamp, D18). TODO(backend): owner uploads these per tier in the admin. */
export const tierArt: Record<'tier-1' | 'tier-2' | 'tier-3', ImageSlot> = {
  'tier-1': { src: u('photo-1500530855697-b586d89ba3ee'), alt: '' },
  'tier-2': { src: u('photo-1470071459604-3b5ec3a7fe05'), alt: '' },
  'tier-3': { src: 'https://images.pexels.com/photos/73759/sea-ocean-water-light-73759.jpeg?auto=compress&cs=tinysrgb&w=2000', alt: '' },
}
/** Photo for the /courses hero. */
export const coursesHero: ImageSlot = { src: u('photo-1506905925346-21bda4d32df4'), alt: '' }

/** Photo behind the member library greeting (D19). */
export const libraryHero: ImageSlot = { src: u("photo-1470071459604-3b5ec3a7fe05"), alt: "" }
/** Photo on the empty-library welcome card (D19). */
export const libraryWelcome: ImageSlot = { src: homeChapters.coaching.src, alt: "" }
/** Photo behind the admin dashboard greeting (D20). */
export const adminHero: ImageSlot = { src: u("photo-1506905925346-21bda4d32df4"), alt: "" }

/** Smaller pages (D21). TODO(backend): owner swaps these in the admin, like the other slots. */
export const pageArt: Record<"philosophy" | "philosophyEnd" | "coaching" | "about" | "contact" | "auth", ImageSlot> = {
  philosophy: { src: "https://images.pexels.com/photos/73759/sea-ocean-water-light-73759.jpeg?auto=compress&cs=tinysrgb&w=2000", alt: "" },
  philosophyEnd: { src: u("photo-1507400492013-162706c8c05e", 1200), alt: "" },
  coaching: { src: homeChapters.coaching.src, alt: "" },
  about: { src: homeChapters.coaching.src, alt: "" },
  contact: { src: u("photo-1470071459604-3b5ec3a7fe05"), alt: "" },
  auth: { src: u("photo-1419242902214-272b3f66ee7a"), alt: "" },
}
