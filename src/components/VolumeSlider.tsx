'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface VolumeSliderProps {
  participantId: string
  initialVolume?: number
  onVolumeChange: (participantId: string, volume: number) => void
  isMuted?: boolean
  onMuteToggle?: (participantId: string) => void
}

export default function VolumeSlider({ 
  participantId, 
  initialVolume = 1, 
  onVolumeChange, 
  isMuted = false,
  onMuteToggle 
}: VolumeSliderProps) {
  const [volume, setVolume] = useState(initialVolume)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setVolume(initialVolume)
  }, [initialVolume])

  const handleVolumeChange = (newVolume: number) => {
    if (!participantId) return
    
    setVolume(newVolume)
    onVolumeChange(participantId, newVolume)
  }

  const handleMuteToggle = () => {
    if (!participantId || !onMuteToggle) return
    
    onMuteToggle(participantId)
  }

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Mute Button */}
      {onMuteToggle && (
        <button
          onClick={handleMuteToggle}
          className={`p-1 rounded transition-colors ${
            isMuted 
              ? 'text-red-400 hover:text-red-300' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {/* Volume Slider */}
      <div className="flex-1 relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, #404040 ${(isMuted ? 0 : volume) * 100}%, #404040 100%)`
          }}
        />
        
        {/* Volume Percentage */}
        <div className="text-xs text-gray-400 mt-1 text-center">
          {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
        </div>
      </div>
    </div>
  )
}
