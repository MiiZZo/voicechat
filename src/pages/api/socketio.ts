import { SocketHandler } from '@/lib/socket'

export default function handler(req: any, res: any) {
  console.log('API route called:', req.method, req.url)
  
  // Добавляем заголовки для CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  return SocketHandler(req, res)
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}
