'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Hash, X, Share2, Check } from 'lucide-react'

interface RoomSelectorProps {
  prefillRoomId?: string | null
  onJoinRoom: (roomId: string, username: string) => void
}

export default function RoomSelector({ prefillRoomId, onJoinRoom }: RoomSelectorProps) {
  const [username, setUsername] = useState(() => {
    // Загружаем сохраненное имя из localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('voice-chat-username') || ''
    }
    return ''
  })
  const [roomId, setRoomId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)
  const [isLinkCopied, setIsLinkCopied] = useState(false)

  // Сохраняем имя в localStorage при изменении
  useEffect(() => {
    if (username.trim() && typeof window !== 'undefined') {
      localStorage.setItem('voice-chat-username', username.trim())
    }
  }, [username])

  // Предзаполняем roomId если передан из URL
  useEffect(() => {
    if (prefillRoomId) {
      setRoomId(prefillRoomId)
    }
  }, [prefillRoomId])

  const validateUsername = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    if (trimmed.length < 2) return false
    if (trimmed.length > 20) return false
    // Проверяем на недопустимые символы
    const invalidChars = /[<>:"/\\|?*]/
    return !invalidChars.test(trimmed)
  }

  const handleCreateRoom = () => {
    if (!validateUsername(username)) return
    
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setCreatedRoomId(newRoomId)
    onJoinRoom(newRoomId, username.trim())
  }

  const handleShareCreatedRoom = async () => {
    if (!createdRoomId) return
    
    const shareUrl = `${window.location.origin}?room=${encodeURIComponent(createdRoomId)}`
    
    try {
      // Fallback - копируем ссылку в буфер обмена
      await navigator.clipboard.writeText(shareUrl)
      setIsLinkCopied(true)
      setTimeout(() => setIsLinkCopied(false), 3000)
    } catch (err) {
      console.error('Ошибка поделиться:', err)
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setIsLinkCopied(true)
      setTimeout(() => setIsLinkCopied(false), 3000)
    }
  }

  const handleJoinRoom = () => {
    if (!validateUsername(username) || !roomId.trim()) return
    
    onJoinRoom(roomId.trim().toUpperCase(), username.trim())
  }

  const clearUsername = () => {
    setUsername('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voice-chat-username')
    }
  }

  return (
    <div className="space-y-6">
      {/* Username Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-medium text-gray-300">
                   Ваше имя
                 </label>
          {username && (
            <button
              onClick={clearUsername}
              className="text-gray-400 hover:text-red-400 transition-colors"
              title="Clear saved name"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
                 placeholder="Введите ваше имя"
          className={`w-full px-4 py-3 bg-dark-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:border-gray-400 outline-none transition-all ${
            username && !validateUsername(username) 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-600 focus:ring-gray-400'
          }`}
          maxLength={20}
        />
        {username && !validateUsername(username) && (
                 <p className="mt-1 text-xs text-red-400">
                   Имя должно быть 2-20 символов и не содержать специальных символов
                 </p>
        )}
        {username && validateUsername(username) && (
                 <p className="mt-1 text-xs text-green-400">
                   ✓ Имя корректно
                 </p>
        )}
        {!username && (
                 <p className="mt-1 text-xs text-gray-500">
                   Ваше имя будет сохранено для следующего раза
                 </p>
        )}
      </div>

             {/* Create Room */}
             <div className="space-y-4">
               <button
                 onClick={handleCreateRoom}
                 disabled={!validateUsername(username)}
                 className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
               >
                 <Plus size={20} />
                 Создать комнату
               </button>

               {/* Room Created Info */}
               {createdRoomId && (
                 <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="text-green-400 font-medium text-sm">Комната создана!</h3>
                     <button
                       onClick={handleShareCreatedRoom}
                       className={`p-1.5 rounded transition-all duration-200 ${
                         isLinkCopied 
                           ? 'bg-blue-500/20 text-blue-400' 
                           : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white'
                       }`}
                       title={isLinkCopied ? 'Ссылка скопирована!' : 'Поделиться ссылкой'}
                     >
                       {isLinkCopied ? <Check size={14} /> : <Share2 size={14} />}
                     </button>
                   </div>
                   <p className="text-green-300 text-xs mb-2">ID комнаты: <span className="font-mono font-medium">{createdRoomId}</span></p>
                   <p className="text-gray-400 text-xs">
                     {isLinkCopied ? 'Ссылка скопирована в буфер обмена!' : 'Нажмите на кнопку поделиться, чтобы отправить ссылку друзьям'}
                   </p>
                 </div>
               )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
                   <span className="px-2 bg-dark-800 text-gray-400">или</span>
          </div>
        </div>

               {/* Join Room */}
               <div className="space-y-4">
                 {/* Информация о предзаполненной комнате */}
                 {prefillRoomId && (
                   <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                     <p className="text-blue-400 text-sm">
                       <span className="font-medium">Комната найдена!</span> Вы перешли по ссылке на комнату <span className="font-mono">{prefillRoomId}</span>
                     </p>
                     <p className="text-gray-400 text-xs mt-1">
                       Введите ваше имя ниже, чтобы присоединиться
                     </p>
                   </div>
                 )}
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">
                     ID комнаты
                   </label>
                   <input
                     type="text"
                     value={roomId}
                     onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                     placeholder="Введите ID комнаты"
                     className="w-full px-4 py-3 bg-dark-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                     maxLength={6}
                   />
                 </div>
          
          <button
            onClick={handleJoinRoom}
            disabled={!validateUsername(username) || !roomId.trim()}
            className="w-full bg-transparent border border-gray-600 hover:border-white disabled:border-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Users size={20} />
                   Присоединиться
          </button>
        </div>
      </div>
    </div>
  )
}
