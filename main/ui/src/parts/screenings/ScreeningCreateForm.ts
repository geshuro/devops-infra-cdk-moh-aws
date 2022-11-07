import { IsString, Length, IsOptional } from 'class-validator';
import { useForm, Resolver } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';

export class CreateScreeningForm {
  @IsString()
  @Length(1, 5000)
  clinicalQuestion!: string;

  @IsString()
  @Length(0, 5000)
  keywords!: string;

  @IsString()
  @Length(1, 5000)
  picoP!: string;

  @IsString()
  @Length(1, 5000)
  picoI!: string;

  @IsString()
  @Length(1, 5000)
  picoC!: string;

  @IsString()
  @Length(1, 5000)
  picoO!: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  picoD?: string;
}

const resolver = classValidatorResolver(CreateScreeningForm) as Resolver<CreateScreeningForm>;

export function useCreateScreeningForm() {
  return useForm<CreateScreeningForm>({ resolver, mode: 'onChange' });
}
