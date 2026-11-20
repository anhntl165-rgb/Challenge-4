import React from 'react';
import { Volume2, VolumeX, HelpCircle, Calculator, History, RotateCcw, Plane } from 'lucide-react';

interface HeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onOpenCalculator: () => void;
  onOpenHistory: () => void;
  onNewMission: () => void;
  missionNumber: number;
}

export const Header: React.FC<HeaderProps> = ({
  isMuted,
  onToggleMute,
  onOpenGuide,
  onOpenCalculator,
  onOpenHistory,
  onNewMission,
  missionNumber
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 text-white px-4 py-3 shadow-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <Plane className="w-6 h-6 transform -rotate-12" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                THẢ HÀNG CỨU TRỢ
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Máy bay cứu trợ. Xác định đúng điểm thả để tiếp tế cho làng bị cô lập
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 text-sm">
          <span className="text-xs font-mono bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 shadow-inner">
            Nhiệm vụ: <strong className="text-emerald-400 font-bold">#{missionNumber}</strong>
          </span>

          <button
            id="btn-calculator"
            onClick={onOpenCalculator}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 transition font-medium cursor-pointer shadow-sm"
            title="Mở máy tính Vật lý hỗ trợ"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Máy tính Vật lý</span>
          </button>

          <button
            id="btn-guide"
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/30 hover:border-amber-500/60 transition font-medium cursor-pointer shadow-sm"
            title="Xem công thức & hướng dẫn"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Công thức</span>
          </button>

          <button
            id="btn-history"
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-sky-300 rounded-lg border border-sky-500/30 hover:border-sky-500/60 transition font-medium cursor-pointer shadow-sm"
            title="Xem lịch sử thả hàng"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Lịch sử</span>
          </button>

          <button
            id="btn-new-mission"
            onClick={onNewMission}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-lg shadow-md shadow-emerald-500/20 transition cursor-pointer"
            title="Đổi bài toán mới"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đổi bài mới</span>
          </button>

          <button
            id="btn-toggle-sound"
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isMuted
                ? 'bg-red-950/60 border-red-800 text-red-400 hover:bg-red-900'
                : 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
