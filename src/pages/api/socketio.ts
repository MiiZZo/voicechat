import { SocketHandler } from '@/lib/socket'

export default function handler(req: any, res: any) {
  console.log('API route called:', req.method, req.url)
  return SocketHandler(req, res)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
