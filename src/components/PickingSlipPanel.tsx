import React from 'react';
import { Order } from '../game/types';
import { Check, Package, AlertTriangle, Truck } from 'lucide-react';

interface PickingSlipPanelProps {
  orders: Order[];
  nearbyPrompt: string | null;
  onTriggerAction: () => void;
}

export const PickingSlipPanel: React.FC<PickingSlipPanelProps> = ({
  orders,
  nearbyPrompt,
  onTriggerAction,
}) => {
  return (
    <aside className="flex h-full w-full flex-col border-t border-slate-700/80 bg-[#0F1E36] lg:w-80 lg:border-l lg:border-t-0 xl:w-88 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-wide text-white leading-none">
            PICKING SLIP AKTIF
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Ikuti kode rak dan alur Packing → Dispatch
          </p>
        </div>
        <span className="font-mono-tabular text-xs font-bold text-orange-400">
          {orders.length} Order
        </span>
      </div>

      {/* Orders List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-4 text-center text-xs text-slate-400">
            Menyiapkan daftar pesanan berikutnya...
          </div>
        ) : (
          orders.map((order) => {
            const totalUnits = order.items.reduce((acc, it) => acc + it.qty, 0);
            const pickedUnits = order.items.reduce((acc, it) => acc + it.pickedQty, 0);
            const pct = totalUnits > 0 ? Math.round((pickedUnits / totalUnits) * 100) : 0;

            return (
              <div
                key={order.id}
                className={`rounded-lg border p-3 transition-colors ${
                  order.stage === 'READY_TO_DISPATCH'
                    ? 'border-emerald-500/60 bg-emerald-950/25'
                    : order.stage === 'READY_TO_PACK'
                    ? 'border-sky-500/60 bg-sky-950/25'
                    : 'border-slate-700 bg-slate-900/65'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-white">
                    {order.id}
                  </span>
                  <span className="truncate text-[11px] text-slate-400">{order.customer}</span>
                </div>

                {/* Stage Guidance */}
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  {order.stage === 'PICKING' && (
                    <span className="font-medium text-orange-400">
                      Tahap 1: Ambil SKU di Rak
                    </span>
                  )}
                  {order.stage === 'READY_TO_PACK' && (
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-400">
                      <Package className="h-3.5 w-3.5" />
                      Tahap 2: Bawa ke Meja Packing
                    </span>
                  )}
                  {order.stage === 'READY_TO_DISPATCH' && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                      <Truck className="h-3.5 w-3.5" />
                      Tahap 3: Kirim ke Loading Dock
                    </span>
                  )}
                  <span className="font-mono-tabular text-slate-400">{pct}%</span>
                </div>

                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full transition-all duration-200 ${
                      order.stage === 'READY_TO_DISPATCH'
                        ? 'bg-emerald-400'
                        : order.stage === 'READY_TO_PACK'
                        ? 'bg-sky-400'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* SKU Items */}
                <ul className="mt-2.5 space-y-1.5">
                  {order.items.map((item) => {
                    const done = item.pickedQty >= item.qty;
                    const needsBuffer = item.blindCountMissing && item.blindCountReported && !done;
                    return (
                      <li
                        key={item.sku.id}
                        className={`flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs ${
                          done
                            ? 'border-emerald-500/30 bg-emerald-950/20 text-slate-400 line-through'
                            : needsBuffer
                            ? 'border-amber-500/70 bg-amber-950/30 text-amber-200'
                            : 'border-slate-800 bg-slate-950/40 text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate font-medium">
                            {done ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            ) : needsBuffer ? (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            ) : (
                              <span
                                className="h-2 w-2 shrink-0 rounded-sm"
                                style={{ backgroundColor: item.sku.color }}
                              />
                            )}
                            <span className="truncate">
                              {item.qty}x {item.sku.name}
                            </span>
                          </div>
                          <div className="mt-0.5 pl-3.5 text-[10px] text-slate-400 font-mono-tabular">
                            {needsBuffer
                              ? 'Selisih Stok → ZONA CADANGAN'
                              : `Lokasi: RAK ${item.sku.rackId}`}
                          </div>
                        </div>

                        <span className="font-mono-tabular text-[11px] font-bold text-slate-300 shrink-0">
                          {item.pickedQty}/{item.qty}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>

      {/* Contextual Action Button */}
      <div className="border-t border-slate-700/80 bg-[#0B1528] p-3">
        <button
          type="button"
          onClick={onTriggerAction}
          disabled={!nearbyPrompt}
          className={`w-full rounded-lg px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
            nearbyPrompt
              ? 'bg-orange-500 text-slate-950 hover:bg-orange-400 active:scale-[0.99] cursor-pointer shadow-md shadow-orange-950/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {nearbyPrompt ? `${nearbyPrompt} (Spasi)` : 'Dekati Rak / Meja / Dock untuk Aksi'}
        </button>
      </div>
    </aside>
  );
};
