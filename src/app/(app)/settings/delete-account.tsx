import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { type AccountAction, errorMessage, useAccountAction, useMeId } from '@/api/users';
import { ConfirmModal } from '@/components/profile/confirm-modal';
import { DELETE_REASONS, type Reason } from '@/components/profile/delete-reasons';
import { Notice } from '@/components/profile/ui';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const meId = useMeId();
  const act = useAccountAction(meId);
  const [reason, setReason] = useState<Reason | null>(null);
  const [kept, setKept] = useState(false);
  const [pending, setPending] = useState<AccountAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (action: AccountAction) => {
    if (!reason) return;
    setError(null);
    act.mutate(
      { action, reason: reason.title },
      {
        onSuccess: async () => {
          setPending(null);
          if (action === 'continue') setKept(true);
          else await signOut();
        },
        onError: (e) => {
          setPending(null);
          setError(errorMessage(e));
        },
      },
    );
  };

  return (
    <Screen>
      <Text className="mb-2 text-lg font-bold text-ink dark:text-white">
        Whoa, is this goodbye? We get it -- sometimes moods go sideways.
      </Text>
      <Text className="mb-4 text-sm text-muted dark:text-neutral-400">
        What are your reasons for wanting to swipe red on us?
      </Text>
      {error ? <Notice>{error}</Notice> : null}

      {kept && reason?.followUp ? (
        <View className="gap-4">
          <Notice kind="ok">{reason.followUp}</Notice>
          <Button title="Back to Moodflik" onPress={() => router.replace('/home')} />
        </View>
      ) : (
        <>
          {DELETE_REASONS.map((r) => {
            const active = reason?.id === r.id;
            return (
              <Pressable
                key={r.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setReason(r)}
                className={`mb-3 rounded-2xl border p-4 ${active ? 'border-brand bg-surface' : 'border-border'}`}
              >
                <Text className="text-base font-semibold text-ink dark:text-white">{r.title}</Text>
                {active ? (
                  <Text className="mt-2 text-sm leading-5 text-muted dark:text-neutral-300">
                    {r.reveal}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}

          {reason ? (
            <View className="mt-2 gap-3">
              {reason.followUp ? (
                <Button
                  title="Keep my account"
                  onPress={() => run('continue')}
                  loading={act.isPending && pending === null}
                />
              ) : null}
              <Button
                variant="outline"
                title="Deactivate for now"
                onPress={() => setPending('deactivate')}
              />
              <Button title="Delete my account" onPress={() => setPending('delete')} />
            </View>
          ) : null}
        </>
      )}

      <ConfirmModal
        visible={pending !== null}
        destructive
        title={pending === 'delete' ? 'Delete your account?' : 'Deactivate your account?'}
        message={
          pending === 'delete'
            ? 'Your account will be scheduled for deletion. This cannot be undone from the app.'
            : 'You can come back any time by logging in again.'
        }
        confirmLabel={pending === 'delete' ? 'Delete' : 'Deactivate'}
        loading={act.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && run(pending)}
      />
    </Screen>
  );
}
