import { Role } from '@/db'
import { catchAsync, exres } from '@/libs'
import { NextFunction, Response } from 'express'
import { ReqWithUser } from './requireAuth.middleware'

const requireRole = <T extends boolean | undefined = undefined>(
  role: Role[],
  options?: { passThrough: T }
) =>
  catchAsync<T>(
    async (req: ReqWithUser, _res: Response, next: NextFunction) => {
      const isValidRole = role.includes(req.locals.user.role)

      if (options?.passThrough) return isValidRole

      if (!isValidRole) throw exres().error(403).message('Not allowed').exec()

      next()

      return
    }
  )

export default requireRole
