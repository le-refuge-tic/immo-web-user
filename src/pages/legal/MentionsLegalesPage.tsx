import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection } from './LegalLayout'
import { editeur, cadreLegal, prestataires } from '../../data/legal'

export default function MentionsLegalesPage() {
  const hebergeurs = prestataires.filter(p => p.role.startsWith('hébergement') || p.nom === 'Supabase')
  return (
    <LegalLayout title="Mentions légales" description="Éditeur, hébergement et informations légales de la plateforme immobilière REFUGE.">
      <p>
        Conformément à la {cadreLegal.loi}, les informations suivantes sont portées à la connaissance des utilisateurs
        de la plateforme REFUGE (site web et application mobile).
      </p>

      <LegalSection title="Éditeur">
        <ul>
          <li>Dénomination : <strong>{editeur.nom}</strong></li>
          <li>Forme juridique : {editeur.formeJuridique}</li>
          <li>Siège : {editeur.siege}</li>
          <li>Immatriculation (RCCM) : {editeur.rccm}</li>
          <li>Identifiant fiscal unique (IFU) : {editeur.ifu}</li>
        </ul>
      </LegalSection>

      <LegalSection title="Contact">
        <ul>
          <li>Email : <span className="select-all text-text-dark font-medium">{editeur.email}</span></li>
          <li>Téléphone : {editeur.telephones.join(' · ')}</li>
        </ul>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>{editeur.directeurPublication}</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <ul>
          {hebergeurs.map(h => (
            <li key={h.nom}>{h.nom} : {h.role}{h.pays ? ` (${h.pays})` : ''}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Les traitements de données réalisés par la plateforme sont soumis au contrôle de
          l’{cadreLegal.apdp.nom}. Leur détail et vos droits figurent dans la{' '}
          <Link to="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Les éléments de la plateforme (logo, textes, interface) appartiennent à {editeur.nom}, sauf mention contraire.
          Les annonces et photos publiées restent sous la responsabilité de leurs auteurs. Toute reproduction sans
          autorisation préalable est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes mentions sont régies par le droit béninois. Tout litige relatif à l’utilisation de la plateforme
          relève de la compétence des juridictions béninoises.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
