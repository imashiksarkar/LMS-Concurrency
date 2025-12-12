import { constants, env } from '@/config'
import { exres } from '@/libs'
import { generateId, ID, IOrderInfo, ORDER, OrderStatus } from '@/db'

interface IUser {
  id: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

interface ICourse {
  id: string
  title: string
  content: string
  price: number
  seats: number
  instructorId: string
  version: number
  updatedAt: Date
  createdAt: Date
}

export default class OrderService {
  private static readonly COURSE_SERVICE_URL = env.COURSE_SERVICE_URL
  private static readonly srvSession = env.SERVICE_SESSION

  static readonly createOrder = async (userSession: string, courseId: ID) => {
    const user = await this.api<IUser>('/users/profile', {
      method: 'GET',
      headers: {
        'x-session': userSession,
      },
    })
    const userId = user.id as ID

    const existingOrder = await this.getExistingOrder(userId, courseId)
    if (existingOrder && existingOrder.status === OrderStatus.PAID)
      throw exres()
        .error(400)
        .message('You already purchased this course.')
        .exec()

    // fetch course info from course service
    const course = await this.api<Record<'data', ICourse>>(
      `/courses/${courseId}`,
      {
        headers: {
          'x-session': userSession,
        },
      }
    ).then((res) => res.data)

    await this.api(`/courses/${courseId}/reserveSeat`, {
      method: 'PATCH',
      headers: {
        'x-session': userSession,
      },
    })

    // // create order
    if (existingOrder && existingOrder.status === OrderStatus.AWAITING_PAYMENT)
      return existingOrder
    else if (
      existingOrder &&
      [OrderStatus.CANCELLED, OrderStatus.EXPIRED, OrderStatus.FAILED].includes(
        existingOrder.status
      )
    )
      ORDER.delete(existingOrder.id)

    const id = generateId()
    const now = Date.now()
    const expiresAt = new Date(
      now + constants.COURSE_RESERVATION_EXPIRY_MINUTES * 60 * 1000
    ) // 5 minutes
    const cancelBy = new Date(
      now + constants.COURSE_RESERVATION_CANCEL_EXPIRY_MINUTES * 60 * 1000
    ) // 4 minutes
    const payBy = new Date(
      now + constants.COURSE_RESERVATION_EXPIRY_MINUTES * 60 * 1000
    ) // 5 minutes
    const order = ORDER.set(id, {
      id,
      courseId,
      userId,
      courseVersion: course.version,
      expiresAt,
      cancelBy,
      payBy,
      price: course.price,
      status: OrderStatus.AWAITING_PAYMENT,
      updatedAt: new Date(now),
      createdAt: new Date(now),
    })

    // TODO: add auto expiration

    const info = order.get(id)!

    // await this.api(`/courses/${courseId}/confirm`, {
    //   method: 'PATCH',
    //   headers: {
    //     'x-session': userSession,
    //   },
    // })

    return info
  }

  private static readonly api = async <T>(
    path: string,
    options?: RequestInit,
    retries: number = 3
  ) => {
    while (retries > 0) {
      try {
        const res = await fetch(this.COURSE_SERVICE_URL + path, {
          ...options,
          headers: {
            ...options?.headers,
            'x-srv-session': this.srvSession,
          },
        })

        return res.json() as T

        if ([500, 502, 503, 504].includes(res.status) && retries !== 1) {
          await this.delay(1000) // wait for 1 second
          continue
        }

        const json = res.json() as T
        if (!res.ok) throw json

        return json
      } catch (error) {
        continue
      } finally {
        retries--
      }
    }

    throw exres().error(500).message('Could not resolve course service.').exec()
  }

  private static readonly delay = async (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  private static readonly getExistingOrder = async (
    userId: string,
    courseId: string
  ): Promise<IOrderInfo | null> => {
    let exists: IOrderInfo | null = null

    ORDER.forEach((order) => {
      const alreadyExists =
        order.userId === userId && order.courseId === courseId

      if (alreadyExists) {
        exists = order
        return
      }
    })

    return exists
  }
}
