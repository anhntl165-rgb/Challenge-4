import React from 'react';
import { MissionData, GameStatus } from '../types';
import { Target, ArrowRight, Gauge, Navigation, MapPin, AlertCircle, Play, RotateCcw, HelpCircle, Lightbulb } from 'lucide-react';

interface PhysicsPanelProps {
  mission: MissionData;
  dropX: number | null;
  onSetDropX: (x: number) => void;
  onStartFlight: () => void;
  onResetPlane: () => void;
  gameStatus: GameStatus;
  planeX: number;
  usedHint: boolean;
  onUseHint: () => void;
}

export const PhysicsPanel: React.FC<PhysicsPanelProps> = ({
  mission,
  dropX,
  onSetDropX,
  onStartFlight,
  onResetPlane,
  gameStatus,
  planeX,
  usedHint,
  onUseHint
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onSetDropX(Math.max(0, Math.min(mission.targetDistance, val)));
    }
  };

  const handleStepChange = (delta: number) => {
    const current = dropX ?? 0;
    const nextVal = Math.max(0, Math.min(mission.targetDistance, current + delta));
    onSetDropX(Math.round(nextVal * 10) / 10);
  };

  const isIdle = gameStatus === 'idle';
  const isFlying = gameStatus === 'flying' || gameStatus === 'dropping';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl text-slate-200">
      {/* Top Mission Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">
            Mục tiêu: <span className="text-emerald-400">{mission.villageName}</span>
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 font-medium">
            {mission.level === 1
              ? '🌱 Đồng bằng'
              : mission.level === 2
              ? `⛰️ ${mission.terrainName} (${mission.targetElevation > 0 ? `+${mission.targetElevation}` : mission.targetElevation}m)`
              : mission.level === 3
              ? `💨 Gió ngang: ${mission.windDirection === 'left' ? 'Gió trái (cản)' : 'Gió phải (xuôi)'} (${mission.windDirection === 'left' ? '-' : '+'}${mission.windSpeed}m/s)`
              : `⚡ Trong bão: a = ${mission.acceleration > 0 ? '+' : ''}${mission.acceleration} m/s² (${mission.acceleration > 0 ? 'Tăng tốc đều' : 'Giảm tốc đều'})`}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-800 px-3 py-1 rounded-md text-slate-300">
          <span>Tọa độ máy bay:</span>
          <span className="text-emerald-400 font-bold">{Math.round(planeX)} m</span>
        </div>
      </div>

      {/* Physics Values Grid */}
      {mission.level === 1 ? (
        /* LEVEL 1 GRID: Standard 4 values */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Altitude */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 flex items-center space-x-1 mb-1">
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              <span>Độ cao (h)</span>
            </div>
            <div className="text-xl font-bold font-mono text-sky-400">
              {mission.altitude} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 flex items-center space-x-1 mb-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Vận tốc (v)</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">
              {mission.velocity} <span className="text-xs font-sans text-slate-400">m/s</span>
            </div>
          </div>

          {/* Gravity */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 flex items-center space-x-1 mb-1">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 rotate-90" />
              <span>Gia tốc (g)</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {mission.gravity} <span className="text-xs font-sans text-slate-400">m/s²</span>
            </div>
          </div>

          {/* Target Distance X */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 flex items-center space-x-1 mb-1">
              <Target className="w-3.5 h-3.5 text-red-400" />
              <span>Vị trí mục tiêu</span>
            </div>
            <div className="text-xl font-bold font-mono text-red-400">
              {mission.targetDistance} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>
        </div>
      ) : mission.level === 2 ? (
        /* LEVEL 2 GRID: 4 values (hmb, hdh, v, X) - Δh is calculated by student */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {/* Plane Altitude */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Navigation className="w-3 h-3 text-sky-400" />
              <span>Độ cao mb (h<sub>mb</sub>)</span>
            </div>
            <div className="text-lg font-bold font-mono text-sky-400">
              {mission.altitude} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>

          {/* Target Elevation */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <MapPin className="w-3 h-3 text-purple-400" />
              <span>Độ cao đ.hình (h<sub>đh</sub>)</span>
            </div>
            <div className={`text-lg font-bold font-mono ${mission.targetElevation >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
              {mission.targetElevation > 0 ? `+${mission.targetElevation}` : mission.targetElevation} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Vận tốc (v)</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {mission.velocity} <span className="text-xs font-sans text-slate-400">m/s</span>
            </div>
          </div>

          {/* Target Distance X */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Target className="w-3 h-3 text-red-400" />
              <span>Vị trí m.tiêu (X)</span>
            </div>
            <div className="text-lg font-bold font-mono text-red-400">
              {mission.targetDistance} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>
        </div>
      ) : mission.level === 3 ? (
        /* LEVEL 3 GRID: 4 values (Δh, v_mb, v_gió, X) - vx is calculated by student */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {/* Effective Height */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Navigation className="w-3 h-3 text-sky-400" />
              <span>Độ cao rơi (Δh)</span>
            </div>
            <div className="text-lg font-bold font-mono text-sky-400">
              {mission.effectiveHeight} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>

          {/* Plane Velocity */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Vận tốc mb (v<sub>mb</sub>)</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {mission.velocity} <span className="text-xs font-sans text-slate-400">m/s</span>
            </div>
          </div>

          {/* Wind Speed & Direction */}
          <div className="bg-slate-950/70 border border-sky-500/30 bg-sky-950/10 rounded-lg p-2.5">
            <div className="text-[11px] text-sky-400 font-medium flex items-center space-x-1 mb-0.5">
              <span>💨 Gió ngang (v<sub>gió</sub>)</span>
            </div>
            <div className={`text-lg font-bold font-mono ${mission.windDirection === 'left' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {mission.windDirection === 'left' ? `-${mission.windSpeed}` : `+${mission.windSpeed}`} <span className="text-xs font-sans text-slate-400">m/s</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {mission.windDirection === 'left' ? '👈 Gió trái (cản)' : '👉 Gió phải (xuôi)'}
            </div>
          </div>

          {/* Target Distance X */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Target className="w-3 h-3 text-red-400" />
              <span>Vị trí m.tiêu (X)</span>
            </div>
            <div className="text-lg font-bold font-mono text-red-400">
              {mission.targetDistance} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>
        </div>
      ) : (
        /* LEVEL 4 GRID: 4 values (Δh, v0, a, X) - Formula L is applied by student */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {/* Effective Height */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Navigation className="w-3 h-3 text-sky-400" />
              <span>Độ cao rơi (Δh)</span>
            </div>
            <div className="text-lg font-bold font-mono text-sky-400">
              {mission.effectiveHeight} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>

          {/* Initial Velocity v_0 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Vận tốc ban đầu (v<sub>0</sub>)</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {mission.effectiveVx} <span className="text-xs font-sans text-slate-400">m/s</span>
            </div>
            <div className="text-[10px] text-amber-400/90 font-mono">
              🌪️ Gió bão: {mission.windSpeed}m/s ({mission.windDirection === 'left' ? 'ngược' : 'xuôi'})
            </div>
          </div>

          {/* Acceleration a */}
          <div className="bg-slate-950/70 border-2 border-amber-500/60 bg-amber-950/20 rounded-lg p-2.5 shadow-md">
            <div className="text-[11px] text-amber-400 font-bold flex items-center space-x-1 mb-0.5">
              <span>⚡ Gia tốc mb (a)</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-amber-300">
              {mission.acceleration > 0 ? `+${mission.acceleration}` : mission.acceleration} <span className="text-xs font-sans text-slate-400">m/s²</span>
            </div>
            <div className="text-[10px] text-amber-400 font-semibold">
              {mission.acceleration > 0 ? '🚀 Máy bay tăng tốc đều' : '🪂 Máy bay giảm tốc đều'}
            </div>
          </div>

          {/* Target Distance X */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 mb-0.5">
              <Target className="w-3 h-3 text-red-400" />
              <span>Vị trí m.tiêu (X)</span>
            </div>
            <div className="text-lg font-bold font-mono text-red-400">
              {mission.targetDistance} <span className="text-xs font-sans text-slate-400">m</span>
            </div>
          </div>
        </div>
      )}

      {/* Drop Position Selector Controls */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 mb-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>ĐIỂM THẢ TÍNH TOÁN (X<sub>thả</sub>)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Nhấp trực tiếp lên đường bay trên màn hình hoặc điều chỉnh con số bên dưới:
            </p>
          </div>

          {/* Quick Step Buttons & Main Action Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
            <div className="flex items-center space-x-1">
              <button
                id="btn-step-minus-10"
                onClick={() => handleStepChange(-10)}
                disabled={isFlying}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer font-mono disabled:opacity-50"
              >
                -10m
              </button>
              <button
                id="btn-step-minus-1"
                onClick={() => handleStepChange(-1)}
                disabled={isFlying}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer font-mono disabled:opacity-50"
              >
                -1m
              </button>

              <div className="relative">
                <input
                  id="input-drop-x"
                  type="number"
                  step="0.5"
                  min="0"
                  max={mission.targetDistance}
                  value={dropX !== null ? dropX : ''}
                  onChange={handleInputChange}
                  disabled={isFlying}
                  placeholder="Ví dụ: 320"
                  className="w-28 px-3 py-1.5 bg-slate-900 border-2 border-emerald-500 rounded-md text-emerald-400 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
                />
                <span className="absolute right-2 top-2 text-xs text-slate-400">m</span>
              </div>

              <button
                id="btn-step-plus-1"
                onClick={() => handleStepChange(1)}
                disabled={isFlying}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer font-mono disabled:opacity-50"
              >
                +1m
              </button>
              <button
                id="btn-step-plus-10"
                onClick={() => handleStepChange(10)}
                disabled={isFlying}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer font-mono disabled:opacity-50"
              >
                +10m
              </button>
            </div>

            {/* Launch & Restart Action Buttons */}
            <div className="flex items-center space-x-2 ml-auto">
              {isIdle ? (
                <button
                  id="btn-start-mission"
                  onClick={onStartFlight}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg shadow-lg transition cursor-pointer flex items-center space-x-1.5 text-xs sm:text-sm animate-pulse"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Bắt đầu nhiệm vụ</span>
                </button>
              ) : (
                <button
                  id="btn-restart"
                  onClick={onResetPlane}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg shadow transition cursor-pointer flex items-center space-x-1.5 text-xs sm:text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Slider for quick visual tuning */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400">0m</span>
          <input
            id="slider-drop-x"
            type="range"
            min="0"
            max={mission.targetDistance}
            step="0.5"
            value={dropX ?? 0}
            disabled={isFlying}
            onChange={(e) => onSetDropX(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
          />
          <span className="text-xs font-mono text-slate-400">{mission.targetDistance}m</span>
        </div>
      </div>

      {/* Physics Hint & Status Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 gap-3">
        {!usedHint ? (
          <button
            id="btn-request-hint"
            onClick={onUseHint}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-500/70 font-semibold rounded-lg transition cursor-pointer flex items-center space-x-2 text-xs"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Xem Gợi ý / Trợ giúp công thức</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
              -50% điểm
            </span>
          </button>
        ) : (
          <div className="flex items-start space-x-2 bg-amber-950/30 border border-amber-500/40 rounded-lg p-2.5 text-amber-200">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300 mb-0.5 flex items-center space-x-2">
                <span>Gợi ý công thức:</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
                  ⚠️ Đã trợ giúp (Bị chia đôi điểm)
                </span>
              </div>
              <div className="font-mono text-slate-200 text-[11px]">
                {mission.level === 1 ? (
                  <>t = √(2h/g) &nbsp;|&nbsp; L = v × t &nbsp;|&nbsp; X<sub>thả</sub> = X<sub>mục tiêu</sub> - L</>
                ) : mission.level === 2 ? (
                  <>Δh = h<sub>mb</sub> - h<sub>đh</sub> &nbsp;|&nbsp; t = √(2Δh/g) &nbsp;|&nbsp; L = v × t &nbsp;|&nbsp; X<sub>thả</sub> = X<sub>mục tiêu</sub> - L</>
                ) : mission.level === 3 ? (
                  <>v<sub>x</sub> = v<sub>mb</sub> {mission.windDirection === 'left' ? '-' : '+'} v<sub>gió</sub> &nbsp;|&nbsp; t = √(2Δh/g) &nbsp;|&nbsp; L = v<sub>x</sub> × t &nbsp;|&nbsp; X<sub>thả</sub> = X<sub>mục tiêu</sub> - L</>
                ) : (
                  <>X<sub>1</sub> = v<sub>0</sub>t<sub>1</sub> + ½at<sub>1</sub>² &nbsp;|&nbsp; v<sub>1</sub> = v<sub>0</sub> + at<sub>1</sub> &nbsp;|&nbsp; t<sub>2</sub> = √(2Δh/g) &nbsp;|&nbsp; X<sub>2</sub> = v<sub>1</sub>t<sub>2</sub> &nbsp;|&nbsp; X = X<sub>1</sub> + X<sub>2</sub></>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status indicator or Restart Button */}
        <div className="flex items-center space-x-2 shrink-0">
          {gameStatus === 'missed' && (
            <button
              id="btn-restart-from-hint"
              onClick={onResetPlane}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart</span>
            </button>
          )}

          {isIdle && (
            <span className="text-emerald-400 font-mono text-[11px]">
              [Máy bay đứng yên • Chọn X<sub>thả</sub> và Bắt đầu]
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
