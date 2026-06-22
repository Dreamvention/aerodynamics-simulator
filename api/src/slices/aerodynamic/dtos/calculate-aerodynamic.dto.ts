import { IsEnum, IsNumber, Max, Min } from 'class-validator';

export enum DroneProfileEnum {
  FLAT = 'flat',
  SLOPED = 'sloped',
  ELLIPSOID = 'ellipsoid',
  SHARP = 'sharp',
}

export class CalculateAerodynamicDto {
  @IsEnum(DroneProfileEnum)
  profile: DroneProfileEnum;

  @IsNumber()
  @Min(0)
  @Max(200)
  windSpeed: number;
}
