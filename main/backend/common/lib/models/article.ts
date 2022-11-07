import { IsArray, IsIn, IsOptional, IsUrl, IsString } from 'class-validator';

export interface ArticleKey {
  id: string;
}

export class Article implements ArticleKey {
  constructor(copy?: Article) {
    if (copy) {
      Object.assign(this, copy);
    }
  }

  id!: string;

  createdAt?: number;

  title!: string;

  author!: string;

  abstract!: string;

  screeningId!: string;

  @IsUrl({
    protocols: ['s3'],
  })
  source!: string;

  @IsOptional()
  picoPScore?: number;

  @IsOptional()
  picoIScore?: number;

  @IsOptional()
  picoCScore?: number;

  @IsOptional()
  picoOScore?: number;

  @IsOptional()
  firstAvgPico?: number;

  @IsOptional()
  picoDScore?: number | undefined;

  @IsOptional()
  secondPicoPScore?: number;

  @IsOptional()
  secondPicoIScore?: number;

  @IsOptional()
  secondPicoCScore?: number;

  @IsOptional()
  secondPicoOScore?: number;

  @IsOptional()
  secondPicoDScore?: number | undefined;

  @IsOptional()
  secondAvgPico?: number;

  @IsOptional()
  @IsUrl({
    protocols: ['s3'],
  })
  metadataSource?: string | undefined;

  @IsIn(['manual', 'approved', 'rejected'])
  firstAutoReviewDecision?: string;

  @IsIn(['manual', 'approved', 'rejected'])
  secondAutoReviewDecision?: string;

  @IsOptional()
  @IsArray({ each: true })
  decisions?: { madeBy: string; decision: string }[];

  @IsOptional()
  @IsString()
  @IsIn(['approved', 'rejected'])
  firstDecisionSummary?: string;

  @IsOptional()
  @IsArray({ each: true })
  secondDecisions?: { madeBy: string; decision: string }[];

  @IsOptional()
  @IsString()
  @IsIn(['approved', 'rejected'])
  secondDecisionSummary?: string;
}
