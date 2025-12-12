import { ID } from '@/db'
import { catchAsync, exres } from '@/libs'
import { Request, Response, Router } from 'express'
import z from 'zod'
import OrderService from './order.service'

class OrderController {
  private static readonly prefix: string = '/orders'

  private static readonly orderService: typeof OrderService = OrderService

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
  private static readonly createOrder = async (path = this.path('/')) => {
    this.router.post(
      path,
      catchAsync(async (req: Request, res: Response) => {
        const { success, data: userSession } = z
          .string()
          .safeParse(req?.headers?.['x-session'])
        if (!success) throw exres().error(401).message('Unauthorized').exec()

        const courseId = z
          .uuid('courseId is required as uuid')
          .parse(req?.body?.courseId) as ID

        const newOrder = await this.orderService.createOrder(
          userSession,
          courseId
        )

        const r = exres()
          .success(201)
          .data(newOrder)
          .message('Order created successfully')
          .exec()

        res.status(r.code).json(r)
      })
    )
  }
}

export default OrderController.module as Router
