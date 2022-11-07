import { useForm } from 'react-hook-form';
import { UserForm } from './UserForm';

export type AddUserForm = Omit<UserForm, 'claims'>;

export function useAddUserForm() {
  return useForm<AddUserForm>({ mode: 'onChange' });
}
