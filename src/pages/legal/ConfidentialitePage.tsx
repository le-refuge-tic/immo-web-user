import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection, LegalTable, EmailContact, RecepisseApdp } from './LegalLayout'
import { editeur, cadreLegal, destinataires, responsableTraitement, MAJ } from '../../data/legal'
import { openConsentSettings } from '../../lib/analytics'

const DONNEES: [string, string][] = [
  ['Compte et identité', 'Nom, prénom, civilité, numéro de téléphone, adresse email, numéro WhatsApp, rôle choisi (prospect ou propriétaire), mot de passe (conservé sous forme hachée)'],
  ['Connexion et sécurité', 'Jeton de session, jeton d’appareil de confiance, code de vérification à usage unique (OTP)'],
  ['Biens immobiliers', 'Adresse, ville, quartier, coordonnées GPS, prix et conditions financières (loyer ou prix de vente, avances, cautions, frais de visite, commission d’agence), caractéristiques du bien'],
  ['Coordonnées des propriétaires', 'Nom, prénom, téléphone et email du propriétaire saisis par un commercial, y compris lorsque le propriétaire n’est pas inscrit sur la plateforme'],
  ['Visites', 'Bien concerné, date et heure souhaitées, note de 1 à 5, commentaire, signalement d’un problème météo'],
  ['Paiements', 'Référence interne, statut et identifiant de transaction, montant, moyen de paiement, numéro de téléphone utilisé pour le paiement. Aucun numéro de carte bancaire n’est conservé par REFUGE.'],
  ['Retraits du portefeuille', 'Numéro Mobile Money de retrait et son réseau (MTN ou Moov), montant, statut du retrait et, en cas d’échec, son motif'],
  ['Contrats de bail et loyers', 'Bien et locataire concernés, dates de début et de fin, loyer mensuel, jour d’échéance, mois prépayés, montant d’intégration, notes ou conditions particulières'],
  ['Messagerie interne', 'Messages échangés, plaintes et signalements'],
  ['Préférences de recherche', 'Ville, budget maximum, surface minimum, nombre de chambres, nombre de voisins, calme requis, animaux admis, jardin, accessibilité PMR, contraintes libres'],
  ['Notifications', 'Identifiant d’abonnement aux notifications du navigateur'],
  ['Mesure d’audience', 'Statistiques de fréquentation, uniquement si vous y consentez'],
]

const FINALITES: [string, string][] = [
  ['Création et gestion du compte utilisateur, sécurisation de l’accès par double authentification', 'Compte et identité ; connexion et sécurité'],
  ['Publication et gestion des annonces de biens immobiliers', 'Biens immobiliers ; coordonnées des propriétaires'],
  ['Organisation des visites et recueil des retours de visite', 'Visites'],
  ['Paiement des visites, des loyers et des frais d’intégration ; rechargement du portefeuille électronique', 'Paiements'],
  ['Versement des retraits du portefeuille par FedaPay vers le compte Mobile Money indiqué', 'Retraits du portefeuille'],
  ['Établissement et suivi des contrats de bail et des loyers', 'Contrats de bail et loyers'],
  ['Échanges entre utilisateurs par la messagerie interne ; traitement des plaintes et signalements', 'Messagerie interne'],
  ['Enregistrement des préférences de recherche', 'Préférences de recherche'],
  ['Envoi de notifications', 'Notifications'],
  ['Mesure d’audience, uniquement avec votre consentement', 'Mesure d’audience'],
]

const DROITS = [
  'droit d’accès aux informations collectées', 'droit d’interrogation', 'droit de modification', 'droit de rectification',
  'droit à la portabilité', 'droit d’opposition au traitement', 'droit de suppression de données', 'droit à l’oubli',
  'droit à réparation',
]

