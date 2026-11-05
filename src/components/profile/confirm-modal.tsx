import { Modal, Pressable, Text, View } from 'react-native';

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-neutral-900">
          <Text className="mb-2 text-lg font-bold text-ink dark:text-white">{title}</Text>
          {message ? (
            <Text className="mb-5 text-sm leading-5 text-muted dark:text-neutral-300">
              {message}
            </Text>
          ) : null}
          <View className="flex-row justify-end gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              className="rounded-xl px-4 py-2.5"
            >
              <Text className="font-semibold text-muted">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onConfirm}
              className={`rounded-xl px-4 py-2.5 ${destructive ? 'bg-danger' : 'bg-brand'} ${loading ? 'opacity-60' : ''}`}
            >
              <Text className="font-semibold text-white">
                {loading ? 'Please wait\u2026' : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
