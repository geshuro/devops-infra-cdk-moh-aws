import { IsIn, Length, IsString, IsOptional, IsUrl } from 'class-validator';
import { ALLOWED_STATUSES } from './status';

export interface ScreeningKey {
  id: string;
}

export class Screening implements ScreeningKey {
  static toOpenSearchIndex(id: string): string {
    return `screening-${id}`.toLowerCase();
  }

  constructor(copy?: Screening) {
    if (copy) {
      Object.assign(this, copy);
    }
  }

  id!: string;

  @IsString()
  @Length(1, 100)
  createdBy!: string;

  @IsIn(ALLOWED_STATUSES)
  status!: string;

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

  @IsString()
  @Length(0, 5000)
  @IsOptional()
  picoD?: string;

  @IsOptional()
  @IsUrl({
    protocols: ['s3'],
  })
  csvMetadataSource!: string | undefined;
}
