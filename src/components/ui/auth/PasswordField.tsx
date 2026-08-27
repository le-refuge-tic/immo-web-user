import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  autoComplete?: string
  id?: string
  required?: boolean
}

export function PasswordField({
  value,
  onChange,
  label = 'Mot de passe',
  placeholder = '••••••••',
  autoComplete = 'current-password',
  id = 'auth-password',
  required,
}: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="auth-input pad-icon-left pad-icon-right w-full"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          tabIndex={-1}
          aria-label={show ? 'Masquer' : 'Afficher'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A8] hover:text-[#1D1D1F] transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}
