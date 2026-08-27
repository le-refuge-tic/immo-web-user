import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  loading?: boolean
  disabled?: boolean
  loadingLabel?: string
  children: React.ReactNode
  type?: 'submit' | 'button'
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  className?: string
}

export function SubmitButton({
  loading,
  disabled,
  loadingLabel,
  children,
  type = 'submit',
  onClick,
  variant = 'primary',
  className = '',
}: Props) {
  const base =
    'relative flex w-full items-center justify-center gap-2 rounded-xl h-10 text-[14px] font-bold transition-all duration-150 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

  const variants = {
    primary:
      'bg-primary text-white shadow-btn hover:bg-primary-d disabled:bg-primary/50',
    ghost:
      'bg-transparent text-text-grey hover:text-text-dark border border-transparent',
  }

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {loadingLabel ?? children}
        </>
      ) : children}
    </motion.button>
  )
}
