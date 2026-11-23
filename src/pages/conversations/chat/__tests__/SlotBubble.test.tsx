import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SlotBubble, type EtatPaiementVisite } from '../SlotBubble'
import type { ChatMessage } from '../../../../types/chat-ui'

const creneauConfirme = {
  id: 1,
  sender_id: 2,
  created_at: '2026-11-19T17:41:00Z',
  metadata: { status: 'accepted', proposed_at: '2026-11-20T11:00:00Z' },
} as unknown as ChatMessage

const rendre = (paiement: EtatPaiementVisite | undefined) => renderToStaticMarkup(
  <SlotBubble m={creneauConfirme} userId={1} isDark tp="#fff" tm="#999" bienId={43} isClientRole
    paying={false} paiement={paiement} onRepondre={() => {}} onPayer={() => {}} />,
)

describe('SlotBubble — paiement d\'un créneau confirmé', () => {
  it('propose « Payer maintenant » quand les frais restent dus', () => {
    expect(rendre('du')).toContain('Payer maintenant')
  })

  it('n\'affiche plus le bouton pour une visite déjà payée', () => {
    const html = rendre('paye')
    expect(html).not.toContain('Payer maintenant')
    expect(html).toContain('Frais de visite payés')
  })

  it('n\'affiche aucun bouton tant que l\'état est inconnu ou que la visite est gratuite', () => {
    expect(rendre(undefined)).not.toContain('Payer maintenant')
    expect(rendre('gratuit')).not.toContain('Payer maintenant')
  })
})
