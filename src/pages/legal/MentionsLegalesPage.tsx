import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection, LegalTable, EmailContact, RecepisseApdp } from './LegalLayout'
import { editeur, cadreLegal, hebergeurs, MAJ } from '../../data/legal'

/** Mentions légales — texte officiel du 4 novembre 2026. */
export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" miseAJour={MAJ.mentions} description="Éditeur, hébergement, déclaration à l’APDP et informations légales de la plateforme REFUGE.">
      <p>Établies conformément à la {cadreLegal.loi}.</p>

      <LegalSection title="1. Éditeur de la plateforme">
        <p>La plateforme REFUGE est éditée par :</p>
        <LegalTable lignes={[
          ['Éditeur', `${editeur.nom} (${editeur.formeJuridique})`],
          ['RCCM', editeur.rccm],
          ['IFU', editeur.ifu],
          ['Adresse', editeur.adresse],
          ['Téléphone', editeur.telephones.join(' / ')],
          ['Email', <EmailContact key="e" />],
          ['Directeur de la publication', editeur.directeurPublication],
        ]} />
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <p>La plateforme REFUGE est hébergée par les prestataires suivants :</p>
        <LegalTable entetes={['Prestataire', 'Service', 'Localisation']} lignes={hebergeurs.map(h => [h.nom, h.service, h.pays])} />
      </LegalSection>

      <LegalSection title="3. Déclaration à l’APDP">
        <p>
          Conformément à la {cadreLegal.loi} (Livre 5<sup>e</sup> relatif à la protection des données personnelles et de la
          vie privée), la plateforme REFUGE a fait l’objet d’une déclaration auprès de l’Autorité de Protection des Données
          Personnelles (<a href={cadreLegal.apdp.site} target="_blank" rel="noreferrer">www.apdp.bj</a>).
        </p>
        <p><RecepisseApdp /></p>
        <p>
          En tout état de cause, {editeur.nom} ne collecte des informations personnelles relatives à l’utilisateur que pour le
          besoin de certains services proposés par la plateforme REFUGE. L’utilisateur fournit ces informations en toute
          connaissance de cause, notamment lorsqu’il procède par lui-même à leur saisie.
        </p>
        <p>
          Conformément aux dispositions de la loi n° 2017-20 portant code du numérique en République du Bénin, tout utilisateur
          dispose d’un droit d’accès, de rectification et d’opposition aux données personnelles le concernant, en effectuant sa
          demande écrite et signée, accompagnée d’une copie du titre d’identité avec signature du titulaire de la pièce, en
          précisant l’adresse à laquelle la réponse doit être envoyée.
        </p>
        <p>
          Aucune information personnelle de l’utilisateur de la plateforme REFUGE n’est publiée à son insu, ni cédée ou vendue
          à des tiers. Elle n’est communiquée qu’aux destinataires et sous-traitants indiqués dans la{' '}
          <Link to="/confidentialite">politique de confidentialité</Link> de REFUGE.
        </p>
      </LegalSection>

      <LegalSection title="4. Droit d’accès">
        <p>
          En application de cette loi, les internautes disposent d’un droit d’accès, de rectification, de modification et de
          suppression concernant les données qui les concernent personnellement. Ce droit peut être exercé par voie
          électronique à l’adresse : <EmailContact />.
        </p>
        <p>
          Les informations personnelles collectées ne sont confiées qu’aux destinataires et sous-traitants indiqués dans la
          politique de confidentialité de REFUGE.
        </p>
      </LegalSection>

      <LegalSection title="5. Confidentialité">
        <p>
          Vos données personnelles sont confidentielles. Elles ne sont communiquées qu’aux destinataires et sous-traitants
          indiqués dans la <Link to="/confidentialite">politique de confidentialité</Link> de REFUGE, qui précise également
          les finalités, les durées de conservation et les modalités d’exercice de vos droits.
        </p>
      </LegalSection>

      <LegalSection title="6. Propriété intellectuelle">
        <p>
          Tout le contenu de la plateforme REFUGE, incluant, de façon non limitative, les graphismes, images, textes, vidéos,
          animations, sons, logos, gifs et icônes ainsi que leur mise en forme, est la propriété exclusive de {editeur.nom}, à
          l’exception des marques, logos ou contenus appartenant à d’autres sociétés partenaires ou auteurs.
        </p>
        <p>
          Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, de ces
          différents éléments est strictement interdite sans l’accord exprès par écrit de {editeur.nom}.
        </p>
      </LegalSection>

      <LegalSection title="7. Conditions de service">
        <p>
          L’utilisation de la plateforme REFUGE est régie par ses{' '}
          <Link to="/cgu">conditions générales d’utilisation</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
