import { Request, Response, Router } from 'express'
import { catchAsync } from '@/libs'
import UserService from './user.service'
import * as UserDtos from './user.dtos'

class UserController {
  private static readonly prefix: string = '/user'

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
  private static readonly test = async (path = this.path('/')) => {
    this.router.post(
      path,
      catchAsync(async (req: Request, res: Response) => {})
    )
  }
}

export default UserController.module as Router
  