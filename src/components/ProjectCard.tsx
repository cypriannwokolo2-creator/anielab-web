import Link from 'next/link'

interface Project {
  id: string
  title: string
  description: string | null
  cover_ipfs_cid?: string | null
  status: string
  genre?: string
  teamSize?: number
  progressPct?: number
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-950/40"
    >
      <div className="aspect-video w-full bg-gradient-to-br from-stone-800 via-stone-900 to-amber-950/40">
        {project.cover_ipfs_cid ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${project.cover_ipfs_cid}`}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold transition group-hover:text-amber-300">
            {project.title}
          </h3>
          {project.genre ? (
            <span className="shrink-0 rounded-full border border-stone-700 bg-stone-800 px-2.5 py-0.5 text-[11px] text-stone-400">
              {project.genre}
            </span>
          ) : null}
        </div>
        {project.description ? (
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-stone-400">
            {project.description}
          </p>
        ) : null}
        {typeof project.progressPct === 'number' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span>{project.teamSize ?? 0} contributors</span>
              <span>{project.progressPct}% complete</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                style={{ width: `${project.progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
