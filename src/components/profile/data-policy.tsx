import { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

const MESSAGE =
  'Moodflik will access your device to retrieve and store images, videos and documents to enable uploading images when creating a new profile or updating your profile picture or cover picture and uploading images, videos or documents whilst creating a new post.\n\nMoodflik will only store uploaded images, videos and documents into its database and server for the purpose of securely storing said data.';

function DataPolicyModal({
  visible,
  onAccept,
  onDismiss,
}: {
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-neutral-900">
          <Text className="mb-2 text-xl font-bold text-ink dark:text-white">Data Policy</Text>
          <Text className="mb-5 text-sm leading-5 text-muted dark:text-neutral-300">{MESSAGE}</Text>
          <View className="flex-row justify-end gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={onDismiss}
              className="rounded-xl px-4 py-2.5"
            >
              <Text className="font-semibold text-muted">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onAccept}
              className="rounded-xl bg-brand px-4 py-2.5"
            >
              <Text className="font-semibold text-white">Accept</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Ask for consent once before running an action that touches device media. */
export function useDataPolicyPrompt() {
  const [visible, setVisible] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const requestPermission = useCallback((onAccept: () => void) => {
    pending.current = onAccept;
    setVisible(true);
  }, []);

  const accept = useCallback(() => {
    const action = pending.current;
    pending.current = null;
    setVisible(false);
    action?.();
  }, []);

  const dismiss = useCallback(() => {
    pending.current = null;
    setVisible(false);
  }, []);

  const DataPolicyPrompt = useMemo(
    () => <DataPolicyModal visible={visible} onAccept={accept} onDismiss={dismiss} />,
    [visible, accept, dismiss],
  );

  return { requestPermission, DataPolicyPrompt };
}
