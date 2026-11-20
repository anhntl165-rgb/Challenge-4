/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MissionData, MissionResult, GameStatus, TerrainType } from './types';
import { generateMission, calculateScore } from './utils/physics';
import { audio } from './utils/audio';

import { Header } from './components/Header';
import { PhysicsPanel } from './components/PhysicsPanel';
import { SimulationCanvas } from './components/SimulationCanvas';
import { CalculatorModal } from './components/CalculatorModal';
import { FormulaGuideModal } from './components/FormulaGuideModal';
import { MissionHistoryModal } from './components/MissionHistoryModal';
import { Mountain, Layers, Home, School, Compass } from 'lucide-react';

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType | 'all'>('all');

  const [missionCount, setMissionCount] = useState<number>(1);
  const [mission, setMission] = useState<MissionData>(() => generateMission(1, 1));
  const [dropX, setDropX] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [planeX, setPlaneX] = useState<number>(0);
  const [usedHint, setUsedHint] = useState<boolean>(false);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<MissionResult[]>([]);

  // Start engine audio when unmuted and game active
  useEffect(() => {
    if (!isMuted) {
      audio.startEngineSound();
    } else {
      audio.stopEngineSound();
    }
  }, [isMuted]);

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const handleUseHint = () => {
    audio.playClick();
    setUsedHint(true);
  };

  const handleNewMission = (lvl: 1 | 2 | 3 | 4 = selectedLevel, terrain?: TerrainType) => {
    audio.playClick();
    const nextCount = missionCount + 1;
    setMissionCount(nextCount);
    
    const actualTerrain = terrain ?? (selectedTerrain === 'all' ? undefined : selectedTerrain);
    setMission(generateMission(nextCount, lvl, actualTerrain));
    setDropX(null);
    setGameStatus('idle');
    setPlaneX(0);
    setUsedHint(false);
  };

  const handleChangeLevel = (lvl: 1 | 2 | 3 | 4) => {
    if (lvl === selectedLevel && gameStatus === 'idle') return;
    setSelectedLevel(lvl);
    setSelectedTerrain('all');
    handleNewMission(lvl, undefined);
  };

  const handleChangeTerrain = (t: TerrainType | 'all') => {
    setSelectedTerrain(t);
    handleNewMission(2, t === 'all' ? undefined : t);
  };

  const handleStartFlight = () => {
    audio.playClick();
    setGameStatus('flying');
  };

  const handleResetPlaneSameMission = () => {
    audio.playClick();
    setGameStatus('idle');
    setPlaneX(0);
    setUsedHint(false);
  };

  const handleMissionSuccess = (errorDistance: number = 0) => {
    if (dropX !== null) {
      const baseScore = calculateScore(errorDistance);
      const score = usedHint ? Math.max(1, Math.floor(baseScore / 2)) : baseScore;
      const result: MissionResult = {
        missionId: mission.id,
        level: mission.level,
        terrainType: mission.terrainType,
        terrainName: mission.terrainName,
        targetElevation: mission.targetElevation,
        altitude: mission.altitude,
        velocity: mission.velocity,
        windSpeed: mission.windSpeed,
        windDirection: mission.windDirection,
        effectiveVx: mission.effectiveVx,
        acceleration: mission.acceleration,
        targetX: mission.targetDistance,
        chosenDropX: dropX,
        exactDropX: mission.exactDropX,
        errorDistance,
        isHit: true,
        score,
        usedHint,
        timestamp: new Date()
      };
      setHistory(prev => [result, ...prev]);
    }
  };

  const handleNextMissionAfterSuccess = (errorDistance: number = 0) => {
    handleMissionSuccess(errorDistance);
  };

  const handleMissionFail = (errorDistance: number, landedX: number) => {
    if (dropX !== null) {
      const baseScore = calculateScore(errorDistance);
      const score = usedHint ? Math.max(1, Math.floor(baseScore / 2)) : baseScore;
      const result: MissionResult = {
        missionId: mission.id,
        level: mission.level,
        terrainType: mission.terrainType,
        terrainName: mission.terrainName,
        targetElevation: mission.targetElevation,
        altitude: mission.altitude,
        velocity: mission.velocity,
        windSpeed: mission.windSpeed,
        windDirection: mission.windDirection,
        effectiveVx: mission.effectiveVx,
        acceleration: mission.acceleration,
        targetX: mission.targetDistance,
        chosenDropX: dropX,
        exactDropX: mission.exactDropX,
        errorDistance,
        isHit: false,
        score,
        usedHint,
        timestamp: new Date()
      };
      setHistory(prev => [result, ...prev]);
    }
  };

  const handleSetDropX = (x: number) => {
    setDropX(x);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* App Header */}
      <Header
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewMission={() => handleNewMission(selectedLevel)}
        missionNumber={missionCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        {/* Level & Terrain Selector Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Level Switcher Buttons */}
          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
            <span className="text-xs font-bold text-slate-400 flex items-center space-x-1 mr-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>CẤP ĐỘ:</span>
            </span>

            <button
              id="btn-level-1"
              onClick={() => handleChangeLevel(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                selectedLevel === 1
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>🌱 Level 1: Đồng bằng</span>
            </button>

            <button
              id="btn-level-2"
              onClick={() => handleChangeLevel(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                selectedLevel === 2
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>⛰️ Level 2: Địa hình</span>
            </button>

            <button
              id="btn-level-3"
              onClick={() => handleChangeLevel(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                selectedLevel === 3
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>💨 Level 3: Gió ngang</span>
            </button>

            <button
              id="btn-level-4"
              onClick={() => handleChangeLevel(4)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                selectedLevel === 4
                  ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-lg animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>⚡ Level 4: Trong bão</span>
            </button>
          </div>

          {/* Level 2 Sub-terrain Quick Filter Buttons */}
          {selectedLevel === 2 && (
            <div className="flex items-center flex-wrap gap-1.5 text-xs bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-amber-400 font-semibold px-1">Thử thách:</span>
              
              <button
                id="terrain-all"
                onClick={() => handleChangeTerrain('all')}
                className={`px-2 py-1 rounded text-[11px] transition cursor-pointer font-medium ${
                  selectedTerrain === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎲 Ngẫu nhiên
              </button>

              <button
                id="terrain-hill"
                onClick={() => handleChangeTerrain('hill')}
                className={`px-2 py-1 rounded text-[11px] transition cursor-pointer font-medium flex items-center space-x-1 ${
                  selectedTerrain === 'hill'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mountain className="w-3 h-3 text-emerald-400" />
                <span>Trên đồi</span>
              </button>

              <button
                id="terrain-crater"
                onClick={() => handleChangeTerrain('crater')}
                className={`px-2 py-1 rounded text-[11px] transition cursor-pointer font-medium flex items-center space-x-1 ${
                  selectedTerrain === 'crater'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 text-rose-400" />
                <span>Dưới hố</span>
              </button>

              <button
                id="terrain-rooftop"
                onClick={() => handleChangeTerrain('rooftop')}
                className={`px-2 py-1 rounded text-[11px] transition cursor-pointer font-medium flex items-center space-x-1 ${
                  selectedTerrain === 'rooftop'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Home className="w-3 h-3 text-sky-400" />
                <span>Mái nhà</span>
              </button>

              <button
                id="terrain-school"
                onClick={() => handleChangeTerrain('highland_school')}
                className={`px-2 py-1 rounded text-[11px] transition cursor-pointer font-medium flex items-center space-x-1 ${
                  selectedTerrain === 'highland_school'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <School className="w-3 h-3 text-purple-400" />
                <span>Trường vùng cao</span>
              </button>
            </div>
          )}
        </div>

        {/* Physics Tactical Data Panel */}
        <PhysicsPanel
          mission={mission}
          dropX={dropX}
          onSetDropX={handleSetDropX}
          onStartFlight={handleStartFlight}
          onResetPlane={handleResetPlaneSameMission}
          gameStatus={gameStatus}
          planeX={planeX}
          usedHint={usedHint}
          onUseHint={handleUseHint}
        />

        {/* 60FPS Parallax Simulation Canvas */}
        <SimulationCanvas
          mission={mission}
          dropX={dropX}
          onSetDropX={handleSetDropX}
          gameStatus={gameStatus}
          setGameStatus={setGameStatus}
          onMissionSuccess={handleNextMissionAfterSuccess}
          onMissionFail={handleMissionFail}
          onResetPlane={handleResetPlaneSameMission}
          onUpdatePlaneX={setPlaneX}
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800 py-3 px-4 text-center text-xs text-slate-500">
        Mô phỏng Học liệu STEM Vật lý 10 • Chuyển động Ném Ngang • Level 1: Đồng bằng & Level 2: Thử thách Địa hình
      </footer>

      {/* Modals */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        mission={mission}
        onApplyCalculatedDrop={(calculatedDropX) => {
          setDropX(calculatedDropX);
          audio.playClick();
        }}
      />

      <FormulaGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <MissionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />
    </div>
  );
}
