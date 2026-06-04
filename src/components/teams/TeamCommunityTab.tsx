'use client'

import { cn } from '@/lib/cn'
import { Button, FilterChip } from '@/components/ui'

type Post = {
  id: string
  content: string
  post_type: string
  created_at: string
}

type PostingType = 'news' | 'lineup'

type Props = {
  posts: Post[]
  isAdmin: boolean
  newPost: string
  onNewPostChange: (value: string) => void
  postingType: PostingType
  onPostingTypeChange: (type: PostingType) => void
  submittingPost: boolean
  onSubmit: () => void
  onDelete: (postId: string) => void
}

export function TeamCommunityTab({
  posts,
  isAdmin,
  newPost,
  onNewPostChange,
  postingType,
  onPostingTypeChange,
  submittingPost,
  onSubmit,
  onDelete,
}: Props) {
  const canPublish = newPost.trim().length > 0

  return (
    <div>
      {isAdmin && (
        <div className="border-b border-light-border px-5 py-4 dark:border-dark-border">
          <div className="mb-2.5 flex gap-1.5">
            {(
              [
                { key: 'news' as const, label: 'Nyhet' },
                { key: 'lineup' as const, label: 'Laguttagning' },
              ] as const
            ).map(t => (
              <FilterChip
                key={t.key}
                active={postingType === t.key}
                onClick={() => onPostingTypeChange(t.key)}
              >
                {t.label}
              </FilterChip>
            ))}
          </div>
          <textarea
            value={newPost}
            onChange={e => onNewPostChange(e.target.value)}
            placeholder={
              postingType === 'news' ? 'Dela en nyhet med laget...' : 'Skriv laguttagningen...'
            }
            rows={3}
            className="mb-2 box-border w-full resize-y rounded-[10px] border border-light-border bg-light-card px-3 py-2.5 text-[13px] bk-text-primary outline-none dark:border-dark-border dark:bg-dark-card"
          />
          <div className="flex justify-end">
            <Button onClick={onSubmit} disabled={submittingPost || !canPublish}>
              {submittingPost ? 'Publicerar...' : 'Publicera'}
            </Button>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="mb-3 text-[28px] text-dark-muted">--</div>
          <p className="mb-1.5 text-sm font-semibold bk-text-primary">Inga inlagg an</p>
          <p className="text-[13px] text-dark-muted">
            {isAdmin
              ? 'Dela nyheter och laguttagningar med laget'
              : 'Kapten har inte publicerat nagonting an'}
          </p>
        </div>
      )}

      {posts.map(post => {
        const postDate = new Date(post.created_at)
        const dateStr = postDate.toLocaleDateString('sv-SE', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        const timeStr = postDate.toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const isLineup = post.post_type === 'lineup'

        return (
          <article
            key={post.id}
            className="border-b border-light-border px-5 py-4 dark:border-dark-border"
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-bold',
                  isLineup ? 'bg-gold/15 text-gold' : 'bg-green/15 text-green',
                )}
              >
                {isLineup ? 'LAGUTTAGNING' : 'NYHET'}
              </span>
              <span className="ml-auto text-[11px] text-dark-muted">
                {dateStr} {timeStr}
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDelete(post.id)}
                  className="cursor-pointer border-none bg-transparent px-1 text-xs text-dark-muted"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed bk-text-primary">
              {post.content}
            </p>
          </article>
        )
      })}
    </div>
  )
}
