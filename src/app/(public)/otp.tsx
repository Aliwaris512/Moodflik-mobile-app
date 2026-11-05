import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useResendOtp, useValidateOtp } from '@/api/auth';
import { apiMessage } from '@/api/auth/errors';
import { otpSchema } from '@/api/auth/schemas';
import { FormMessage, Heading } from '@/components/auth/auth-fields';
import { useAuthForm } from '@/components/auth/auth-form';
import { Button, Screen } from '@/components/ui';

export default function OtpValidation() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const validate = useValidateOtp();
  const resend = useResendOtp();
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const form = useAuthForm({
    defaultValues: { code: '' },
    validators: { onChange: otpSchema },
    onSubmit: async ({ value }) => {
      setError('');
      setInfo('');
      try {
        const res = await validate.mutateAsync({ email, code: value.code });
        router.replace({
          pathname: '/reset-password',
          params: { email, code: String(res.data.otp_code) },
        });
      } catch (e) {
        setError(apiMessage(e, 'Invalid code'));
      }
    },
  });

  const onResend = async () => {
    setError('');
    try {
      await resend.mutateAsync(email);
      setInfo('A new code has been sent to your email.');
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Heading>OTP Verification</Heading>
        <FormMessage message={error} />
        <FormMessage message={info} tone="ok" />
        <form.AppField name="code">
          {(field) => (
            <field.TextField
              label="Code"
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
            />
          )}
        </form.AppField>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              title="Verify"
              loading={isSubmitting}
              onPress={() => void form.handleSubmit()}
            />
          )}
        </form.Subscribe>
        <View className="mt-3">
          <Button
            title="Resend code"
            variant="ghost"
            loading={resend.isPending}
            onPress={() => void onResend()}
          />
        </View>
      </View>
    </Screen>
  );
}
