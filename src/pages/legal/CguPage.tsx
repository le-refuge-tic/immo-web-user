import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection, LegalTable, EmailContact } from './LegalLayout'
import { editeur, MAJ } from '../../data/legal'

const DEFINITIONS: [string, string][] = [
  ['Plateforme', 'L’application REFUGE (web et mobile) et l’ensemble de ses services.'],
  ['Utilisateur', 'Toute personne disposant d’un compte sur la Plateforme.'],
  ['Prospect', 'Utilisateur qui cherche à louer ou à acheter un bien.'],
  ['Propriétaire', 'Utilisateur qui publie et gère ses biens immobiliers, ou qui met en vente un bien.'],
  ['Locataire', 'Utilisateur qui accède à son logement et paie ses loyers via la Plateforme. Ce rôle est obtenu en rejoignant un bien à l’aide d’un code d’invitation communiqué par le propriétaire.'],
  ['Commercial, Superviseur, Administrateur', `Membres de l’équipe de ${editeur.nom}, disposant chacun d’un rôle unique.`],
  ['Bien', 'Logement, maison, terrain ou boutique publié sur la Plateforme.'],
  ['Visite', 'Rendez-vous organisé via la Plateforme pour visiter un bien.'],
  ['Intégration', 'Entrée du locataire dans le bien, comprenant le paiement des sommes d’entrée et l’acceptation du contrat de bail.'],
  ['Mandat de gestion', 'Mandat signé électroniquement dans l’application par le propriétaire, qui autorise REFUGE à diffuser son bien, à encaisser les sommes pour son compte et qui fixe les taux de commission.'],
  ['Portefeuille', 'Solde électronique de l’utilisateur sur la Plateforme.'],
]

const REMBOURSEMENTS: [string, string][] = [
  ['Annulation par REFUGE ou par le propriétaire', 'Intégral'],
  ['Annulation par le prospect au moins 24 heures avant la visite', 'Intégral ; si le prospect reporte la visite à un autre jour, il n’a rien à payer de plus'],
  ['Annulation par le prospect moins de 24 heures et au moins 3 heures avant la visite', '70 %'],
  ['Annulation par le prospect moins de 3 heures et au moins 1 heure avant la visite', '50 %'],
  ['Annulation par le prospect moins de 1 heure avant la visite', 'Aucun remboursement'],
  ['Absence du prospect, ou bien ni loué ni acheté après la visite', 'Aucun remboursement'],
]

const COMMISSIONS: [string, string, string][] = [
  ['Mise en relation pour une location', '50 % d’un mois de loyer, dont sont déduits les frais de visite déjà payés', 'Locataire'],
  ['Gestion et encaissement des loyers', '8 % de chaque loyer mensuel encaissé', 'Propriétaire'],
  ['Vente immobilière (terrain, maison, villa…)', 'Entre 3 % et 5 % du prix de vente, ou tarif forfaitaire dégressif selon la valeur du bien, fixé dans le mandat', 'Vendeur'],
  ['Guest houses et salles de fêtes', 'Entre 8 % et 15 % du montant total de la réservation, fixé dans le mandat', 'Selon le mandat'],
]

