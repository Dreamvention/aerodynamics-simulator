export type DroneProfile = 'flat' | 'sloped' | 'ellipsoid' | 'sharp';

export interface ProfileSpec {
  cd: number;
  area: number;
}

export interface AerodynamicInput {
  profile: DroneProfile;
  windSpeed: number;
}

export interface AerodynamicResult {
  cd: number;
  refArea: number;
  dynamicPressure: number;
  dragForce: number;
}

// Air density at sea level, 15°C (kg/m³)
export const AIR_DENSITY = 1.225;

// Reference drag coefficients and frontal areas per drone shape. Kept in sync
// with the values surfaced in the frontend profile selector.
export const PROFILE_SPECS: Record<DroneProfile, ProfileSpec> = {
  flat: { cd: 0.25, area: 0.5 },
  sloped: { cd: 0.35, area: 0.45 },
  ellipsoid: { cd: 0.04, area: 0.35 },
  sharp: { cd: 0.2, area: 0.4 },
};
