import logoUrl from '../../assets/REFUGE-LOGO.png'
import terrainImg from '../../assets/login/terrain.jpg'
import appartementImg from '../../assets/login/appartement.jpg'
import villaImg from '../../assets/login/villa.jpg'
import '../../pages/auth/authLayout.css'

export default function AuthSidePanel() {
  return (
    <div className="lp-left">
      <div className="lp-brand">
        <img src={logoUrl} alt="REFUGE" style={{ width: 58, height: 58, objectFit: 'contain' }} />
        <span className="lp-brand-name">REFUGE</span>
      </div>

      <div className="lp-collage">
        <div className="lp-img lp-img--1"><img src={terrainImg} alt="Terrain" /></div>
        <div className="lp-img lp-img--2"><img src={appartementImg} alt="Appartement" /></div>
        <div className="lp-img lp-img--3"><img src={villaImg} alt="Villa" /></div>
      </div>

      <div className="lp-tagline">
        Trouvez votre<br />
        <span>logement idéal</span><br />
        au Bénin
      </div>
      <div className="lp-pitch-list">
        {[
          'Maisons, appartements, terrains vérifiés',
          'Réservez des visites en quelques clics',
          'Échangez directement avec les propriétaires',
        ].map(text => (
          <div key={text} className="lp-pitch-item">
            <span className="lp-pitch-dot" />
            <span className="lp-pitch-text">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
