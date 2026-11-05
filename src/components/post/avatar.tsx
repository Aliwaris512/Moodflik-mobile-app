import { Image } from 'expo-image';

const FALLBACK = require('../../../assets/images/default_profile.png') as number;

export function Avatar({ uri, size = 44 }: { uri?: string | null; size?: number }) {
  return (
    <Image
      source={uri ? { uri } : FALLBACK}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      accessibilityIgnoresInvertColors
    />
  );
}