/** Politique de confidentialité — texte officiel du 6 novembre 2026 (article 415 du code du numérique). */
export default function ConfidentialitePage() {
  const contacts = <><EmailContact /> · {editeur.telephones.join(' / ')}</>
  return (
    <LegalLayout title="Politique de confidentialité" miseAJour={MAJ.confidentialite} description="Données personnelles traitées par REFUGE, finalités, destinataires, durées de conservation et vos droits.">
      <p>
        La présente politique de confidentialité est fondée sur l’article 415 figurant au livre cinquième du code du numérique
        relatif à la protection des données à caractère personnel. Elle mentionne la preuve de l’accomplissement des
        formalités préalables auprès de l’Autorité de Protection des Données Personnelles (APDP) et vous aide à comprendre
        quelles informations nous collectons et traitons dans notre entreprise {editeur.nom}, éditrice de la plateforme REFUGE,
        les finalités visées ainsi que la politique de management mise en place pour respecter la législation en vigueur en
        matière de protection des données personnelles et de la vie privée en République du Bénin.
      </p>
      <p>Veuillez lire attentivement cette politique de confidentialité qui nous engage.</p>

      <LegalSection title="1. Responsable du traitement">
        <LegalTable lignes={[
          ['Responsable du traitement', `${editeur.nom} (${editeur.formeJuridique}), éditrice de la plateforme REFUGE`],
          ['Représentant légal', `${responsableTraitement.nom}, responsable du traitement`],
          ['RCCM', editeur.rccm],
          ['Adresse', editeur.adresse],
          ['Contact téléphonique', responsableTraitement.telephone],
          ['Adresse email', <a key="e" href={`mailto:${responsableTraitement.email}`}>{responsableTraitement.email}</a>],
        ]} />
      </LegalSection>

      <LegalSection title="2. Formalités préalables">
        <p>Le traitement est poursuivi conformément au récépissé délivré par l’Autorité de Protection des Données Personnelles (APDP).</p>
        <p><RecepisseApdp /></p>
        <p>Vous pouvez contacter cette autorité et vérifier les termes de la présente par le biais des coordonnées suivantes :</p>
        <LegalTable lignes={[
          ['Autorité', cadreLegal.apdp.nom],
          ['Siège', cadreLegal.apdp.siege],
          ['Téléphone', cadreLegal.apdp.telephone],
          ['Email · Site', <><a key="m" href={`mailto:${cadreLegal.apdp.email}`}>{cadreLegal.apdp.email}</a> · <a key="s" href={cadreLegal.apdp.site} target="_blank" rel="noreferrer">www.apdp.bj</a></>],
        ]} />
      </LegalSection>

      <LegalSection title="3. Les données personnelles objet du traitement">
        <LegalTable entetes={['Catégorie', 'Données collectées']} lignes={DONNEES} />
        <p>
          <strong>Caractère obligatoire des réponses.</strong> Pour créer un compte, le nom, le prénom, le mot de passe, le rôle
          et le numéro de téléphone sont obligatoires : sans eux, le compte ne peut pas être créé. La civilité, l’adresse email
          et le numéro WhatsApp sont facultatifs à l’inscription.
        </p>
      </LegalSection>

      <LegalSection title="4. Les opérations effectuées">
        <p>
          {editeur.nom} ne collecte des informations personnelles relatives à ses utilisateurs (prospects, propriétaires,
          commerciaux, superviseurs et administrateurs) et aux propriétaires dont les coordonnées sont saisies par un
          commercial, que pour le besoin exclusif de services proposés par elle-même.
        </p>
        <p>
          Les informations recueillies font l’objet des opérations suivantes : la collecte, l’enregistrement, l’organisation,
          la conservation, la consultation, l’utilisation, la modification, la communication par transmission et l’effacement.
          Il s’agit d’un traitement électronique, destiné à l’atteinte des finalités ci-dessous.
        </p>
      </LegalSection>

      <LegalSection title="5. Les finalités des traitements">
        <LegalTable entetes={['Finalité', 'Données concernées']} lignes={FINALITES} />
        <p>
          Chaque traitement correspond à une finalité précise et unique. Dans l’hypothèse où un seul et même traitement
          pourrait servir plusieurs finalités, votre consentement sera recueilli distinctement pour chacune d’elles.
        </p>
      </LegalSection>

      <LegalSection title="6. Destinataires, communication et transfert">
        <p>
          Ont accès aux données : la direction (responsable du traitement), pour les données nécessaires à l’exercice de ses
          fonctions, et le service informatique (développeurs de la plateforme), pour les données nécessaires à
          l’exploitation, à la maintenance et à la sécurité de la plateforme. Les données sont également communiquées aux
          sous-traitants suivants :
        </p>
        <LegalTable entetes={['Destinataire', 'Rôle et données transmises', 'Pays de conservation']} lignes={destinataires.map(d => [d.nom, d.role, d.pays])} />
      </LegalSection>

      <LegalSection title="7. Durée du traitement, conservation et stockage">
        <LegalTable entetes={['Données', 'Durée de conservation']} lignes={[
          ['Données de navigation et de connexion', '1 an après la suppression du compte'],
          ['Données de profil et transactions financières', '5 ans à compter de la clôture du compte, en raison des obligations de régulation financière applicables dans la zone UEMOA/BCEAO'],
          ['Compte inactif depuis plus de 3 ans', 'Suppression du compte après un préavis par email ou par SMS ; les données sont ensuite conservées pour les durées ci-dessus'],
          ['Compte dont vous demandez la suppression', 'Compte désactivé pendant 7 jours, délai pendant lequel vous pouvez annuler la suppression en vous reconnectant ; le compte est ensuite supprimé et les données restantes sont conservées pour les durées ci-dessus'],
        ]} />
        <p>
          Les données sont conservées sous la forme de dossier électronique : en Allemagne (Francfort) pour la base de données
          et l’API ; aux États-Unis pour l’hébergement de l’application web ; en Europe de l’Ouest pour les sauvegardes et
          journaux d’activité (Cloudflare R2) ; dans l’Union européenne (Francfort) pour la centralisation des journaux
          (Axiom) ; dans l’Union européenne (Belgique et Pays-Bas) pour les notifications de l’application Android
          (Firebase). Après les durées ci-dessus, vos données sont supprimées.
        </p>
        <p>Pour plus d’informations sur les durées de conservation : {contacts}.</p>
      </LegalSection>

      <LegalSection title="8. Les droits des personnes concernées">
        <p>La loi vous donne sur vos données personnelles les droits suivants :</p>
        <ul>
          {DROITS.map(d => <li key={d}>{d} ;</li>)}
          <li>
            droit de retirer votre consentement à tout moment, notamment pour la mesure d’audience, via{' '}
            <button type="button" onClick={openConsentSettings} className="font-semibold text-primary dark:text-brand-soft hover:underline">
              « Gérer les cookies »
            </button>.
          </li>
        </ul>
        <p>
          Vous pouvez consulter la définition de ces droits sur le site de l’APDP :{' '}
          <a href={cadreLegal.apdp.site} target="_blank" rel="noreferrer">www.apdp.bj</a>. Vous pouvez les exercer en écrivant
          par e-mail à la personne chargée du suivi des réclamations, {responsableTraitement.nom}, responsable du traitement :{' '}
          <EmailContact />. Nous garantissons une réponse dans un délai d’un (01) mois à compter de la réception de votre
          demande.
        </p>
        <p>
          Vous pouvez aussi demander vous-même la suppression de votre compte depuis l’application. La suppression devient
          effective 7 jours après la demande : pendant ce délai, le compte ne peut plus être utilisé, son numéro de téléphone
          ne peut pas servir à créer un nouveau compte, et vous pouvez annuler la suppression en vous reconnectant avec votre
          numéro et le code reçu par SMS.
        </p>
      </LegalSection>

      <LegalSection title="9. Plaintes">
        <p>Vous avez le droit de déposer une plainte auprès de l’Autorité de Protection des Données Personnelles. La plainte est :</p>
        <ul>
          <li>déposée au siège de l’institution : Rue 6.076 Aïdjèdo, Cotonou ;</li>
          <li>adressée (mail uniquement) à l’adresse : <a href={`mailto:${cadreLegal.apdp.email}`}>{cadreLegal.apdp.email}</a>.</li>
        </ul>
        <p>Ceci est sans préjudice d’un recours devant un tribunal compétent.</p>
      </LegalSection>

      <LegalSection title="10. Pour en savoir plus">
        <p>
          Pour toute autre question sur le traitement de vos données personnelles, contactez le responsable du traitement :{' '}
          {contacts}. L’usage des traceurs est détaillé dans la <Link to="/cookies">politique cookies</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
