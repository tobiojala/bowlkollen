'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import PlayerCard from '@/components/PlayerCard'
import { shortName } from '@/lib/utils'
import { calcPlayerRating, getPlayerTier } from '@/lib/player-ui'
import { PlayerPageLoadingSpinner } from '@/components/players/PlayerPageSkeleton'
import { PlayerHero } from '@/components/players/PlayerHero'
import { PlayerStatsBar } from '@/components/players/PlayerStatsBar'
import { PlayerTabBar, type PlayerTab } from '@/components/players/PlayerTabBar'
import { PlayerOverviewTab } from '@/components/players/PlayerOverviewTab'
import { PlayerMatchLogTab } from '@/components/players/PlayerMatchLogTab'
import { PlayerCompareSheet } from '@/components/players/PlayerCompareSheet'

type Props = { params: Promise<{ id: string }> }

type Player = {
  id: string
  name: string
  team_id: string | null
  bio: string | null
  hand: string | null
  style: string | null
  hometown: string | null
  ball_brand: string | null
  avatar_url: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  favorite_center: string | null
  achievements: string[] | null
}

export default function PlayerPage({ params }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [id, setId] = useState<string | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Player>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PlayerTab>('oversikt')
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareQuery, setCompareQuery] = useState('')
  const [compareResults, setCompareResults] = useState<{ id: string; name: string }[]>([])
  const [searchingCompare, setSearchingCompare] = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('players').select('*').eq('id', id).single(),
      supabase
        .from('match_results')
        .select(
          '*, matches:match_id(id, date, division, home_team_id, away_team_id, home_score, away_score, home:teams!home_team_id(name), away:teams!away_team_id(name))',
        )
        .eq('player_id', id)
        .order('date', { ascending: false }),
      supabase.auth.getSession(),
    ]).then(async ([{ data: p }, { data: r }, { data: { session } }]) => {
      if (p) {
        setPlayer(p as Player)
        setEditData(p as Player)
        if (p.team_id) {
          const { data: t } = await supabase.from('teams').select('id, name').eq('id', p.team_id).single()
          if (t) setTeam(t)
        }
      }
      if (r) setResults(r)
      if (session) {
        const { data: claim } = await supabase
          .from('player_claims')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('player_id', id)
          .single()
        setIsOwner(!!claim)
      }
      setLoading(false)
    })
  }, [id])

  const save = async () => {
    if (!id) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('players')
      .update({
        bio: editData.bio,
        hand: editData.hand,
        style: editData.style,
        hometown: editData.hometown,
        ball_brand: editData.ball_brand,
        instagram: editData.instagram,
        facebook: editData.facebook,
        youtube: editData.youtube,
        favorite_center: editData.favorite_center,
        achievements: editData.achievements,
      })
      .eq('id', id)
    if (!error) {
      setPlayer(prev => (prev ? { ...prev, ...editData } : null))
      setEditing(false)
    }
    setSaving(false)
  }

  const uploadAvatar = async (file: File) => {
    if (!id) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('player-avatars')
      .upload(path, file, { upsert: true })
    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('player-avatars').getPublicUrl(path)
      await supabase.from('players').update({ avatar_url: publicUrl }).eq('id', id)
      setPlayer(prev => (prev ? { ...prev, avatar_url: publicUrl } : null))
    }
    setUploadingAvatar(false)
  }

  const searchPlayers = async (q: string) => {
    setCompareQuery(q)
    if (q.trim().length < 2) {
      setCompareResults([])
      return
    }
    setSearchingCompare(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('players')
      .select('id, name')
      .ilike('name', `%${q.trim()}%`)
      .neq('id', id || '')
      .limit(6)
    setCompareResults(data || [])
    setSearchingCompare(false)
  }

  if (loading) return <PlayerPageLoadingSpinner />

  if (!player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-sm text-dark-muted">Spelare hittades inte</p>
      </main>
    )
  }

  const allGames = results.flatMap(r => (r.games || []).filter((g: number) => g > 0))
  const avgScore =
    allGames.length > 0
      ? Math.round(allGames.reduce((a: number, b: number) => a + b, 0) / allGames.length)
      : 0
  const seriesTotals = results
    .map(r =>
      (r.games || []).filter((g: number) => g > 0).reduce((a: number, b: number) => a + b, 0),
    )
    .filter((t: number) => t > 0)
  const bestSeries = seriesTotals.length > 0 ? Math.max(...seriesTotals) : 0
  const over200 = allGames.filter((g: number) => g >= 200).length
  const over250 = allGames.filter((g: number) => g >= 250).length
  const rating = calcPlayerRating(avgScore, bestSeries, over200, allGames.length > 0)
  const tier = getPlayerTier(rating)

  const recentGames = results
    .slice(0, 4)
    .flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
  const olderGames = results
    .slice(4, 8)
    .flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
  const recentAvg =
    recentGames.length > 0
      ? recentGames.reduce((a: number, b: number) => a + b, 0) / recentGames.length
      : 0
  const olderAvg =
    olderGames.length > 0
      ? olderGames.reduce((a: number, b: number) => a + b, 0) / olderGames.length
      : 0
  const formTrend =
    recentGames.length === 0
      ? null
      : olderGames.length === 0
        ? 'neutral'
        : recentAvg > olderAvg + 5
          ? 'up'
          : recentAvg < olderAvg - 5
            ? 'down'
            : 'neutral'
  const trendColor =
    formTrend === 'up' ? '#5dcaa5' : formTrend === 'down' ? '#e05555' : '#6b7a99'

  return (
    <main className="min-h-screen bg-light-bg font-sans bk-text-primary dark:bg-dark-bg">
      <div className="mx-auto max-w-app">
        <PlayerHero
          player={player}
          team={team}
          tier={tier}
          rating={rating}
          hasStats={allGames.length > 0}
          formTrend={formTrend}
          trendColor={trendColor}
          isOwner={isOwner}
          editing={editing}
          onEdit={() => setEditing(true)}
          playerId={id!}
          uploadingAvatar={uploadingAvatar}
          onAvatarUpload={uploadAvatar}
          onOpenCard={() => setCardOpen(true)}
          onOpenCompare={() => {
            setCompareOpen(true)
            setCompareQuery('')
            setCompareResults([])
          }}
          dark={dark}
        />

        {allGames.length > 0 && (
          <PlayerStatsBar
            tier={tier}
            stats={[
              { label: 'SNITT', value: avgScore, color: '#f5c200' },
              { label: 'BÄSTA', value: bestSeries, color: '#5a82b4' },
              { label: '200+', value: over200, color: tier.accent },
              { label: 'BK RATING', value: rating, color: tier.accent },
            ]}
          />
        )}

        <PlayerTabBar tab={activeTab} onTabChange={setActiveTab} matchCount={results.length} />

        {activeTab === 'oversikt' && (
          <PlayerOverviewTab
            player={player}
            editData={editData}
            onEditDataChange={setEditData}
            editing={editing}
            onSave={save}
            onCancel={() => {
              setEditing(false)
              setEditData(player)
            }}
            saving={saving}
            allGames={allGames}
            resultsCount={results.length}
            over250={over250}
            tier={tier}
          />
        )}

        {activeTab === 'matchlogg' && <PlayerMatchLogTab results={results} tier={tier} />}

        {compareOpen && id && (
          <PlayerCompareSheet
            playerId={id}
            playerFirstName={player.name.split(' ')[0]}
            compareQuery={compareQuery}
            compareResults={compareResults}
            searching={searchingCompare}
            onClose={() => setCompareOpen(false)}
            onQueryChange={searchPlayers}
            dark={dark}
          />
        )}

        {cardOpen && (
          <>
            <button
              type="button"
              aria-label="Stäng spelarkort"
              onClick={() => setCardOpen(false)}
              className="fixed inset-0 z-[99] bg-black/50"
            />
            <PlayerCard
              name={player.name}
              teamName={team ? shortName(team.name) : ''}
              avatarUrl={player.avatar_url}
              avg={avgScore || 180}
              bestSeries={bestSeries || 0}
              over200={over200}
              matches={results.length}
              division={
                team?.name
                  ? shortName(team.name).includes('Elit')
                    ? 'Elitserien'
                    : 'Allsvenskan'
                  : 'Division'
              }
              hand={player.hand}
              style={player.style}
              ballBrand={player.ball_brand}
              bio={player.bio}
              achievements={player.achievements || []}
              isDark={dark}
              isOwner={isOwner}
              onClose={() => setCardOpen(false)}
            />
          </>
        )}
      </div>
    </main>
  )
}
