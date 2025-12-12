import { constants, cors } from '@/config'
import { exres } from '@/libs'
import { errorHandler, notFoundHandler } from '@/middleware'
import modules from '@/modules'
import express, { type Request, type Response } from 'express'
import helmet from 'helmet'

export default async () => {
  const app = express()

  app.use(cors())
  app.use(helmet())

  app.use(express.json())

  app.get('/', (_req: Request, res: Response) => {
    const r = exres()
      .success(200)
      .message(`${constants.SERVICE_NAME} service is running fine 🚀`)
      .exec()
    res.status(r.code).json(r)
  })

  app.get('/health', (_req: Request, res: Response) => {
    const r = exres()
      .success(200)
      .data({
        status: 'healthy',
        service: constants.SERVICE_NAME,
        uptime: process.uptime(),
      })
      .exec()
    res.status(r.code).json(r)
  })

  app.use(modules)

  app.use(notFoundHandler())
  app.use(errorHandler())

  return app
}
