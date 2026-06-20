import { IsString, IsEnum, Min } from 'class-validator';

export enum FileTypeEnum {
  STL = 'stl',
  STEP = 'step',
}

export class CreateModelDto {
  @IsString()
  filename: string;

  @IsEnum(FileTypeEnum)
  fileType: FileTypeEnum;

  @Min(1)
  fileSize: number;
}
