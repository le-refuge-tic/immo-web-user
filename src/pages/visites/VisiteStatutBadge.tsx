const STATUT_LABELS: any = {
  en_attente:      'En attente',
  contre_proposee: 'Contre-proposée',
  confirmee:       'Confirmée',
  effectuee:       'Effectuée',
  annulee:         'Annulée',
};

const STATUT_COLORS: any = {
  en_attente:      '#2563EB',
  contre_proposee: '#D97706',
  confirmee:       '#16A34A',
  effectuee:       '#0891B2',
  annulee:         '#DC2626',
};

export default function VisiteStatutBadge({ statut }: { statut: any }) {
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
