import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { encodeImageMessage } from '@/api/chat';
import { uploadMedia } from '@/api/posts/upload';
import { isGiphyAvailable, pickGif } from '@/lib/giphy';

export function Composer({ onSend }: { onSend: (text: string) => void | Promise<void> }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const gifsEnabled = isGiphyAvailable();
  const stopGif = useRef<(() => void) | null>(null);

  useEffect(() => () => stopGif.current?.(), []);

  const openGifs = () => {
    stopGif.current?.();
    stopGif.current = pickGif((url) => void onSend(encodeImageMessage(url)));
  };

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    void onSend(body);
  };

  const attach = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    setUploading(true);
    try {
      const url = await uploadMedia(
        {
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? `chat-${Date.now()}.jpg`,
        },
        'chat',
      );
      await onSend(encodeImageMessage(url));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-row items-end gap-2 border-t border-border bg-white px-3 py-2">
      <Pressable onPress={() => void attach()} disabled={uploading} className="p-2">
        {uploading ? (
          <ActivityIndicator />
        ) : (
          <Ionicons name="image-outline" size={24} color="#01377d" />
        )}
      </Pressable>
      {gifsEnabled ? (
        <Pressable accessibilityLabel="Send a GIF" onPress={openGifs} className="p-2">
          <Ionicons name="happy-outline" size={24} color="#01377d" />
        </Pressable>
      ) : null}
      <TextInput
        className="max-h-28 flex-1 rounded-2xl bg-surface px-4 py-2 text-base text-ink"
        placeholder="Message"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={1000}
      />
      <Pressable onPress={submit} disabled={!text.trim()} className="p-2">
        <Ionicons name="send" size={24} color={text.trim() ? '#00234b' : '#c4c4c4'} />
      </Pressable>
    </View>
  );
}
