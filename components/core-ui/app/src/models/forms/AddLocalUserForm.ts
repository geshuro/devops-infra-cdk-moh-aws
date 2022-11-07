import { useForm } from 'react-hook-form';
import { UserForm } from './UserForm';

export type AddLocalUserForm = Omit<UserForm, 'userName' | 'claims'>;

export function useAddLocalUserForm() {
  return useForm<AddLocalUserForm>({ mode: 'onChange', defaultValues: { enabled: true } });
}
