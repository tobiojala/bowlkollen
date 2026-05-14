const API = "https://api.swebowl.se/api/v1/matchResult"

async function getJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "accept": "*/*",
      "origin": "https://bits.swebowl.se",
      "referer": "https://bits.swebowl.se/",
      "user-agent": "Mozilla/5.0",
      "cookie": process.env.SWEBOWL_COOKIE || ""
    },
    cache: "no-store"
  })

  const text = await res.text()

  try {
    return JSON.parse(text)
  } catch {
    return { error: true, status: res.status, text }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const matchId = searchParams.get("matchid") || "3290185"

  const key = process.env.SWEBOWL_API_KEY

  const head = await getJson(
    `${API}/GetHeadResultInfo?APIKey=${key}&id=${matchId}`
  )

  const scores = await getJson(
    `${API}/GetMatchScores?APIKey=${key}&matchId=${matchId}`
  )

  const results = await getJson(
    `${API}/GetMatchResults?APIKey=${key}&matchId=${matchId}&matchSchemeId=8M8BA`
  )

  return Response.json({
    matchId,
    head,
    scores,
    results
  })
}
