import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Loader } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { configureGiphy } from '@/lib/giphy';
import { QueryProvider } from '@/lib/query';
import { RealtimeProvider } from '@/providers/RealtimeProvider';

void SplashScreen.preventAutoHideAsync();
configureGiphy();

/* eslint-disable @typescript-eslint/no-require-imports */
const FONTS = {
  'Nunito-Regular': require('../../assets/fonts/Nunito-Regular.ttf') as number,
  'Nunito-Light': require('../../assets/fonts/Nunito-Light.ttf') as number,
  'Nunito-Medium': require('../../assets/fonts/Nunito-Medium.ttf') as number,
  'Nunito-SemiBold': require('../../assets/fonts/Nunito-SemiBold.ttf') as number,
  'Nunito-Bold': require('../../assets/fonts/Nunito-Bold.ttf') as number,
  'Nunito-Black': require('../../assets/fonts/Nunito-Black.ttf') as number,
  'Lato-Regular': require('../../assets/fonts/Lato-Regular.ttf') as number,
  'Lato-Bold': require('../../assets/fonts/Lato-Bold.ttf') as number,
};
/* eslint-enable @typescript-eslint/no-require-imports */

function Routes() {
  const { status } = useAuth();
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const ready = status !== 'loading' && (fontsLoaded || Boolean(fontError));
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return <Loader />;
  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="activate/[uuid]/[token]" />
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>
    </Stack>
  );
  return stack;
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RealtimeProvider>
          <Routes />
        </RealtimeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
