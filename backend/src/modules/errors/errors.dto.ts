import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  MinLength,
} from 'class-validator';
import { DifficultyLevel, Severity } from '@prisma/client';

export class CreateErrorDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  rootCause?: string;

  @IsString()
  @MinLength(3)
  solution: string;

  @IsString()
  @IsOptional()
  netsuitePath?: string;

  @IsString()
  @IsOptional()
  howToTest?: string;

  @IsString()
  @IsOptional()
  postValidation?: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  imageIds?: string[];
}

export class UpdateErrorDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  rootCause?: string;

  @IsString()
  @MinLength(3)
  @IsOptional()
  solution?: string;

  @IsString()
  @IsOptional()
  netsuitePath?: string;

  @IsString()
  @IsOptional()
  howToTest?: string;

  @IsString()
  @IsOptional()
  postValidation?: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class ListErrorsDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @IsString()
  @IsOptional()
  tag?: string;
}
