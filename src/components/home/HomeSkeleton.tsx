import { dark } from '@/lib/colors'

export default function HomeSkeleton({ C, isDark }: { C: typeof dark; isDark: boolean }) {
  const skelClr = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const S = ({ w = '100%', h = 12, r = 6, style = {} }: { w?: number | string; h?: number; r?: number; style?: React.CSSProperties }) => (
    <div style={{ width: w, height: h, borderRadius: r, background: skelClr, flexShrink: 0, ...style }} />
  )
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes skel-pulse{0%,100%{opacity:.45}50%{opacity:1}}.skel-wrap>*{animation:skel-pulse 1.6s ease-in-out infinite}`}</style>
      <div className="skel-wrap" style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* Din nästa match card */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(91,130,180,0.2)' : 'rgba(91,130,180,0.15)'}` }}>
            <div style={{ height: 3, background: skelClr }} />
            <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <S w={110} h={9} />
                <S w={48} h={18} r={4} style={{ marginLeft: 'auto' }} />
                <S w={52} h={18} r={8} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <S w="70%" h={14} />
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2,3,4].map(i => <S key={i} w={6} h={6} r={99} />)}
                  </div>
                  <S w={36} h={8} />
                </div>
                <div style={{ flexShrink: 0, minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <S w={56} h={26} r={6} />
                  <S w={44} h={8} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <S w="70%" h={14} />
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2,3,4].map(i => <S key={i} w={6} h={6} r={99} />)}
                  </div>
                  <S w={36} h={8} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero strip */}
        <div style={{ padding: '16px 16px 0', display: 'flex', gap: 12, overflowX: 'hidden' }}>
          {[0].map(i => (
            <div key={i} style={{ flex: '0 0 calc(100% - 40px)', borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
              <div style={{ height: 3, background: skelClr }} />
              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <S w={80} h={9} />
                  <S w={52} h={18} r={4} style={{ marginLeft: 'auto' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <S w="80%" h={16} />
                    <S w={32} h={8} />
                  </div>
                  <div style={{ flexShrink: 0, width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <S w={64} h={36} r={8} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <S w="80%" h={16} />
                    <S w={32} h={8} />
                  </div>
                </div>
                <S w="60%" h={10} style={{ alignSelf: 'center' }} />
              </div>
            </div>
          ))}
          <div style={{ flex: '0 0 28px' }} />
        </div>

        {/* Honor roll */}
        <div style={{ marginTop: 28, padding: '0 16px' }}>
          <S w={120} h={10} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10, overflowX: 'hidden' }}>
            {[96, 80, 74, 74, 74].map((w, i) => (
              <div key={i} style={{ flexShrink: 0, width: w, borderRadius: 12,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                padding: '10px 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <S w={40} h={8} />
                <S w={i === 0 ? 48 : 40} h={i === 0 ? 44 : 28} r={6} />
                <S w="80%" h={9} />
                <S w="60%" h={8} />
              </div>
            ))}
          </div>
        </div>

        {/* Ligatabell */}
        <div style={{ marginTop: 28, padding: '0 16px' }}>
          <S w={100} h={10} style={{ marginBottom: 12 }} />
          <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
                borderBottom: i < 7 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none' }}>
                <S w={16} h={10} r={3} />
                <S w={`${55 + (i % 3) * 15}%`} h={10} />
                <S w={20} h={10} r={3} style={{ marginLeft: 'auto' }} />
                <S w={24} h={10} r={3} />
              </div>
            ))}
          </div>
        </div>

        {/* Match list rows */}
        <div style={{ marginTop: 28, padding: '0 16px' }}>
          <S w={130} h={10} style={{ marginBottom: 12 }} />
          <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 12px',
                borderBottom: i < 4 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none' }}>
                <div style={{ width: 3, height: 32, borderRadius: 2, background: skelClr, flexShrink: 0 }} />
                <S w="40%" h={12} style={{ marginLeft: 4 }} />
                <S w={60} h={22} r={6} style={{ marginLeft: 'auto', marginRight: 'auto' }} />
                <S w="40%" h={12} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
