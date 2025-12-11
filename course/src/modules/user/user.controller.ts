import { ID } from '@/db'
import { catchAsync, exres } from '@/libs'
import { requireAuth } from '@/middleware'
import { ReqWithUser } from '@/middleware/requireAuth.middleware'
import { Request, Response, Router } from 'express'
import UserService from './user.service'
import * as UserDtos from './user.dtos'

class UserController {
  private static readonly prefix: string = '/users'

  private static readonly userService: typeof UserService = UserService

  private static readonly router = Router()
  private static readonly path = (path: string) => `${this.prefix}${path}`

  /* Prepare the module */
  static get module() {
    try {
      const EOFIndex = Object.keys(this).indexOf('EOF') + 1 || 0
      const methods = Object.keys(this).splice(EOFIndex) // skip constructor

      methods.forEach((name) => eval(`this.${name}()`))

      return this.router
    } catch (error: any) {
      console.log(error.message)
    }
  }

  private static readonly EOF = null // routes begin after line

  /* Hare are all the routes */
  private static readonly getProfile = async (path = this.path('/profile')) => {
    this.router.post(
      path,
      requireAuth(),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const user = await this.userService.getSingleUser(req.locals.user.id)

        const r = exres()
          .success(200)
          .data({ ...user })
          .exec()
        res.status(r.code).json(r.data)
      })
    )
  }

  private static readonly getUserProfile = async (
    path = this.path('/:userId')
  ) => {
    this.router.post(
      path,
      catchAsync(async (req: Request, res: Response) => {
        const { userId } = UserDtos.getUserDto.parse(req.params)

        const user = await this.userService.getSingleUser(userId)

        const r = exres()
          .success(200)
          .data({ ...user })
          .exec()
        res.status(r.code).json(r.data)
      })
    )
  }
}

export default UserController.module as Router
