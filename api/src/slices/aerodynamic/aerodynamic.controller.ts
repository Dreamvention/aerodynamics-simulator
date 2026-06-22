import { Body, Controller, Post } from '@nestjs/common';
import { AerodynamicService } from './data';
import { AerodynamicResponseDto, CalculateAerodynamicDto } from './dtos';

@Controller('aerodynamic')
export class AerodynamicController {
  constructor(private readonly aerodynamicService: AerodynamicService) {}

  @Post('calculate')
  calculate(@Body() dto: CalculateAerodynamicDto): AerodynamicResponseDto {
    return this.aerodynamicService.calculate({
      profile: dto.profile,
      windSpeed: dto.windSpeed,
    });
  }
}
