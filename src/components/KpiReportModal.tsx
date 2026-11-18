import React from 'react';
import { ShiftStats } from '../game/types';
import { LEVEL_CONFIGS } from '../game/warehouseData';
import { RotateCcw, Home, Award, Download } from 'lucide-react';

interface KpiReportModalProps {
  stats: ShiftStats;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const KpiReportModal: React.FC<KpiReportModalProps> = ({
  stats,
  onPlayAgain,
  onBackToMenu,
}) => {
  const cfg = LEVEL_CONFIGS[stats.level];

  const gradeColor =
    stats.competencyGrade === 'Sangat Kompeten'
      ? 'text-emerald-400 border-emerald-500/60 bg-emerald-950/30'
      : stats.competencyGrade === 'Kompeten'
      ? 'text-sky-400 border-sky-500/60 bg-sky-950/30'
      : 'text-amber-400 border-amber-500/60 bg-amber-950/30';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B1528]/90 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-[#0F1E36] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/assets/aistudio/logo_kecil__stm_kapal_baru_0c25b1d6.png"
              alt="Logo SMK Tanjung Priok 1"
              referrerPolicy="no-referrer"
              className="h-12 w-12 shrink-0 object-contain"
            />
            <div>
              <div className="font-mono-tabular text-xs font-bold text-orange-400">
                RAPOR KPI SISWA · SMK TANJUNG PRIOK 1 · {cfg.title.toUpperCase()}
              </div>
              <h2 className="font-display text-3xl font-extrabold text-white">
                {stats.packagesDelivered >= stats.targetPackages
                  ? 'SHIFT SELESAI LEBIH AWAL!'
                  : 'WAKTU SHIFT BERAKHIR'}
              </h2>
            </div>
          </div>

          <div className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 ${gradeColor}`}>
            <Award className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-300 leading-none">Predikat Kompetensi</div>
              <div className="font-display text-lg font-bold leading-tight">
                {stats.competencyGrade}
              </div>
            </div>
          </div>
        </div>

        {/* Main 4 KPI Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3">
            <div className="text-[11px] text-slate-400">Total Skor</div>
            <div className="mt-1 font-mono-tabular text-2xl font-bold text-orange-400">
              {stats.score}
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3">
            <div className="text-[11px] text-slate-400">Akurasi Picking</div>
            <div className="mt-1 font-mono-tabular text-2xl font-bold text-white">
              {stats.accuracyPercent}%
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3">
            <div className="text-[11px] text-slate-400">Paket Terkirim</div>
            <div className="mt-1 font-mono-tabular text-2xl font-bold text-emerald-400">
              {stats.packagesDelivered}/{stats.targetPackages}
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3">
            <div className="text-[11px] text-slate-400">Siklus Order</div>
            <div className="mt-1 font-mono-tabular text-2xl font-bold text-sky-400">
              {stats.avgCycleSeconds > 0 ? `${stats.avgCycleSeconds.toFixed(1)}d` : '-'}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-4 rounded-lg border border-slate-700/70 bg-slate-900/50 p-3.5 text-xs">
          <div className="mb-2 font-semibold text-slate-200">Rincian Poin &amp; Evaluasi</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 font-mono-tabular">
            <div className="flex justify-between rounded bg-[#0B1528] px-2.5 py-1.5">
              <span className="text-slate-400">Paket Akurat:</span>
              <span className="text-emerald-400">+{stats.packagePoints}</span>
            </div>
            <div className="flex justify-between rounded bg-[#0B1528] px-2.5 py-1.5">
              <span className="text-slate-400">Bonus Waktu ({stats.timeRemaining}d):</span>
              <span className="text-sky-400">+{stats.timeBonus}</span>
            </div>
            <div className="flex justify-between rounded bg-[#0B1528] px-2.5 py-1.5">
              <span className="text-slate-400">Penalti Kesalahan:</span>
              <span className="text-rose-400">-{stats.penaltyPoints}</span>
            </div>
          </div>
        </div>

        {/* Educational Feedback */}
        <div className="mt-4 rounded-lg border border-slate-700/70 bg-[#0B1528] p-3.5">
          <div className="text-xs font-semibold text-orange-400">
            Umpan Balik Edukatif Manajemen Logistik:
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-300 list-disc pl-4">
            {stats.lessons.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80 pt-4">
          <a
            href="/warehouse-grand-prix.html"
            download="warehouse-grand-prix-netlify.html"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-sky-400" />
            <span>Unduh Versi HTML Netlify</span>
          </a>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 whitespace-nowrap cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Pilih Level</span>
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-orange-400 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Main Lagi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
