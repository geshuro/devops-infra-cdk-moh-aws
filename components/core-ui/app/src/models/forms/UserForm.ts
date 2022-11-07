import { RegisterOptions } from 'react-hook-form';

export interface UserForm {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  userRoles: string[];
  enabled: boolean;
  claims: Record<string, string>;
}

export type FormRules<T> = Partial<Record<keyof T, RegisterOptions>>;

export const UserFormRules: FormRules<UserForm> = {
  username: {
    required: 'Please provide a user name',
    minLength: { value: 3, message: 'The user name should be between 3 and 300 characters' },
    maxLength: { value: 300, message: 'The user name should be between 3 and 300 characters' },
  },
  firstName: {
    required: 'Please provide a first name',
    minLength: { value: 3, message: 'The first name should be between 3 and 500 characters' },
    maxLength: { value: 500, message: 'The first name should be between 3 and 500 characters' },
  },
  lastName: {
    required: 'Please provide a last name',
    minLength: { value: 3, message: 'The last name should be between 3 and 500 characters' },
    maxLength: { value: 500, message: 'The last name should be between 3 and 500 characters' },
  },
  email: { required: 'Please provide a valid email' },
};
