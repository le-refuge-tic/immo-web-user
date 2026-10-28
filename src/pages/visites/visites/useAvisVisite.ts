import { useState } from 'react'
import { visitesApi } from '../../../api/visitesApi'
import { apiMessage } from '../../../utils/apiMessage'
import type { Visite } from '../../../types/api'

// Avis après visite : état de la modale, validation et envoi.
export function useAvisVisite({ loadVisites }: { loadVisites: () => void }) {
  const [showFeedback, setShowFeedback] = useState<Visite | null>(null)
  const [feedbackNote, setFeedbackNote] = useState<number | null>(null)
  const [feedbackTags, setFeedbackTags] = useState<string[]>([])
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackDone, setFeedbackDone] = useState(false)

  const openFeedback = (v: Visite) => {
    setShowFeedback(v)
    setFeedbackNote(null)
    setFeedbackTags([])
    setFeedbackComment('')
    setFeedbackError('')
    setFeedbackDone(false)
  }

  const needsTags = feedbackNote !== null && feedbackNote <= 3
  const canSubmitFeedback = feedbackNote !== null &&
    (feedbackNote > 3 || feedbackTags.length > 0 || feedbackComment.trim().length > 0)

  const toggleFeedbackTag = (tag: string) =>
    setFeedbackTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleSubmitFeedback = async () => {
    if (!showFeedback || !canSubmitFeedback) return
    setFeedbackSaving(true)
    setFeedbackError('')
    try {
      await visitesApi.donnerFeedback(showFeedback.id, {
        note: feedbackNote!,
        tags: feedbackTags.length ? feedbackTags : undefined,
        texte: feedbackComment.trim() || undefined,
      })
      setFeedbackDone(true)
      loadVisites()
    } catch (err: unknown) {
      setFeedbackError(apiMessage(err) || "Impossible d'envoyer l'avis")
    }
    setFeedbackSaving(false)
  }

  return {
    showFeedback, setShowFeedback, feedbackNote, setFeedbackNote, feedbackTags, setFeedbackTags,
    feedbackComment, setFeedbackComment, feedbackSaving, feedbackError, feedbackDone,
    needsTags, canSubmitFeedback, openFeedback, toggleFeedbackTag, handleSubmitFeedback,
  }
}
