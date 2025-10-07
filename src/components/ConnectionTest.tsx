'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function ConnectionTest() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [socketId, setSocketId] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    console.log('🧪 Testing Socket.io connection...')
    
    const socket = io({
      path: '/api/socketio',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      forceNew: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.on('connect', () => {
      console.log('✅ Test connection successful!')
      setStatus('connected')
      setSocketId(socket.id || '')
      setError('')
    })

    socket.on('connect_error', (err) => {
      console.error('❌ Test connection failed:', err)
      setStatus('error')
      setError(err.message)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Test connection disconnected')
      setStatus('disconnected')
      setSocketId('')
    })

    setStatus('connecting')

    return () => {
      socket.disconnect()
    }
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50'
      case 'connecting': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return '✅ Подключен'
      case 'connecting': return '🔄 Подключение...'
      case 'error': return '❌ Ошибка'
      default: return '🔌 Отключен'
    }
  }

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 border max-w-sm">
      <h3 className="font-semibold text-gray-800 mb-2">Тест подключения</h3>
      <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </div>
      {socketId && (
        <div className="mt-2 text-xs text-gray-600">
          ID: {socketId}
        </div>
      )}
      {error && (
        <div className="mt-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
