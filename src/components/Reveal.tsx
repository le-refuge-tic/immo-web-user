import { useEffect, useRef, useState } from 'react'

type RevealProps = {
  children: React.ReactNode
  className?: string
  animation?: string
  delay?: number
  style?: React.CSSProperties
}

export default function Reveal({ children, className = '', animation = 'anim-fade-up', delay = 0, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.08 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} ${visible ? animation : 'opacity-0'}`}
      style={{ ...style, ...(delay > 0 ? { animationDelay: `${delay}ms` } : {}) }}
    >
      {children}
    </div>
  )
}
