const STATUT_LABELS: any = {
  actif:   'Actif',
  resilie: 'Résilié',
  expire:  'Expiré',
};

const STATUT_COLORS: any = {
  actif:   '#16A34A',
  resilie: '#DC2626',
  expire:  '#64748B',
};

export default function ContratStatutBadge({ statut }: { statut: any }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: (STATUT_COLORS[statut] ?? '#64748B') + '18',
      color: STATUT_COLORS[statut] ?? '#64748B',
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}
