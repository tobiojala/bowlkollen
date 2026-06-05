'use client'

import { MapPin, Hand } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { PlayerSparkline } from '@/components/players/PlayerSparkline'
import { playerAchievementChipStyle, type PlayerTier } from '@/lib/player-ui'

type Player = {
  bio: string | null
  hand: string | null
  style: string | null
  hometown: string | null
  ball_brand: string | null
  favorite_center: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  achievements: string[] | null
}

type Props = {
  player: Player
  editData: Partial<Player>
  onEditDataChange: (data: Partial<Player>) => void
  editing: boolean
  onSave: () => void
  onCancel: () => void
  saving: boolean
  allGames: number[]
  resultsCount: number
  over250: number
  tier: PlayerTier
}

function ProfileField({
  label,
  value,
  placeholder,
  editing,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  placeholder: string
  editing: boolean
  onChange: (v: string) => void
  type?: 'text' | 'textarea'
}) {
  return (
    <div className="mb-3.5">
      <div className="mb-1 text-[11px] font-bold tracking-wide text-dark-muted uppercase">{label}</div>
      {editing ? (
        type === 'textarea' ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="box-border w-full resize-y rounded-[10px] border border-light-border bg-light-card px-3 py-2 text-[13px] bk-text-primary outline-none dark:border-dark-border dark:bg-dark-card"
          />
        ) : (
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="box-border w-full rounded-[10px] border border-light-border bg-light-card px-3 py-2 text-[13px] bk-text-primary outline-none dark:border-dark-border dark:bg-dark-card"
          />
        )
      ) : (
        <div className={cn('text-sm', value ? 'bk-text-primary' : 'italic text-dark-muted')}>
          {value || placeholder}
        </div>
      )}
    </div>
  )
}

