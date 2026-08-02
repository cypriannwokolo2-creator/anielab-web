/**
 * DEV-ONLY mock data. Shown only in local development while Supabase
 * credentials are not configured. Delete once projects come from the database.
 */
export interface MockProject {
  id: string
  title: string
  description: string
  genre: string
  teamSize: number
  progressPct: number
  status: 'active'
}

export const mockProjects: MockProject[] = [
  {
    id: 'mock-1',
    title: 'Stellar Sakura — OVA',
    description:
      'A 24-minute mecha short about a junior pilot who inherits her father’s battle android and a very un-mechanical promise to her school band.',
    genre: 'Anime · Mecha',
    teamSize: 6,
    progressPct: 64,
    status: 'active',
  },
  {
    id: 'mock-2',
    title: 'Night Market — Webtoon',
    description:
      'An urban-fantasy webtoon about a night market that only opens during eclipses, where vendors trade memories for wishes.',
    genre: 'Comics · Urban fantasy',
    teamSize: 5,
    progressPct: 38,
    status: 'active',
  },
  {
    id: 'mock-3',
    title: 'Hexbound — Indie Game',
    description:
      'A tactical roguelite where every run reshuffles the board — original art, score, and a writer-led story across 40 levels.',
    genre: 'Games · Roguelite',
    teamSize: 8,
    progressPct: 55,
    status: 'active',
  },
  {
    id: 'mock-4',
    title: 'Midnight Bento',
    description:
      'A cozy-fantasy anime series about a night-shift chef whose cooking lets ghosts relive their favorite meals — and maybe finish the conversations they never got to.',
    genre: 'Anime · Cozy fantasy',
    teamSize: 4,
    progressPct: 42,
    status: 'active',
  },
  {
    id: 'mock-5',
    title: 'Neon Haiku',
    description:
      'A five-minute animated music video built around an original synth track — every frame scored, storyboarded, and sung by its three creators.',
    genre: 'Music · Music video',
    teamSize: 3,
    progressPct: 23,
    status: 'active',
  },
  {
    id: 'mock-6',
    title: 'Paper Cranes',
    description:
      'A short film about a 1960s paper-mill town where an unlikely film club becomes the only thing its members agree on.',
    genre: 'Film · Drama',
    teamSize: 7,
    progressPct: 81,
    status: 'active',
  },
]
