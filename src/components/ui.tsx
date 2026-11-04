import React, { PropsWithChildren, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import { RAIL_WIDTH, useResponsive } from '@/hooks/use-responsive';
import type {
  Comment,
  Conversation,
  Message,
  Notification,
  Post,
  Thread,
  User,
} from '@/types/moodflik';

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

// SF Symbols on iOS, Material Symbols on Android and web.
const icons = {
  home: { ios: 'house', android: 'home', web: 'home' },
  bookmark: { ios: 'bookmark', android: 'bookmark', web: 'bookmark' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  person: { ios: 'person', android: 'person', web: 'person' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  chat: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' },
  heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  heartOutline: { ios: 'heart', android: 'favorite', web: 'favorite' },
  thumbDown: { ios: 'hand.thumbsdown.fill', android: 'thumb_down', web: 'thumb_down' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  menu: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' },
  more: { ios: 'ellipsis', android: 'more_vert', web: 'more_vert' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
  share: { ios: 'arrowshape.turn.up.right', android: 'share', web: 'share' },
  comment: { ios: 'bubble.left', android: 'chat_bubble', web: 'chat_bubble' },
  eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  tag: { ios: 'number', android: 'tag', web: 'tag' },
  edit: { ios: 'square.and.pencil', android: 'edit', web: 'edit' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  photo: { ios: 'photo', android: 'photo', web: 'photo' },
  send: { ios: 'paperplane.fill', android: 'send', web: 'send' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  trending: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' },
  group: { ios: 'person.2', android: 'group', web: 'group' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  mood: { ios: 'face.smiling', android: 'mood', web: 'mood' },
  shield: { ios: 'shield', android: 'shield', web: 'shield' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 22,
  color = colors.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <SymbolView
      name={icons[name]}
      size={size}
      tintColor={color}
      style={{ width: size, height: size }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Basics                                                              */
/* ------------------------------------------------------------------ */

export function AppText({
  children,
  variant = 'body',
  color = colors.text,
  style,
  numberOfLines,
}: PropsWithChildren<{
  variant?: keyof typeof typography;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>) {
  return (
    <Text
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.4}
      style={[typography[variant], { color }, style]}
    >
      {children}
    </Text>
  );
}

export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  padded = true,
  style,
  bottomBar = true,
}: PropsWithChildren<{
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  bottomBar?: boolean;
}>) {
  const r = useResponsive();
  const content = (
    <View
      style={[
        styles.screenContent,
        { maxWidth: r.contentMax, padding: r.gutter, gap: r.compact ? spacing.md : spacing.lg },
        !padded && styles.screenContentFlush,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!scroll) return <View style={styles.screen}>{content}</View>;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: bottomBar && !r.rail ? 120 : spacing.xxl }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {content}
    </ScrollView>
  );
}

export const ScreenContainer = Screen;

export function KeyboardScreen({ children }: PropsWithChildren) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export function Card({
  children,
  style,
  padded = true,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; padded?: boolean }>) {
  return <View style={[styles.card, !padded && styles.cardFlush, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="h3" color={colors.darkText}>
        {title}
      </AppText>
      {action && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText variant="label" color={colors.primary}>
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  tone = 'primary',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'primary' | 'success' | 'danger';
}) {
  const main =
    tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.primary;
  const soft =
    tone === 'success'
      ? colors.successSoft
      : tone === 'danger'
        ? colors.dangerSoft
        : colors.primarySoft;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? main : soft },
        pressed && styles.pressed,
      ]}
    >
      {icon && <Icon name={icon} size={16} color={selected ? colors.white : main} />}
      <Text style={[styles.chipText, { color: selected ? colors.white : main }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Header & navigation                                                 */
/* ------------------------------------------------------------------ */

function HeaderButton({
  icon,
  label,
  onPress,
  badge,
  small = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  badge?: number;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={small ? 8 : 6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButton,
        small && styles.headerButtonSmall,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={small ? 18 : 20} />
      {!!badge && (
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function AppHeader({
  title = 'Moodflik',
  back = false,
  actions = true,
  menu = true,
}: {
  title?: string;
  back?: boolean;
  actions?: boolean;
  menu?: boolean;
}) {
  const r = useResponsive();
  const small = r.compact || r.short;
  return (
    <View style={[styles.header, { paddingHorizontal: r.gutter, height: small ? 52 : 60 }]}>
      <View style={[styles.headerSide, small && styles.headerSideSmall]}>
        {back && (
          <HeaderButton
            small={small}
            icon="back"
            label="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        )}
        {menu && (
          <HeaderButton
            small={small}
            icon="menu"
            label="Open menu"
            onPress={() => router.push('/menu')}
          />
        )}
      </View>
      <View pointerEvents="none" style={styles.headerLogoWrap}>
        <Image
          source={require('../../assets/moodflik/moodfliklogo.webp')}
          style={[styles.logo, r.compact && styles.logoSmall]}
          resizeMode="contain"
          accessibilityLabel={title}
        />
      </View>
      <View style={[styles.headerSide, small && styles.headerSideSmall, styles.headerSideRight]}>
        {actions && (
          <HeaderButton
            small={small}
            icon="search"
            label="Search"
            onPress={() => router.push('/search')}
          />
        )}
        {actions && (
          <HeaderButton
            small={small}
            icon="chat"
            label="Messages"
            badge={2}
            onPress={() => router.push('/direct-message')}
          />
        )}
      </View>
    </View>
  );
}

const tabs = [
  { key: 'home', icon: 'home', label: 'Home', route: '/home' },
  { key: 'favourites', icon: 'bookmark', label: 'Favourites', route: '/favourites' },
  { key: 'add', icon: 'add', label: 'Create post', route: '/create-post' },
  { key: 'notifications', icon: 'bell', label: 'Notifications', route: '/notifications' },
  { key: 'profile', icon: 'person', label: 'Profile', route: '/profile' },
] as const;

export function BottomTabs({
  active = 'home',
  notificationCount = 2,
}: {
  active?: string;
  notificationCount?: number;
}) {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabsWrap,
        {
          paddingBottom: Math.max(insets.bottom, r.compact ? spacing.sm : spacing.md),
          paddingHorizontal: r.compact ? spacing.sm : spacing.lg,
        },
      ]}
    >
      <View style={[styles.tabs, r.compact && styles.tabsCompact]}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          if (tab.key === 'add') {
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                onPress={() => router.push(tab.route)}
                style={({ pressed }) => [
                  styles.tabAdd,
                  r.compact && styles.tabAddCompact,
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="add" size={r.compact ? 22 : 26} color={colors.primary} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => router.replace(tab.route)}
              style={styles.tab}
            >
              <View
                style={[
                  styles.tabIconWrap,
                  r.compact && styles.tabIconCompact,
                  isActive && styles.tabIconActive,
                ]}
              >
                <Icon name={tab.icon} size={22} color={isActive ? colors.primary : colors.white} />
                {tab.key === 'notifications' && notificationCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Vertical navigation for wide screens: unfolded foldables, tablets and landscape phones. */
export function NavRail({
  active = '',
  notificationCount = 2,
}: {
  active?: string;
  notificationCount?: number;
}) {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const showLabels = !r.short;
  return (
    <View style={[styles.rail, { marginBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Image
        source={require('../../assets/moodflik/app-icon.png')}
        style={styles.railLogo}
        accessibilityLabel="Moodflik"
      />
      <View style={[styles.railItems, r.short && { gap: 2 }]}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          if (tab.key === 'add') {
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                onPress={() => router.push(tab.route)}
                style={({ pressed }) => [
                  styles.tabAdd,
                  r.short && styles.tabAddCompact,
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="add" size={24} color={colors.primary} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => router.replace(tab.route)}
              style={styles.railItem}
            >
              <View
                style={[
                  styles.tabIconWrap,
                  r.short && styles.tabIconCompact,
                  isActive && styles.tabIconActive,
                ]}
              >
                <Icon name={tab.icon} size={22} color={isActive ? colors.primary : colors.white} />
                {tab.key === 'notifications' && notificationCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )}
              </View>
              {showLabels && (
                <Text
                  style={[styles.railLabel, isActive && styles.railLabelActive]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  {tab.key === 'favourites'
                    ? 'Saved'
                    : tab.key === 'notifications'
                      ? 'Alerts'
                      : tab.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        onPress={() => router.push('/menu')}
        style={styles.railItem}
      >
        <View style={[styles.tabIconWrap, r.short && styles.tabIconCompact]}>
          <Icon name="menu" size={22} color={colors.white} />
        </View>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'outline' | 'text' | 'soft' | 'success' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  size = 'md',
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const filled = variant === 'primary' || variant === 'success' || variant === 'danger';
  const fg = filled
    ? colors.white
    : variant === 'soft' || variant === 'outline' || variant === 'text'
      ? colors.primary
      : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSmall,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'success' && { backgroundColor: colors.success },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'outline' && styles.buttonOutline,
        variant === 'soft' && styles.buttonSoft,
        variant === 'text' && styles.buttonText,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Text
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            style={[styles.buttonLabel, size === 'sm' && styles.buttonLabelSmall, { color: fg }]}
          >
            {label}
          </Text>
          {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} color={fg} />}
        </>
      )}
    </Pressable>
  );
}

export function Input({
  label,
  error,
  hint,
  icon,
  secureToggle = false,
  rightIcon,
  onRightPress,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  secureToggle?: boolean;
  rightIcon?: IconName;
  onRightPress?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const trailing = secureToggle ? (hidden ? 'eyeOff' : 'eye') : rightIcon;
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View
        style={[
          styles.inputField,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          props.multiline && styles.inputFieldMultiline,
        ]}
      >
        {icon && <Icon name={icon} size={20} color={focused ? colors.primary : colors.muted} />}
        <TextInput
          placeholderTextColor={colors.muted}
          {...props}
          secureTextEntry={secureToggle ? hidden : props.secureTextEntry}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.input, props.multiline && styles.inputMultiline, style]}
        />
        {trailing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              secureToggle ? (hidden ? 'Show password' : 'Hide password') : 'Field action'
            }
            hitSlop={10}
            onPress={secureToggle ? () => setHidden((value) => !value) : onRightPress}
          >
            <Icon name={trailing} size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: PropsWithChildren<{ checked: boolean; onChange: (value: boolean) => void }>) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.checkboxRow}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Icon name="check" size={14} color={colors.white} />}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

export function AppIconButton({
  label,
  onPress,
  children,
  tone = 'plain',
}: PropsWithChildren<{ label: string; onPress: () => void; tone?: 'plain' | 'soft' | 'solid' }>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'soft' && { backgroundColor: colors.primarySoft },
        tone === 'solid' && { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function AppModal({
  visible,
  title,
  onClose,
  children,
}: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} accessibilityLabel="Close dialog" />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <AppText variant="h2" color={colors.darkText}>
            {title}
          </AppText>
          <AppIconButton label="Close" onPress={onClose} tone="soft">
            <Icon name="close" size={18} />
          </AppIconButton>
        </View>
        {children}
      </View>
    </Modal>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  autoFocus,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.searchBar}>
      <Icon name="search" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.searchInput}
        accessibilityLabel={placeholder}
        autoFocus={autoFocus}
      />
      {!!value && (
        <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => onChangeText('')}>
          <Icon name="close" size={18} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Moods                                                               */
/* ------------------------------------------------------------------ */

export type MoodSide = 'love' | 'dislike';

export const isDislikeMood = (mood: string) => /dislike|frustrat|upset|angry|hate/i.test(mood);

export const moodOptions: Record<MoodSide, string[]> = {
  love: ['I’m loving', 'I’m excited', 'I’m grateful', 'I’m proud'],
  dislike: ['I dislike', 'I’m frustrated', 'I’m upset', 'I’m annoyed'],
};

export function MoodToggle({
  value,
  onChange,
}: {
  value: MoodSide;
  onChange: (value: MoodSide) => void;
}) {
  const { compact } = useResponsive();
  return (
    <View style={styles.moodToggle} accessibilityRole="tablist">
      {(['love', 'dislike'] as const).map((side) => {
        const active = value === side;
        const tint = side === 'love' ? colors.success : colors.danger;
        return (
          <Pressable
            key={side}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(side)}
            style={[styles.moodToggleHalf, active && { backgroundColor: tint }]}
          >
            <Icon
              name={side === 'love' ? 'heart' : 'thumbDown'}
              size={18}
              color={active ? colors.white : tint}
            />
            <Text
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              style={[styles.moodToggleText, { color: active ? colors.white : colors.muted }]}
            >
              {compact
                ? side === 'love'
                  ? 'Love'
                  : 'Dislike'
                : side === 'love'
                  ? 'Things I love'
                  : 'Things I dislike'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MoodSelector({
  value,
  onChange,
  side = 'love',
}: {
  value: string;
  onChange: (value: string) => void;
  side?: MoodSide;
}) {
  return (
    <View style={styles.chipRow}>
      {moodOptions[side].map((mood) => (
        <Chip
          key={mood}
          label={mood}
          selected={value === mood}
          onPress={() => onChange(mood)}
          tone={side === 'love' ? 'success' : 'danger'}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function Avatar({
  user,
  size = 44,
  ring = false,
}: {
  user: User;
  size?: number;
  ring?: boolean;
}) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        ring && styles.avatarRing,
      ]}
      accessibilityLabel={`${user.displayName} avatar`}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>
        {initials(user.displayName)}
      </Text>
    </View>
  );
}

export function UserListItem({
  user,
  actionLabel,
  onAction,
  onPress,
  actionVariant = 'soft',
}: {
  user: User;
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
  actionVariant?: ButtonVariant;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressedRow]}
    >
      <Avatar user={user} />
      <View style={styles.listCopy}>
        <AppText variant="h3" color={colors.darkText} numberOfLines={1}>
          {user.displayName}
        </AppText>
        <AppText variant="caption" color={colors.primary}>
          @{user.username}
        </AppText>
      </View>
      {actionLabel && (
        <Button
          label={actionLabel}
          size="sm"
          variant={actionVariant}
          onPress={onAction ?? (() => undefined)}
        />
      )}
    </Pressable>
  );
}

export function ProfileHeader({ user }: { user: User }) {
  return (
    <View style={styles.profileHeader}>
      <Avatar user={user} size={88} ring />
      <AppText variant="h2" color={colors.darkText}>
        {user.displayName}
      </AppText>
      <AppText variant="caption" color={colors.primary}>
        @{user.username}
      </AppText>
    </View>
  );
}

export function StatTile({
  value,
  label,
  tone = 'primary',
  onPress,
}: {
  value: number | string;
  label: string;
  tone?: 'primary' | 'success' | 'danger';
  onPress?: () => void;
}) {
  const main =
    tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.primary;
  const { compact } = useResponsive();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.statTile,
        compact && styles.statTileCompact,
        pressed && styles.pressed,
      ]}
    >
      <Text maxFontSizeMultiplier={1.3} style={[styles.statValue, { color: main }]}>
        {value}
      </Text>
      <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProfileStats({
  user,
  onFollowers,
  onFollowing,
}: {
  user: User;
  onFollowers: () => void;
  onFollowing: () => void;
}) {
  return (
    <View style={styles.statRow}>
      <StatTile value={user.followers} label="Followers" onPress={onFollowers} />
      <StatTile value={user.following} label="Following" onPress={onFollowing} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

export function PostCard({
  post,
  onComment,
  showFollow = true,
}: {
  post: Post;
  onComment?: () => void;
  showFollow?: boolean;
}) {
  const [reaction, setReaction] = useState(post.reacted);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(!!post.favourite);
  const [whyOpen, setWhyOpen] = useState(false);
  const [following, setFollowing] = useState(!!post.author.isFollowing);
  const dislike = isDislikeMood(post.mood);
  const tint = dislike ? colors.danger : colors.success;
  const soft = dislike ? colors.dangerSoft : colors.successSoft;
  const reacted = reaction === 'like';
  const toggleReaction = () => {
    setReaction(reacted ? undefined : 'like');
    setLikes((value) => value + (reacted ? -1 : 1));
  };
  const isMine = post.author.id === 'me';
  const { compact } = useResponsive();
  return (
    <View style={[styles.postCard, compact && styles.postCardCompact]}>
      <View style={[styles.postAuthor, compact && { gap: spacing.sm }]}>
        <Pressable
          onPress={() =>
            router.push(isMine ? '/profile' : `/user-profile?userId=${post.author.id}`)
          }
        >
          <Avatar user={post.author} size={compact ? 38 : 44} />
        </Pressable>
        <View style={styles.authorCopy}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.author.displayName} <Text style={styles.username}>@{post.author.username}</Text>
          </Text>
          <Text style={styles.time}>{post.createdAt}</Text>
        </View>
        {showFollow && !isMine && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={following ? 'Unfollow' : 'Follow'}
            hitSlop={6}
            onPress={() => setFollowing((value) => !value)}
            style={[styles.followPill, following && styles.followPillOn]}
          >
            <Icon
              name={following ? 'check' : 'personAdd'}
              size={16}
              color={following ? colors.white : colors.primary}
            />
          </Pressable>
        )}
        <AppIconButton label="Post options" onPress={() => undefined}>
          <Icon name="more" size={20} color={colors.muted} />
        </AppIconButton>
      </View>

      <Text maxFontSizeMultiplier={1.3} style={[styles.mood, compact && styles.moodCompact]}>
        {post.mood}
      </Text>

      <View style={[styles.bubble, { backgroundColor: tint }]}>
        <Text style={styles.bubbleText}>{post.content}</Text>
        {post.media?.[0] && (
          <Image source={{ uri: post.media[0].uri }} style={styles.bubbleMedia} />
        )}
      </View>

      {whyOpen && post.why && (
        <View style={[styles.whyBox, { backgroundColor: soft, borderLeftColor: tint }]}>
          <Text style={[styles.whyLabel, { color: tint }]}>Why?</Text>
          <Text style={styles.whyText}>{post.why}</Text>
        </View>
      )}

      <View style={[styles.postActions, compact && { gap: 0 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="React to post"
          accessibilityState={{ selected: reacted }}
          onPress={toggleReaction}
          style={[styles.actionPill, reacted && { backgroundColor: soft }]}
        >
          <Icon
            name={reacted ? 'heart' : 'heartOutline'}
            size={18}
            color={reacted ? tint : colors.muted}
          />
          <Text style={[styles.actionCount, reacted && { color: tint }]}>{likes}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View comments"
          onPress={onComment}
          style={styles.actionPill}
        >
          <Icon name="comment" size={18} color={colors.muted} />
          <Text style={styles.actionCount}>{post.comments}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from favourites' : 'Save to favourites'}
          onPress={() => setSaved((value) => !value)}
          style={styles.actionPill}
        >
          <Icon name="bookmark" size={18} color={saved ? colors.primary : colors.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share post"
          style={styles.actionPill}
        >
          <Icon name="share" size={18} color={colors.muted} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {post.why && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: whyOpen }}
            onPress={() => setWhyOpen((value) => !value)}
            style={styles.whyButton}
          >
            <Text style={styles.whyButtonText}>Why?</Text>
            <View style={{ transform: [{ rotate: whyOpen ? '180deg' : '0deg' }] }}>
              <Icon name="chevronDown" size={16} />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function PostActions({ post, onComment }: { post: Post; onComment?: () => void }) {
  return <PostCard post={post} onComment={onComment} />;
}

export function CommentItem({ comment }: { comment: Comment }) {
  return (
    <View style={styles.commentRow}>
      <Avatar user={comment.author} size={36} />
      <View style={styles.commentBubble}>
        <Text style={styles.authorName}>
          {comment.author.displayName}{' '}
          <Text style={styles.username}>@{comment.author.username}</Text>
        </Text>
        <AppText>{comment.body}</AppText>
        <AppText variant="caption" color={colors.muted}>
          {comment.createdAt}
        </AppText>
      </View>
    </View>
  );
}

export function ThreadItem({ thread, onPress }: { thread: Thread; onPress: () => void }) {
  const dislike = isDislikeMood(thread.title);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.threadTop}>
        <View
          style={[
            styles.threadIcon,
            { backgroundColor: dislike ? colors.dangerSoft : colors.successSoft },
          ]}
        >
          <Icon name="tag" size={18} color={dislike ? colors.danger : colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" color={colors.darkText}>
            {thread.title}
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            {thread.comments} comments · {thread.createdAt}
          </AppText>
        </View>
        <Icon name="chevronRight" size={18} color={colors.muted} />
      </View>
      <AppText numberOfLines={2}>{thread.post.content}</AppText>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications & messages                                            */
/* ------------------------------------------------------------------ */

const notificationIcon: Record<string, { icon: IconName; color: string }> = {
  reaction: { icon: 'heart', color: colors.success },
  follow: { icon: 'personAdd', color: colors.primary },
  'follow-request': { icon: 'personAdd', color: colors.primary },
  comment: { icon: 'comment', color: colors.primary },
  favourite: { icon: 'bookmark', color: colors.primary },
};

export function NotificationItem({ item, onPress }: { item: Notification; onPress?: () => void }) {
  const meta = notificationIcon[item.kind ?? 'reaction'];
  const [handled, setHandled] = useState<'accepted' | 'declined' | null>(null);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.notification,
        !item.read && styles.notificationUnread,
        pressed && styles.pressedRow,
      ]}
    >
      <View>
        {item.actor ? <Avatar user={item.actor} size={46} /> : <View style={styles.avatar} />}
        <View style={[styles.notificationBadge, { backgroundColor: meta.color }]}>
          <Icon name={meta.icon} size={11} color={colors.white} />
        </View>
      </View>
      <View style={styles.listCopy}>
        <Text style={styles.notificationText}>
          {item.actor && <Text style={styles.notificationActor}>@{item.actor.username} </Text>}
          {item.title}
        </Text>
        {!!item.body && (
          <Text style={styles.notificationBody} numberOfLines={1}>
            “{item.body}”
          </Text>
        )}
        <Text style={styles.time}>{item.time}</Text>
        {item.kind === 'follow-request' &&
          (handled ? (
            <Text style={styles.hint}>Request {handled}</Text>
          ) : (
            <View style={styles.inlineButtons}>
              <Button label="Accept" size="sm" onPress={() => setHandled('accepted')} />
              <Button
                label="Decline"
                size="sm"
                variant="soft"
                onPress={() => setHandled('declined')}
              />
            </View>
          ))}
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export function MessageBubble({ message, mine = false }: { message: Message; mine?: boolean }) {
  return (
    <View style={[styles.messageBubble, mine && styles.messageBubbleMine]}>
      <AppText color={mine ? colors.white : colors.text}>{message.body}</AppText>
      <AppText variant="caption" color={mine ? colors.primarySoft : colors.muted}>
        {message.createdAt}
      </AppText>
    </View>
  );
}

export function ConversationItem({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const unread = conversation.unreadCount > 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressedRow]}
    >
      <Avatar user={conversation.participant} size={50} />
      <View style={styles.listCopy}>
        <View style={styles.rowBetween}>
          <AppText variant="h3" color={colors.darkText}>
            {conversation.participant.displayName}
          </AppText>
          <AppText variant="caption" color={unread ? colors.primary : colors.muted}>
            {conversation.updatedAt}
          </AppText>
        </View>
        <View style={styles.rowBetween}>
          <AppText
            variant="caption"
            color={unread ? colors.darkText : colors.muted}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {conversation.lastMessage}
          </AppText>
          {unread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.composerInput}
        multiline
        accessibilityLabel={placeholder}
      />
      <AppIconButton label="Send" tone="solid" onPress={onSend}>
        <Icon name="send" size={18} color={colors.white} />
      </AppIconButton>
    </View>
  );
}

export function BottomActionBar({ children }: PropsWithChildren) {
  return <View style={styles.bottomActionBar}>{children}</View>;
}

export function MenuRow({
  icon,
  label,
  onPress,
  tone = 'primary',
  last = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger';
  last?: boolean;
}) {
  const main = tone === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !last && styles.menuRowBorder,
        pressed && styles.pressedRow,
      ]}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: tone === 'danger' ? colors.dangerSoft : colors.primarySoft },
        ]}
      >
        <Icon name={icon} size={18} color={main} />
      </View>
      <Text style={[styles.menuLabel, tone === 'danger' && { color: colors.danger }]}>{label}</Text>
      <Icon name="chevronRight" size={18} color={colors.lightGray} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function StateView({
  type,
  message,
}: {
  type: 'loading' | 'empty' | 'error';
  message: string;
}) {
  return (
    <View style={styles.state}>
      {type === 'loading' ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        <View style={styles.stateIcon}>
          <Icon name={type === 'error' ? 'info' : 'mood'} size={30} />
        </View>
      )}
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  screenContentFlush: { padding: 0 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  pressedRow: { backgroundColor: colors.primarySoft },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...layout.shadow,
  },
  cardFlush: { padding: 0, overflow: 'hidden', gap: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.lighterGray, width: '100%' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  chip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  chipText: { fontFamily: fonts.nunitoSemiBold, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  header: {
    height: 60,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  headerSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 88,
    zIndex: 1,
  },
  headerSideSmall: { gap: 6, minWidth: 78 },
  headerSideRight: { justifyContent: 'flex-end' },
  headerLogoWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 130, height: 40 },
  logoSmall: { width: 100, height: 32 },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...layout.shadow,
    shadowOpacity: 0.06,
  },
  headerButtonSmall: { width: 36, height: 36, borderRadius: 18 },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
  },

  tabsWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg },
  tabs: {
    height: layout.tabBarHeight,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    ...layout.shadowStrong,
  },
  tabsCompact: { height: 56, paddingHorizontal: 4 },
  tab: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
  tabIconCompact: { width: 38, height: 38, borderRadius: 19 },
  tabAddCompact: { width: 44, height: 44, borderRadius: 22 },
  rail: {
    width: RAIL_WIDTH - spacing.md,
    marginLeft: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...layout.shadowStrong,
  },
  railLogo: { width: 40, height: 40, borderRadius: 12 },
  railItems: { alignItems: 'center', gap: spacing.sm },
  railItem: { alignItems: 'center', gap: 2, minWidth: 64 },
  railLabel: { fontFamily: fonts.nunitoSemiBold, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  railLabelActive: { color: colors.white, fontFamily: fonts.nunitoBold },
  tabIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: { backgroundColor: colors.white },
  tabAdd: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.xs,
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  badgeText: { color: colors.white, fontFamily: fonts.nunitoBold, fontSize: 10, lineHeight: 13 },

  button: {
    minHeight: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  buttonSmall: { minHeight: 36, borderRadius: radius.pill, paddingHorizontal: spacing.lg },
  buttonPrimary: { backgroundColor: colors.primary, ...layout.shadow, shadowOpacity: 0.22 },
  buttonOutline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  buttonSoft: { backgroundColor: colors.primarySoft },
  buttonText: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.sm,
    minHeight: layout.touchTarget,
  },
  buttonLabel: { fontFamily: fonts.nunitoBold, fontSize: 17 },
  buttonLabelSmall: { fontSize: 14 },
  disabled: { opacity: 0.5 },

  inputWrap: { gap: 6 },
  inputLabel: { ...typography.label, color: colors.darkText, marginLeft: 2 },
  inputField: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.lighterGray,
  },
  inputFieldMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    minHeight: 50,
    color: colors.darkText,
    fontFamily: fonts.nunitoRegular,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
  hint: { ...typography.caption, color: colors.muted, marginLeft: 2 },
  error: { ...typography.caption, color: colors.danger, marginLeft: 2 },

  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBackdrop: { flex: 1, backgroundColor: colors.overlay },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.lighterGray,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  searchBar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...layout.shadow,
    shadowOpacity: 0.05,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: colors.darkText,
    fontFamily: fonts.nunitoRegular,
    fontSize: 16,
  },

  moodToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...layout.shadow,
    shadowOpacity: 0.05,
  },
  moodToggleHalf: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moodToggleText: { fontFamily: fonts.nunitoBold, fontSize: 14 },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarRing: { borderWidth: 4, borderColor: colors.surface },
  avatarText: { color: colors.primary, fontFamily: fonts.nunitoBold },

  listRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  listCopy: { flex: 1, gap: 2 },
  profileHeader: { alignItems: 'center', gap: spacing.xs },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  statTileCompact: { minWidth: '45%' },
  statValue: { fontFamily: fonts.nunitoBold, fontSize: 20, lineHeight: 26 },
  statLabel: { ...typography.caption, color: colors.muted },

  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...layout.shadow,
  },
  postCardCompact: { padding: spacing.md, borderRadius: radius.md },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  authorCopy: { flex: 1 },
  authorName: {
    fontFamily: fonts.nunitoBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.darkText,
  },
  username: { color: colors.primary, fontFamily: fonts.nunitoRegular },
  time: { ...typography.caption, color: colors.muted },
  followPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  followPillOn: { backgroundColor: colors.primary },
  mood: {
    fontFamily: fonts.nunitoMedium,
    fontStyle: 'italic',
    fontSize: 26,
    lineHeight: 34,
    color: colors.darkText,
    marginTop: spacing.xs,
  },
  moodCompact: { fontSize: 22, lineHeight: 28 },
  bubble: { borderRadius: radius.md, borderTopLeftRadius: 4, padding: spacing.md, gap: spacing.md },
  bubbleText: {
    fontFamily: fonts.nunitoSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
  },
  bubbleMedia: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.sm,
    backgroundColor: colors.overlay,
  },
  whyBox: { borderLeftWidth: 3, borderRadius: radius.sm, padding: spacing.md, gap: 2 },
  whyLabel: { fontFamily: fonts.nunitoBold, fontSize: 13 },
  whyText: { ...typography.body, color: colors.text },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionPill: {
    minHeight: 36,
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  actionCount: { fontFamily: fonts.nunitoSemiBold, fontSize: 13, color: colors.muted },
  whyButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  whyButtonText: { fontFamily: fonts.nunitoBold, fontSize: 14, color: colors.primary },

  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderTopLeftRadius: 4,
    padding: spacing.md,
    gap: 2,
  },
  threadTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  threadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  notificationUnread: { backgroundColor: '#FAF6FE' },
  notificationBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notificationText: { ...typography.body, color: colors.text },
  notificationActor: { fontFamily: fonts.nunitoBold, color: colors.darkText },
  notificationBody: { ...typography.caption, color: colors.muted, fontStyle: 'italic' },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  inlineButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },

  messageBubble: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
    gap: 2,
  },
  messageBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...layout.shadow,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: 11,
    paddingBottom: 11,
    backgroundColor: colors.background,
    color: colors.darkText,
    fontFamily: fonts.nunitoRegular,
    fontSize: 16,
  },
  bottomActionBar: { padding: spacing.md, backgroundColor: colors.surface },

  menuRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lighterGray,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontFamily: fonts.nunitoSemiBold, fontSize: 16, color: colors.darkText },

  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  stateText: { ...typography.body, color: colors.muted, textAlign: 'center' },
});

export const commonStyles = styles;