export function PlayerOverviewTab({
  player,
  editData,
  onEditDataChange,
  editing,
  onSave,
  onCancel,
  saving,
  allGames,
  resultsCount,
  over250,
  tier,
}: Props) {
  const set = (key: keyof Player, val: string | string[]) =>
    onEditDataChange({ ...editData, [key]: val })

  return (
    <>
      {allGames.length >= 3 && (
        <div className="border-b border-light-border px-5 py-4 dark:border-dark-border">
          <div className="mb-2.5 text-[10px] font-extrabold tracking-widest text-dark-muted">SENASTE FORM</div>
          <PlayerSparkline games={allGames} />
          <div className="mt-2 flex gap-3">
            <span className="flex items-center gap-1 text-[10px] text-dark-muted">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#5a82b4]" />
              250+
            </span>
            <span className="flex items-center gap-1 text-[10px] text-dark-muted">
              <span className="inline-block h-2 w-2 rounded-sm bg-gold" />
              200+
            </span>
          </div>
        </div>
      )}

      {editing && (
        <div className="border-b border-light-border px-5 py-5 dark:border-dark-border">
          <p className="mb-4 text-[13px] font-bold bk-text-primary">Redigera profil</p>
          <ProfileField
            label="Om mig"
            value={(editData.bio as string) || ''}
            placeholder="Skriv en kort beskrivning..."
            editing
            onChange={v => set('bio', v)}
            type="textarea"
          />
          <ProfileField
            label="Hemstad"
            value={(editData.hometown as string) || ''}
            placeholder="T.ex. Stockholm"
            editing
            onChange={v => set('hometown', v)}
          />
          <div className="mb-3.5">
            <div className="mb-1 text-[11px] font-bold tracking-wide text-dark-muted uppercase">HAND</div>
            <div className="flex gap-2">
              {(['right', 'left'] as const).map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => set('hand', h)}
                  className={cn(
                    'flex-1 cursor-pointer rounded-[10px] border py-2 text-[13px] font-semibold',
                    editData.hand === h
                      ? 'border-gold/50 bg-gold/15 text-gold'
                      : 'border-light-border text-dark-muted dark:border-dark-border',
                  )}
                >
                  {h === 'right' ? 'Höger' : 'Vänster'}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3.5">
            <div className="mb-1 text-[11px] font-bold tracking-wide text-dark-muted uppercase">STIL</div>
            <div className="flex flex-wrap gap-1.5">
              {['Straight', 'Hook', 'Cranker', 'Tweener', 'Stroker'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('style', s)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold',
                    editData.style === s
                      ? 'border-gold/50 bg-gold/15 text-gold'
                      : 'border-light-border text-dark-muted dark:border-dark-border',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <ProfileField
            label="Klotmärke"
            value={(editData.ball_brand as string) || ''}
            placeholder="T.ex. Storm, Roto Grip..."
            editing
            onChange={v => set('ball_brand', v)}
          />
          <ProfileField
            label="Favoritcenter"
            value={(editData.favorite_center as string) || ''}
            placeholder="T.ex. Nässjö Bowling"
            editing
            onChange={v => set('favorite_center', v)}
          />
          <p className="mb-2.5 mt-1 text-xs font-bold text-dark-muted">SOCIALA MEDIER</p>
          <div className="mb-3.5">
            <div className="mb-2 text-[11px] font-bold tracking-wide text-dark-muted uppercase">
              MERITER & TITLAR
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(editData.achievements || []).map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border border-gold/45 bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'achievements',
                        (editData.achievements || []).filter((_, j) => j !== i),
                      )
                    }
                    className="cursor-pointer border-none bg-transparent p-0 leading-none text-gold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                id="achInput"
                placeholder='T.ex. "SM-guld 2024"'
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) {
                      set('achievements', [...(editData.achievements || []), val])
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
                className="flex-1 rounded-[10px] border border-light-border bg-light-card px-3 py-2 text-[13px] outline-none dark:border-dark-border dark:bg-dark-card"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('achInput') as HTMLInputElement
                  const val = input?.value.trim()
                  if (val) {
                    set('achievements', [...(editData.achievements || []), val])
                    if (input) input.value = ''
                  }
                }}
                className="cursor-pointer rounded-[10px] border-none bg-gold px-3.5 py-2 text-[13px] font-bold text-[#1a1400]"
              >
                +
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-dark-muted">Tryck Enter eller + för att lägga till.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[
                'SM-guld',
                'SM-silver',
                'SM-brons',
                'Landslagsspelare',
                'PBA Tour',
                'PWBA Tour',
                'Weber Cup',
                '300-serie',
                'Elitserien MVP',
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    set(
                      'achievements',
                      (editData.achievements || []).includes(preset)
                        ? editData.achievements!
                        : [...(editData.achievements || []), preset],
                    )
                  }
                  className="cursor-pointer rounded-[10px] border border-light-border bg-transparent px-2 py-0.5 text-[10px] text-dark-muted dark:border-dark-border"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
          <ProfileField
            label="Instagram (användarnamn)"
            value={(editData.instagram as string) || ''}
            placeholder="ditt_användarnamn"
            editing
            onChange={v => set('instagram', v)}
          />
          <ProfileField
            label="Facebook (URL)"
            value={(editData.facebook as string) || ''}
            placeholder="https://facebook.com/..."
            editing
            onChange={v => set('facebook', v)}
          />
          <ProfileField
            label="YouTube (URL)"
            value={(editData.youtube as string) || ''}
            placeholder="https://youtube.com/..."
            editing
            onChange={v => set('youtube', v)}
          />
          <div className="mt-2 flex gap-2">
            <Button className="flex-1" onClick={onSave} disabled={saving}>
              {saving ? 'Sparar...' : 'Spara'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={onCancel}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {!editing && player.achievements && player.achievements.length > 0 && (
        <div className="border-b border-light-border px-5 py-3.5 dark:border-dark-border">
          <div className="mb-2 text-[10px] font-extrabold tracking-widest text-dark-muted">MERITER</div>
          <div className="flex flex-wrap gap-1.5">
            {player.achievements.map((a, i) => (
              <span
                key={i}
                className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={playerAchievementChipStyle(tier)}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {!editing && (player.hand || player.style || player.ball_brand || player.favorite_center) && (
        <div className="flex flex-wrap gap-2 border-b border-light-border px-5 py-3.5 dark:border-dark-border">
          {player.hand && (
            <span className="inline-flex items-center gap-1.25 rounded-full border border-light-border bg-light-card px-3 py-1.25 text-xs text-dark-muted dark:border-dark-border dark:bg-dark-card">
              <Hand size={11} />
              {player.hand === 'right' ? 'Högerhänt' : 'Vänsterhänt'}
            </span>
          )}
          {player.style && (
            <span className="rounded-full border border-light-border bg-light-card px-3 py-1.25 text-xs text-dark-muted dark:border-dark-border dark:bg-dark-card">
              {player.style}
            </span>
          )}
          {player.ball_brand && (
            <span className="rounded-full border border-light-border bg-light-card px-3 py-1.25 text-xs text-dark-muted dark:border-dark-border dark:bg-dark-card">
              🎳 {player.ball_brand}
            </span>
          )}
          {player.favorite_center && (
            <span className="inline-flex items-center gap-1.25 rounded-full border border-light-border bg-light-card px-3 py-1.25 text-xs text-dark-muted dark:border-dark-border dark:bg-dark-card">
              <MapPin size={11} />
              {player.favorite_center}
            </span>
          )}
        </div>
      )}

      {allGames.length > 0 && (
        <div className="grid grid-cols-2 gap-2 border-b border-light-border px-5 py-3.5 dark:border-dark-border">
          {[
            { label: 'Matcher', value: resultsCount },
            { label: '250+ spel', value: over250 },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl border border-light-border bg-light-card px-3.5 py-3 dark:border-dark-border dark:bg-dark-card"
            >
              <div className="text-lg font-extrabold bk-text-primary">{s.value}</div>
              <div className="mt-0.5 text-[10px] tracking-wide text-dark-muted uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {allGames.length === 0 && !editing && (
        <div className="px-6 py-12 text-center">
          <div className="mb-3 text-[32px]">🎳</div>
          <p className="mb-1.5 text-sm font-semibold bk-text-primary">Inga resultat ännu</p>
          <p className="text-[13px] text-dark-muted">Resultat registreras när matcher spelas.</p>
        </div>
      )}
    </>
  )
}
