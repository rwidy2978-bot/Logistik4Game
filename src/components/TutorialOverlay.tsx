import React from 'react';
import { Order, TutorialStep } from '../game/types';
import { CheckCircle2, Compass, Package, Truck, ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
  step: TutorialStep;
  firstOrder: Order | undefined;
  onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  firstOrder,
  onSkip,
}) => {
  if (step === 'OFF' || step === 'DO_PACKING') return null;

  if (step === 'COMPLETED') {
    return (
      <div className="pointer-events-none absolute top-3 left-3 z-20 max-w-sm">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-emerald-500/70 bg-[#0B1528]/95 px-4 py-3 shadow-xl">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <div className="font-mono-tabular text-xs font-bold text-emerald-400">
              TUTORIAL SELESAI
            </div>
            <p className="text-xs text-slate-200">
              Alur Order Picking → Packing → Dispatch dikuasai! Waktu shift kini berjalan penuh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalUnits = firstOrder
    ? firstOrder.items.reduce((acc, it) => acc + it.qty, 0)
    : 0;
  const pickedUnits = firstOrder
    ? firstOrder.items.reduce((acc, it) => acc + it.pickedQty, 0)
    : 0;
  const nextMissingItem = firstOrder?.items.find((it) => it.pickedQty < it.qty);

  const stepMeta: Record<
    Exclude<TutorialStep, 'OFF' | 'DO_PACKING' | 'COMPLETED'>,
    {
      num: number;
      title: string;
      body: string;
      hint: string;
      icon: React.ReactNode;
    }
  > = {
    PICKING: {
      num: 1,
      title: 'Langkah 1/4: Mengambil Barang (Order Picking)',
      body: nextMissingItem
        ? `Lihat Picking Slip di kanan. Gerakkan operator (WASD / Panah / D-Pad) ke RAK ${
            nextMissingItem.blindCountMissing && nextMissingItem.blindCountReported
              ? 'ZONA CADANGAN'
              : nextMissingItem.sku.rackId
          }, lalu tekan SPASI untuk memindai ${nextMissingItem.qty}x ${nextMissingItem.sku.name}.`
        : 'Ambil semua SKU pada pesanan pertama sesuai kode rak di Picking Slip.',
      hint: `Progres SKU pesanan pertama: ${pickedUnits}/${totalUnits} unit`,
      icon: <Compass className="h-4 w-4 text-orange-400" />,
    },
    GO_PACKING: {
      num: 2,
      title: 'Langkah 2/4: Menuju Meja Packing',
      body: 'Semua barang pesanan telah terkumpul! Ikuti garis panduan kuning menuju MEJA PACKING di bawah-kiri gudang, lalu tekan SPASI untuk QC & pelabelan.',
      hint: 'Tahap berikutnya: Pilih Handling Label & cek dokumen',
      icon: <Package className="h-4 w-4 text-sky-400" />,
    },
    DISPATCH: {
      num: 4,
      title: 'Langkah 4/4: Pengiriman (Dispatch)',
      body: 'Paket sudah tersegel rapi! Bawa paket menuju LOADING DOCK di bawah-kanan gudang dan tekan SPASI untuk memuat ke truk & meraih +100 poin.',
      hint: 'Setelah terkirim, tutorial selesai dan timer shift aktif',
      icon: <Truck className="h-4 w-4 text-emerald-400" />,
    },
  };

  const current = stepMeta[step];

  return (
    <div className="pointer-events-none absolute top-3 left-3 z-20 w-[calc(100%-1.5rem)] max-w-sm">
      <div className="pointer-events-auto rounded-xl border border-amber-400/70 bg-[#0B1528]/95 p-3.5 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {current.icon}
            <span className="font-mono-tabular text-[11px] font-bold text-amber-300">
              PANDUAN INTERAKTIF · TIMER DIJEDA
            </span>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer"
          >
            Lewati
          </button>
        </div>

        <h3 className="mt-1.5 font-display text-lg font-bold text-white leading-tight">
          {current.title}
        </h3>
        <p className="mt-1 text-xs text-slate-200 leading-relaxed">{current.body}</p>

        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] font-mono-tabular text-amber-300">
          <span className="inline-flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            {current.hint}
          </span>
        </div>
      </div>
    </div>
  );
};
