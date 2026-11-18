import React, { useState } from 'react';
import { DifficultyLevel } from '../game/types';
import { HANDLING_LABEL_META, LEVEL_CONFIGS } from '../game/warehouseData';
import { Volume2, VolumeX, BookOpen, Download, Play, X } from 'lucide-react';

interface TitleScreenProps {
  selectedLevel: DifficultyLevel;
  onSelectLevel: (level: DifficultyLevel) => void;
  onStartGame: () => void;
  muted: boolean;
  onToggleMute: () => void;
  tutorialEnabled: boolean;
  onToggleTutorial: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedLevel,
  onSelectLevel,
  onStartGame,
  muted,
  onToggleMute,
  tutorialEnabled,
  onToggleTutorial,
}) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between bg-[#0B1528]/82 px-4 py-5 sm:px-8 sm:py-7 overflow-y-auto">
      {/* Top utility row */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
          <img
            src="/assets/aistudio/logo_kecil__stm_kapal_baru_0c25b1d6.png"
            alt="Logo SMK Tanjung Priok 1"
            referrerPolicy="no-referrer"
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="font-mono-tabular text-orange-400">TEKNIK LOGISTIK · SMK TANJUNG PRIOK 1</span>
          <span aria-hidden="true" className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline">Simulasi Order Fulfillment 2D</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-orange-400" />
            <span>Panduan SOP</span>
          </button>

          <a
            href="/warehouse-grand-prix.html"
            download="warehouse-grand-prix-netlify.html"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-orange-500/70 hover:text-white whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Unduh 1-File HTML (Netlify)</span>
            <span className="sm:hidden">HTML Netlify</span>
          </a>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-slate-200 transition-colors hover:border-slate-500 hover:text-white shrink-0 cursor-pointer"
          >
            {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Title & Level Selection Centerpiece */}
      <div className="mx-auto my-auto w-full max-w-5xl py-4">
        {/* Custom Inline SVG Title Lockup */}
        <div className="mb-6 flex flex-col items-start gap-2">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-700/90 bg-[#0F1E36] p-1.5 shadow-lg">
              <img
                src="/assets/aistudio/logo_kecil__stm_kapal_baru_0c25b1d6.png"
                alt="Logo SMK Tanjung Priok 1"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl text-balance leading-none">
                WAREHOUSE GRAND PRIX
              </h1>
              <p className="font-display text-xl font-bold tracking-wide text-orange-400 sm:text-2xl leading-tight">
                ORDER FULFILLMENT RUSH
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-slate-300 leading-relaxed">
            Kuasai alur kerja operator gudang modern di lintasan U-Shape: lakukan{' '}
            <strong className="text-white">Order Picking</strong> sesuai Picking Slip, verifikasi{' '}
            <strong className="text-white">Packing &amp; Handling Label</strong>, lalu kirim tepat waktu ke{' '}
            <strong className="text-white">Loading Dock</strong>.
          </p>
        </div>

        {/* 3 Difficulty Level Cards */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {([1, 2, 3] as DifficultyLevel[]).map((lvl) => {
            const cfg = LEVEL_CONFIGS[lvl];
            const active = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-orange-500 bg-[#14233C] shadow-lg shadow-orange-950/30'
                    : 'border-slate-700/90 bg-[#0F1E36]/90 hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono-tabular text-xs font-semibold text-orange-400">
                      {cfg.subtitle}
                    </span>
                    <span className="font-mono-tabular text-xs text-slate-400">
                      {cfg.durationSeconds}d
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                    {cfg.title}
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {cfg.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-700/70 pt-2.5 text-xs text-slate-400 font-mono-tabular">
                  <span>{cfg.concurrentOrders} Order Paralel</span>
                  <span>Target {cfg.totalShiftOrders} Paket</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Primary CTA & Tutorial Toggle */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartGame}
              className="inline-flex items-center gap-2.5 rounded-xl bg-orange-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-orange-950/40 transition-transform hover:bg-orange-400 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-5 w-5 fill-slate-950" />
              <span>Mulai Shift Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onToggleTutorial}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tutorialEnabled
                  ? 'border-amber-400/70 bg-amber-950/35 text-amber-200'
                  : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-sm border ${
                  tutorialEnabled
                    ? 'border-amber-400 bg-amber-400'
                    : 'border-slate-500 bg-transparent'
                }`}
              />
              <span>Tutorial Interaktif: {tutorialEnabled ? 'Aktif' : 'Nonaktif'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 font-mono-tabular">
            WASD / Panah Bergerak · Spasi Ambil / Proses · Esc Jeda
          </p>
        </div>
      </div>

      {/* Bottom subtle legend */}
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <span>+100 Poin / Paket Akurat · +10 Poin / Sisa Detik · -30 Penalti Salah Rak / Label</span>
        <span className="font-mono-tabular text-slate-500">Siap Desktop &amp; Layar Sentuh (D-Pad)</span>
      </div>

      {/* SOP & Handling Label Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-[#0F1E36] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  SOP Order Fulfillment &amp; Handling Label
                </h3>
                <p className="text-xs text-slate-400">
                  Panduan singkat standar operasional SMK Manajemen Logistik
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                  <div className="font-mono-tabular text-xs font-bold text-orange-400">01. ORDER PICKING</div>
                  <p className="mt-1 text-xs leading-relaxed">
                    Baca kode rak di Picking Slip. Dekati rak dan tekan Spasi. Di Level 3, jika rak kosong (Blind Count), ambil stok di Zona Cadangan.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                  <div className="font-mono-tabular text-xs font-bold text-sky-400">02. PACKING &amp; QC</div>
                  <p className="mt-1 text-xs leading-relaxed">
                    Bawa barang ke Meja Packing. Pilih Handling Label sesuai sifat barang serta centang dokumen Packing List dan AWB.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                  <div className="font-mono-tabular text-xs font-bold text-emerald-400">03. DISPATCH</div>
                  <p className="mt-1 text-xs leading-relaxed">
                    Antar paket tersegel ke Loading Dock untuk dimuat ke truk kontainer dan raih poin pengiriman akurat.
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-700/80 pt-3">
                <div className="text-xs font-semibold text-slate-200">Klasifikasi Handling Label ISO:</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(['FRAGILE', 'THIS_WAY_UP', 'KEEP_DRY'] as const).map((key) => {
                    const meta = HANDLING_LABEL_META[key];
                    return (
                      <div key={key} className={`rounded-lg border ${meta.borderClass}/40 ${meta.bgClass} p-2.5`}>
                        <div className="font-mono-tabular text-xs font-bold text-white">{meta.title}</div>
                        <div className="text-[11px] font-medium text-slate-300">{meta.subtitle}</div>
                        <p className="mt-1 text-[11px] text-slate-400 leading-snug">{meta.rule}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-orange-400 cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
