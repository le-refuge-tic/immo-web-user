import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { cn } from '../../lib/utils'
import React from 'react'

type PresetType = 'fade' | 'slide' | 'scale' | 'blur' | 'blur-slide' | 'zoom' | 'bounce'

type AnimatedGroupProps = {
  children: ReactNode
  className?: string
  variants?: { container?: Variants; item?: Variants }
  preset?: PresetType
  /** stagger delay between children in seconds */
  stagger?: number
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  fade: {
    container: defaultContainerVariants,
    item: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  },
  slide: {
    container: defaultContainerVariants,
    item: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  },
  scale: {
    container: defaultContainerVariants,
    item: { hidden: { opacity: 0, scale: 0.88 }, visible: { opacity: 1, scale: 1 } },
  },
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(12px)' },
      visible: { opacity: 1, filter: 'blur(0px)', transition: { type: 'spring', bounce: 0.3, duration: 1.2 } },
    },
  },
  'blur-slide': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(8px)', y: 20 },
      visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { type: 'spring', bounce: 0.3, duration: 1.0 } },
    },
  },
  zoom: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.6 },
      visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 22 } },
    },
  },
  bounce: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: -40 },
      visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 14 } },
    },
  },
}

export function AnimatedGroup({ children, className, variants, preset = 'blur-slide', stagger }: AnimatedGroupProps) {
  const selected = presetVariants[preset]
  const containerVariants = variants?.container || {
    ...selected.container,
    visible: {
      ...selected.container.visible,
      transition: {
        ...(selected.container.visible as any)?.transition,
        staggerChildren: stagger ?? (selected.container.visible as any)?.transition?.staggerChildren ?? 0.1,
      },
    },
  }
  const itemVariants = variants?.item || selected.item

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
