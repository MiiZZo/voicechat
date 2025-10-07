import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as ServerIO, Socket } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Extended Socket interface with custom properties
interface ExtendedSocket extends Socket {
  roomId?: string
  username?: string
}

// Store room participants
const rooms = new Map<string, Map<string, { username: string; socketId: string }>>()

export const SocketHandler = (req: any, res: NextApiResponseServerIO) => {
  console.log('🔌 SocketHandler called')
  
  if (res.socket.server.io) {
    console.log('✅ Socket is already running')
    return res.end()
  }

  console.log('🚀 Socket is initializing...')
  const io = new ServerIO(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [
            process.env.CLIENT_URL || 'https://voicechat-t2ph-dcwqm30gu-miizzos-projects.vercel.app/'
          ]
        : [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001"
          ],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket'], // Polling first for better compatibility
    upgrade: true,
    rememberUpgrade: true
  })

  res.socket.server.io = io

  io.on('connection', (socket: ExtendedSocket) => {
    console.log('👤 User connected:', socket.id)

    socket.on('join-room', ({ roomId, username }: { roomId: string; username: string }) => {
      console.log(`User ${username} joining room ${roomId}`)
      
      // Leave any previous room
      if (socket.roomId) {
        socket.leave(socket.roomId)
        removeUserFromRoom(socket.roomId, socket.id)
      }

      // Join new room
      socket.join(roomId)
      socket.roomId = roomId
      socket.username = username

      // Add user to room participants
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map())
      }
      
      const room = rooms.get(roomId)!
      room.set(socket.id, { username, socketId: socket.id })

      // Notify other users in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        username
      })

      // Send current participants to the new user (excluding the new user)
      const participants = Array.from(room.values())
        .filter(p => p.socketId !== socket.id)
        .map(p => p.username)
      socket.emit('room-participants', participants)

      // Update participants list for all users in the room
      room.forEach((participant, participantSocketId) => {
        if (participantSocketId !== socket.id) {
          const otherParticipants = Array.from(room.values())
            .filter(p => p.socketId !== participantSocketId)
            .map(p => p.username)
          socket.to(participantSocketId).emit('room-participants', otherParticipants)
        }
      })

      console.log(`Room ${roomId} now has ${room.size} participants`)
    })

    socket.on('signal', ({ targetUserId, signal, roomId }: { 
      targetUserId: string; 
      signal: any; 
      roomId: string 
    }) => {
      console.log(`Relaying signal from ${socket.id} to ${targetUserId}`)
      socket.to(targetUserId).emit('signal', {
        signal,
        fromUserId: socket.id
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('User disconnected:', socket.id, 'reason:', reason)
      
      if (socket.roomId) {
        const room = rooms.get(socket.roomId)
        if (room) {
          room.delete(socket.id)
          
          // Notify other users
          socket.to(socket.roomId).emit('user-left', {
            userId: socket.id
          })

          // Clean up empty rooms
          if (room.size === 0) {
            rooms.delete(socket.roomId)
            console.log(`Room ${socket.roomId} deleted (empty)`)
          } else {
            console.log(`Room ${socket.roomId} now has ${room.size} participants`)
          }
        }
      }
    })
  })

  return res.end()
}

function removeUserFromRoom(roomId: string, socketId: string) {
  const room = rooms.get(roomId)
  if (room) {
    room.delete(socketId)
    
    if (room.size === 0) {
      rooms.delete(roomId)
    }
  }
}
