import React, { useRef, useEffect, useState } from 'react';
import { MissionData, Particle, TrajectoryPoint, GameStatus } from '../types';
import { audio } from '../utils/audio';
import { calculateScore } from '../utils/physics';
import { RotateCcw, Trophy } from 'lucide-react';

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface SimulationCanvasProps {
  mission: MissionData;
  dropX: number | null;
  onSetDropX: (x: number) => void;
  gameStatus: GameStatus;
  setGameStatus: (status: GameStatus) => void;
  onMissionSuccess: (errorDistance: number) => void;
  onMissionFail: (errorDistance: number, landedX: number) => void;
  onResetPlane: () => void;
  onUpdatePlaneX: (x: number) => void;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  mission,
  dropX,
  onSetDropX,
  gameStatus,
  setGameStatus,
  onMissionSuccess,
  onMissionFail,
  onResetPlane,
  onUpdatePlaneX
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lastLandInfo, setLastLandInfo] = useState<{ error: number; score: number } | null>(null);

  // Animation & simulation state refs
  const planeXRef = useRef<number>(0); // Plane starts stationary at 0m
  const planeTimeRef = useRef<number>(0);
  const packageRef = useRef<{
    isFalling: boolean;
    x: number;
    y: number;
    vx: number;
    t: number;
    trajectory: TrajectoryPoint[];
    landedX: number | null;
    isHit: boolean | null;
  }>({
    isFalling: false,
    x: 0,
    y: mission.altitude,
    vx: mission.effectiveVx ?? mission.velocity,
    t: 0,
    trajectory: [],
    landedX: null,
    isHit: null
  });

  const particlesRef = useRef<Particle[]>([]);
  const smokeTrailRef = useRef<SmokeParticle[]>([]);
  const dustPuffRef = useRef<DustParticle[]>([]);

  const villagersRef = useRef<{ x: number; offset: number }[]>([
    { x: -28, offset: 0 },
    { x: -12, offset: 1.2 },
    { x: 12, offset: 2.4 },
    { x: 28, offset: 3.6 },
  ]);

  const [hoverX, setHoverX] = useState<number | null>(null);

  // World dimensions
  const totalWorldWidth = Math.max(850, mission.targetDistance + 150);

  // Reset plane position & package state when mission changes or gameStatus returns to idle
  useEffect(() => {
    if (gameStatus === 'idle') {
      planeXRef.current = 0;
      packageRef.current = {
        isFalling: false,
        x: 0,
        y: mission.altitude,
        vx: mission.effectiveVx ?? mission.velocity,
        t: 0,
        trajectory: [],
        landedX: null,
        isHit: null
      };
      particlesRef.current = [];
      smokeTrailRef.current = [];
      dustPuffRef.current = [];
      onUpdatePlaneX(0);
    }
  }, [gameStatus, mission]);

  // Handle Canvas Click to set Drop Point
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickPx = e.clientX - rect.left;
    const scaleX = totalWorldWidth / canvas.width;
    const clickedMeters = Math.max(0, Math.min(mission.targetDistance, clickPx * scaleX));

    audio.playClick();
    onSetDropX(Math.round(clickedMeters * 10) / 10);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'idle') {
      setHoverX(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickPx = e.clientX - rect.left;
    const scaleX = totalWorldWidth / canvas.width;
    const hoverMeters = Math.max(0, Math.min(mission.targetDistance, clickPx * scaleX));
    setHoverX(Math.round(hoverMeters * 10) / 10);
  };

  const handleCanvasMouseLeave = () => {
    setHoverX(null);
  };

  // Main Render & Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnFireworks = (targetPxX: number, groundPxY: number) => {
      const colors = ['#34d399', '#f59e0b', '#38bdf8', '#f43f5e', '#a855f7', '#fbbf24'];
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particlesRef.current.push({
          x: targetPxX,
          y: groundPxY - 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 4,
          alpha: 1,
          life: 0,
          maxLife: 60 + Math.random() * 40
        });
      }
    };

    const spawnDustPuff = (landedPxX: number, groundPxY: number) => {
      const dustColors = ['#f59e0b', '#d97706', '#b45309', '#e2e8f0', '#94a3b8'];
      for (let i = 0; i < 35; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.85; // Upward arc
        const speed = 1.2 + Math.random() * 4.5;
        dustPuffRef.current.push({
          x: landedPxX,
          y: groundPxY - 3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          size: 4 + Math.random() * 8,
          alpha: 0.85,
          color: dustColors[Math.floor(Math.random() * dustColors.length)],
          life: 0,
          maxLife: 35 + Math.random() * 25
        });
      }
    };

    const render = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // Handle Canvas Responsive Sizing
      const parent = canvas.parentElement;
      if (parent) {
        if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
          canvas.width = parent.clientWidth;
          canvas.height = Math.max(380, Math.min(500, parent.clientHeight || 420));
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      // Coordinate Scaling Formulas
      const groundY = height - 50;
      const maxAltPx = height * 0.65;
      const scaleX = width / totalWorldWidth;
      const scaleY = maxAltPx / 350; // max 350m height capacity

      const planePxY = groundY - (mission.altitude * scaleY);

      // --- 1. AIRCRAFT MOVEMENT (Stage 1: Accelerated Motion) ---
      const effectiveVx = mission.effectiveVx ?? mission.velocity;
      const accel = mission.acceleration ?? 0;

      if (gameStatus === 'idle') {
        planeXRef.current = 0;
        planeTimeRef.current = 0;
        onUpdatePlaneX(0);
      } else {
        planeTimeRef.current += dt;
        const currentPlaneSpeed = effectiveVx + accel * planeTimeRef.current;
        planeXRef.current += Math.max(5, currentPlaneSpeed) * dt;
        onUpdatePlaneX(planeXRef.current);

        if (gameStatus === 'flying') {
          // CHECK AUTOMATIC DROP TRIGGER
          if (dropX !== null && planeXRef.current >= dropX) {
            // Release Package at Stage 1 End!
            setGameStatus('dropping');
            const releaseVx = accel !== 0
              ? Math.sqrt(Math.max(0, effectiveVx * effectiveVx + 2 * accel * dropX))
              : effectiveVx;

            packageRef.current = {
              isFalling: true,
              x: dropX,
              y: mission.altitude,
              vx: releaseVx,
              t: 0,
              trajectory: [{ x: dropX, y: mission.altitude }],
              landedX: null,
              isHit: null
            };
            audio.playDropSound();
          } else if (planeXRef.current > totalWorldWidth + 30) {
            // Reached end of flight path without dropping
            setGameStatus('missed');
            onMissionFail(totalWorldWidth - mission.targetDistance, totalWorldWidth);
          }
        }
      }

      // --- 2. PACKAGE FALL PHYSICS INTEGRATION (Stage 2: Free Fall with v_1) ---
      if (packageRef.current.isFalling) {
        packageRef.current.t += dt * 1.5; // Smooth speed factor for responsive feel
        const t = packageRef.current.t;

        const targetElev = mission.targetElevation ?? 0;
        const currX = packageRef.current.x + packageRef.current.vx * t;
        const fallDist = 0.5 * mission.gravity * t * t;
        const currY = Math.max(targetElev, mission.altitude - fallDist);

        packageRef.current.trajectory.push({ x: currX, y: currY });

        if (currY <= targetElev) {
          // LANDED!
          packageRef.current.isFalling = false;
          packageRef.current.y = targetElev;
          packageRef.current.landedX = currX;

          const error = Math.abs(currX - mission.targetDistance);
          const isHit = error <= mission.tolerance;
          packageRef.current.isHit = isHit;

          const score = calculateScore(error);
          setLastLandInfo({ error, score });

          audio.playImpactSound(isHit);

          // Impact position on canvas surface:
          const landedPxX = currX * scaleX;
          const targetImpactPxY = groundY - (targetElev * scaleY);
          spawnDustPuff(landedPxX, targetImpactPxY);

          if (isHit) {
            setGameStatus('success');
            audio.playVictoryFanfare();
            const targetPxX = mission.targetDistance * scaleX;
            spawnFireworks(targetPxX, targetImpactPxY);
            onMissionSuccess(error);
          } else {
            setGameStatus('missed');
            onMissionFail(error, currX);
          }
        }
      }

      // --- 3. DRAW BACKGROUND & SKY ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.35, '#0f172a');
      skyGrad.addColorStop(0.75, '#1e2640');
      skyGrad.addColorStop(1, '#1e3a5f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant Stars / Sky Twinkle Dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      [
        { x: width * 0.08, y: 18 }, { x: width * 0.22, y: 32 }, { x: width * 0.42, y: 14 },
        { x: width * 0.65, y: 28 }, { x: width * 0.85, y: 20 }, { x: width * 0.94, y: 40 }
      ].forEach(star => {
        ctx.fillRect(star.x, star.y, 1.5, 1.5);
      });

      // Distant Parallax Mountain Range 1 (Far silhouette)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width * 0.15, groundY - 85);
      ctx.lineTo(width * 0.35, groundY - 40);
      ctx.lineTo(width * 0.55, groundY - 105);
      ctx.lineTo(width * 0.8, groundY - 50);
      ctx.lineTo(width, groundY - 95);
      ctx.lineTo(width, groundY);
      ctx.closePath();
      ctx.fill();

      // Near Parallax Mountain Range 2 (Slightly darker with ridge highlights)
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width * 0.1, groundY - 45);
      ctx.lineTo(width * 0.28, groundY - 70);
      ctx.lineTo(width * 0.48, groundY - 35);
      ctx.lineTo(width * 0.7, groundY - 65);
      ctx.lineTo(width * 0.9, groundY - 30);
      ctx.lineTo(width, groundY - 55);
      ctx.lineTo(width, groundY);
      ctx.closePath();
      ctx.fill();

      // --- MÂY CHUYỂN ĐỘNG (Multi-layered Drifting Clouds) ---
      const timeSec = currentTime * 0.001;

      // Layer 1: High background clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      [
        { x: ((timeSec * 8 + 50) % (width + 120)) - 60, y: 35, r: 25 },
        { x: ((timeSec * 8 + 400) % (width + 120)) - 60, y: 55, r: 30 },
        { x: ((timeSec * 8 + 750) % (width + 120)) - 60, y: 25, r: 22 },
      ].forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.arc(c.x + c.r * 0.6, c.y - 5, c.r * 0.7, 0, Math.PI * 2);
        ctx.arc(c.x - c.r * 0.6, c.y, c.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 2: Midground fluffy drifting clouds with soft white/cyan glow
      ctx.fillStyle = 'rgba(224, 242, 254, 0.15)';
      [
        { x: ((timeSec * 20 + 100) % (width + 180)) - 90, y: 70, r: 36 },
        { x: ((timeSec * 20 + 550) % (width + 180)) - 90, y: 45, r: 42 },
        { x: ((timeSec * 20 + 920) % (width + 180)) - 90, y: 85, r: 38 },
      ].forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.arc(c.x + c.r * 0.6, c.y - 8, c.r * 0.75, 0, Math.PI * 2);
        ctx.arc(c.x - c.r * 0.6, c.y + 2, c.r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- LEVEL 3: GIÓ NGANG VISUAL STREAMS (Wind Vector Lines) ---
      if (mission.level === 3 || (mission.windSpeed && mission.windSpeed > 0)) {
        const isLeftWind = mission.windDirection === 'left';
        const windSpeedFactor = (mission.windSpeed || 15) * 4;
        const windDirMult = isLeftWind ? -1 : 1;
        
        ctx.strokeStyle = isLeftWind ? 'rgba(244, 63, 94, 0.25)' : 'rgba(56, 189, 248, 0.3)';
        ctx.fillStyle = isLeftWind ? 'rgba(244, 63, 94, 0.4)' : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;

        const windLines = [
          { y: planePxY - 25, offset: 0, len: 70 },
          { y: planePxY + 20, offset: 180, len: 90 },
          { y: planePxY + 60, offset: 90, len: 80 },
          { y: planePxY + 110, offset: 270, len: 100 },
          { y: planePxY - 50, offset: 130, len: 60 }
        ];

        windLines.forEach(wl => {
          let wx = ((timeSec * windSpeedFactor * windDirMult + wl.offset) % (width + 200));
          if (wx < -100) wx += width + 200;

          // Draw wavy wind stream line
          ctx.beginPath();
          ctx.moveTo(wx, wl.y);
          ctx.quadraticCurveTo(wx + wl.len * 0.5 * windDirMult, wl.y + Math.sin(timeSec * 4 + wl.offset) * 6, wx + wl.len * windDirMult, wl.y);
          ctx.stroke();

          // Arrow head
          const arrowX = wx + wl.len * windDirMult;
          ctx.beginPath();
          ctx.moveTo(arrowX, wl.y);
          ctx.lineTo(arrowX - 8 * windDirMult, wl.y - 4);
          ctx.lineTo(arrowX - 8 * windDirMult, wl.y + 4);
          ctx.closePath();
          ctx.fill();
        });
      }

      // Ground Surface Base
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#064e3b');
      groundGrad.addColorStop(0.3, '#022c22');
      groundGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Ground Line Accent
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Target elevation calculations
      const targetPxX = mission.targetDistance * scaleX;
      const targetElevPx = (mission.targetElevation ?? 0) * scaleY;
      const targetSurfaceY = groundY - targetElevPx;

      // Draw Specific Terrain Visual Features
      const tType = mission.terrainType ?? 'plains';

      if (tType === 'hill') {
        // Draw grassy rounded hill
        const hillWidth = 190;
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.moveTo(targetPxX - hillWidth / 2, groundY);
        ctx.quadraticCurveTo(targetPxX, targetSurfaceY - 10, targetPxX + hillWidth / 2, groundY);
        ctx.closePath();
        ctx.fill();

        // Hill outline
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(targetPxX - hillWidth / 2, groundY);
        ctx.quadraticCurveTo(targetPxX, targetSurfaceY - 10, targetPxX + hillWidth / 2, groundY);
        ctx.stroke();

        // Slope trees
        [-65, 65].forEach(dx => {
          const tx = targetPxX + dx;
          const ty = groundY - (targetElevPx * 0.45);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(tx - 2, ty - 12, 4, 12);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(tx, ty - 16, 9, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (tType === 'crater') {
        // Draw sunken pit/crater
        const craterWidth = 170;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(targetPxX - craterWidth / 2, groundY);
        ctx.quadraticCurveTo(targetPxX, targetSurfaceY + 12, targetPxX + craterWidth / 2, groundY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(targetPxX - craterWidth / 2, groundY);
        ctx.quadraticCurveTo(targetPxX, targetSurfaceY + 12, targetPxX + craterWidth / 2, groundY);
        ctx.stroke();
      } else if (tType === 'rooftop') {
        // Draw Flood Rescue Building
        const bWidth = 90;
        const bTop = targetSurfaceY;
        ctx.fillStyle = '#334155';
        ctx.fillRect(targetPxX - bWidth / 2, bTop, bWidth, groundY - bTop);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(targetPxX - bWidth / 2, bTop, bWidth, groundY - bTop);

        // Windows
        ctx.fillStyle = '#38bdf8';
        [-25, 0, 25].forEach(wx => {
          ctx.fillRect(targetPxX + wx - 5, bTop + 12, 10, 8);
          if (groundY - bTop > 35) {
            ctx.fillRect(targetPxX + wx - 5, bTop + 28, 10, 8);
          }
        });

        // Rooftop Crosshair Target Icon
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(targetPxX, bTop, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(targetPxX - 2, bTop - 8, 4, 16);
        ctx.fillRect(targetPxX - 8, bTop - 2, 16, 4);
      } else if (tType === 'highland_school') {
        // Highland schoolyard terrace & building
        const tWidth = 220;
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(targetPxX - tWidth / 2 - 30, groundY);
        ctx.lineTo(targetPxX - tWidth / 2, targetSurfaceY);
        ctx.lineTo(targetPxX + tWidth / 2, targetSurfaceY);
        ctx.lineTo(targetPxX + tWidth / 2 + 30, groundY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(targetPxX - tWidth / 2 - 30, groundY);
        ctx.lineTo(targetPxX - tWidth / 2, targetSurfaceY);
        ctx.lineTo(targetPxX + tWidth / 2, targetSurfaceY);
        ctx.lineTo(targetPxX + tWidth / 2 + 30, groundY);
        ctx.stroke();

        // School building
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(targetPxX + 25, targetSurfaceY - 26, 45, 26);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(targetPxX + 20, targetSurfaceY - 26);
        ctx.lineTo(targetPxX + 47, targetSurfaceY - 38);
        ctx.lineTo(targetPxX + 75, targetSurfaceY - 26);
        ctx.closePath();
        ctx.fill();

        // School Banner Sign
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(targetPxX + 22, targetSurfaceY - 22, 50, 8);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TRƯỜNG VÙNG CAO', targetPxX + 47, targetSurfaceY - 16);
      }

      // --- 4. DISTANCE METRIC GRID & RULER ---
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      for (let m = 0; m <= totalWorldWidth; m += 100) {
        const px = m * scaleX;
        ctx.beginPath();
        ctx.moveTo(px, groundY);
        ctx.lineTo(px, groundY + 6);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.stroke();
        ctx.fillText(`${m}m`, px, groundY + 18);

        // Sky dashed grid
        ctx.setLineDash([2, 8]);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, groundY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- 5. FLIGHT PATH ALTITUDE LINE ---
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, planePxY);
      ctx.lineTo(width, planePxY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Altitude Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Đường bay: h = ${mission.altitude}m`, 10, planePxY - 8);

      // --- 6. TARGET VILLAGE & NGƯỜI DÂN VẪY TAY ---
      // Village Base Highlight
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.beginPath();
      ctx.ellipse(targetPxX, targetSurfaceY, mission.tolerance * scaleX, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Target Crosshair / Flag Pole
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(targetPxX, targetSurfaceY);
      ctx.lineTo(targetPxX, targetSurfaceY - 35);
      ctx.stroke();

      // Flag Banner
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(targetPxX, targetSurfaceY - 35);
      ctx.lineTo(targetPxX + 24, targetSurfaceY - 28);
      ctx.lineTo(targetPxX, targetSurfaceY - 21);
      ctx.closePath();
      ctx.fill();

      if (tType === 'highland_school') {
        // Yellow star on school flag
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(targetPxX + 8, targetSurfaceY - 28, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Village Houses (for plains / hill / crater)
      if (tType === 'plains' || tType === 'hill' || tType === 'crater') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(targetPxX - 35, targetSurfaceY - 18, 16, 18);
        ctx.fillRect(targetPxX + 18, targetSurfaceY - 22, 18, 22);

        // Roofs
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(targetPxX - 38, targetSurfaceY - 18);
        ctx.lineTo(targetPxX - 27, targetSurfaceY - 28);
        ctx.lineTo(targetPxX - 16, targetSurfaceY - 18);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(targetPxX + 15, targetSurfaceY - 22);
        ctx.lineTo(targetPxX + 27, targetSurfaceY - 34);
        ctx.lineTo(targetPxX + 39, targetSurfaceY - 22);
        ctx.closePath();
        ctx.fill();
      }

      // Target Label
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      const elevSign = mission.targetElevation > 0 ? '+' : '';
      const elevText = mission.targetElevation !== 0 ? ` (${mission.terrainName}: ${elevSign}${mission.targetElevation}m)` : '';
      ctx.fillText(`🎯 ${mission.villageName}${elevText}`, targetPxX, targetSurfaceY + 28);

      // --- NGƯỜI DÂN VẪY TAY KHI NHẬN HÀNG ---
      const isHitSuccess = packageRef.current.isHit === true;
      const isCargoFalling = packageRef.current.isFalling;
      
      villagersRef.current.forEach((v, idx) => {
        const vx = targetPxX + v.x;
        
        // Jump height on hit / cargo falling
        let jumpY = 0;
        if (isHitSuccess) {
          jumpY = Math.abs(Math.sin((currentTime * 0.01) + v.offset)) * 14;
        } else if (isCargoFalling) {
          jumpY = Math.abs(Math.sin((currentTime * 0.006) + v.offset)) * 6;
        }

        const vy = targetSurfaceY - jumpY;

        // Head
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(vx, vy - 14, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Conical Hat (Nón lá)
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(vx - 6, vy - 15);
        ctx.lineTo(vx, vy - 21);
        ctx.lineTo(vx + 6, vy - 15);
        ctx.closePath();
        ctx.fill();

        // Colorful Shirt
        const clothesColors = ['#f43f5e', '#06b6d4', '#10b981', '#a855f7'];
        ctx.fillStyle = clothesColors[idx % clothesColors.length];
        ctx.fillRect(vx - 3, vy - 10, 6, 8);

        // Legs
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(vx - 1.5, vy - 2);
        ctx.lineTo(vx - 1.5, vy);
        ctx.moveTo(vx + 1.5, vy - 2);
        ctx.lineTo(vx + 1.5, vy);
        ctx.stroke();

        // Waving Arms
        const waveAngle = Math.sin((currentTime * 0.012) + v.offset);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (isHitSuccess || isCargoFalling) {
          // Both arms up waving enthusiastically!
          ctx.moveTo(vx - 3, vy - 8);
          ctx.lineTo(vx - 7, vy - 16 + waveAngle * 4);

          ctx.moveTo(vx + 3, vy - 8);
          ctx.lineTo(vx + 7, vy - 16 - waveAngle * 4);
        } else {
          // Gentle single hand waving
          ctx.moveTo(vx - 3, vy - 8);
          ctx.lineTo(vx - 5, vy - 4);

          ctx.moveTo(vx + 3, vy - 8);
          ctx.lineTo(vx + 6, vy - 14 + waveAngle * 3);
        }
        ctx.stroke();
      });

      // --- 7. HOVER & DROP MARKER ---
      if (hoverX !== null && dropX === null) {
        const hoverPxX = hoverX * scaleX;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hoverPxX, planePxY - 15);
        ctx.lineTo(hoverPxX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Nhấp để đặt điểm thả: ${hoverX}m`, hoverPxX, planePxY - 20);
      }

      // MARKED DROP POSITION
      if (dropX !== null) {
        const dropPxX = dropX * scaleX;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(dropPxX, planePxY - 10);
        ctx.lineTo(dropPxX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(dropPxX, planePxY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 ĐIỂM THẢ: ${dropX}m`, dropPxX, planePxY - 18);
      }

      // --- 8. TRAJECTORY TRAIL ---
      if (packageRef.current.trajectory.length > 1) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        packageRef.current.trajectory.forEach((pt, i) => {
          const px = pt.x * scaleX;
          const py = groundY - (pt.y * scaleY);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- 9. AIRCRAFT DRAWING (CÁNH MÁY BAY RUNG NHẸ & CÁNH QUẠT QUAY) ---
      const planePxX = planeXRef.current * scaleX;

      // Cánh máy bay rung nhẹ (Micro wing vibration & pitch rotation)
      const yVibration = Math.sin(currentTime * 0.012) * 2.2;
      const wingTilt = Math.sin(currentTime * 0.007) * 0.035;

      // Draw Aircraft Body
      ctx.save();
      ctx.translate(planePxX, planePxY + yVibration);
      ctx.rotate(wingTilt);

      // C-130 Airplane Body Vector Drawing (Vibrant Rescue Blue & Metallic Silver)
      const planeGrad = ctx.createLinearGradient(-35, -10, 42, 8);
      planeGrad.addColorStop(0, '#1e40af'); // Deep royal blue
      planeGrad.addColorStop(0.5, '#3b82f6'); // Vibrant bright blue
      planeGrad.addColorStop(1, '#60a5fa'); // Sky metallic blue
      ctx.fillStyle = planeGrad;

      ctx.beginPath();
      ctx.moveTo(-35, -2);
      ctx.lineTo(-20, -10);
      ctx.lineTo(25, -6);
      ctx.quadraticCurveTo(40, 0, 42, 4);
      ctx.lineTo(30, 8);
      ctx.lineTo(-28, 6);
      ctx.closePath();
      ctx.fill();

      // Rescue Stripe Accent Line
      ctx.fillStyle = '#fbbf24'; // Amber Rescue Stripe
      ctx.fillRect(-15, 0, 35, 3);

      // Cockpit Window (Glowing Cyan)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(25, -4);
      ctx.lineTo(36, -1);
      ctx.lineTo(33, 3);
      ctx.lineTo(25, 2);
      ctx.closePath();
      ctx.fill();

      // Cockpit Window Highlight
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(27, -3);
      ctx.lineTo(33, -1);
      ctx.lineTo(31, 1);
      ctx.closePath();
      ctx.fill();

      // Main Wing
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.moveTo(-5, -6);
      ctx.lineTo(8, -24);
      ctx.lineTo(18, -24);
      ctx.lineTo(6, -6);
      ctx.closePath();
      ctx.fill();

      // Wingtip Navigation Strobe Light (Blinking Red Light on Left Wing)
      const strobeAlpha = Math.sin(currentTime * 0.015) > 0.3 ? 1 : 0.2;
      ctx.fillStyle = `rgba(244, 63, 94, ${strobeAlpha})`;
      ctx.beginPath();
      ctx.arc(13, -24, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Wing Engine Pods
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -22, 6, 8);
      ctx.fillRect(10, -16, 6, 7);

      // Tail Fin
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(-26, -6);
      ctx.lineTo(-38, -26);
      ctx.lineTo(-30, -26);
      ctx.lineTo(-20, -6);
      ctx.closePath();
      ctx.fill();

      // --- CÁNH QUẠT QUAY (Spinning Propellers on Nose & Engines) ---
      const propSpeed = currentTime * 0.08;

      // 1. Nose Propeller
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(43, 4 - Math.sin(propSpeed) * 14);
      ctx.lineTo(43, 4 + Math.sin(propSpeed) * 14);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(43, 4, 3, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Wing Engine Propeller 1
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3, -18 - Math.sin(propSpeed + 1) * 10);
      ctx.lineTo(3, -18 + Math.sin(propSpeed + 1) * 10);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(3, -18, 2.5, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Wing Engine Propeller 2
      ctx.beginPath();
      ctx.moveTo(13, -12 - Math.cos(propSpeed + 2) * 9);
      ctx.lineTo(13, -12 + Math.cos(propSpeed + 2) * 9);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(13, -12, 2.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Relief Package attached under plane if not dropped
      if (!packageRef.current.isFalling && packageRef.current.landedX === null) {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-2, 8, 12, 12);
        // Red Cross
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(3, 10, 2, 8);
        ctx.fillRect(0, 13, 8, 2);
      }

      ctx.restore();

      // --- 10. HỘP HÀNG CÓ DÙ MỞ KHI RƠI (Relief Package with Opening Parachute) ---
      if (packageRef.current.isFalling || packageRef.current.landedX !== null) {
        let pkgPxX: number;
        let pkgPxY: number;

        if (packageRef.current.isFalling) {
          const lastPt = packageRef.current.trajectory[packageRef.current.trajectory.length - 1];
          pkgPxX = lastPt.x * scaleX;
          pkgPxY = groundY - (lastPt.y * scaleY);
        } else {
          pkgPxX = (packageRef.current.landedX ?? 0) * scaleX;
          pkgPxY = targetSurfaceY - 6;
        }

        // Package Box
        ctx.fillStyle = '#b45309';
        ctx.fillRect(pkgPxX - 9, pkgPxY - 14, 18, 15);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pkgPxX - 9, pkgPxY - 14, 18, 15);

        // Red Cross Symbol
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(pkgPxX - 2.5, pkgPxY - 12, 5, 11);
        ctx.fillRect(pkgPxX - 7, pkgPxY - 9, 14, 5);

        // --- PARACHUTE CANOPY OPENING ---
        if (packageRef.current.isFalling) {
          const fallT = packageRef.current.t;
          const deployFactor = Math.min(1, fallT * 3.2); // Smooth canopy opening
          const canopyRadius = 22 * deployFactor;
          const canopyY = pkgPxY - 32 * deployFactor;

          if (deployFactor > 0.1) {
            // Shroud Lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(pkgPxX - 8, pkgPxY - 14);
            ctx.lineTo(pkgPxX - canopyRadius * 0.8, canopyY);
            ctx.moveTo(pkgPxX - 3, pkgPxY - 14);
            ctx.lineTo(pkgPxX - canopyRadius * 0.3, canopyY);
            ctx.moveTo(pkgPxX + 3, pkgPxY - 14);
            ctx.lineTo(pkgPxX + canopyRadius * 0.3, canopyY);
            ctx.moveTo(pkgPxX + 8, pkgPxY - 14);
            ctx.lineTo(pkgPxX + canopyRadius * 0.8, canopyY);
            ctx.stroke();

            // Parachute Canopy Dome
            ctx.save();
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(pkgPxX, canopyY, canopyRadius, Math.PI, 0);
            ctx.fill();

            // Red Stripe Left
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(pkgPxX, canopyY, canopyRadius, Math.PI, Math.PI * 0.7, true);
            ctx.lineTo(pkgPxX, canopyY);
            ctx.closePath();
            ctx.fill();

            // Red Stripe Right
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(pkgPxX, canopyY, canopyRadius, Math.PI * 0.3, 0, true);
            ctx.lineTo(pkgPxX, canopyY);
            ctx.closePath();
            ctx.fill();

            // Blue Center Stripe
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(pkgPxX, canopyY, canopyRadius, Math.PI * 0.6, Math.PI * 0.4, true);
            ctx.lineTo(pkgPxX, canopyY);
            ctx.closePath();
            ctx.fill();

            // Canopy Border
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(pkgPxX, canopyY, canopyRadius, Math.PI, 0);
            ctx.stroke();

            ctx.restore();
          }
        }
      }

      // --- 11. LANDED RESULT & ERROR DISPLAY ---
      if (packageRef.current.landedX !== null) {
        const landedPxX = packageRef.current.landedX * scaleX;
        const errDistance = packageRef.current.landedX - mission.targetDistance;

        // Pin at Landed X
        ctx.fillStyle = packageRef.current.isHit ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(landedPxX, targetSurfaceY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Error Connector Line if missed
        if (!packageRef.current.isHit) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(landedPxX, targetSurfaceY - 15);
          ctx.lineTo(targetPxX, targetSurfaceY - 15);
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          const sign = errDistance > 0 ? '+' : '';
          ctx.fillText(`Lệch ${sign}${errDistance.toFixed(1)}m`, (landedPxX + targetPxX) / 2, targetSurfaceY - 22);
        }
      }

      // --- HIỆU ỨNG BỤI KHI TIẾP ĐẤT (Dust Puff Particles) ---
      for (let i = dustPuffRef.current.length - 1; i >= 0; i--) {
        const p = dustPuffRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity deceleration
        p.size += 0.2;
        p.life++;
        p.alpha = Math.max(0, 0.85 * (1 - p.life / p.maxLife));

        if (p.life >= p.maxLife || p.alpha <= 0) {
          dustPuffRef.current.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      // --- PARTICLES & FIREWORKS ---
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Filter out dead particles
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mission, dropX, gameStatus, totalWorldWidth]);

  return (
    <div className="relative w-full h-[420px] sm:h-[460px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl select-none">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        className={`w-full h-full block ${gameStatus === 'idle' ? 'cursor-crosshair' : 'cursor-default'}`}
      />

      {/* Instructional Floating Banner */}
      {gameStatus === 'idle' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 pointer-events-none animate-pulse">
          {dropX === null ? (
            <span>👆 Nhấp lên màn hình để đánh dấu điểm thả, sau đó bấm "Bắt đầu nhiệm vụ"</span>
          ) : (
            <span>🚀 Đã đặt điểm thả {dropX}m. Bấm "Bắt đầu nhiệm vụ" để máy bay cất cánh!</span>
          )}
        </div>
      )}

      {/* Missed Target Overlay Banner with Restart button */}
      {gameStatus === 'missed' && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-red-950/90 border border-red-700 text-red-200 px-6 py-3.5 rounded-xl shadow-2xl text-center backdrop-blur-md max-w-md flex flex-col items-center gap-2 z-20">
          <div className="font-bold text-base text-red-400">❌ CHƯA TRÚNG MỤC TIÊU!</div>
          {lastLandInfo && (
            <div className="flex items-center space-x-3 bg-slate-900/90 px-3 py-1 rounded-lg border border-red-800 my-0.5">
              <span className="text-xs text-slate-300">Sai số: <strong className="text-red-300 font-mono">{lastLandInfo.error.toFixed(1)}m</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Điểm: <span className="text-amber-400 font-mono text-sm">{lastLandInfo.score}/10</span>
              </span>
            </div>
          )}
          <p className="text-xs text-red-200">
            Hàng rơi chưa trúng khu vực cứu trợ. Hãy kiểm tra lại t = √(2h/g) và L = v × t!
          </p>
          <button
            id="btn-canvas-restart"
            onClick={onResetPlane}
            className="mt-1 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold rounded-lg shadow-lg transition cursor-pointer flex items-center space-x-1.5 text-xs sm:text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Target Hit Victory Overlay */}
      {gameStatus === 'success' && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-500 animate-bounce">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-black text-emerald-400 mb-1">
            XUẤT SẮC! CỨU TRỢ THÀNH CÔNG!
          </h2>
          {lastLandInfo && (
            <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-emerald-500/50 my-2">
              <span className="text-xs sm:text-sm text-slate-200">Sai số: <strong className="text-emerald-300 font-mono">{lastLandInfo.error.toFixed(1)}m</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                Điểm số: <span className="text-amber-400 font-mono text-base">{lastLandInfo.score}/10 điểm</span>
              </span>
            </div>
          )}
          <p className="text-sm text-slate-300 max-w-md mb-4">
            Hàng cứu trợ đã rơi trúng khu vực <strong className="text-emerald-300">{mission.villageName}</strong>! Người dân đã nhận được lương thực & đồ dùng y tế.
          </p>
        </div>
      )}
    </div>
  );
};
