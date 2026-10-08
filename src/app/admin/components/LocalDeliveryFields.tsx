"use client"
export default function LocalDeliveryFields({ date, start, end, onDate, onStart, onEnd }: {
  date: string; start: string; end: string; onDate: (value: string) => void; onStart: (value: string) => void; onEnd: (value: string) => void
}) {
  return <div className="space-y-3 rounded-xl border border-[#ead5cf] bg-[#faf5f2] p-4">
    <p className="text-xs leading-relaxed text-slate-600">Sipariş Mağaza ekibi tarafından bizzat teslim edilecek. Planı kaydettiğinizde müşteriye tarih ve saat aralığı e-postayla bildirilir.</p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label className="text-xs font-medium text-slate-700">Teslimat tarihi<input id="local-delivery-date" type="date" required value={date} onChange={e => onDate(e.target.value)} className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white p-2.5"/></label>
      <label className="text-xs font-medium text-slate-700">Başlangıç saati<input type="time" required value={start} onChange={e => onStart(e.target.value)} className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white p-2.5"/></label>
      <label className="text-xs font-medium text-slate-700">Bitiş saati<input type="time" required value={end} onChange={e => onEnd(e.target.value)} className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white p-2.5"/></label>
    </div><p className="text-[11px] text-slate-500">Saatler Türkiye saatine göredir.</p>
  </div>
}
