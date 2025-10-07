'use client'

import { useState, useEffect } from 'react'
import VoiceChat from '@/components/VoiceChat'
import RoomSelector from '@/components/RoomSelector'
import SimpleConnectionTest from '@/components/SimpleConnectionTest'
import RespectedUsers from '@/components/RespectedUsers'
import ConnectionDebugger from '@/components/ConnectionDebugger'

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')

  // Обработка URL параметров для автоматического подключения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const roomId = urlParams.get('room')
      
      if (roomId) {
        setCurrentRoom(roomId)
        // Имя пользователя будет введено в RoomSelector или взято из localStorage
      }
    }
  }, [])

  if (currentRoom && username) {
    return (
      <VoiceChat 
        roomId={currentRoom} 
        username={username}
        onLeave={() => setCurrentRoom(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg p-4 flex items-center justify-center">
      <SimpleConnectionTest />
      <ConnectionDebugger isVisible={process.env.NODE_ENV === 'development'} />
      
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6">
        {/* Основной контент */}
        <div className="flex-1 flex items-center justify-center">
          <div className="minimal-card p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-white mb-2">
                Голосовой чат
              </h1>
              <p className="text-gray-400 text-sm">
                Общайтесь с подпивасами в реальном времени
              </p>
            </div>
            
            <RoomSelector 
              prefillRoomId={currentRoom}
              onJoinRoom={(roomId, user) => {
                setCurrentRoom(roomId)
                setUsername(user)
              }}
            />
          </div>
        </div>
        
        {/* Блок уважаемых пользователей */}
        <div className="w-full lg:w-auto flex-shrink-0">
          <RespectedUsers />
        </div>
      </div>
    </div>
  )
}
