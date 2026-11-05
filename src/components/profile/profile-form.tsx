import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { z } from 'zod';

import { errorMessage, uploadImage, type User, useUpdateUser } from '@/api/users';
import { useDataPolicyPrompt } from '@/components/profile/data-policy';
import { Avatar, Notice } from '@/components/profile/ui';
import { Button } from '@/components/ui';
import { useAppForm } from '@/lib/form';

const schema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  phone_number: z.string().trim(),
  country: z.string().trim(),
  city: z.string().trim(),
  website: z
    .string()
    .trim()
    .refine((v) => v === '' || /^(https?:\/\/)?[^\s.]+\.[^\s]+$/.test(v), 'Enter a valid website'),
  me: z.string().trim().max(60),
  like: z.string().trim().max(60),
  dislike: z.string().trim().max(60),
});

type Slot = 'photo_url' | 'cover_photo_url';

/** Shared by the Edit Profile and first-run Profile Setup screens. */
export function ProfileForm({
  user,
  submitLabel,
  onSaved,
}: {
  user: User;
  submitLabel: string;
  onSaved: () => void;
}) {
  const update = useUpdateUser(user.uuid);
  const [photos, setPhotos] = useState<Record<Slot, string | null>>({
    photo_url: user.photo_url ?? null,
    cover_photo_url: user.cover_photo_url ?? null,
  });
  const [busySlot, setBusySlot] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { requestPermission, DataPolicyPrompt } = useDataPolicyPrompt();

  const form = useAppForm({
    defaultValues: {
      username: user.username ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      country: user.country ?? '',
      city: user.city ?? '',
      website: user.website ?? '',
      me: user.me ?? '',
      like: user.like ?? '',
      dislike: user.dislike ?? '',
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await update.mutateAsync(value);
        onSaved();
      } catch (e) {
        setError(errorMessage(e));
      }
    },
  });

  const pick = (slot: Slot) =>
    requestPermission(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: slot === 'photo_url' ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;
      setBusySlot(slot);
      setError(null);
      try {
        const url = await uploadImage(
          asset.uri,
          slot === 'photo_url' ? 'profile' : 'cover',
          asset.mimeType ?? 'image/jpeg',
        );
        await update.mutateAsync({ [slot]: url });
        setPhotos((p) => ({ ...p, [slot]: url }));
      } catch (e) {
        setError(errorMessage(e, 'Upload failed. Please try again.'));
      } finally {
        setBusySlot(null);
      }
    });

  return (
    <View>
      {DataPolicyPrompt}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change cover photo"
        onPress={() => pick('cover_photo_url')}
        className="mb-12 h-36 justify-end overflow-hidden rounded-2xl bg-surface dark:bg-neutral-800"
      >
        {photos.cover_photo_url ? (
          <Image
            source={{ uri: photos.cover_photo_url }}
            style={{ position: 'absolute', inset: 0 }}
            contentFit="cover"
          />
        ) : null}
        <Text className="self-end rounded-tl-xl bg-black/50 px-3 py-1.5 text-xs font-semibold text-white">
          {busySlot === 'cover_photo_url' ? 'Uploading\u2026' : 'Change cover'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={() => pick('photo_url')}
          className="absolute -bottom-10 left-4 rounded-full border-4 border-white dark:border-neutral-950"
        >
          <Avatar user={user} uri={photos.photo_url} size={80} />
        </Pressable>
      </Pressable>

      {error ? <Notice>{error}</Notice> : null}

      {(
        [
          ['username', 'Username', { autoCapitalize: 'none' }],
          ['first_name', 'First name', {}],
          ['last_name', 'Last name', {}],
          ['phone_number', 'Mobile number', { keyboardType: 'phone-pad' }],
          ['country', 'Country', {}],
          ['city', 'City', {}],
          ['website', 'Website (optional)', { autoCapitalize: 'none', keyboardType: 'url' }],
        ] as const
      ).map(([name, label, props]) => (
        <form.AppField key={name} name={name}>
          {(field) => <field.TextField label={label} {...props} />}
        </form.AppField>
      ))}

      <Text className="mb-2 mt-2 text-base font-bold text-ink dark:text-white">Your bio</Text>
      {(
        [
          ['me', 'Me in 3 words'],
          ['like', 'I like'],
          ['dislike', 'I dislike'],
        ] as const
      ).map(([name, label]) => (
        <form.AppField key={name} name={name}>
          {(field) => <field.TextField label={label} maxLength={60} />}
        </form.AppField>
      ))}

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
