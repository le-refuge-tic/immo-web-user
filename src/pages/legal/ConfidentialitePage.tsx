import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection, ACompleter } from './LegalLayout'
import { editeur, cadreLegal, prestataires } from '../../data/legal'
import { openConsentSettings } from '../../lib/analytics'

/**
 * Politique de confidentialité de la plateforme, rédigée d'après les données
 * réellement traitées par le backend et les applications (inventaire du code).
 * Les durées de conservation ne sont pas définies dans le code : à compléter.
 */
export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" description="Données personnelles traitées par REFUGE, finalités, destinataires, durée de conservation et vos droits.">
      <p>
        {editeur.nom} édite la plateforme immobilière REFUGE (site web et application mobile). Cette politique explique
        quelles données nous traitons, pourquoi, avec qui elles sont partagées et quels sont vos droits, conformément à
        la {cadreLegal.loi} et aux règles de l’{cadreLegal.apdp.nom}.
      </p>

      <LegalSection title="Responsable du traitement">
        <p>
          {editeur.nom}, {editeur.siege}. Contact :{' '}
          <span className="select-all text-text-dark font-medium">{editeur.email}</span> · {editeur.telephones[0]}.
        </p>
      </LegalSection>

      <LegalSection title="Données que nous traitons">
        <ul>
          <li><strong>Compte</strong> : civilité, nom, prénom, numéro de téléphone, numéro WhatsApp, email, mot de passe (enregistré uniquement sous forme chiffrée), photo de profil, rôles (client, locataire, propriétaire, démarcheur).</li>
          <li><strong>Vérification d’identité</strong> : copie de la carte d’identité (CIP) et attestation IFU, lorsque vous les fournissez pour publier ou gérer des biens.</li>
          <li><strong>Annonces</strong> : description, prix, photos et localisation (ville, quartier, coordonnées) des biens publiés.</li>
          <li><strong>Visites et échanges</strong> : demandes et créneaux de visite, messages échangés dans la messagerie, avis laissés après une visite.</li>
          <li><strong>Paiements</strong> : frais de visite, loyers, recharges et retraits du portefeuille, numéro Mobile Money de retrait. Nous ne conservons aucune donnée de carte bancaire : les paiements sont traités par les prestataires listés plus bas.</li>
          <li><strong>Sécurité</strong> : codes envoyés par SMS (conservés sous forme chiffrée et pour une durée courte), tentatives de connexion, jetons de session.</li>
          <li><strong>Notifications</strong> : identifiant de l’appareil ou du navigateur pour vous envoyer des notifications, si vous les activez.</li>
          <li><strong>Mesure d’audience</strong> : statistiques de fréquentation anonymes, sans cookie et sans donnée d’identification, uniquement si vous l’acceptez.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Pourquoi nous les utilisons">
        <ul>
          <li>Créer et sécuriser votre compte, vous connecter avec un code SMS.</li>
          <li>Publier, vérifier (modération) et afficher les annonces.</li>
          <li>Organiser les visites et vous mettre en relation avec les propriétaires, démarcheurs et locataires.</li>
          <li>Encaisser les frais et loyers, gérer le portefeuille et les retraits.</li>
          <li>Vous prévenir des événements qui vous concernent (visite confirmée, message, loyer…).</li>
          <li>Lutter contre la fraude et les abus, améliorer la plateforme.</li>
        </ul>
        <p>
          Ces traitements reposent sur l’exécution du service que vous demandez en créant un compte, sur nos obligations
          légales (comptabilité des paiements) et, pour la mesure d’audience et les notifications, sur votre consentement.
        </p>
      </LegalSection>

      <LegalSection title="Qui y a accès">
        <p>
          Les personnes habilitées de {editeur.nom} (administrateurs et commerciaux, selon leur rôle). Les informations
          utiles à une visite ou à une location (prénom, numéro de contact) sont partagées avec l’autre partie au moment
          prévu par le service. Nos prestataires techniques traitent les données uniquement pour notre compte :
        </p>
        <ul>
          {prestataires.map(p => (
            <li key={p.nom}>
              <strong>{p.nom}</strong> : {p.role}
              {p.pays ? ` (${p.pays})` : ''}
            </li>
          ))}
        </ul>
        <p>
          Certains de ces prestataires sont situés hors du Bénin. Nous ne vendons pas vos données et ne les utilisons pas
          à des fins publicitaires.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <ul>
          <li>Compte et annonces : pendant toute la durée d’utilisation du compte, puis <ACompleter label="durée après désactivation" />.</li>
          <li>Pièces d’identité (CIP, IFU) : <ACompleter label="durée de conservation" />.</li>
          <li>Paiements et transactions : <ACompleter label="durée légale de conservation comptable" />.</li>
          <li>Messages : <ACompleter label="durée de conservation" />.</li>
          <li>Codes SMS : quelques minutes (ils expirent automatiquement).</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez accéder à vos données, les rectifier, demander leur suppression ou vous opposer à un traitement.
          Vous pouvez modifier vos informations depuis votre profil. Pour désactiver ou supprimer votre compte, ou pour
          toute autre demande, écrivez à <span className="select-all text-text-dark font-medium">{editeur.email}</span>. En cas de difficulté,
          vous pouvez saisir l’{cadreLegal.apdp.nom} ({cadreLegal.apdp.site.replace('https://', '')}).
        </p>
      </LegalSection>

      <LegalSection title="Cookies et mesure d’audience">
        <p>
          La plateforme utilise uniquement le stockage nécessaire à son fonctionnement (session, préférences comme le
          thème). La mesure d’audience Umami ne dépose aucun cookie et n’est activée qu’avec votre accord.{' '}
          <button type="button" onClick={openConsentSettings} className="font-semibold text-primary dark:text-[#9DB0FF] hover:underline">
            Modifier mon choix
          </button>
          .
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les échanges sont chiffrés (HTTPS), les mots de passe et codes SMS sont enregistrés sous forme chiffrée, la
          connexion est protégée par un code SMS et le nombre de tentatives est limité.
        </p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>
          Cette politique peut évoluer, par exemple lors de l’ajout d’un service. La date de mise à jour en haut de page
          est alors actualisée. Voir aussi les <Link to="/mentions-legales">mentions légales</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
