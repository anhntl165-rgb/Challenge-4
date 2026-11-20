import React, { useState, useEffect } from 'react';
import { X, Calculator, Check } from 'lucide-react';
import { MissionData } from '../types';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: MissionData;
  onApplyCalculatedDrop: (dropX: number) => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  mission,
  onApplyCalculatedDrop
}) => {
  const [hmb, setHmb] = useState<number>(mission.altitude);
  const [hdh, setHdh] = useState<number>(mission.targetElevation);
  const [v, setV] = useState<number>(mission.velocity);
  const [vwind, setVwind] = useState<number>(mission.windSpeed || 0);
  const [windDir, setWindDir] = useState<'left' | 'right' | 'none'>(mission.windDirection || 'none');
  const [accel, setAccel] = useState<number>(mission.acceleration || 0);
  const [targetX, setTargetX] = useState<number>(mission.targetDistance);

  // Sync state whenever modal opens or mission changes
  useEffect(() => {
    if (isOpen) {
      setHmb(mission.altitude);
      setHdh(mission.targetElevation);
      setV(mission.velocity);
      setVwind(mission.windSpeed || 0);
      setWindDir(mission.windDirection || 'none');
      setAccel(mission.acceleration || 0);
      setTargetX(mission.targetDistance);
    }
  }, [isOpen, mission]);

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time calculations with Level 3 wind and Level 4 acceleration support
  const g = 9.8;
  const deltaH = hmb - hdh;
  const effectiveDeltaH = Math.max(0.1, deltaH);
  const timeOfFall = Math.sqrt((2 * effectiveDeltaH) / g);
  
  const effectiveVx = windDir === 'right' ? v + vwind : windDir === 'left' ? v - vwind : v;
  
  let computedDropX = 0;
  let t1_calc = 0;
  let v1_calc = effectiveVx;
  let X1_calc = 0;
  let X2_calc = effectiveVx * timeOfFall;

  if (mission.level === 4 && accel !== 0) {
    const A_l4 = 0.5 * accel;
    const B_l4 = effectiveVx + accel * timeOfFall;
    const C_l4 = effectiveVx * timeOfFall - targetX;
    const delta_l4 = B_l4 * B_l4 - 4 * A_l4 * C_l4;
    t1_calc = (-B_l4 + Math.sqrt(Math.max(0, delta_l4))) / (2 * A_l4);
    X1_calc = effectiveVx * t1_calc + 0.5 * accel * t1_calc * t1_calc;
    v1_calc = effectiveVx + accel * t1_calc;
    X2_calc = v1_calc * timeOfFall;
    computedDropX = X1_calc;
  } else {
    X2_calc = effectiveVx * timeOfFall;
    computedDropX = targetX - X2_calc;
  }
  const horizontalRange = X2_calc;

  const handleApply = () => {
    onApplyCalculatedDrop(Math.round(computedDropX * 10) / 10);
    onClose();
  };

  const handleSyncCurrentMission = () => {
    setHmb(mission.altitude);
    setHdh(mission.targetElevation);
    setV(mission.velocity);
    setVwind(mission.windSpeed || 0);
    setWindDir(mission.windDirection || 'none');
    setAccel(mission.acceleration || 0);
    setTargetX(mission.targetDistance);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-800/80 px-5 py-4 border-b border-slate-700">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Calculator className="w-5 h-5" />
            <span>MÁY TÍNH VẬT LÝ NÉM NGANG ({
              mission.level === 1 ? 'LEVEL 1' :
              mission.level === 2 ? 'LEVEL 2' :
              mission.level === 3 ? 'LEVEL 3: GIÓ NGANG' :
              'LEVEL 4: TRONG BÃO (a)'
            })</span>
          </div>
          <button
            id="btn-close-calculator"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">
              Mục tiêu: <strong className="text-emerald-400">{mission.villageName}</strong> ({mission.level === 3 ? 'Gió ngang' : mission.terrainName})
            </span>
            <button
              id="btn-sync-calculator"
              onClick={handleSyncCurrentMission}
              className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer font-medium"
            >
              Nạp lại thông số
            </button>
          </div>

          {/* Input fields */}
          {mission.level === 1 ? (
            /* LEVEL 1 INPUTS: 3 fields */
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Độ cao h (m)</label>
                <input
                  id="calc-input-hmb"
                  type="number"
                  value={hmb}
                  onChange={(e) => setHmb(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sky-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Vận tốc v (m/s)</label>
                <input
                  id="calc-input-v"
                  type="number"
                  value={v}
                  onChange={(e) => setV(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Vị trí mục tiêu (m)</label>
                <input
                  id="calc-input-target"
                  type="number"
                  value={targetX}
                  onChange={(e) => setTargetX(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-red-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : mission.level === 2 ? (
            /* LEVEL 2 INPUTS: 4 fields */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Độ cao mb h<sub>mb</sub> (m)</label>
                <input
                  id="calc-input-hmb"
                  type="number"
                  value={hmb}
                  onChange={(e) => setHmb(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-sky-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Độ cao đ.hình h<sub>đh</sub> (m)</label>
                <input
                  id="calc-input-hdh"
                  type="number"
                  value={hdh}
                  onChange={(e) => setHdh(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-purple-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vận tốc v (m/s)</label>
                <input
                  id="calc-input-v"
                  type="number"
                  value={v}
                  onChange={(e) => setV(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-amber-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Khoảng cách X (m)</label>
                <input
                  id="calc-input-target"
                  type="number"
                  value={targetX}
                  onChange={(e) => setTargetX(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-red-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : mission.level === 3 ? (
            /* LEVEL 3 INPUTS: Plane v, Wind speed, Wind dir, h, target */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vận tốc mb v<sub>mb</sub> (m/s)</label>
                <input
                  id="calc-input-vmb"
                  type="number"
                  value={v}
                  onChange={(e) => setV(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-amber-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vận tốc gió v<sub>gió</sub> (m/s)</label>
                <input
                  id="calc-input-vwind"
                  type="number"
                  value={vwind}
                  onChange={(e) => setVwind(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-sky-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Hướng gió</label>
                <select
                  id="calc-select-winddir"
                  value={windDir}
                  onChange={(e) => setWindDir(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="left">👈 Gió trái (cản -)</option>
                  <option value="right">👉 Gió phải (xuôi +)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Độ cao rơi Δh (m)</label>
                <input
                  id="calc-input-deltah"
                  type="number"
                  value={deltaH}
                  onChange={(e) => setHmb((parseFloat(e.target.value) || 0) + hdh)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-purple-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            /* LEVEL 4 INPUTS: v0, acceleration a, h, target */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vận tốc ban đầu v<sub>0</sub> (m/s)</label>
                <input
                  id="calc-input-v0"
                  type="number"
                  value={v}
                  onChange={(e) => setV(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-amber-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Gia tốc a (m/s²)</label>
                <input
                  id="calc-input-accel"
                  type="number"
                  step="0.1"
                  value={accel}
                  onChange={(e) => setAccel(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-amber-300 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Độ cao rơi Δh (m)</label>
                <input
                  id="calc-input-deltah"
                  type="number"
                  value={deltaH}
                  onChange={(e) => setHmb((parseFloat(e.target.value) || 0) + hdh)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-purple-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Khoảng cách X (m)</label>
                <input
                  id="calc-input-target"
                  type="number"
                  value={targetX}
                  onChange={(e) => setTargetX(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-red-400 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Formula Breakdown Steps */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2.5 font-mono text-xs">
            {mission.level === 1 ? (
              /* LEVEL 1 STEPS: Standard h calculation */
              <>
                {/* Step 1: Fall Time */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 1</span>
                    <span>Tính thời gian rơi (t)</span>
                  </div>
                  <div className="text-slate-300">
                    t = √(2h / g) = √(2 × {hmb} / 9.8) = <strong className="text-emerald-400 text-sm">{timeOfFall.toFixed(2)} s</strong>
                  </div>
                </div>

                {/* Step 2: Horizontal Range */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 2</span>
                    <span>Tính tầm bay xa (L)</span>
                  </div>
                  <div className="text-slate-300">
                    L = v × t = {v} × {timeOfFall.toFixed(2)} = <strong className="text-emerald-400 text-sm">{horizontalRange.toFixed(1)} m</strong>
                  </div>
                </div>

                {/* Step 3: Drop Point */}
                <div>
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 3</span>
                    <span>Tọa độ thả hàng (X<sub>thả</sub>)</span>
                  </div>
                  <div className="text-slate-300">
                    X<sub>thả</sub> = X<sub>mục tiêu</sub> - L = {targetX} - {horizontalRange.toFixed(1)} = <strong className="text-emerald-400 text-sm">{computedDropX.toFixed(1)} m</strong>
                  </div>
                </div>
              </>
            ) : mission.level === 2 ? (
              /* LEVEL 2 STEPS: Delta h calculation */
              <>
                {/* Step 1: Delta H */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 1</span>
                    <span>Tính độ cao rơi thực tế (Δh)</span>
                  </div>
                  <div className="text-slate-300">
                    Δh = h<sub>mb</sub> - h<sub>đh</sub> = {hmb} - {hdh} = <strong className="text-emerald-400 text-sm">{deltaH.toFixed(1)} m</strong>
                  </div>
                </div>

                {/* Step 2: Fall Time */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 2</span>
                    <span>Tính thời gian rơi (t)</span>
                  </div>
                  <div className="text-slate-300">
                    t = √(2Δh / g) = √(2 × {deltaH.toFixed(1)} / 9.8) = <strong className="text-emerald-400 text-sm">{timeOfFall.toFixed(2)} s</strong>
                  </div>
                </div>

                {/* Step 3: Horizontal Range */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 3</span>
                    <span>Tính tầm bay xa (L)</span>
                  </div>
                  <div className="text-slate-300">
                    L = v × t = {v} × {timeOfFall.toFixed(2)} = <strong className="text-emerald-400 text-sm">{horizontalRange.toFixed(1)} m</strong>
                  </div>
                </div>

                {/* Step 4: Drop Point */}
                <div>
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 4</span>
                    <span>Tọa độ thả hàng (X<sub>thả</sub>)</span>
                  </div>
                  <div className="text-slate-300">
                    X<sub>thả</sub> = X<sub>mục tiêu</sub> - L = {targetX} - {horizontalRange.toFixed(1)} = <strong className="text-emerald-400 text-sm">{computedDropX.toFixed(1)} m</strong>
                  </div>
                </div>
              </>
            ) : mission.level === 3 ? (
              /* LEVEL 3 STEPS: Gió Ngang calculation */
              <>
                {/* Step 1: Effective Horizontal Velocity Vx */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 1</span>
                    <span>Tính vận tốc tổng hợp phương ngang (v<sub>x</sub>)</span>
                  </div>
                  <div className="text-slate-300">
                    v<sub>x</sub> = v<sub>mb</sub> {windDir === 'left' ? '-' : '+'} v<sub>gió</sub> = {v} {windDir === 'left' ? '-' : '+'} {vwind} = <strong className="text-emerald-400 text-sm">{effectiveVx.toFixed(1)} m/s</strong>
                  </div>
                </div>

                {/* Step 2: Fall Time */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 2</span>
                    <span>Tính thời gian rơi (t)</span>
                  </div>
                  <div className="text-slate-300">
                    t = √(2Δh / g) = √(2 × {effectiveDeltaH.toFixed(1)} / 9.8) = <strong className="text-emerald-400 text-sm">{timeOfFall.toFixed(2)} s</strong>
                  </div>
                </div>

                {/* Step 3: Horizontal Range */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 3</span>
                    <span>Tính tầm bay xa có ảnh hưởng gió (L)</span>
                  </div>
                  <div className="text-slate-300">
                    L = v<sub>x</sub> × t = {effectiveVx.toFixed(1)} × {timeOfFall.toFixed(2)} = <strong className="text-emerald-400 text-sm">{horizontalRange.toFixed(1)} m</strong>
                  </div>
                </div>

                {/* Step 4: Drop Point */}
                <div>
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Bước 4</span>
                    <span>Tọa độ thả hàng (X<sub>thả</sub>)</span>
                  </div>
                  <div className="text-slate-300">
                    X<sub>thả</sub> = X<sub>mục tiêu</sub> - L = {targetX} - {horizontalRange.toFixed(1)} = <strong className="text-emerald-400 text-sm">{computedDropX.toFixed(1)} m</strong>
                  </div>
                </div>
              </>
            ) : (
              /* LEVEL 4 STEPS: Bài toán 2 giai đoạn (Biến đổi đều a + Ném ngang) */
              <>
                {/* Step 1: Fall time Stage 2 */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Giai đoạn 2 (Rơi)</span>
                    <span>Thời gian rơi t<sub>2</sub> = √(2Δh/g)</span>
                  </div>
                  <div className="text-slate-300">
                    t<sub>2</sub> = √(2 × {effectiveDeltaH.toFixed(1)} / 9.8) = <strong className="text-emerald-400 text-sm">{timeOfFall.toFixed(2)} s</strong>
                  </div>
                </div>

                {/* Step 2: Stage 1 flight time t1 */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Giai đoạn 1 (NHD)</span>
                    <span>Lập PT tổng X = X<sub>1</sub> + X<sub>2</sub> ⇒ Giải ra thời gian t<sub>1</sub></span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    ½a·t<sub>1</sub>² + (v<sub>0</sub> + a·t<sub>2</sub>)·t<sub>1</sub> + (v<sub>0</sub>t<sub>2</sub> - X) = 0 ⇒ t<sub>1</sub> = <strong className="text-amber-300 text-sm">{t1_calc.toFixed(2)} s</strong>
                  </div>
                </div>

                {/* Step 3: Velocity v1 at drop time */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Vận tốc thả v<sub>1</sub></span>
                    <span>Vận tốc MB khi thả v<sub>1</sub> = v<sub>0</sub> + a·t<sub>1</sub></span>
                  </div>
                  <div className="text-slate-300">
                    v<sub>1</sub> = {effectiveVx.toFixed(1)} {accel >= 0 ? '+' : ''} ({accel} × {t1_calc.toFixed(2)}) = <strong className="text-amber-400 text-sm">{v1_calc.toFixed(1)} m/s</strong>
                  </div>
                </div>

                {/* Step 4: Drop position X_thả = X1 */}
                <div>
                  <div className="text-slate-400 font-sans mb-1 flex items-center space-x-1">
                    <span className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold">Kết quả</span>
                    <span>Tọa độ thả hàng X<sub>thả</sub> = X<sub>1</sub> = v<sub>0</sub>t<sub>1</sub> + ½a·t<sub>1</sub>²</span>
                  </div>
                  <div className="text-slate-300">
                    X<sub>thả</sub> = ({effectiveVx.toFixed(1)} × {t1_calc.toFixed(2)}) + (0.5 × {accel} × {t1_calc.toFixed(2)}²) = <strong className="text-emerald-400 text-sm">{computedDropX.toFixed(1)} m</strong>
                    <span className="text-xs text-slate-400 ml-2">(Tầm xa rơi X<sub>2</sub> = v<sub>1</sub>t<sub>2</sub> = {X2_calc.toFixed(1)}m)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 bg-slate-800/60 px-5 py-3 border-t border-slate-700">
          <button
            id="btn-cancel-calc"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            Đóng
          </button>
          <button
            id="btn-apply-calculated-drop"
            onClick={handleApply}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow"
          >
            <Check className="w-4 h-4" />
            <span>Áp dụng X = {computedDropX.toFixed(1)}m vào trò chơi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
