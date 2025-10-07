'use client'

import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

interface ConnectionDebuggerProps {
  isVisible?: boolean
}

export default function ConnectionDebugger({ isVisible = false }: ConnectionDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!isVisible) return

    const debugSocket = io({
      path: '/api/socketio',
      transports: ['polling', 'websocket'],
      withCredentials: true
    })

    setSocket(debugSocket)

    const updateDebugInfo = () => {
      setDebugInfo({
        connected: debugSocket.connected,
        transport: debugSocket.io.engine?.transport?.name || 'unknown',
        readyState: debugSocket.io.engine?.readyState || 'unknown',
        url: debugSocket.io.uri,
        id: debugSocket.id,
        timestamp: new Date().toISOString()
      })
    }

    debugSocket.on('connect', () => {
      console.log('🔍 Debug: Connected')
      updateDebugInfo()
    })

    debugSocket.on('disconnect', (reason) => {
      console.log('🔍 Debug: Disconnected', reason)
      updateDebugInfo()
    })

    debugSocket.on('connect_error', (error) => {
      console.log('🔍 Debug: Connection error', error)
      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        errorType: error.type
      }))
    })

    debugSocket.io.engine?.on('upgrade', () => {
      console.log('🔍 Debug: Transport upgraded')
      updateDebugInfo()
    })

    debugSocket.io.engine?.on('upgradeError', (error) => {
      console.log('🔍 Debug: Upgrade error', error)
      setDebugInfo(prev => ({
        ...prev,
        upgradeError: error.message
      }))
    })

    updateDebugInfo()

    return () => {
      debugSocket.disconnect()
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 bg-black border border-gray-600 rounded-lg p-4 max-w-sm text-xs">
      <h3 className="text-white font-semibold mb-2">🔍 Connection Debug</h3>
      
      <div className="space-y-1 text-gray-300">
        <div>
          <span className="text-gray-400">Status:</span> 
          <span className={`ml-2 ${debugInfo.connected ? 'text-green-400' : 'text-red-400'}`}>
            {debugInfo.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Transport:</span> 
          <span className="ml-2 text-blue-400">{debugInfo.transport}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Ready State:</span> 
          <span className="ml-2 text-yellow-400">{debugInfo.readyState}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Socket ID:</span> 
          <span className="ml-2 text-purple-400">{debugInfo.id || 'None'}</span>
        </div>
        
        <div>
          <span className="text-gray-400">URL:</span> 
          <span className="ml-2 text-cyan-400 break-all">{debugInfo.url}</span>
        </div>
        
        {debugInfo.error && (
          <div>
            <span className="text-gray-400">Error:</span> 
            <span className="ml-2 text-red-400">{debugInfo.error}</span>
          </div>
        )}
        
        {debugInfo.upgradeError && (
          <div>
            <span className="text-gray-400">Upgrade Error:</span> 
            <span className="ml-2 text-red-400">{debugInfo.upgradeError}</span>
          </div>
        )}
        
        <div>
          <span className="text-gray-400">Time:</span> 
          <span className="ml-2 text-gray-500">{debugInfo.timestamp}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-600">
        <button
          onClick={() => {
            if (socket) {
              socket.disconnect()
              setTimeout(() => socket.connect(), 1000)
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
        >
          Reconnect
        </button>
      </div>
    </div>
  )
}
