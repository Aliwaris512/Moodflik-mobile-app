import type { ReactNode } from 'react';
import { Redirect, router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, type IconName } from '@/components/ui';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAuth } from '@/context/AuthContext';

const features: { icon: IconName; tint: string; soft: string; text: ReactNode }[] = [
  {
    icon: 'heart',
    tint: colors.success,
    soft: colors.successSoft,
    text: (
      <>
        See, share and speak about daily events and experiences of things you{' '}
        <Text style={{ color: colors.success, fontStyle: 'italic' }}>love</Text> and{' '}
        <Text style={{ color: colors.danger, fontStyle: 'italic' }}>dislike</Text> simultaneously.
      </>
    ),
  },
  {
    icon: 'personAdd',
    tint: colors.primary,
    soft: colors.primarySoft,
    text: 'Find and follow your favourite people, places and organisations with similar interests and dislikes.',
  },
  {
    icon: 'tag',
    tint: colors.danger,
    soft: colors.dangerSoft,
    text: 'Join live hot trending topics of events happening locally and globally with diverse reactions.',
  },
];

export default function Landing() {
  const r = useResponsive();
  const { status } = useAuth();
  // Hero beside the actions on unfolded foldables, tablets and landscape phones.
  const split = r.width >= 700 || r.landscape;
  if (status === 'signedIn') return <Redirect href="/home" />;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: r.compact ? spacing.lg : spacing.xl,
            gap: r.compact ? spacing.lg : spacing.xl,
          },
          split && styles.contentSplit,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.hero, split && styles.heroSplit, r.compact && { paddingTop: spacing.sm }]}
        >
          <View style={styles.glow} />
          <Image
            source={require('../../assets/moodflik/moodfliklogo.webp')}
            style={[styles.logo, r.compact && styles.logoSmall]}
            resizeMode="contain"
            accessibilityLabel="Moodflik"
          />
          <Text maxFontSizeMultiplier={1.3} style={[styles.title, r.compact && styles.titleSmall]}>
            Welcome to Moodflik
          </Text>
          <Text style={styles.subtitle}>
            Where you can share every mood — the good and the bad.
          </Text>
        </View>

        <View style={[styles.side, split && styles.sideSplit]}>
          <View style={[styles.features, r.compact && { padding: spacing.md }]}>
            {features.map((feature) => (
              <View key={feature.icon} style={styles.feature}>
                <View
                  style={[
                    styles.featureIcon,
                    r.compact && styles.featureIconSmall,
                    { backgroundColor: feature.soft },
                  ]}
                >
                  <Icon name={feature.icon} size={22} color={feature.tint} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>No account? No problem.</Text>
            <Text style={styles.ctaSubtitle}>Jump on board in seconds!</Text>
            <Button label="Sign Up" onPress={() => router.push('/sign-up')} />
            <Button label="Sign In" variant="outline" onPress={() => router.push('/login')} />
            <Button
              label="See Trending Moods"
              variant="soft"
              icon="tag"
              onPress={() => router.push('/threads-list')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', flexGrow: 1 },
  contentSplit: { maxWidth: 1100, flexDirection: 'row', alignItems: 'center' },
  side: { gap: spacing.xl },
  sideSplit: { flex: 1, maxWidth: 520 },
  heroSplit: { flex: 1, paddingTop: 0 },
  logoSmall: { width: 160, height: 56 },
  titleSmall: { fontSize: 24, lineHeight: 30 },
  featureIconSmall: { width: 38, height: 38, borderRadius: 12 },
  hero: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.sm },
  glow: {
    position: 'absolute',
    top: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primarySoft,
  },
  logo: { width: 200, height: 72 },
  title: {
    ...typography.display,
    color: colors.darkText,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: { ...typography.body, color: colors.muted, textAlign: 'center', maxWidth: 300 },
  features: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    ...layout.shadow,
  },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, ...typography.body, color: colors.text },
  cta: { gap: spacing.md },
  ctaTitle: { ...typography.h1, color: colors.darkText, textAlign: 'center' },
  ctaSubtitle: {
    ...typography.body,
    fontFamily: fonts.nunitoSemiBold,
    color: colors.primary,
    textAlign: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
});
