import { ChevronDown } from 'lucide-react'
import { CountryFlag } from './CountryFlag'

const COUNTRY_CODES = [
  { code: '+229', label: 'Bénin' },
  { code: '+228', label: 'Togo' },
  { code: '+225', label: "Côte d'Ivoire" },
  { code: '+221', label: 'Sénégal' },
  { code: '+33',  label: 'France' },
]

interface Props {
  countryCode: string
  phone: string
  onCountryChange: (v: string) => void
  onPhoneChange: (v: string) => void
  autoComplete?: string
}

export function PhoneField({ countryCode, phone, onCountryChange, onPhoneChange, autoComplete = 'tel' }: Props) {
  const current = COUNTRY_CODES.find(c => c.code === countryCode) ?? COUNTRY_CODES[0]

  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor="auth-phone">Numéro de téléphone</label>
      <div className="auth-phone">
        <div className="auth-phone-country">
          <CountryFlag code={current.code} />
          <span className="auth-phone-code">{current.code}</span>
          <ChevronDown size={14} className="auth-phone-caret" />
          <select
            className="auth-phone-select"
            value={countryCode}
            onChange={e => onCountryChange(e.target.value)}
            aria-label="Indicatif pays"
          >
            {COUNTRY_CODES.map(c => (
              <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
            ))}
          </select>
        </div>
        <span className="auth-phone-divider" />
        <input
          id="auth-phone"
          type="tel"
          className="auth-phone-number"
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
          placeholder="97 00 00 00"
          autoComplete={autoComplete}
        />
      </div>
    </div>
  )
}
