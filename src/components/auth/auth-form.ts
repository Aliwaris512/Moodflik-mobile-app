import { createFormHook } from '@tanstack/react-form';

import { fieldContext, formContext } from '@/lib/form';

import { CheckboxField, DateField, GenderField, PasswordField, TextField } from './auth-fields';

export const { useAppForm: useAuthForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField, GenderField, DateField, CheckboxField },
  formComponents: {},
});
