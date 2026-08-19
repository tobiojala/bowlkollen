import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Two-door welcome (see docs/ACCOUNT_MODEL.md): fans/family and players both
// belong here. Fans follow & explore with no licence; players additionally claim
// their BITS profile. Neither door is a dead end — both land in a working app.
export function WelcomeChooser({ onFan, onPlayer }: { onFan: () => void; onPlayer: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>BOWLKOLLEN</Text>
      <Text style={styles.h1}>Välkommen</Text>
      <Text style={styles.sub}>Hela din bowling på ett ställe — oavsett om du spelar eller hejar.</Text>

      <View style={styles.doors}>
        <Door
          icon="heart-outline"
          title="Jag följer bowling"
          body="Fan eller familj — följ lag och spelare och få deras matcher, resultat och stories i flödet."
          onPress={onFan}
        />
        <Door
          icon="bowling-ball-outline"
          title="Jag är spelare"
          body="Följ ditt lag och koppla din spelarprofil för din egen statistik, dagbok och laguppställning."
          onPress={onPlayer}
          accent
        />
      </View>
    </View>
  );
}

function Door({ icon, title, body, onPress, accent }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; body: string; onPress: () => void; accent?: boolean;
}) {
  return (
    <PressableScale style={[styles.door, accent && styles.doorAccent]} onPress={onPress} haptic>
      <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
        <Ionicons name={icon} size={26} color={accent ? COLOR.bg : COLOR.gold} />
      </View>
      <View style={styles.doorText}>
        <Text style={styles.doorTitle}>{title}</Text>
        <Text style={styles.doorBody}>{body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLOR.ink3} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: SPACE[6], justifyContent: 'center' },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 3, fontFamily: FONT.bold },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 12, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: SPACE[2] },
  sub: { color: COLOR.ink2, fontSize: TYPE.body, marginTop: SPACE[2], lineHeight: 22 },

  doors: { marginTop: SPACE[8], gap: SPACE[3] },
  door: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[4],
    backgroundColor: COLOR.surface, borderRadius: RADIUS.xl, padding: SPACE[4],
    borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline,
  },
  doorAccent: { borderColor: 'rgba(245,194,0,0.35)' },
  iconWrap: {
    width: 52, height: 52, borderRadius: RADIUS.lg, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,194,0,0.10)',
  },
  iconWrapAccent: { backgroundColor: COLOR.gold },
  doorText: { flex: 1, minWidth: 0 },
  doorTitle: { color: COLOR.ink, fontSize: TYPE.body + 2, fontFamily: FONT.bold, letterSpacing: -0.3 },
  doorBody: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular, marginTop: 3, lineHeight: 18 },
});
