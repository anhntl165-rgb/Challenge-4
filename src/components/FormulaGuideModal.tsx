import React, { useEffect } from 'react';
import { X, BookOpen, Target, CheckCircle, Navigation, Trophy } from 'lucide-react';

interface FormulaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaGuideModal: React.FC<FormulaGuideModalProps> = ({ isOpen, onClose }) => {
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

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-800/90 px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <BookOpen className="w-5 h-5" />
            <span>KIẾN THỨC VẬT LÝ 10: CHUYỂN ĐỘNG NÉM NGANG</span>
          </div>
          <button
            id="btn-close-guide"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-slate-300">
          {/* Section 1: Intro */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-emerald-400 font-bold mb-2 flex items-center space-x-1.5">
              <Navigation className="w-4 h-4" />
              <span>1. Định nghĩa & Bản chất chuyển động</span>
            </h3>
            <p className="text-xs leading-relaxed text-slate-300">
              Chuyển động ném ngang là chuyển động của vật được ném theo phương nằm ngang với vận tốc ban đầu <strong>v₀</strong> từ độ cao <strong>h</strong> so với mặt đất.
              Chuyển động này gồm 2 thành phần độc lập:
            </p>
            <ul className="list-disc list-inside text-xs mt-2 space-y-1 text-slate-400 pl-2">
              <li><strong>Theo phương ngang (trục Ox):</strong> Chuyển động thẳng đều với vận tốc v₀ (không có lực cản).</li>
              <li><strong>Theo phương thẳng đứng (trục Oy):</strong> Chuyển động rơi tự do dưới tác dụng của trọng lực g = 9.8 m/s².</li>
            </ul>
          </div>

          {/* Section 2: Core Formulas */}
          <div className="space-y-3">
            <h3 className="text-amber-400 font-bold flex items-center space-x-1.5">
              <Target className="w-4 h-4" />
              <span>2. Các công thức cốt lõi cần nhớ</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {/* Formula 0: Level 2 Delta h */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-purple-400 font-bold font-sans mb-1">Độ cao rơi thực tế (Δh) - Level 2</div>
                <div className="bg-slate-900 p-2 rounded text-center text-sm font-bold text-emerald-400 mb-1">
                  Δh = h<sub>mb</sub> - h<sub>đh</sub>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  • <strong>h<sub>mb</sub></strong>: Độ cao máy bay so với đất.<br />
                  • <strong>h<sub>đh</sub></strong>: Độ cao địa hình mục tiêu.
                </div>
              </div>

              {/* Formula 0.5: Level 3 Wind Vx */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-sky-400 font-bold font-sans mb-1">Vận tốc ngang v<sub>x</sub> - Level 3 Gió Ngang</div>
                <div className="bg-slate-900 p-2 rounded text-center text-sm font-bold text-sky-300 mb-1">
                  v<sub>x</sub> = v<sub>máy bay</sub> ± v<sub>gió</sub>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  • <strong>Gió trái (cản)</strong>: v<sub>x</sub> = v<sub>mb</sub> - v<sub>gió</sub><br />
                  • <strong>Gió phải (xuôi)</strong>: v<sub>x</sub> = v<sub>mb</sub> + v<sub>gió</sub>
                </div>
              </div>

              {/* Formula 0.8: Level 4 Acceleration a */}
              <div className="bg-slate-950 p-3 rounded-lg border border-purple-500/40">
                <div className="text-purple-400 font-bold font-sans mb-1">Level 4: Trong Bão - Bài toán 2 giai đoạn</div>
                <div className="bg-slate-900 p-2 rounded text-center text-xs font-bold text-purple-300 mb-1 font-mono">
                  Giai đoạn 1: X<sub>1</sub> = v<sub>0</sub>t<sub>1</sub> + ½at<sub>1</sub>², v<sub>1</sub> = v<sub>0</sub> + at<sub>1</sub><br />
                  Giai đoạn 2: t<sub>2</sub> = √(2Δh/g), X<sub>2</sub> = v<sub>1</sub>t<sub>2</sub><br />
                  Tổng: X = X<sub>1</sub> + X<sub>2</sub>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  • <strong>Giai đoạn 1</strong>: Máy bay NHD với gia tốc <em>a</em> trong thời gian <em>t<sub>1</sub></em> trên mặt phẳng ngang.<br />
                  • <strong>Giai đoạn 2</strong>: Vật ném ngang rời máy bay ở độ cao <em>h</em> với vận tốc thả <em>v<sub>1</sub> = v<sub>0</sub> + at<sub>1</sub></em>.<br />
                  • Vận tốc cuối của Giai đoạn 1 chính là vận tốc ban đầu của Giai đoạn 2.
                </div>
              </div>

              {/* Formula 1 */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-sky-400 font-bold font-sans mb-1">Thời gian rơi (t)</div>
                <div className="bg-slate-900 p-2 rounded text-center text-sm font-bold text-white mb-1">
                  t = √(2Δh / g)
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Thời gian rơi phụ thuộc vào độ cao rơi thực tế <strong>Δh</strong>.
                </div>
              </div>

              {/* Formula 2 */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-amber-400 font-bold font-sans mb-1">Tầm xa (L)</div>
                <div className="bg-slate-900 p-2 rounded text-center text-sm font-bold text-white mb-1">
                  L = v<sub>x</sub> × t
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Tính theo vận tốc thực tế v<sub>x</sub> có tính ảnh hưởng của gió ngang.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Solving Strategy */}
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4">
            <h3 className="text-emerald-400 font-bold mb-2 flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>3. Quy trình xác định điểm thả hàng chuẩn xác</span>
            </h3>

            <ol className="space-y-2 text-xs text-slate-200">
              <li className="flex items-start space-x-2">
                <span className="bg-emerald-800 text-emerald-200 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">B1</span>
                <span><strong>Đọc thông số:</strong> Lấy độ cao <strong>h</strong>, vận tốc máy bay <strong>v</strong> và gia tốc <strong>g = 9.8 m/s²</strong>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-emerald-800 text-emerald-200 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">B2</span>
                <span><strong>Tính thời gian rơi:</strong> t = √(2 × h / 9.8).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-emerald-800 text-emerald-200 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">B3</span>
                <span><strong>Tính tầm bay xa:</strong> L = v × t.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-emerald-800 text-emerald-200 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">B4</span>
                <span><strong>Xác định điểm thả:</strong> X<sub>thả</sub> = X<sub>mục tiêu</sub> - L. Đánh dấu vị trí này trên đường bay!</span>
              </li>
            </ol>
          </div>

          {/* Section 4: Score Conversion Table */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-amber-400 font-bold mb-3 flex items-center space-x-1.5">
              <Trophy className="w-4 h-4" />
              <span>4. Bảng quy đổi điểm số theo sai số điểm rơi</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80 text-slate-300">
                    <th className="py-2 px-3 font-semibold">Vùng điểm | Sai số điểm rơi</th>
                    <th className="py-2 px-3 font-semibold text-center w-28">Điểm số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  <tr className="bg-emerald-950/40 text-emerald-300 font-bold">
                    <td className="py-1.5 px-3">≤ 2 m</td>
                    <td className="py-1.5 px-3 text-center text-emerald-400">10 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 2 – 5 m</td>
                    <td className="py-1.5 px-3 text-center text-amber-300 font-bold">9 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 5 – 8 m</td>
                    <td className="py-1.5 px-3 text-center text-amber-300 font-bold">8 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 8 – 12 m</td>
                    <td className="py-1.5 px-3 text-center text-sky-300 font-bold">7 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 12 – 18 m</td>
                    <td className="py-1.5 px-3 text-center text-sky-300 font-bold">6 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 18 – 25 m</td>
                    <td className="py-1.5 px-3 text-center">5 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 25 – 35 m</td>
                    <td className="py-1.5 px-3 text-center">4 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 35 – 50 m</td>
                    <td className="py-1.5 px-3 text-center">3 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3">&gt; 50 – 70 m</td>
                    <td className="py-1.5 px-3 text-center">2 điểm</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50 text-slate-400">
                    <td className="py-1.5 px-3">&gt; 70 m</td>
                    <td className="py-1.5 px-3 text-center">1 điểm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-5 py-3 border-t border-slate-700 flex justify-end shrink-0">
          <button
            id="btn-understand-guide"
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow"
          >
            Đã hiểu kiến thức ➔
          </button>
        </div>
      </div>
    </div>
  );
};
