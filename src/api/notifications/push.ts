import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { api } from '@/api/client';

import { hrefForNotification } from './index';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

/** Ask permission, fetch the Expo push token and hand it to the backend. */
export async function registerForPush() {
  if (!Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Moodflik',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return null;

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] no EAS projectId in app config; run `eas init` to enable push');
    return null;
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  if (token !== registeredToken) {
    await api.post('chat/device_token/', { token, platform: Platform.OS });
    registeredToken = token;
  }
  return token;
}

export async function unregisterPush() {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await api.delete('chat/device_token/', { data: { token } }).catch(() => undefined);
}

/** Route taps on a push to the matching screen. Returns the unsubscribe function. */
export function listenForPushTaps() {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Parameters<
      typeof hrefForNotification
    >[0];
    const href = hrefForNotification(data);
    if (href) router.push(href);
  });
  return () => sub.remove();
}
