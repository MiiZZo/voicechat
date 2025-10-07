'use client'

import { useState } from 'react'
import VoiceChat from '@/components/VoiceChat'
import RoomSelector from '@/components/RoomSelector'
import SimpleConnectionTest from '@/components/SimpleConnectionTest'

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')

  if (currentRoom) {
    return (
      <VoiceChat 
        roomId={currentRoom} 
        username={username}
        onLeave={() => setCurrentRoom(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-oklch(14.5% 0 0) flex items-center justify-center p-4">
      <SimpleConnectionTest />
      <div className="minimal-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Voice Chat
          </h1>
          <p className="text-gray-400 text-sm">
            Connect with friends in real-time
          </p>
        </div>
        
        <RoomSelector 
          onJoinRoom={(roomId, user) => {
            setCurrentRoom(roomId)
            setUsername(user)
          }}
        />
      </div>
    </div>
  )
}
