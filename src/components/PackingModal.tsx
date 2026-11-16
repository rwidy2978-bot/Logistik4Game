import React, { useEffect, useState } from 'react';
import { HandlingLabel, Order } from '../game/types';
import { HANDLING_LABEL_META } from '../game/warehouseData';
import { CheckSquare, Square, AlertCircle, PackageCheck } from 'lucide-react';

interface PackingModalProps {
  order: Order;
  onWrongLabel: (chosen: HandlingLabel, expected: HandlingLabel) => void;
  onConfirmPack: (orderId: string) => void;
  onCancel: () => void;
}

const LabelIcon: React.FC<{ type: HandlingLabel }> = ({ type }) => {
  if (type === 'FRAGILE') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M8 5H20L18.5 13C18 15.5 16.2 17 14 17C11.8 17 10 15.5 9.5 13L8 5Z" stroke="#38BDF8" strokeWidth="2" />
        <path d="M14 17V23M10 23H18" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 8L15 11L13.5 13" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'THIS_WAY_UP') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M9 21V8M9 8L5.5 12M9 8L12.5 12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 21V8M19 8L15.5 12M19 8L22.5 12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 24H22" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M5 14C5 9 9 6 14 6C19 6 23 9 23 14H5Z" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 14V21C14 22.5 12.8 23.5 11.5 23.5C10.5 23.5 9.8 22.8 9.8 22" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 3.5V5M19 3.5V5" stroke="#6EE7B7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

export const PackingModal: React.FC<PackingModalProps> = ({
  order,
  onWrongLabel,
  onConfirmPack,
  onCancel,
}) => {
  const [selectedLabel, setSelectedLabel] = useState<HandlingLabel | null>(null);
  const [packingListChecked, setPackingListChecked] = useState(false);
  const [awbChecked, setAwbChecked] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedLabel) {
      setErrorFeedback('Pilih 1 Handling Label yang sesuai dengan muatan pesanan.');
      return;
    }
    if (!packingListChecked || !awbChecked) {
      setErrorFeedback('Centang Packing List dan Shipping Label (AWB) terlebih dahulu.');
      return;
    }
    if (selectedLabel !== order.requiredLabel) {
      const expectedMeta = HANDLING_LABEL_META[order.requiredLabel];
      setErrorFeedback(
        `Label kurang tepat (-30 poin)! Muatan ini memerlukan label ${expectedMeta.title} (${expectedMeta.subtitle}).`
      );
      onWrongLabel(selectedLabel, order.requiredLabel);
      return;
    }
    onConfirmPack(order.id);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setSelectedLabel('FRAGILE');
      else if (e.key === '2') setSelectedLabel('THIS_WAY_UP');
      else if (e.key === '3') setSelectedLabel('KEEP_DRY');
      else if (e.key === '4') setPackingListChecked((v) => !v);
      else if (e.key === '5') setAwbChecked((v) => !v);
      else if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-[#0F1E36] p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-700/80 pb-3">
          <div>
            <div className="font-mono-tabular text-xs font-bold text-sky-400">
              MEJA PACKING · QC &amp; LABELING
            </div>
            <h3 className="font-display text-2xl font-bold text-white">
              Verifikasi Paket {order.id}
            </h3>
            <p className="text-xs text-slate-400">Pelanggan: {order.customer}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            Tunda (Esc)
          </button>
        </div>

        {/* Cargo summary */}
        <div className="mt-3.5 rounded-lg border border-slate-700/80 bg-slate-900/70 p-3">
          <div className="mb-1.5 text-xs font-semibold text-slate-300">
            Isi Muatan untuk Dicek:
          </div>
          <div className="flex flex-wrap gap-2">
            {order.items.map((it) => (
              <div
                key={it.sku.id}
                className="rounded border border-slate-700 bg-[#0B1528] px-2.5 py-1.5 text-xs text-slate-200"
              >
                <span className="font-mono-tabular font-bold text-white">{it.qty}x</span>{' '}
                <span>{it.sku.name}</span>
                <span className="block text-[10px] text-slate-400">{it.sku.shortHint}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Handling Label Selection */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              1. Pilih 1 Handling Label yang Tepat:
            </span>
            <span className="font-mono-tabular text-slate-400">Shortcut: Tombol 1 / 2 / 3</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {(['FRAGILE', 'THIS_WAY_UP', 'KEEP_DRY'] as HandlingLabel[]).map((label, idx) => {
              const meta = HANDLING_LABEL_META[label];
              const isSelected = selectedLabel === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setSelectedLabel(label);
                    setErrorFeedback(null);
                  }}
                  className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? `${meta.borderClass} ${meta.bgClass} ring-1 ring-white/40`
                      : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <LabelIcon type={label} />
                    <span className="font-mono-tabular text-[11px] text-slate-400">[{idx + 1}]</span>
                  </div>
                  <div className="mt-2 font-mono-tabular text-xs font-bold text-white">
                    {meta.title}
                  </div>
                  <div className="text-[11px] text-slate-300">{meta.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Mandatory Documents Checklist */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              2. Verifikasi Dokumen Pengiriman:
            </span>
            <button
              type="button"
              onClick={() => {
                setPackingListChecked(true);
                setAwbChecked(true);
                setErrorFeedback(null);
              }}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              Centang Semua
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setPackingListChecked((v) => !v);
                setErrorFeedback(null);
              }}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs font-medium cursor-pointer ${
                packingListChecked
                  ? 'border-emerald-500/70 bg-emerald-950/30 text-white'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              {packingListChecked ? (
                <CheckSquare className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Square className="h-4 w-4 shrink-0 text-slate-500" />
              )}
              <span>Packing List [4]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAwbChecked((v) => !v);
                setErrorFeedback(null);
              }}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs font-medium cursor-pointer ${
                awbChecked
                  ? 'border-emerald-500/70 bg-emerald-950/30 text-white'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              {awbChecked ? (
                <CheckSquare className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Square className="h-4 w-4 shrink-0 text-slate-500" />
              )}
              <span>Shipping Label / AWB [5]</span>
            </button>
          </div>
        </div>

        {errorFeedback && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/60 bg-rose-950/40 p-2.5 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorFeedback}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-700/80 pt-3.5">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-orange-400 cursor-pointer"
          >
            <PackageCheck className="h-4 w-4" />
            <span>Segel Paket &amp; Siap Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
