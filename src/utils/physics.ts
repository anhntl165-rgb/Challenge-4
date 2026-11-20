import { MissionData, TerrainType, WindDirection } from '../types';

export const GRAVITY = 9.8; // m/s²

/**
 * Tính điểm số dựa trên sai số điểm rơi (mét) theo quy định
 */
export function calculateScore(errorDistance: number): number {
  const err = Math.abs(errorDistance);
  if (err <= 2) return 10;
  if (err <= 5) return 9;
  if (err <= 8) return 8;
  if (err <= 12) return 7;
  if (err <= 18) return 6;
  if (err <= 25) return 5;
  if (err <= 35) return 4;
  if (err <= 50) return 3;
  if (err <= 70) return 2;
  return 1;
}

const VILLAGE_NAMES = [
  'Làng Hoa Sen',
  'Thôn Bản Xanh',
  'Bản Núi Cao',
  'Xóm Thung Lũng',
  'Làng Bình Yên',
  'Bản Mơ Sa',
  'Thôn Đồng Xanh',
  'Bản Cát Cát'
];

/**
 * Generate a new random mission with physics parameters and level support
 */
export function generateMission(
  missionIndex: number = 1,
  level: 1 | 2 | 3 | 4 = 1,
  requestedTerrain?: TerrainType
): MissionData {
  let terrainType: TerrainType = 'plains';
  let terrainName = 'Mặt đất đồng bằng';
  let levelName = 'Level 1: Đồng bằng';
  let targetElevation = 0;

  let windSpeed = 0;
  let windDirection: WindDirection = 'none';
  let acceleration = 0; // m/s²

  if (level === 2 || level === 3 || level === 4) {
    if (level === 2) {
      levelName = 'Level 2: Địa hình';
    } else if (level === 3) {
      levelName = 'Level 3: Gió ngang';
    } else {
      levelName = 'Level 4: Trong bão';
    }

    // In level 2, 3, 4, terrain can vary
    const terrains: TerrainType[] = ['hill', 'crater', 'rooftop', 'highland_school'];
    terrainType = requestedTerrain && requestedTerrain !== 'plains'
      ? requestedTerrain
      : terrains[Math.floor(Math.random() * terrains.length)];

    switch (terrainType) {
      case 'hill':
        terrainName = 'Trên đồi';
        targetElevation = Math.floor(25 + Math.random() * 25); // +25m to +50m
        break;
      case 'crater':
        terrainName = 'Dưới hố / Thung lũng';
        targetElevation = -Math.floor(15 + Math.random() * 20); // -15m to -35m
        break;
      case 'rooftop':
        terrainName = 'Trên mái nhà';
        targetElevation = Math.floor(14 + Math.random() * 12); // +14m to +26m
        break;
      case 'highland_school':
        terrainName = 'Sân trường vùng cao';
        targetElevation = Math.floor(40 + Math.random() * 30); // +40m to +70m
        break;
      default:
        terrainName = 'Địa hình biến đổi';
        targetElevation = 30;
    }
  }

  // Level 3 & 4: Wind speed & direction
  if (level === 3) {
    const windSpeeds = [8, 10, 12, 14, 16, 18, 20];
    windSpeed = windSpeeds[Math.floor(Math.random() * windSpeeds.length)];
    windDirection = Math.random() < 0.5 ? 'left' : 'right';
  } else if (level === 4) {
    // Level 4: Trong Bão - Gió bão giật rất mạnh (28m/s - 60m/s)
    const stormWindSpeeds = [28, 32, 35, 40, 45, 50, 55, 60];
    windSpeed = stormWindSpeeds[Math.floor(Math.random() * stormWindSpeeds.length)];
    windDirection = Math.random() < 0.5 ? 'left' : 'right';
  }

  // Level 4 specific: Acceleration (Tăng tốc / Giảm tốc đều)
  if (level === 4) {
    const accelerations = [0.2, 0.3, 0.4, 0.5, -0.2, -0.3, -0.4, -0.5];
    acceleration = accelerations[Math.floor(Math.random() * accelerations.length)];
  }

  // Ensure plane altitude is comfortably above target elevation
  const minPlaneAlt = Math.max(100, targetElevation + 60);
  const standardAltitudes = [100, 122.5, 140, 160, 180, 196, 225, 245, 270, 300].filter(a => a >= minPlaneAlt);
  const altitude = standardAltitudes.length > 0
    ? standardAltitudes[Math.floor(Math.random() * standardAltitudes.length)]
    : Math.round((minPlaneAlt + 40) * 10) / 10;

  const standardVelocities = [40, 45, 50, 60, 70, 75, 80, 90, 100];
  const velocity = standardVelocities[Math.floor(Math.random() * standardVelocities.length)];

  // Calculate effective horizontal velocity Vx
  let effectiveVx = velocity;
  if (windDirection === 'right') {
    effectiveVx = velocity + windSpeed; // Gió phải / gió xuôi: vx = v + v_wind
  } else if (windDirection === 'left') {
    effectiveVx = velocity - windSpeed; // Gió trái / gió ngược: vx = v - v_wind
  }

  const targetDistance = Math.floor(480 + Math.random() * 370);

  // Effective height for free fall formula: h_effective = h_plane - targetElevation
  const effectiveHeight = altitude - targetElevation;

  // Exact physics calculations
  const exactTimeOfFall = Math.sqrt((2 * effectiveHeight) / GRAVITY); // t_2 = sqrt(2h/g)
  
  let exactDropX = 0;
  let exactRange = 0; // X_2 = v_1 * t_2

  if (acceleration !== 0) {
    // Stage 1: Plane accelerated motion v_1 = v_0 + a*t_1, X_1 = v_0*t_1 + 0.5*a*t_1^2
    // Stage 2: Free fall with horizontal v_1, X_2 = v_1 * t_2
    // Total X = X_1 + X_2 = 0.5*a*t_1^2 + (v_0 + a*t_2)*t_1 + v_0*t_2 = targetDistance
    const A = 0.5 * acceleration;
    const B = effectiveVx + acceleration * exactTimeOfFall;
    const C = effectiveVx * exactTimeOfFall - targetDistance;
    const delta = B * B - 4 * A * C;
    
    // Find positive t_1
    const t1 = (-B + Math.sqrt(Math.max(0, delta))) / (2 * A);
    const X1 = effectiveVx * t1 + 0.5 * acceleration * t1 * t1;
    const v1 = effectiveVx + acceleration * t1;
    const X2 = v1 * exactTimeOfFall;

    exactDropX = X1;
    exactRange = X2;
  } else {
    exactRange = effectiveVx * exactTimeOfFall;
    exactDropX = targetDistance - exactRange;
  }

  const villageName = VILLAGE_NAMES[Math.floor(Math.random() * VILLAGE_NAMES.length)];

  return {
    id: `mission-${missionIndex}-${Date.now()}`,
    level,
    levelName,
    terrainType,
    terrainName,
    targetElevation,
    altitude: Math.round(altitude * 10) / 10,
    effectiveHeight: Math.round(effectiveHeight * 10) / 10,
    velocity: Math.round(velocity * 10) / 10,
    windSpeed,
    windDirection,
    effectiveVx: Math.round(effectiveVx * 10) / 10,
    acceleration,
    targetDistance,
    gravity: GRAVITY,
    exactTimeOfFall: Math.round(exactTimeOfFall * 100) / 100,
    exactRange: Math.round(exactRange * 10) / 10,
    exactDropX: Math.round(exactDropX * 10) / 10,
    tolerance: 12.0, // ±12 meters hit box
    villageName
  };
}

/**
 * Calculates current position of falling relief package at time t (seconds)
 */
export function calculatePackagePosition(
  dropX: number,
  altitude: number,
  velocity: number,
  t: number,
  acceleration: number = 0,
  targetElevation: number = 0
): { x: number; y: number; landed: boolean } {
  // Stage 2 release velocity v_1 at dropX
  const releaseVelocity = acceleration !== 0
    ? Math.sqrt(Math.max(0, velocity * velocity + 2 * acceleration * dropX))
    : velocity;
  const x = dropX + releaseVelocity * t;
  const fallDistance = 0.5 * GRAVITY * t * t;
  const y = Math.max(targetElevation, altitude - fallDistance);
  const landed = y <= targetElevation;

  return { x, y, landed };
}
