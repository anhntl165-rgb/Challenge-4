import React, { useEffect } from 'react';
import { X, History, Trophy, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MissionResult } from '../types';

interface MissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: MissionResult[];
}

export const MissionHistoryModal: React.FC<MissionHistoryModalProps> = ({
  isOpen,
  onClose,
  history
}) => {
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

  const totalHits = history.filter(h => h.isHit).length;
  const hitRate = history.length > 0 ? Math.round((totalHits / history.length) * 100) : 0;
  const averageScore = history.length > 0 
    ? (history.reduce((acc, h) => acc + (h.score ?? 1), 0) / history.length).toFixed(1)
    : '0';

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-800/90 px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center space-x-2 text-sky-400 font-bold">
            <History className="w-5 h-5" />
            <span>LỊCH SỬ NHIỆM VỤ CỨU TRỢ</span>
          </div>
          <button
            id="btn-close-history"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-4 gap-2 p-3.5 bg-slate-950 border-b border-slate-800 text-center text-xs shrink-0">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Tổng số lượt</div>
            <div className="text-base font-bold font-mono text-white">{history.length}</div>
          </div>
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Thành công</div>
            <div className="text-base font-bold font-mono text-emerald-400">{totalHits}</div>
          </div>
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Chính xác</div>
            <div className="text-base font-bold font-mono text-amber-400">{hitRate}%</div>
          </div>
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Điểm TB</div>
            <div className="text-base font-bold font-mono text-sky-400">{averageScore}/10</div>
          </div>
        </div>

        {/* List of attempts */}
        <div className="p-4 overflow-y-auto space-y-2 text-xs flex-1">
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Chưa có dữ liệu thả hàng nào. Hãy bắt đầu nhiệm vụ đầu tiên!
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                  item.isHit
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                    : 'bg-red-950/30 border-red-800/80 text-red-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.isHit ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold flex items-center space-x-2 flex-wrap gap-y-1">
                      <span>Lượt #{history.length - idx}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                        Lvl {item.level}
                      </span>
                      <span className="font-mono text-[11px] opacity-80">
                        (h={item.altitude}m, v={item.velocity}m/s{item.acceleration ? `, a=${item.acceleration > 0 ? '+' : ''}${item.acceleration}m/s²` : ''})
                      </span>
                      {item.usedHint && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                          💡 Dùng gợi ý (-50%)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-75 font-mono">
                      Mục tiêu: {item.targetX}m | Thả chọn: {item.chosenDropX}m
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-amber-300 text-sm">{item.score ?? 1}/10 đ</span>
                  </div>
                  <div className="text-[10px] opacity-80">
                    Sai số: {item.errorDistance.toFixed(1)}m
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-5 py-3 border-t border-slate-700 flex justify-end shrink-0">
          <button
            id="btn-close-history-footer"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
