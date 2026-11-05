import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { z } from 'zod';

import { type PickedFile, uploadMedia } from '@/api/posts/upload';
import { Button } from '@/components/ui';
import { useAppForm } from '@/lib/form';

import { MediaView } from './media-view';

export const postSchema = z
  .object({
    mood_type: z.string().trim().min(1, 'Tell us how you feel').max(99),
    content: z.string().trim().max(2000),
    why_content: z.string().trim().max(150, 'Max 150 characters'),
  })
  .refine((v) => v.content.length > 0, { path: ['content'], message: 'Write something' });

export type PostFormValues = z.infer<typeof postSchema> & {
  media_url: string | null;
  content_type: string;
};

type Props = {
  submitLabel: string;
  initial?: {
    mood_type?: string;
    content?: string | null;
    why_content?: string | null;
    media_url?: string | null;
    content_type?: string | null;
  };
  onSubmit: (values: PostFormValues) => Promise<unknown>;
};

export function PostForm({ submitLabel, initial, onSubmit }: Props) {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [existingUrl, setExistingUrl] = useState(initial?.media_url ?? null);

  const form = useAppForm({
    defaultValues: {
      mood_type: initial?.mood_type ?? '',
      content: initial?.content ?? '',
      why_content: initial?.why_content ?? '',
    },
    validators: { onSubmit: postSchema },
    onSubmit: async ({ value }) => {
      let mediaUrl = existingUrl;
      let contentType = initial?.content_type ?? 'text';
      if (file) {
        mediaUrl = await uploadMedia(file);
        contentType = file.mimeType.startsWith('video') ? 'video' : 'image';
      }
      if (!mediaUrl) contentType = 'text';
      await onSubmit({ ...value, media_url: mediaUrl, content_type: contentType });
    },
  });

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    const mimeType = asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
    setFile({
      uri: asset.uri,
      mimeType,
      name: asset.fileName ?? `upload.${mimeType.split('/')[1] ?? 'bin'}`,
    });
  };

  const previewUrl = file?.uri ?? existingUrl;
  const previewType = file?.mimeType ?? initial?.content_type;

  return (
    <View>
      <form.AppField name="mood_type">
        {(field) => <field.TextField label="Mood" placeholder="I'm loving..." />}
      </form.AppField>
      <form.AppField name="content">
        {(field) => <field.TextField label="What's on your mind?" multiline />}
      </form.AppField>
      <form.AppField name="why_content">
        {(field) => <field.TextField label="Why? (optional)" multiline />}
      </form.AppField>

      <MediaView url={previewUrl} type={previewType} />
      <View className="my-4 flex-row gap-3">
        <View className="flex-1">
          <Button
            variant="outline"
            title={previewUrl ? 'Change media' : 'Add photo / video'}
            onPress={() => void pick().catch((e: Error) => Alert.alert('Media', e.message))}
          />
        </View>
        {previewUrl ? (
          <View className="flex-1">
            <Button
              variant="ghost"
              title="Remove"
              onPress={() => {
                setFile(null);
                setExistingUrl(null);
              }}
            />
          </View>
        ) : null}
      </View>

      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(error) =>
          typeof error === 'string' ? (
            <Text className="mb-2 text-sm text-danger">{error}</Text>
          ) : null
        }
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button
            title={submitLabel}
            loading={submitting}
            onPress={() => void form.handleSubmit()}
          />
        )}
      </form.Subscribe>
    </View>
  );
}
