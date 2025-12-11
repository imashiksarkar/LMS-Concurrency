import { exres } from '@/libs'
import modules from '@/modules'

import express, { type Request, type Response } from 'express'
import { errorHandler, notFoundHandler } from './middleware'

export default async () => {
  const app = express()

  app.use(express.json())

  app.get('/', (_req: Request, res: Response) => {
    const r = exres().success(200).message('App is running fine 🚀').exec()
    res.status(r.code).json(r)
  })

  app.get('/health', (_req: Request, res: Response) => {
    const r = exres()
      .success(200)
      .message('App is running fine 🚀')
      .data({
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
