const STATUT_LABELS: any = {
  en_attente: 'En attente',
  active:     'Active',
  revoquee:   'Révoquée',
  expiree:    'Expirée',
  refusee:    'Refusée',
};

const STATUT_COLORS: any = {
  en_attente: '#D97706',
  active:     '#16A34A',
  revoquee:   '#DC2626',
  expiree:    '#64748B',
  refusee:    '#DC2626',
};

export default function DelegationStatutBadge({ statut }: { statut: any }) {
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
