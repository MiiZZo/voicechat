'use client'

import { useEffect, useState, useRef } from 'react'

interface UseAudioLevelOptions {
  smoothingFactor?: number // 0-1, сглаживание изменений
  threshold?: number // 0-1, минимальный уровень для активации
  updateInterval?: number // интервал обновления в мс
  onThresholdChange?: (threshold: number) => void // callback для изменения порога
}

export function useAudioLevel(
  stream: MediaStream | null,
  options: UseAudioLevelOptions = {}
) {
  const {
    smoothingFactor = 0.8,
    threshold = 0.01,
    updateInterval = 100,
    onThresholdChange
  } = options

  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentThreshold, setCurrentThreshold] = useState(() => {
    // Загружаем сохраненный порог из localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voice-threshold')
      return saved ? parseFloat(saved) : threshold
    }
    return threshold
  })
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationRef = useRef<number>()
  const lastLevelRef = useRef(0)

  useEffect(() => {
    if (!stream) {
      setAudioLevel(0)
      setIsSpeaking(false)
      return
    }

    try {
      // Создаем AudioContext
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Создаем источник из MediaStream
      const source = audioContextRef.current.createMediaStreamSource(stream)
      
      // Создаем анализатор
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
      
      // Подключаем источник к анализатору
      source.connect(analyserRef.current)
      
      // Создаем массив для данных
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      // Функция анализа уровня звука
      const analyzeAudio = () => {
        if (!analyserRef.current || !dataArrayRef.current) return

        // Получаем данные частот
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        
        // Вычисляем средний уровень
        let sum = 0
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i]
        }
        const average = sum / dataArrayRef.current.length
        const normalizedLevel = average / 255

        // Применяем сглаживание
        const smoothedLevel = lastLevelRef.current * smoothingFactor + normalizedLevel * (1 - smoothingFactor)
        lastLevelRef.current = smoothedLevel

        // Обновляем состояние
        setAudioLevel(smoothedLevel)
        const speaking = smoothedLevel > currentThreshold
        setIsSpeaking(speaking)
        
        // Отладочная информация
        if (process.env.NODE_ENV === 'development') {
          console.log(`Audio Level: ${(smoothedLevel * 100).toFixed(1)}%, Threshold: ${(currentThreshold * 1000).toFixed(1)}‰, Speaking: ${speaking}`)
        }

        // Продолжаем анимацию
        animationRef.current = requestAnimationFrame(analyzeAudio)
      }

      // Запускаем анализ
      analyzeAudio()

    } catch (error) {
      console.error('Error setting up audio analysis:', error)
      setAudioLevel(0)
      setIsSpeaking(false)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stream, smoothingFactor, currentThreshold])

  // Отслеживаем изменения порога
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Threshold updated to:', currentThreshold)
    }
  }, [currentThreshold])

  // Функция для изменения порога
  const updateThreshold = (newThreshold: number) => {
    setCurrentThreshold(newThreshold)
    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('voice-threshold', newThreshold.toString())
    }
    if (onThresholdChange) {
      onThresholdChange(newThreshold)
    }
  }

  return {
    audioLevel,
    isSpeaking,
    threshold: currentThreshold,
    updateThreshold
  }
}
