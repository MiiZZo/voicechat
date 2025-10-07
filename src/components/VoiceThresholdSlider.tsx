'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'

interface VoiceThresholdSliderProps {
  threshold: number
  onThresholdChange: (threshold: number) => void
  currentAudioLevel: number
  isSpeaking: boolean
}

export default function VoiceThresholdSlider({
  threshold,
  onThresholdChange,
  currentAudioLevel,
  isSpeaking
}: VoiceThresholdSliderProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleThresholdChange = (newThreshold: number) => {
    onThresholdChange(newThreshold)
  }

  const getThresholdColor = () => {
    if (threshold < 0.02) return 'text-green-400'
    if (threshold < 0.05) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getThresholdLabel = () => {
    if (threshold < 0.02) return 'Очень чувствительно'
    if (threshold < 0.05) return 'Чувствительно'
    if (threshold < 0.1) return 'Нормально'
    if (threshold < 0.2) return 'Менее чувствительно'
    return 'Очень низко'
  }

  return (
    <div className="bg-dark-800 border border-gray-600 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-white">Активация голоса</span>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Current Status */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <Mic size={16} className="text-green-400" />
          ) : (
            <MicOff size={16} className="text-gray-500" />
          )}
          <span className="text-sm text-gray-300">
            {isSpeaking ? 'Говорит' : 'Молчит'}
          </span>
        </div>
        
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-400 h-2 rounded-full transition-all duration-100"
            style={{ width: `${Math.min(currentAudioLevel * 100, 100)}%` }}
          />
        </div>
        
        <span className="text-xs text-gray-400 w-12 text-right">
          {Math.round(currentAudioLevel * 100)}%
        </span>
      </div>

      {/* Threshold Settings */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Порог</span>
            <span className={`text-sm font-medium ${getThresholdColor()}`}>
              {getThresholdLabel()}
            </span>
          </div>
          
          <div className="space-y-2">
            <input
              type="range"
              min="0.005"
              max="0.3"
              step="0.005"
              value={threshold}
              onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>Очень чувствительно</span>
              <span>Очень низко</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-700 rounded-full h-1">
              <div 
                className="bg-gray-400 h-1 rounded-full"
                style={{ width: `${(threshold / 0.3) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-12 text-right">
              {Math.round(threshold * 1000)}%
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            Текущий уровень: {Math.round(currentAudioLevel * 100)}% | 
            Порог: {Math.round(threshold * 1000)}% | 
            Статус: {isSpeaking ? 'Активен' : 'Неактивен'} | 
            Сравнение: {currentAudioLevel.toFixed(3)} vs {threshold.toFixed(3)}
          </div>
        </div>
      )}
    </div>
  )
}
