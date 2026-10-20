import { useState } from 'react'
import { ModalSheet } from '../../../components/ui/ModalSheet'

/** Couleurs du thème passées au sélecteur de créneau (défini hors du fil pour ne pas se remonter à chaque message reçu). */
export interface SlotColors { menuBg: string; menuBdr: string; tp: string; tm: string; inpFieldBg: string; inpFieldBdr: string }

export function SlotModal({ onConfirm, onCancel, c }: { onConfirm: (iso: string) => void; onCancel: () => void; c: SlotColors }) {
  const tom = new Date(Date.now() + 86400000)
  const [date, setDate] = useState(tom.toISOString().slice(0, 10))
  const [time, setTime] = useState('09:00')
  const { menuBg, menuBdr, tp, tm, inpFieldBg, inpFieldBdr } = c
  return (
    <ModalSheet open onClose={onCancel} label="Proposer un créneau" placement="center" panelClassName="w-full max-w-xs" backdropOpacity={0.55}>
      <div className="rounded-3xl p-5 w-full anim-scale-in"
        style={{ background: menuBg, border: `1px solid ${menuBdr}`, boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        <p className="font-bold text-[15px] mb-4" style={{ color: tp }}>Proposer un créneau</p>
        <div className="space-y-3">
          <div>
            <label htmlFor="slot-date" className="text-caption font-bold uppercase tracking-wider mb-1.5 block" style={{ color: tm }}>Date</label>
            <input id="slot-date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp }} />
          </div>
          <div>
            <label htmlFor="slot-time" className="text-caption font-bold uppercase tracking-wider mb-1.5 block" style={{ color: tm }}>Heure</label>
            <input id="slot-time" type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp }} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ border: `1px solid ${menuBdr}`, color: tp }}>Annuler</button>
          <button onClick={() => onConfirm(new Date(`${date}T${time}`).toISOString())} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer" style={{ background: 'linear-gradient(135deg,#4160F2,#7B4BFF)' }}>Confirmer</button>
        </div>
      </div>
    </ModalSheet>
  )
}
