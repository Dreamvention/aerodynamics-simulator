import { Injectable } from '@nestjs/common';

@Injectable()
export class AeroService {
  // Cd (lift coefficient) table for rocket / drone forms
  private cdTable = {
    'flat': 0.25,
    'sloped': 0.35,
    'ellipsoid': 0.04,
    'sharp': 0.20,
  };

  calculateCd(form: string): number {
    return this.cdTable[form] || 0.25;
  }

  calculateRange(weight: number, speed: number, cd: number): number {
    const seconds = speed * 100 / (cd * 10);
    return (speed / 1000) * seconds;
  }
}