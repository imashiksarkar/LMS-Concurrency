import { Request, Response, Router } from 'express'
import { catchAsync, exres } from '@/libs'
import AuthService from './auth.service'
import * as AuthDtos from './auth.dtos'
import requireAuth, { ReqWithUser } from '@/middleware/requireAuth.middleware'

class AuthController {
  private static readonly prefix: string = '/auth'

  private static readonly authService: typeof AuthService = AuthService

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
  private static readonly signUp = async (path = this.path('/signup')) => {
    this.router.post(
      path,
      catchAsync(async (req: Request, res: Response) => {
        const payload = AuthDtos.signUpDto.parse(req.body)

        await this.authService.signUp(payload)

        const r = exres()
          .success(201)
          .message('User created successfully')
          .exec()

        res.status(r.code).json(r)
      })
    )
  }

  private static readonly signIn = async (path = this.path('/signin')) => {
    this.router.post(
      path,
      catchAsync(async (req: Request, res: Response) => {
        const payload = AuthDtos.signInDto.parse(req.body)

        const user = await this.authService.signIn(payload)

        const r = exres().success(200).data(user).exec()
        res.status(r.code).json(r)
      })
    )
  }

  private static readonly signOut = async (path = this.path('/logout')) => {
    this.router.post(
      path,
      requireAuth(),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const sessionToken = (req.headers as Record<string, string>)[
          'x-session'
        ]?.trim()

        await this.authService.signOut(sessionToken)

        const r = exres().success(200).message('Signed out successfully').exec()
        res.status(r.code).json(r)
      })
    )
  }
}

export default AuthController.module as Router