/** Conditions générales d'utilisation — texte officiel du 6 novembre 2026. */
export default function CguPage() {
  const telephones = editeur.telephones.join(' / ')
  return (
    <LegalLayout title="Conditions générales d’utilisation" miseAJour={MAJ.cgu} description="Accès, services, visites, paiements, commissions et responsabilités sur la plateforme REFUGE.">
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions générales d’utilisation (ci-après « CGU ») définissent les modalités d’accès et
          d’utilisation de la plateforme REFUGE, éditée par {editeur.nom}.
        </p>
        <p>
          REFUGE met en relation des personnes à la recherche d’un logement ou d’un bien avec des propriétaires. Elle permet de
          publier et de rechercher des biens immobiliers, d’organiser des visites, de conclure et de suivre des contrats de
          bail, de payer les sommes correspondantes et d’échanger par une messagerie interne. Elle est accessible par une
          application web et par une application mobile Android.
        </p>
      </LegalSection>

      <LegalSection title="2. Éditeur">
        <LegalTable lignes={[
          ['Éditeur', `${editeur.nom} (${editeur.formeJuridique})`],
          ['RCCM', editeur.rccm],
          ['IFU', editeur.ifu],
          ['Adresse', editeur.adresse],
          ['Téléphone', telephones],
          ['Email', <EmailContact key="e" />],
          ['Directeur de la publication', editeur.directeurPublication],
        ]} />
      </LegalSection>

      <LegalSection title="3. Définitions">
        <LegalTable lignes={DEFINITIONS} />
      </LegalSection>

      <LegalSection title="4. Acceptation des CGU">
        <p>
          L’utilisation de la Plateforme suppose l’acceptation pleine et entière des présentes CGU. Lors de son inscription,
          l’utilisateur coche la case « J’accepte les conditions d’utilisation et la politique de confidentialité ».
        </p>
      </LegalSection>

      <LegalSection title="5. Accès et inscription">
        <p>
          L’inscription et l’utilisation de la Plateforme sont gratuites. Seules sont payantes les sommes affichées avant chaque
          paiement (frais de visite, intégration, loyers, commissions).
        </p>
        <p>
          La création d’un compte est réservée aux personnes âgées d’au moins 18 ans. L’utilisateur renseigne obligatoirement
          son nom, son prénom, un mot de passe, son rôle et son numéro de téléphone. La civilité, l’adresse email et le numéro
          WhatsApp sont facultatifs.
        </p>
        <p>
          Un même compte peut cumuler les rôles de prospect et de propriétaire. Les rôles de commercial, de superviseur et
          d’administrateur sont réservés à l’équipe de {editeur.nom}.
        </p>
      </LegalSection>

      <LegalSection title="6. Sécurité du compte">
        <p>
          L’utilisateur est responsable de la confidentialité de son mot de passe. La connexion est sécurisée par un code de
          vérification à usage unique (OTP) envoyé par SMS. Après une vérification réussie, l’appareil peut être reconnu comme
          appareil de confiance pendant 30 jours. Un code de vérification est également exigé pour les actions sensibles, et
          le changement de numéro de téléphone passe par une procédure de vérification dédiée.
        </p>
        <p>
          L’utilisateur informe sans délai {editeur.nom} de toute utilisation non autorisée de son compte à l’adresse{' '}
          <EmailContact />.
        </p>
      </LegalSection>

      <LegalSection title="7. Publication et validation des biens">
        <p>
          Les propriétaires peuvent publier des biens. Un commercial peut également publier un bien pour le compte d’un
          propriétaire, en saisissant ses coordonnées. Avant toute diffusion d’un bien ou toute gestion de loyers, le
          propriétaire signe électroniquement le mandat de gestion dans l’application.
        </p>
        <p>
          Chaque annonce précise notamment la localisation du bien (adresse, ville, quartier, coordonnées GPS), son prix (loyer
          mensuel ou prix de vente), les conditions financières et ses caractéristiques. Le propriétaire garantit l’exactitude
          des informations publiées et la disponibilité du bien.
        </p>
        <p>
          Tout bien proposé par un commercial ou un propriétaire fait l’objet d’une vérification physique, puis d’une
          validation sur l’interface d’administration de REFUGE, avant sa publication.
        </p>
      </LegalSection>

      <LegalSection title="8. Visites">
        <p>
          La demande de visite est réservée aux prospects et aux locataires. Le prospect choisit une date et une heure ; le
          propriétaire peut proposer une autre date.
        </p>
        <h3>8.1 Frais de visite</h3>
        <p>
          Pour les biens en location, des frais de visite de 1 000 FCFA sont demandés (500 FCFA pendant les périodes de
          promotion). Ils garantissent la visite du prospect et couvrent les frais de déplacement du commercial de{' '}
          {editeur.nom} qui l’accompagne.
        </p>
        <ul>
          <li>Si le prospect loue le bien, les frais de visite lui sont restitués : ils sont déduits de la commission de mise en relation.</li>
          <li>
            Si le prospect ne loue pas le bien visité, il peut effectuer deux visites supplémentaires le même jour sans nouveau
            paiement. Les frais de visite restent alors acquis à {editeur.nom}.
          </li>
          <li>Toute nouvelle visite, pour le même bien ou pour un autre, au-delà de ces visites, donne lieu à un nouveau paiement.</li>
        </ul>
        <h3>8.2 Annulation et remboursement</h3>
        <LegalTable entetes={['Situation', 'Remboursement des frais de visite']} lignes={REMBOURSEMENTS} />
        <p>Le remboursement est effectué sous 7 jours à compter de la date d’annulation.</p>
        <p>
          Après la visite, le prospect peut attribuer une note de 1 à 5 et laisser un commentaire. Lorsqu’une visite n’a pas eu
          lieu, l’utilisateur peut proposer de la reprogrammer via la messagerie.
        </p>
      </LegalSection>

      <LegalSection title="9. Intégration et contrat de bail">
        <p>
          Après une visite concluante, le prospect peut procéder à son intégration. Le montant de l’intégration comprend les
          mois d’avance fixés pour le bien (deux mois par défaut), les mois de loyer prépayés, ainsi que les cautions eau et
          électricité, le cas échéant. L’intégration est validée après le paiement et l’acceptation du contrat de bail dans
          l’application.
        </p>
        <p>Le modèle de contrat de bail proposé dans l’application prévoit notamment :</p>
        <ul>
          <li>un contrat à durée indéterminée, à usage exclusivement résidentiel ;</li>
          <li>un loyer payable à la date d’échéance fixée dans le contrat, via l’application REFUGE ;</li>
          <li>une mise en demeure en cas de retard de paiement supérieur à 10 jours ;</li>
          <li>une résiliation de plein droit en cas de non-paiement pendant plus de deux mois consécutifs ou de violation grave ;</li>
          <li>la restitution du dépôt de garantie dans un délai de 30 jours après la remise des clés, déduction faite des sommes dues.</li>
        </ul>
        <p>
          REFUGE n’est pas partie au contrat de bail, qui lie exclusivement le propriétaire et le locataire. Lorsqu’il encaisse
          les loyers et gère les fonds, REFUGE agit en qualité de mandataire du propriétaire, en vertu du mandat de gestion signé.
        </p>
      </LegalSection>

      <LegalSection title="10. Commissions">
        <LegalTable entetes={['Service', 'Commission', 'À la charge de']} lignes={COMMISSIONS} />
        <p>
          Pour les ventes, REFUGE intervient en qualité d’apporteur d’affaires et d’intermédiaire de mise en relation. Les taux
          applicables à chaque bien sont fixés dans le mandat de gestion signé par le propriétaire ou le vendeur, et affichés
          avant tout paiement.
        </p>
      </LegalSection>

      <LegalSection title="11. Paiements">
        <p>
          Les paiements (frais de visite, intégration, loyers, commissions) sont traités par FedaPay, par Mobile Money ou par
          carte bancaire. Pour un paiement par Mobile Money, une demande est envoyée sur le téléphone de l’utilisateur, qui doit
          la valider dans les 3 minutes.
        </p>
        <p>
          Aucun numéro de carte bancaire n’est conservé par REFUGE. Un reçu est disponible pour chaque paiement validé, et
          l’historique des paiements est consultable dans l’application. Lorsque plusieurs mois de loyer sont payés en une
          fois, l’échec d’un paiement n’annule pas ceux déjà validés.
        </p>
      </LegalSection>

      <LegalSection title="12. Portefeuille et retraits">
        <p>
          Les sommes revenant aux propriétaires et aux vendeurs sont créditées sur leur portefeuille. Les retraits sont réservés
          aux propriétaires et aux vendeurs, et effectués par FedaPay vers un compte Mobile Money (MTN, Moov, Celtiis) ou par
          virement bancaire.
        </p>
        <ul>
          <li>Montant minimum de retrait : 5 000 FCFA.</li>
          <li>Plafond : 2 000 000 FCFA par transaction vers un compte Mobile Money.</li>
          <li>Frais de retrait : pris en charge par REFUGE.</li>
          <li>
            Délai : de quelques secondes à quelques minutes pour un retrait automatique ; de 24 à 72 heures ouvrées lorsqu’une
            validation préalable est nécessaire.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="13. Messagerie et signalements">
        <p>
          La messagerie interne permet aux utilisateurs d’échanger au sujet d’un bien ou d’une visite. Les propos irrespectueux,
          les injures, le harcèlement et tout contenu illicite y sont interdits. Tout message ou toute conversation peut être
          signalé ; l’équipe de {editeur.nom} examine chaque signalement et peut appliquer les mesures prévues à l’article 15.
        </p>
      </LegalSection>

      <LegalSection title="14. Obligations des utilisateurs">
        <p>L’utilisateur s’engage à :</p>
        <ul>
          <li>fournir des informations exactes et à jour, notamment un numéro de téléphone valide permettant de recevoir les codes de vérification ;</li>
          <li>utiliser la Plateforme conformément aux lois en vigueur en République du Bénin et aux présentes CGU ;</li>
          <li>ne pas publier de contenu trompeur, illicite ou portant atteinte aux droits de tiers ;</li>
          <li>ne pas utiliser les coordonnées d’autres utilisateurs à d’autres fins que celles de la Plateforme ;</li>
          <li>ne pas porter atteinte à la sécurité ou au fonctionnement de la Plateforme.</li>
        </ul>
      </LegalSection>

      <LegalSection title="15. Suspension et suppression du compte">
        <h3>15.1 Suppression à la demande de l’utilisateur</h3>
        <p>
          L’utilisateur peut supprimer son compte et ses données à tout moment depuis l’application, ou en écrivant à{' '}
          <EmailContact />. Les données sont alors conservées pour les durées prévues par la{' '}
          <Link to="/confidentialite">politique de confidentialité</Link>.
        </p>
        <h3>15.2 Suspension ou suppression immédiate</h3>
        <p>
          {editeur.nom} peut suspendre ou supprimer un compte immédiatement, sans avertissement préalable, en cas de faute lourde,
          d’illégalité ou de mise en danger de la Plateforme, notamment :
        </p>
        <ul>
          <li>fraude financière ou tentative de blanchiment, utilisation de numéros Mobile Money suspects ou flux financiers anormaux ;</li>
          <li>encaissement de frais de visite sans se présenter aux rendez-vous, de manière répétée ;</li>
          <li>publication de biens inexistants ou appartenant à autrui dans le but d’obtenir de l’argent ;</li>
          <li>usurpation d’identité ;</li>
          <li>atteinte grave à la sécurité de la Plateforme (tentative de piratage, injection de code, contournement de la vérification par code OTP).</li>
        </ul>
        <h3>15.3 Suspension après avertissement</h3>
        <p>
          Pour les autres manquements aux présentes CGU, {editeur.nom} adresse un avertissement à l’utilisateur et lui accorde
          un délai de 7 à 14 jours pour régulariser sa situation avant toute suspension, notamment en cas :
        </p>
        <ul>
          <li>d’annulations abusives et répétées de visites à la dernière minute ;</li>
          <li>de non-respect des règles de la messagerie (propos irrespectueux, injures, harcèlement) ;</li>
          <li>de données de profil obsolètes, par exemple un numéro de téléphone expiré ou non vérifié ne permettant plus de recevoir les codes de vérification.</li>
        </ul>
        <h3>15.4 Inactivité prolongée</h3>
        <p>Un compte inactif depuis plus de 3 ans peut être supprimé, après l’envoi d’un préavis par email ou par SMS à l’utilisateur.</p>
      </LegalSection>

      <LegalSection title={`16. Responsabilité de ${editeur.nom}`}>
        <p>
          {editeur.nom} est tenu d’une obligation de moyens : il met en œuvre les moyens techniques et organisationnels
          raisonnables pour assurer le bon fonctionnement de la Plateforme (diffusion des annonces, traitement des paiements,
          messagerie), sans garantir un résultat, par exemple la location d’un bien dans un délai donné.
        </p>
        <p>REFUGE intervient comme plateforme technique de mise en relation et d’intermédiation. À ce titre, {editeur.nom} n’est pas responsable :</p>
        <ul>
          <li>des litiges entre propriétaires et locataires, le contrat de bail étant conclu exclusivement entre eux ;</li>
          <li>
            de l’état des biens après leur vérification et leur publication : la vérification constate l’état du bien à un
            instant donné et ne couvre ni les dégradations ultérieures, ni le défaut d’entretien par le propriétaire, ni les
            dommages causés par le locataire ;
          </li>
          <li>
            des indisponibilités temporaires de la Plateforme dues à des travaux de maintenance, programmés ou d’urgence, ou à des
            pannes de prestataires externes (opérateurs de télécommunication, FedaPay, hébergeurs).
          </li>
        </ul>
        <p>
          {editeur.nom} reste responsable des dommages causés par ses propres erreurs, fautes ou négligences, par exemple un
          double prélèvement dû à une erreur interne ou un défaut de reversement des sommes encaissées imputable à sa gestion.
        </p>
      </LegalSection>

      <LegalSection title="17. Assistance">
        <p>
          Une assistance est disponible six jours sur sept, du lundi au samedi, de 8 h 00 à 18 h 00, à l’adresse{' '}
          <EmailContact /> et aux numéros {telephones}.
        </p>
      </LegalSection>

      <LegalSection title="18. Données personnelles et cookies">
        <p>
          Le traitement des données personnelles est décrit dans la <Link to="/confidentialite">politique de confidentialité</Link>{' '}
          de REFUGE, et l’usage des traceurs dans la <Link to="/cookies">politique de gestion des cookies et traceurs</Link>. Ces
          documents font partie intégrante des présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="19. Propriété intellectuelle">
        <p>
          Tout le contenu de la plateforme REFUGE (graphismes, images, textes, logos, icônes et leur mise en forme) est la
          propriété exclusive de {editeur.nom}, à l’exception des marques, logos ou contenus appartenant à des partenaires ou à
          des tiers. Toute reproduction ou utilisation, même partielle, sans l’accord écrit de {editeur.nom} est interdite.
        </p>
        <p>
          Les annonces et photos publiées par les utilisateurs restent leur propriété. En les publiant, l’utilisateur autorise
          REFUGE à les afficher gratuitement et sans exclusivité sur la Plateforme, pendant toute la durée de leur publication.
        </p>
      </LegalSection>

      <LegalSection title="20. Modification des CGU">
        <p>
          {editeur.nom} peut modifier les présentes CGU. Les utilisateurs en sont informés par une notification dans
          l’application et par email. En cas de modification importante, une nouvelle acceptation des CGU leur est demandée.
          La date de dernière mise à jour figure en tête du document.
        </p>
      </LegalSection>

      <LegalSection title="21. Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit béninois. En cas de litige, l’utilisateur et {editeur.nom} recherchent
          d’abord une solution amiable, pendant un délai de 30 jours à compter de la réclamation adressée à <EmailContact />.
          À défaut d’accord, le litige est porté devant le Tribunal de commerce de Cotonou.
        </p>
      </LegalSection>

      <LegalSection title="22. Contact">
        <p>Pour toute question relative aux présentes CGU : <EmailContact /> · {telephones}.</p>
      </LegalSection>
    </LegalLayout>
  )
}
