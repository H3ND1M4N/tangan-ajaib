import React from 'react';
import { X, HelpCircle, Hand, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Panduan Gerakan Tangan MediaPipe</h3>
              <p className="text-xs text-slate-400">Cara bermain mencocokkan soal PAI tanpa sentuh</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-base">
              🖐️
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">1. Angkat Tangan ke Arah Kamera</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Posisikan tanganmu sekitar 0.5 hingga 1.5 meter di depan webcam atau papan interaktif. Sistem MediaPipe AI akan langsung mengenali 21 sendi tangan dan menampilkan kursor di ujung telunjuk.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-base">
              ☝️
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">2. Arahkan Telunjuk ke Kartu Jawaban</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Gerakkan telunjukmu di udara menuju kartu jawaban yang cocok dengan soal di sebelah kiri. Kartu yang disorot akan membesar dan bercahaya hijau.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-base">
              🤏
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">3. Jepit Jari (Pinch) untuk Memilih</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Satukan ujung jempol dan telunjukmu untuk menjepit (pinch). Pilihanmu akan langsung terkunci! Kamu juga bisa cukup menahan telunjuk di atas kartu selama 1 detik (*dwell tap*).
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200/90 leading-relaxed">
            <span className="font-bold text-emerald-300">🖥️ Ramah Layar Sentuh Smartboard:</span> Di papan tulis digital sekolah, siswa atau guru juga dapat langsung menyentuh layar dengan jari atau pena digital (*stylus*) kapan saja!
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Mengerti, Bismillah!
          </button>
        </div>
      </div>
    </div>
  );
};
