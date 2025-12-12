import cors from 'cors'
import { constants } from '@/config'

const corsConfig = () =>
  cors({
    origin: (origin, callback) => {
      if (constants.DISABLE_CORS) return callback(null, true) // allow all
      else if (!origin || constants.ALLOWED_ORIGINS.includes(origin))
        callback(null, true)
      else callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    maxAge: 3600,
    credentials: true,
  })

export default corsConfig
