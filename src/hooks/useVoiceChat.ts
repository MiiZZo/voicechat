'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import { useAudioLevel } from './useAudioLevel'

// Extended Socket interface for client side
interface ExtendedSocket extends Socket {
  roomId?: string
  username?: string
}

interface Participant {
  id: string
  username: string
}

interface VoiceChatOptions {
  onParticipantsUpdate: (participants: Participant[]) => void
  onError: (error: string) => void
}

interface PeerConnection {
  peer: SimplePeer.Instance
  username: string
  audioElement?: HTMLAudioElement
  volume: number
  isMuted: boolean
  isSpeaking?: boolean
  audioLevel?: number
}

export function useVoiceChat(roomId: string, username: string, options: VoiceChatOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<ExtendedSocket | null>(null)
  const peersRef = useRef<Map<string, PeerConnection>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const isMutedRef = useRef(false)
  const isDeafenedRef = useRef(false)
  const isConnectingRef = useRef(false)
  
  // Отслеживание активности голоса
  const { 
    audioLevel: localAudioLevel, 
    isSpeaking: localIsSpeaking,
    threshold: localThreshold,
    updateThreshold: updateLocalThreshold
  } = useAudioLevel(localStreamRef.current, {
    smoothingFactor: 0.8
  })

  const connect = useCallback(async () => {
    try {
      // Prevent multiple connections
      if (socketRef.current?.connected || isConnectingRef.current) {
        console.log('Already connected or connecting, skipping...')
        return
      }

      isConnectingRef.current = true
      setIsConnecting(true)
      setError(null)

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      localStreamRef.current = stream

      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }

             // Connect to socket server
             const socket = io({
               path: '/api/socketio',
               transports: ['polling', 'websocket'], // Railway поддерживает WebSocket
               autoConnect: true,
               forceNew: true,
               timeout: 45000,
               reconnection: false, // Disable auto-reconnection to prevent loops
               reconnectionAttempts: 0,
               upgrade: true,
               rememberUpgrade: true,
               withCredentials: true,
               closeOnBeforeunload: false,
               pingTimeout: 60000,
               pingInterval: 25000
             }) as ExtendedSocket
      
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('✅ Connected to server with ID:', socket.id)
        setIsConnected(true)
        setIsConnecting(false)
        isConnectingRef.current = false
        setError(null)
        
        // Join room
        socket.emit('join-room', { roomId, username })
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error)
        setError('Ошибка подключения к серверу')
        setIsConnecting(false)
        isConnectingRef.current = false
      })

      socket.on('user-joined', async (data: { userId: string, username: string }) => {
        console.log('User joined:', data.username)
        
        // Check if we already have a connection for this user
        if (peersRef.current.has(data.userId)) {
          console.log('Peer connection already exists for:', data.userId)
          return
        }
        
        // Add small delay to avoid race conditions
        setTimeout(() => {
          // Create peer connection for new user
          const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: localStreamRef.current!
          })

          peer.on('signal', (signal) => {
            console.log('Sending signal to:', data.userId)
            socket.emit('signal', {
              targetUserId: data.userId,
              signal,
              roomId
            })
          })

                 peer.on('stream', (stream) => {
                   console.log('Received stream from:', data.username)
                   // Handle incoming audio stream
                   const audio = new Audio()
                   audio.srcObject = stream
                   audio.autoplay = true
                   audio.volume = isDeafenedRef.current ? 0 : 1
                   
                   // Создаем AudioContext для анализа уровня звука
                   const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                   const source = audioContext.createMediaStreamSource(stream)
                   const analyser = audioContext.createAnalyser()
                   analyser.fftSize = 256
                   analyser.smoothingTimeConstant = 0.8
                   source.connect(analyser)
                   
                   const bufferLength = analyser.frequencyBinCount
                   const dataArray = new Uint8Array(bufferLength)
                   
                   // Функция для анализа уровня звука
                   const analyzeAudio = () => {
                     analyser.getByteFrequencyData(dataArray)
                     let sum = 0
                     for (let i = 0; i < dataArray.length; i++) {
                       sum += dataArray[i]
                     }
                     const average = sum / dataArray.length
                     const normalizedLevel = average / 255
                     
                     // Обновляем уровень звука в peer connection
                     const peerConnection = peersRef.current.get(data.userId)
                     if (peerConnection) {
                       peerConnection.audioLevel = normalizedLevel
                       peerConnection.isSpeaking = normalizedLevel > localThreshold
                     }
                     
                     requestAnimationFrame(analyzeAudio)
                   }
                   analyzeAudio()
                   
                   // Store audio element for volume control
                   const existingPeer = peersRef.current.get(data.userId)
                   if (existingPeer) {
                     existingPeer.audioElement = audio
                     existingPeer.volume = 1
                     existingPeer.isMuted = false
                   } else {
                     peersRef.current.set(data.userId, {
                       peer,
                       username: data.username,
                       audioElement: audio,
                       volume: 1,
                       isMuted: false,
                       isSpeaking: false,
                       audioLevel: 0
                     })
                   }
                 })

          peer.on('error', (err) => {
            console.error('Peer connection error:', err)
          })

                 // Store peer connection
                 peersRef.current.set(data.userId, {
                   peer,
                   username: data.username,
                   volume: 1,
                   isMuted: false,
                   isSpeaking: false,
                   audioLevel: 0
                 })

          // Update participants list
          updateParticipantsList()
        }, 100) // 100ms delay
      })

      socket.on('user-left', (data: { userId: string }) => {
        console.log('User left:', data.userId)
        
        const peerConnection = peersRef.current.get(data.userId)
        if (peerConnection) {
          try {
            if (!peerConnection.peer.destroyed) {
              peerConnection.peer.destroy()
            }
          } catch (error) {
            console.error('Error destroying peer connection:', error)
          }
          peersRef.current.delete(data.userId)
        }

        updateParticipantsList()
      })

      socket.on('signal', (data: { signal: any, fromUserId: string }) => {
        console.log('Received signal from:', data.fromUserId)
        
        const peerConnection = peersRef.current.get(data.fromUserId)
        if (peerConnection) {
          // Check if peer is in a valid state to receive signals
          if (peerConnection.peer.destroyed) {
            console.log('Peer connection destroyed, ignoring signal')
            return
          }
          
          try {
            peerConnection.peer.signal(data.signal)
          } catch (error) {
            console.error('Error signaling peer:', error)
          }
        } else {
          // Create peer connection for existing user
          console.log('Creating new peer connection for:', data.fromUserId)
          
          const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: localStreamRef.current!
          })

          peer.on('signal', (signal) => {
            console.log('Sending signal back to:', data.fromUserId)
            socket.emit('signal', {
              targetUserId: data.fromUserId,
              signal,
              roomId
            })
          })

                 peer.on('stream', (stream) => {
                   console.log('Received stream from existing user:', data.fromUserId)
                   const audio = new Audio()
                   audio.srcObject = stream
                   audio.autoplay = true
                   audio.volume = isDeafenedRef.current ? 0 : 1
                   
                   // Создаем AudioContext для анализа уровня звука
                   const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                   const source = audioContext.createMediaStreamSource(stream)
                   const analyser = audioContext.createAnalyser()
                   analyser.fftSize = 256
                   analyser.smoothingTimeConstant = 0.8
                   source.connect(analyser)
                   
                   const bufferLength = analyser.frequencyBinCount
                   const dataArray = new Uint8Array(bufferLength)
                   
                   // Функция для анализа уровня звука
                   const analyzeAudio = () => {
                     analyser.getByteFrequencyData(dataArray)
                     let sum = 0
                     for (let i = 0; i < dataArray.length; i++) {
                       sum += dataArray[i]
                     }
                     const average = sum / dataArray.length
                     const normalizedLevel = average / 255
                     
                     // Обновляем уровень звука в peer connection
                     const peerConnection = peersRef.current.get(data.fromUserId)
                     if (peerConnection) {
                       peerConnection.audioLevel = normalizedLevel
                       peerConnection.isSpeaking = normalizedLevel > localThreshold
                     }
                     
                     requestAnimationFrame(analyzeAudio)
                   }
                   analyzeAudio()
                   
                   // Update existing peer connection with audio element
                   const existingPeer = peersRef.current.get(data.fromUserId)
                   if (existingPeer) {
                     existingPeer.audioElement = audio
                     existingPeer.volume = 1
                     existingPeer.isMuted = false
                   }
                 })

          peer.on('error', (err) => {
            console.error('Peer connection error:', err)
          })

                 // Store peer connection first
                 peersRef.current.set(data.fromUserId, {
                   peer,
                   username: 'Unknown', // Will be updated when we get the username
                   volume: 1,
                   isMuted: false,
                   isSpeaking: false,
                   audioLevel: 0
                 })

          // Then signal
          try {
            peer.signal(data.signal)
          } catch (error) {
            console.error('Error signaling new peer:', error)
          }
        }
      })

      socket.on('room-participants', (participants: string[]) => {
        console.log('Received room participants:', participants)
        // Convert string array to participant objects
        const participantObjects = participants
          .filter(p => p !== username)
          .map((participantName, index) => ({
            id: `participant-${index}-${participantName}`, // Generate temporary ID
            username: participantName
          }))
        options.onParticipantsUpdate(participantObjects)
      })

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from server, reason:', reason)
        setIsConnected(false)
        setIsConnecting(false)
        isConnectingRef.current = false
        
        // Only attempt reconnection if it wasn't intentional
        if (reason !== 'io client disconnect') {
          console.log('Attempting to reconnect...')
          setTimeout(() => {
            if (!socketRef.current?.connected && !isConnectingRef.current) {
              connect()
            }
          }, 2000)
        }
      })

      socket.on('error', (error: string) => {
        console.error('Socket error:', error)
        setError(error)
        options.onError(error)
      })

    } catch (err) {
      console.error('Connection error:', err)
      setError('Не удалось подключиться к голосовому чату')
      options.onError('Не удалось подключиться к голосовому чату')
      setIsConnecting(false)
      isConnectingRef.current = false
    }
  }, [roomId, username, options])

  const disconnect = useCallback(() => {
    console.log('Disconnecting...')
    
    isConnectingRef.current = false
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }

    // Clean up peer connections
    peersRef.current.forEach(({ peer }) => {
      try {
        if (!peer.destroyed) {
          peer.destroy()
        }
      } catch (error) {
        console.error('Error destroying peer connection:', error)
      }
    })
    peersRef.current.clear()

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setError(null)
  }, [])

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = isMutedRef.current
      })
      isMutedRef.current = !isMutedRef.current
    }
  }, [])

  const toggleDeafen = useCallback(() => {
    isDeafenedRef.current = !isDeafenedRef.current
    
    // Update volume for all peer audio elements
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = isDeafenedRef.current ? 0 : 1
    })
  }, [])

  const updateParticipantsList = useCallback(() => {
    const participants = Array.from(peersRef.current.entries())
      .filter(([id, peer]) => peer && peer.username)
      .map(([id, peer]) => ({
        id,
        username: peer.username || 'Unknown'
      }))
    console.log('Updating participants list:', participants)
    options.onParticipantsUpdate(participants)
  }, [options])

  const setParticipantVolume = useCallback((participantId: string, volume: number) => {
    if (!participantId) return
    
    const peerConnection = peersRef.current.get(participantId)
    if (peerConnection && peerConnection.audioElement) {
      peerConnection.volume = volume
      peerConnection.audioElement.volume = isDeafenedRef.current ? 0 : volume
    }
  }, [])

  const toggleParticipantMute = useCallback((participantId: string) => {
    if (!participantId) return
    
    const peerConnection = peersRef.current.get(participantId)
    if (peerConnection && peerConnection.audioElement) {
      peerConnection.isMuted = !peerConnection.isMuted
      peerConnection.audioElement.volume = peerConnection.isMuted ? 0 : peerConnection.volume
    }
  }, [])

  const getParticipantVolume = useCallback((participantId: string) => {
    if (!participantId) return 1
    
    const peerConnection = peersRef.current.get(participantId)
    return peerConnection ? peerConnection.volume : 1
  }, [])

  const isParticipantMuted = useCallback((participantId: string) => {
    if (!participantId) return false
    
    const peerConnection = peersRef.current.get(participantId)
    return peerConnection ? peerConnection.isMuted : false
  }, [])

  const isParticipantSpeaking = useCallback((participantId: string) => {
    if (!participantId) return false
    
    const peerConnection = peersRef.current.get(participantId)
    return peerConnection ? peerConnection.isSpeaking || false : false
  }, [])

  const getParticipantAudioLevel = useCallback((participantId: string) => {
    if (!participantId) return 0
    
    const peerConnection = peersRef.current.get(participantId)
    return peerConnection ? peerConnection.audioLevel || 0 : 0
  }, [])

  const getLocalAudioLevel = useCallback(() => {
    return localAudioLevel
  }, [localAudioLevel])

  const isLocalSpeaking = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Local speaking status: ${localIsSpeaking}, level: ${localAudioLevel}, threshold: ${localThreshold}`)
    }
    return localIsSpeaking
  }, [localIsSpeaking, localAudioLevel, localThreshold])

  const getLocalThreshold = useCallback(() => {
    return localThreshold
  }, [localThreshold])

  const handleLocalThresholdUpdate = useCallback((newThreshold: number) => {
    updateLocalThreshold(newThreshold)
  }, [updateLocalThreshold])

  // Remove the useEffect that was causing the loop
  // The component will handle connection/disconnection lifecycle

  return {
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
    isParticipantMuted,
    isParticipantSpeaking,
    getParticipantAudioLevel,
    getLocalAudioLevel,
    isLocalSpeaking,
    getLocalThreshold,
    updateLocalThreshold: handleLocalThresholdUpdate
  }
}
