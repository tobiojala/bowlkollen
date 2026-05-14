"use client"

import { useEffect, useState } from "react"

const firstNames = ["Marcus", "Robin", "Felix", "Teodor", "Rasmus", "Axel", "Mikael", "Joel"]
const lastNames = ["Andersson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Gustafsson", "Bergman", "Samuelsson"]

function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    function checkTheme() {
      const html = document.documentElement
      const body = document.body
      const stored = localStorage.getItem("theme")

      setDark(
        stored === "dark" ||
        html.classList.contains("dark") ||
        body.classList.contains("dark") ||
        document.body.style.backgroundColor.includes("17")
      )
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
    observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] })

    window.addEventListener("storage", checkTheme)

    return () => {
      observer.disconnect()
      window.removeEventListener("storage", checkTheme)
    }
  }, [])

  return dark
}

function makePlayers(seed: number) {
  return Array.from({ length: 8 }).map((_, i) => {
    const res = [
      185 + ((seed + i * 13) % 75),
      190 + ((seed + i * 11) % 70),
      180 + ((seed + i * 17) % 80),
      188 + ((seed + i * 19) % 72),
    ]

    return {
      name: `${firstNames[i]} ${lastNames[(seed + i) % lastNames.length]}`,
      res,
      total: res.reduce((a, b) => a + b, 0),
      ser: 4,
      banp: (seed + i) % 5
    }
  })
}

function PlayerTable({ title, players, colors, side }: any) {
  const rowBg = side === "home" ? colors.homeSoft : colors.awaySoft

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${colors.border}`, borderRadius: 14, background: colors.card }}>
      <div style={{ padding: "12px 14px", fontWeight: 950, fontSize: 18, background: rowBg, color: colors.text }}>
        {title}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: colors.tableHead, color: "#fff", textAlign: "left" }}>
            {["Spelare", "Res 1", "Res 2", "Res 3", "Res 4", "Totalt", "Ser", "Banp"].map((h) => (
              <th key={h} style={{ padding: 10, border: `1px solid ${colors.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {players.map((p: any) => (
            <tr key={p.name} style={{ background: rowBg, color: colors.text }}>
              <td style={{ padding: 10, border: `1px solid ${colors.border}`, fontWeight: 800 }}>{p.name}</td>
              {p.res.map((r: number, i: number) => (
                <td key={i} style={{ padding: 10, border: `1px solid ${colors.border}`, textAlign: "right" }}>{r}</td>
              ))}
              <td style={{ padding: 10, border: `1px solid ${colors.border}`, textAlign: "right", fontWeight: 900 }}>{p.total}</td>
              <td style={{ padding: 10, border: `1px solid ${colors.border}`, textAlign: "right" }}>{p.ser}</td>
              <td style={{ padding: 10, border: `1px solid ${colors.border}`, textAlign: "right", fontWeight: 900 }}>{p.banp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LiveScoreBoard({
  matchId,
  homeTeam,
  awayTeam
}: {
  matchId: string | number
  homeTeam?: string
  awayTeam?: string
}) {
  const dark = useDarkMode()
  const [score, setScore] = useState<any>(null)

  const colors = dark
    ? {
        card: "#111827",
        panel: "#161b22",
        text: "#f8fafc",
        muted: "#94a3b8",
        border: "#334155",
        accent: "#fbbf24",
        tableHead: "#3f3a3a",
        homeSoft: "#332b12",
        awaySoft: "#152c3a"
      }
    : {
        card: "#ffffff",
        panel: "#fff7e6",
        text: "#111827",
        muted: "#64748b",
        border: "#e2e8f0",
        accent: "#d99a00",
        tableHead: "#716a6a",
        homeSoft: "#fff5cc",
        awaySoft: "#dcecf2"
      }

  useEffect(() => {
    const seed = Number(String(matchId).replace(/\D/g, "").slice(-3)) || 120

    const homePlayers = makePlayers(seed)
    const awayPlayers = makePlayers(seed + 37)

    const homePins = homePlayers.reduce((sum, p) => sum + p.total, 0)
    const awayPins = awayPlayers.reduce((sum, p) => sum + p.total, 0)

    const homeScore = seed % 3 === 0 ? 10 : seed % 2 === 0 ? 12 : 14
    const awayScore = 20 - homeScore

    setScore({
      status: "LIVE",
      homeTeam: homeTeam || "Hemmalag",
      awayTeam: awayTeam || "Bortalag",
      homeScore,
      awayScore,
      homePins,
      awayPins,
      homePlayers,
      awayPlayers
    })
  }, [matchId, homeTeam, awayTeam])

  if (!score) return <div style={{ padding: 30, color: colors.text }}>Laddar live scoring...</div>

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div style={{ background: colors.panel, border: `1px solid ${colors.accent}`, borderRadius: 20, padding: 24, color: colors.text }}>
        <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: colors.muted }}>
          Automatisk live scoring • {score.status}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 18, marginTop: 18 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: colors.muted }}>Hemmalag</div>
            <div style={{ fontSize: 26, fontWeight: 950 }}>{score.homeTeam}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Kägelpoäng: <b>{score.homePins}</b></div>
          </div>

          <div style={{ fontSize: 58, fontWeight: 950, lineHeight: 1 }}>
            {score.homeScore} - {score.awayScore}
          </div>

          <div>
            <div style={{ fontSize: 13, color: colors.muted }}>Bortalag</div>
            <div style={{ fontSize: 26, fontWeight: 950 }}>{score.awayTeam}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Kägelpoäng: <b>{score.awayPins}</b></div>
          </div>
        </div>
      </div>

      <PlayerTable title={score.homeTeam} players={score.homePlayers} colors={colors} side="home" />
      <PlayerTable title={score.awayTeam} players={score.awayPlayers} colors={colors} side="away" />

      <div style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
        Demo-data tills officiell API-koppling är godkänd.
      </div>
    </div>
  )
}
