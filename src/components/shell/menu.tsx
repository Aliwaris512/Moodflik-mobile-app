import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';

type MenuValue = { open: () => void; close: () => void };
const MenuContext = createContext<MenuValue | null>(null);

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used inside MenuProvider');
  return ctx;
}

const LINKS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string }[] = [
  { label: 'Home', icon: 'home-outline', href: '/home' },
  { label: 'Search', icon: 'search-outline', href: '/search' },
  { label: 'Notifications', icon: 'notifications-outline', href: '/notifications' },
  { label: 'Profile', icon: 'person-outline', href: '/profile' },
  { label: 'Favourites', icon: 'bookmark-outline', href: '/post/favourites' },
  { label: 'My posts', icon: 'document-text-outline', href: '/post/mine' },
  { label: 'Chat', icon: 'chatbubble-ellipses-outline', href: '/chat' },
  { label: 'Settings', icon: 'settings-outline', href: '/settings' },
  { label: 'Legal & help', icon: 'information-circle-outline', href: '/legal' },
];

/** Drawer-equivalent: a left sheet opened from the header menu button. */
export function MenuProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <MenuContext.Provider value={value}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View className="flex-1 flex-row">
          <SafeAreaView className="w-72 bg-brand">
            <Text className="px-5 py-6 text-2xl font-bold text-white">Moodflik</Text>
            {LINKS.map((link) => (
              <Pressable
                key={link.href}
                className="flex-row items-center gap-3 px-5 py-3"
                onPress={() => {
                  close();
                  router.push(link.href as Href);
                }}
              >
                <Ionicons name={link.icon} size={22} color="#fff" />
                <Text className="text-base text-white">{link.label}</Text>
              </Pressable>
            ))}
            <Pressable
              className="mt-4 flex-row items-center gap-3 px-5 py-3"
              onPress={() => {
                close();
                void signOut();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color="#ff6473" />
              <Text className="text-base text-danger">Sign out</Text>
            </Pressable>
          </SafeAreaView>
          <Pressable
            className="flex-1 bg-black/40"
            onPress={close}
            accessibilityLabel="Close menu"
          />
        </View>
      </Modal>
    </MenuContext.Provider>
  );
}

export function MenuButton() {
  const { open } = useMenu();
  return (
    <Pressable onPress={open} hitSlop={10} className="px-4" accessibilityLabel="Open menu">
      <Ionicons name="menu" size={26} color="#00234b" />
    </Pressable>
  );
}
