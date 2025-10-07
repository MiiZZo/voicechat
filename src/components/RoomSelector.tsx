'use client'

import { useState } from 'react'
import { Users, Plus, Hash } from 'lucide-react'

interface RoomSelectorProps {
  onJoinRoom: (roomId: string, username: string) => void
}

export default function RoomSelector({ onJoinRoom }: RoomSelectorProps) {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = () => {
    if (!username.trim()) return
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    onJoinRoom(newRoomId, username.trim())
  }

  const handleJoinRoom = () => {
    if (!username.trim() || !roomId.trim()) return
    
    onJoinRoom(roomId.trim().toUpperCase(), username.trim())
  }

  return (
    <div className="space-y-6">
      {/* Username Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 bg-dark-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          maxLength={20}
        />
      </div>

      {/* Create Room */}
      <div className="space-y-4">
        <button
          onClick={handleCreateRoom}
          disabled={!username.trim()}
          className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Room
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark-800 text-gray-400">or</span>
          </div>
        </div>

        {/* Join Room */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter room ID"
              className="w-full px-4 py-3 bg-dark-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              maxLength={6}
            />
          </div>
          
          <button
            onClick={handleJoinRoom}
            disabled={!username.trim() || !roomId.trim()}
            className="w-full bg-transparent border border-gray-600 hover:border-white disabled:border-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Users size={20} />
            Join Room
          </button>
        </div>
      </div>
    </div>
  )
}
