'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Phone, Users, Volume2, VolumeX } from 'lucide-react'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import VolumeSlider from './VolumeSlider'

interface VoiceChatProps {
  roomId: string
  username: string
  onLeave: () => void
}

export default function VoiceChat({ roomId, username, onLeave }: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [participants, setParticipants] = useState<{id: string, username: string}[]>([])
  
  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen,
    setParticipantVolume,
    toggleParticipantMute,
    getParticipantVolume,
    isParticipantMuted
  } = useVoiceChat(roomId, username, {
    onParticipantsUpdate: (newParticipants) => {
      console.log('Participants updated:', newParticipants)
      setParticipants(newParticipants)
    },
    onError: (err) => console.error('Voice chat error:', err)
  })

  useEffect(() => {
    connect()
    return () => {
      console.log('VoiceChat component unmounting, disconnecting...')
      disconnect()
    }
  }, [roomId, username]) // Only depend on roomId and username, not the functions

  const handleMuteToggle = () => {
    toggleMute()
    setIsMuted(!isMuted)
  }

  const handleDeafenToggle = () => {
    toggleDeafen()
    setIsDeafened(!isDeafened)
  }

  const handleLeave = () => {
    disconnect()
    onLeave()
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="minimal-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {roomId}
              </h1>
              <p className="text-gray-400 text-sm">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={20} />
                <span className="text-sm">{participants.length + 1} ({participants.length} others)</span>
              </div>
              
              <button
                onClick={handleLeave}
                className="bg-transparent border border-gray-600 hover:border-red-500 hover:text-red-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Phone size={20} />
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="minimal-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Participants ({participants.length + 1})
          </h2>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
              Debug: {participants.length} participants found
              {participants.length > 0 && (
                <div className="mt-1">
                  {participants.map(p => `${p.username} (${p.id})`).join(', ')}
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Current User */}
            <div className="bg-dark-700 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{username}</p>
                  <p className="text-sm text-gray-400">You</p>
                </div>
              </div>
            </div>

            {/* Other Participants */}
            {participants.filter(participant => participant && participant.username).map((participant) => (
              <div key={participant.id} className="bg-dark-800 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                    {participant.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{participant.username || 'Unknown'}</p>
                    <p className="text-sm text-gray-400">Participant</p>
                  </div>
                </div>
                
                {/* Volume Control */}
                <VolumeSlider
                  participantId={participant.id}
                  initialVolume={getParticipantVolume(participant.id)}
                  onVolumeChange={setParticipantVolume}
                  isMuted={isParticipantMuted(participant.id)}
                  onMuteToggle={toggleParticipantMute}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="minimal-card p-6">
          <div className="flex justify-center gap-6">
            <button
              onClick={handleMuteToggle}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${
                isMuted 
                  ? 'bg-red-500 border-red-500 text-white' 
                  : 'bg-transparent border-gray-600 hover:border-white text-white'
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button
              onClick={handleDeafenToggle}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${
                isDeafened 
                  ? 'bg-red-500 border-red-500 text-white' 
                  : 'bg-transparent border-gray-600 hover:border-white text-white'
              }`}
            >
              {isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
              {isMuted ? 'Microphone off' : 'Microphone on'} • 
              {isDeafened ? ' Audio off' : ' Audio on'}
            </p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
