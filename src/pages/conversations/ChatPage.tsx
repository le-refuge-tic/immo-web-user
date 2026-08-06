import { useParams, useNavigate } from 'react-router-dom'
import ChatThread from './ChatThread'

/** Route /conversations/:id — délègue tout à ChatThread, qui est aussi
 *  réutilisé en mode embarqué (ex : onglet Messages du dashboard propriétaire). */
export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  return (
    <div className="h-dvh md:h-full">
      <ChatThread convId={Number(id)} onBack={() => navigate('/conversations')} />
    </div>
  )
}
