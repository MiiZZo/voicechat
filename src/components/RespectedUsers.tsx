'use client'

import { Users, Star } from 'lucide-react'

interface RespectedUser {
  id: string
  name: string
  description: string
  avatar?: string
}

const respectedUsers: RespectedUser[] = [
  {
    id: '1',
    name: 'Брадок',
    description: 'Любитель заставить брадков ждать',
    avatar: '/bratok.jpg',
  },
  {
    id: '2',
    name: 'Брадок 2 (Андрюха)',
    description: '9 авг монстр, но скоро апнет 3к эло',
    avatar: '/andruxa.webp',
  }
]

export default function RespectedUsers() {
  return (
    <div className="minimal-card p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">
          Уважаемые пользователи
        </h2>
      </div>
      
      <div className="space-y-4">
        {respectedUsers.map((user) => (
          <div key={user.id} className="bg-dark-800 border border-gray-600 rounded-lg p-4 min-w-0">
            <div className="flex items-start gap-3">
              {/* Аватар */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback к инициалам если изображение не загрузилось
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-white font-semibold text-lg">${user.name.charAt(0)}</span>`
                        }
                      }}
                    />
                  ) : (
                    <span className="text-white font-semibold text-lg">
                      {user.name.charAt(0)}
                    </span>
                  )}
                </div>
                
              </div>
              
              {/* Информация о пользователе */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">{user.name}</h3>
                  <Star size={14} className="text-yellow-400" />
                </div>
                <p className="text-sm text-gray-400 break-words">
                  {user.description}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Заглушка для будущих пользователей */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Больше уважаемых пользователей скоро...
          </p>
        </div>
      </div>
    </div>
  )
}
