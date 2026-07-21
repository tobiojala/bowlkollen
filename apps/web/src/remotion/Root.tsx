import { Composition } from 'remotion'
import { PlayerShareCard, type ShareCardProps } from './PlayerShareCard'

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PlayerShareCard"
    component={PlayerShareCard}
    durationInFrames={90}
    fps={30}
    width={1080}
    height={1080}
    defaultProps={{
      name: 'Spelare',
      teamName: 'Lag',
      avg: 185,
      bestSeries: 256,
      over200: 8,
      rating: 78,
      tierLabel: 'PRO',
      tierAccent: '#5dcaa5',
      tierGlow: 'rgba(29,158,117,0.40)',
      tierBg: 'rgba(29,158,117,0.12)',
      tierRarity: 'RARE ✦',
      avatarUrl: null,
    } satisfies ShareCardProps}
  />
)
