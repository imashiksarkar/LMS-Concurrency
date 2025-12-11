import { ID, ISession, Role, SESSION } from '@/db'
import { catchAsync, exres } from '@/libs'
import { Prettify } from '@/types'
import { NextFunction, Request, Response } from 'express'

export interface ILoginInfo {
  id: ID
  email: string
  role: Prettify<Role>
}

export interface ReqWithUser<T extends boolean | undefined = undefined>
  extends Request {
  locals: {
    user: T extends true ? ILoginInfo | null : ILoginInfo
  }
}

const requireAuth = <T extends boolean | undefined>(options?: {
  passThrough: T
}) =>
  catchAsync(
    async (req: ReqWithUser<T>, _res: Response, next: NextFunction) => {
      const sessionToken: string | undefined = (
        req.headers as Record<string, string>
      )['x-session']?.trim()

      if (!sessionToken && options?.passThrough) {
        next()
        return
      }

      if (!sessionToken)
        throw exres().error(401).message('Session token not found').exec()

      if (!SESSION.has(sessionToken))
        throw exres().error(401).message('Invalid session token').exec()

      const session: ISession = JSON.parse(
        Buffer.from(sessionToken, 'base64').toString()
      )

      const sessionExpiresAt = new Date(session.expiresAt)
      const now = new Date()
      if (sessionExpiresAt < now)
        throw exres().error(401).message('Session expired').exec()

      req.locals = {
        user: {
          id: session.sub,
          email: session.email,
          role: session.role,
        },
      }

      return next()
    }
  )

export default requireAuth
