'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { blurFor } from '@/lib/coverBlur'

interface Project {
  id: string
  title: string
  description: string | null
  cover_ipfs_cid?: string | null
  status: string
  genre?: string
  teamSize?: number
  progressPct?: number
  total_pledged?: number
  funding_goal?: number
}

/**
 * Build the full URL for a MinIO object key.
 * The column `cover_ipfs_cid` stores the object key (e.g. `uploads/…/cover.jpg`).
 * The full path includes the bucket name.
 */
function mediaUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'https://minio.anielab.app'
  return `${base}/anielab-media/${key}`
}

export default function ProjectCard({ project }: { project: Project }) {
  const [imgError, setImgError] = useState(false)
  const progressPct =
    project.funding_goal && project.funding_goal > 0 && project.total_pledged != null
      ? Math.min(100, Math.round((project.total_pledged / project.funding_goal) * 100))
      : project.progressPct

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-950/40"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-stone-800 via-stone-900 to-amber-950/40">
        {project.cover_ipfs_cid && !imgError ? (
          <Image
            src={mediaUrl(project.cover_ipfs_cid)}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            placeholder="blur"
            blurDataURL={blurFor(project.cover_ipfs_cid)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl text-stone-700">✦</span>
          </div>
        )}
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
        {typeof progressPct === 'number' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span>{project.teamSize ?? 0} contributors</span>
              <span>{progressPct}% funded</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
