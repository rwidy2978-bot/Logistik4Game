import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand } from 'lucide-react';

interface TouchControlsProps {
  onDirectionChange: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void;
  onAction: () => void;
  actionLabel: string | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionChange,
  onAction,
  actionLabel,
}) => {
  const bindDir = (dir: 'up' | 'down' | 'left' | 'right') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onDirectionChange(dir, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onDirectionChange(dir, false);
    },
    onPointerLeave: () => onDirectionChange(dir, false),
    onPointerCancel: () => onDirectionChange(dir, false),
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex items-end justify-between px-4 lg:static lg:pointer-events-auto lg:hidden">
      {/* Virtual D-Pad */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5 rounded-xl border border-slate-700/80 bg-[#0B1528]/85 p-2 shadow-lg">
        <div />
        <button
          type="button"
          aria-label="Atas"
          {...bindDir('up')}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/90 text-white active:bg-orange-500 active:text-slate-950 select-none"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
        <div />
        <button
          type="button"
          aria-label="Kiri"
          {...bindDir('left')}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/90 text-white active:bg-orange-500 active:text-slate-950 select-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Bawah"
          {...bindDir('down')}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/90 text-white active:bg-orange-500 active:text-slate-950 select-none"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Kanan"
          {...bindDir('right')}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/90 text-white active:bg-orange-500 active:text-slate-950 select-none"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onAction();
        }}
        className={`pointer-events-auto flex h-16 min-w-[120px] flex-col items-center justify-center rounded-xl border px-4 font-bold shadow-lg active:scale-95 select-none ${
          actionLabel
            ? 'border-orange-400 bg-orange-500 text-slate-950'
            : 'border-slate-600 bg-slate-900/90 text-slate-300'
        }`}
      >
        <Hand className="h-5 w-5" />
        <span className="mt-0.5 text-[11px] leading-none">AMBIL / PROSES</span>
      </button>
    </div>
  );
};
