/**
 * DEV-ONLY mock data. Shown only while Supabase credentials are not
 * configured in .env.local. Delete once projects come from the database.
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
    genre: 'Mecha · Slice of life',
    teamSize: 6,
    progressPct: 64,
    status: 'active',
  },
  {
    id: 'mock-2',
    title: 'Midnight Bento',
    description:
      'A cozy-fantasy series about a night-shift chef whose cooking lets ghosts relive their favorite meals — and maybe finish the conversations they never got to.',
    genre: 'Cozy fantasy · Cooking',
    teamSize: 4,
    progressPct: 42,
    status: 'active',
  },
  {
    id: 'mock-3',
    title: 'Paper Cranes',
    description:
      'A historical drama about a 1960s paper-mill town where an unlikely film club becomes the only thing its members agree on.',
    genre: 'Drama · Historical',
    teamSize: 7,
    progressPct: 81,
    status: 'active',
  },
  {
    id: 'mock-4',
    title: 'Neon Haiku',
    description:
      'A five-minute animated music video built around an original synth track — every frame scored, storyboarded, and sung by its three creators.',
    genre: 'Sci-fi · Music video',
    teamSize: 3,
    progressPct: 23,
    status: 'active',
  },
]
