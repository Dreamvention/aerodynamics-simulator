import { Injectable } from '@nestjs/common';
import {
  AIR_DENSITY,
  AerodynamicInput,
  AerodynamicResult,
  PROFILE_SPECS,
} from '../domain';

@Injectable()
export class AerodynamicService {
  calculate(input: AerodynamicInput): AerodynamicResult {
    const spec = PROFILE_SPECS[input.profile];

    const refArea = spec.area;
    const dynamicPressure = 0.5 * AIR_DENSITY * Math.pow(input.windSpeed, 2);
    const dragForce = spec.cd * refArea * dynamicPressure;

    return {
      cd: spec.cd,
      refArea,
      dynamicPressure,
      dragForce,
    };
  }
}
