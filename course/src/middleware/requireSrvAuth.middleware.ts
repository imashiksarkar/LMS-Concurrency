import { env } from '@/config'
import { catchAsync, exres } from '@/libs'
import { NextFunction, Request, Response } from 'express'

const requireSrvAuth = () =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const sessionToken: string | undefined = (
      req.headers as Record<string, string>
    )?.['x-srv-session']?.trim()

    if (!sessionToken)
      throw exres().error(401).message('Session token not found (srv)').exec()

    if (sessionToken !== env.SERVICE_SESSION)
      throw exres().error(401).message('Invalid session token (srv)').exec()

    return next()
  })

export default requireSrvAuth
