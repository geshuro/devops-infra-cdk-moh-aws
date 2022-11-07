// eslint-disable-next-line max-classes-per-file
import { OmitType } from '@nestjs/mapped-types';
import { Screening } from '@aws-ee/backend-common';

export class CreateScreeningDtoFromClient extends OmitType(Screening, ['id', 'createdBy', 'status']) {}

export class CreateScreeningDto extends OmitType(Screening, ['id']) {}
