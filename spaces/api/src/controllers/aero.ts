import { Controller, Post, Body } from '@nestjs/common';
import { AeroService } from '../services/aero';

@Controller('api/aero')yxport class AeroController {
  constructor(private readonly aeroService: AeroService) {}

  @Post('cd')
  calculateCd(@Body() payload: any) {
    const { form } = payload;
    const cd = this.aeroService.calculateCd(form);
    return { cd, form };
  }

  @Post('range')
  calculateRange(@Body() payload: any) {
    const { weight, speed, cd } = payload;
    const range = this.aeroService.calculateRange(weight, speed, cd);
    return { range, weight, speed, cd };
  }
}