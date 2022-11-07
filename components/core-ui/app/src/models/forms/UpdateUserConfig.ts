import { useForm } from 'react-hook-form';
import { UserForm } from './UserForm';

export type UpdateUserConfigForm = UserForm;

export function useUpdateUserConfigForm(existing: UpdateUserConfigForm) {
  return useForm<UpdateUserConfigForm>({
    mode: 'onChange',
    defaultValues: existing,
  });
}
