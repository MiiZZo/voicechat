'use client'

import { useEffect, useState, useRef } from 'react'

interface VoiceActivityIndicatorProps {
  isActive: boolean
  audioLevel?: number // 0-1, уровень громкости
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode // Аватар пользователя
}

export default function VoiceActivityIndicator({
  isActive,
  audioLevel = 0,
  size = 'md',
  className = '',
  children
}: VoiceActivityIndicatorProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0)
  const animationRef = useRef<number>()

  // Размеры для разных размеров индикатора
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  const ringSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-18 h-18'
  }

  useEffect(() => {
    if (isActive) {
      // Анимация пульсации на основе уровня звука
      const animate = () => {
        setPulseIntensity(audioLevel)
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      setPulseIntensity(0)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, audioLevel])

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Индикатор активности голоса - кольца */}
      {isActive && (
        <>
          {/* Внешнее кольцо - пульсирующее */}
          <div 
            className={`absolute rounded-full border-2 border-green-400 transition-all duration-150 ${ringSizeClasses[size]}`}
            style={{
              opacity: 0.3 + (pulseIntensity * 0.7),
              transform: `scale(${1 + pulseIntensity * 0.1})`,
              boxShadow: `0 0 ${10 + pulseIntensity * 20}px rgba(34, 197, 94, ${0.3 + pulseIntensity * 0.4})`
            }}
          />
          
          {/* Внутреннее кольцо - более яркое */}
          <div 
            className={`absolute rounded-full border-2 border-green-300 transition-all duration-100 ${sizeClasses[size]}`}
            style={{
              opacity: 0.6 + (pulseIntensity * 0.4),
              transform: `scale(${1 + pulseIntensity * 0.05})`,
              boxShadow: `0 0 ${5 + pulseIntensity * 15}px rgba(34, 197, 94, ${0.5 + pulseIntensity * 0.3})`
            }}
          />
        </>
      )}
      
      {/* Статичное кольцо для неактивных пользователей */}
      {!isActive && (
        <div className={`absolute rounded-full border-2 border-gray-600 opacity-30 ${ringSizeClasses[size]}`} />
      )}
      
      {/* Основной аватар - по центру */}
      <div className={`relative z-10 ${sizeClasses[size]} rounded-full overflow-hidden`}>
        {children}
      </div>
    </div>
  )
}
