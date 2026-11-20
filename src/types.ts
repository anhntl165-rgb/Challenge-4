export type TerrainType = 'plains' | 'hill' | 'crater' | 'rooftop' | 'highland_school';
export type WindDirection = 'left' | 'right' | 'none';

export interface MissionData {
  id: string;
  level: 1 | 2 | 3 | 4;
  levelName: string; // "Level 1: Đồng bằng" | "Level 2: Địa hình" | "Level 3: Gió ngang" | "Level 4: Trong bão"
  terrainType: TerrainType;
  terrainName: string; // "Mặt đất đồng bằng", "Trên đồi", "Dưới hố", "Trên mái nhà", "Sân trường vùng cao"
  targetElevation: number; // h_target relative to ground (0, +30m hill, -20m crater, +18m rooftop, +50m highland school)
  
  altitude: number; // h_plane in meters (100 - 300)
  effectiveHeight: number; // h_effective = h_plane - targetElevation
  velocity: number; // v_plane in m/s (40 - 100)
  
  windSpeed: number; // v_wind in m/s (0 for L1/L2, 8-25 for L3/L4)
  windDirection: WindDirection; // 'left' (gió trái / ngược) | 'right' (gió phải / xuôi) | 'none'
  effectiveVx: number; // v_x = v_plane ± v_wind
  acceleration: number; // a in m/s² (0 for L1/L2/L3, ±0.2 to ±0.6 for L4)

  targetDistance: number; // X_target in meters (e.g., 450 - 850)
  gravity: number; // g = 9.8 m/s²
  exactTimeOfFall: number; // t = sqrt(2 * h_effective / g)
  exactRange: number; // L = v_x * t + 0.5 * a * t²
  exactDropX: number; // X_drop = X_target - L
  tolerance: number; // allowable error in meters (e.g., ±12m)
  villageName: string;
}

export interface DropMarker {
  x: number; // in meters
  isSet: boolean;
}

export interface TrajectoryPoint {
  x: number; // meters
  y: number; // meters above ground
}

export interface PackageState {
  status: 'attached' | 'falling' | 'landed';
  x: number; // current x position in meters
  y: number; // current y altitude in meters
  vx: number; // velocity x (m/s)
  vy: number; // velocity y (m/s)
  fallTime: number; // seconds spent falling
  trajectory: TrajectoryPoint[];
  landedX: number | null;
  errorDistance: number | null; // landedX - targetDistance
  isHit: boolean | null;
}

export type GameStatus = 
  | 'idle'         // Airplane stationary at start, waiting for player to set drop point and press "Bắt đầu nhiệm vụ"
  | 'flying'       // Airplane flying across towards drop point
  | 'dropping'     // Package released and falling along parabolic trajectory
  | 'landed'       // Package touched ground
  | 'missed'       // Missed target area, user can click "Restart"
  | 'success';     // Landed accurately in target village, can move to next mission

export interface MissionResult {
  missionId: string;
  level: 1 | 2 | 3 | 4;
  terrainType: TerrainType;
  terrainName: string;
  targetElevation: number;
  altitude: number;
  velocity: number;
  windSpeed?: number;
  windDirection?: WindDirection;
  effectiveVx?: number;
  acceleration?: number;
  targetX: number;
  chosenDropX: number;
  exactDropX: number;
  errorDistance: number;
  isHit: boolean;
  score: number;
  usedHint?: boolean;
  timestamp: Date;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}
