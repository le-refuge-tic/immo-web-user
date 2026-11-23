import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection, LegalTable, EmailContact } from './LegalLayout'
import { editeur, cadreLegal, MAJ } from '../../data/legal'
import { openConsentSettings } from '../../lib/analytics'

const NECESSAIRES: [string, string, string][] = [
  ['rg_token', 'Jeton d’accès à votre session', '15 minutes, renouvelé pendant la session ; supprimé à la déconnexion'],
  ['rg_refresh', 'Jeton de renouvellement de la session', 'Renouvelé à chaque utilisation ; supprimé et révoqué à la déconnexion'],
  ['rg_device_token', 'Reconnaissance de votre appareil de confiance, pour ne pas redemander le code de vérification (OTP) à chaque connexion', '30 jours ; révoqué en cas de changement de mot de passe ou de numéro de téléphone'],
  ['rg_user', 'Informations minimales d’affichage : identifiant, prénom, nom, rôle(s), photo de profil. Vos coordonnées (téléphone, email) ne sont pas enregistrées sur l’appareil.', 'Jusqu’à la déconnexion'],
  ['rg_active_role', 'Rôle actif choisi dans l’application', 'Jusqu’à la déconnexion'],
  ['post_login_redirect', 'Page à rouvrir après la connexion', 'Jusqu’à la fermeture de l’onglet'],
  ['rg_consent', 'Mémorisation de votre choix concernant la mesure d’audience', '6 mois'],
]

const PREFERENCES: [string, string][] = [
  ['rg_theme', 'Thème d’affichage choisi (clair, sombre ou réglage de l’appareil)'],
  ['rg_onboarded', 'Indique que le parcours d’accueil a déjà été vu'],
  ['rg_ville, rg_quartier', 'Ville et quartier indiqués à l’accueil, pour préremplir la recherche'],
  ['rg_objectif, rg_role_suggere', 'Objectif indiqué à l’accueil et rôle suggéré à l’inscription'],
  ['rg_push_dismissed', 'Mémorise que vous avez refusé l’invitation aux notifications'],
]

/** Politique de gestion des cookies et traceurs — texte officiel du 13 octobre 2026. */
export default function CookiesPage() {
  const modifier = (
    <button type="button" onClick={openConsentSettings} className="font-semibold text-primary dark:text-brand-soft hover:underline">
      Modifier mon choix
    </button>
  )
  return (
    <LegalLayout title="Politique de gestion des cookies et traceurs" miseAJour={MAJ.cookies} description="Traceurs utilisés par l’application web REFUGE, leurs finalités, leurs durées et comment gérer vos choix.">
      <LegalSection title="1. Objet de la présente politique">
        <p>
          La présente politique explique comment l’application web REFUGE, éditée par {editeur.nom}, utilise les cookies et
          autres traceurs lors de votre navigation, à quelles fins, pendant combien de temps, et comment vous pouvez exprimer ou
          modifier vos choix.
        </p>
        <p>
          On appelle « traceur » toute information enregistrée sur votre appareil (ordinateur, téléphone, tablette) lors de la
          consultation d’un service en ligne, et relue ensuite par ce service. Les cookies en sont un exemple ; le stockage
          local du navigateur (localStorage et sessionStorage) en est un autre. Elle complète la{' '}
          <Link to="/confidentialite">politique de confidentialité</Link> de REFUGE, qui décrit l’ensemble des traitements de
          données personnelles réalisés sur la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="2. Ce que REFUGE utilise">
        <LegalTable entetes={['Élément', 'Sur REFUGE']} lignes={[
          ['Cookies publicitaires', 'Aucun'],
          ['Cookies déposés par l’application', 'Aucun : l’application utilise uniquement le stockage local de votre navigateur'],
          ['Traceurs nécessaires au fonctionnement', 'Oui : session, sécurité de connexion, mémorisation de votre choix (section 3)'],
          ['Traceurs de préférences', 'Oui : thème d’affichage et choix faits à l’accueil (section 4)'],
          ['Mesure d’audience', 'Umami Cloud, sans cookie, uniquement si vous l’acceptez (section 5)'],
        ]} />
      </LegalSection>

      <LegalSection title="3. Traceurs strictement nécessaires">
        <p>
          Ces traceurs sont indispensables au fonctionnement de l’application et à la sécurité de votre compte. Ils ne
          nécessitent pas votre consentement et ne servent à aucune autre fin.
        </p>
        <LegalTable entetes={['Nom', 'Finalité', 'Durée de conservation']} lignes={NECESSAIRES} />
      </LegalSection>

      <LegalSection title="4. Traceurs de préférences">
        <p>
          Ces traceurs mémorisent des choix que vous faites vous-même dans l’application, afin de vous éviter de les refaire à
          chaque visite. Ils restent sur votre appareil et ne sont transmis à aucun tiers. Ils sont conservés jusqu’à
          l’effacement des données du navigateur.
        </p>
        <LegalTable entetes={['Nom', 'Finalité']} lignes={PREFERENCES} />
      </LegalSection>

      <LegalSection title="5. Mesure d’audience">
        <p>
          Avec votre accord, REFUGE mesure la fréquentation de l’application à l’aide du service Umami Cloud (Umami Software,
          Inc.), afin d’en comprendre l’usage et de l’améliorer.
        </p>
        <ul>
          <li><strong>Sans cookie</strong> : Umami ne dépose aucun cookie sur votre appareil ;</li>
          <li><strong>Uniquement avec votre consentement</strong> : le service n’est chargé qu’après que vous avez cliqué sur « Accepter » ;</li>
          <li><strong>Respect du réglage « Ne pas suivre »</strong> : si votre navigateur l’active, aucune mesure n’est effectuée ;</li>
          <li>
            <strong>Sans donnée d’identification</strong> : les événements mesurés (recherche, consultation d’une annonce, ajout
            d’un favori, demande et paiement d’une visite, inscription, publication d’une annonce) ne contiennent ni nom, ni
            téléphone, ni identifiant ;
          </li>
          <li><strong>Localisation des données</strong> : Union européenne.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Gérer vos choix">
        <p>
          Lors de votre première visite, un bandeau « Cookies et mesure d’audience » vous permet d’accepter ou de refuser la
          mesure d’audience. Les boutons « Refuser » et « Accepter » ont la même importance : refuser est aussi simple
          qu’accepter, et n’empêche pas d’utiliser l’application.
        </p>
        <p>Votre choix est conservé 6 mois, puis le bandeau vous est proposé à nouveau. Vous pouvez le modifier à tout moment :</p>
        <ul>
          <li>depuis votre profil, rubrique « Cookies et mesure d’audience » ;</li>
          <li>ici même : {modifier}.</li>
        </ul>
        <p>Si vous retirez votre consentement, la mesure d’audience s’arrête immédiatement, sans qu’il soit nécessaire de recharger la page.</p>
        <p>
          Vous pouvez aussi effacer les données enregistrées par l’application depuis les réglages de votre navigateur. Dans ce
          cas, vous serez déconnecté, le code de vérification (OTP) vous sera redemandé à la prochaine connexion, et vos
          préférences seront réinitialisées.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          Pour toute question relative à la présente politique ou à vos données personnelles : <EmailContact /> ·{' '}
          {editeur.telephones.join(' / ')}. Vous disposez également du droit d’introduire une réclamation auprès de
          l’Autorité de Protection des Données Personnelles (APDP) :{' '}
          <a href={`mailto:${cadreLegal.apdp.email}`}>{cadreLegal.apdp.email}</a> ·{' '}
          <a href={cadreLegal.apdp.site} target="_blank" rel="noreferrer">www.apdp.bj</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
