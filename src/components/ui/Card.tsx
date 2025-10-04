import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false
}) => {
  return (
    <motion.div
      className={cn(
        'bg-card rounded-lg shadow-sm border border-gray-200',
        hover && 'hover:shadow-md transition-shadow duration-200',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}