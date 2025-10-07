'use client'

import { useEffect, useState } from 'react'

export default function SimpleConnectionTest() {
  const [apiStatus, setApiStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [socketStatus, setSocketStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Test HTTP API first
    const testAPI = async () => {
      try {
        const response = await fetch('/api/test')
        if (response.ok) {
          setApiStatus('success')
          console.log('✅ HTTP API работает')
        } else {
          setApiStatus('error')
          console.error('❌ HTTP API не работает')
        }
      } catch (err) {
        setApiStatus('error')
        console.error('❌ HTTP API ошибка:', err)
      }
    }

    testAPI()

    // Test Socket.io connection
    const testSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        
        setSocketStatus('connecting')
        console.log('🧪 Тестируем Socket.io...')
        
        const socket = io({
          path: '/api/socketio',
          transports: ['polling'],
          autoConnect: true,
          timeout: 10000,
          reconnection: false,
          forceNew: true
        })

        const timeout = setTimeout(() => {
          socket.removeAllListeners()
          socket.disconnect()
          setSocketStatus('error')
          setError('Таймаут подключения')
        }, 10000)

        socket.on('connect', () => {
          clearTimeout(timeout)
          console.log('✅ Socket.io подключен!')
          setSocketStatus('connected')
          setError('')
          socket.removeAllListeners()
          socket.disconnect()
        })

        socket.on('connect_error', (err) => {
          clearTimeout(timeout)
          console.error('❌ Socket.io ошибка:', err)
          setSocketStatus('error')
          setError(err.message)
        })

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason)
        })

      } catch (err) {
        console.error('❌ Ошибка импорта Socket.io:', err)
        setSocketStatus('error')
        setError('Ошибка загрузки Socket.io')
      }
    }

    // Test socket after a short delay
    setTimeout(testSocket, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected': return 'text-green-400 bg-green-900/20 border border-green-500/30'
      case 'testing':
      case 'connecting': return 'text-yellow-400 bg-yellow-900/20 border border-yellow-500/30'
      case 'error': return 'text-red-400 bg-red-900/20 border border-red-500/30'
      default: return 'text-gray-400 bg-gray-800 border border-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '✅ HTTP API'
      case 'connected': return '✅ Socket.io'
      case 'testing': return '🔄 HTTP API...'
      case 'connecting': return '🔄 Socket.io...'
      case 'error': return '❌ Ошибка'
      default: return '🔌 Отключен'
    }
  }

  return (
    <div className="fixed top-4 right-4 minimal-card p-4 max-w-sm">
      <h3 className="font-medium text-white mb-3 text-sm">Тест подключения</h3>
      
      <div className="space-y-2">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(apiStatus)}`}>
          {getStatusText(apiStatus)}
        </div>
        
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(socketStatus)}`}>
          {getStatusText(socketStatus)}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <div>HTTP API: {apiStatus === 'success' ? '✅' : apiStatus === 'error' ? '❌' : '🔄'}</div>
        <div>Socket.io: {socketStatus === 'connected' ? '✅' : socketStatus === 'error' ? '❌' : '🔄'}</div>
      </div>
    </div>
  )
}
