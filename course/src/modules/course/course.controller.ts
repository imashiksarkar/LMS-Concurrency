import { ID, Role } from '@/db'
import { catchAsync, exres } from '@/libs'
import { requireAuth, requireRole, requireSrvAuth } from '@/middleware'
import { ReqWithUser } from '@/middleware/requireAuth.middleware'
import { Response, Router } from 'express'
import z from 'zod'
import * as CourseDtos from './course.dtos'
import CourseService from './course.service'

class CourseController {
  private static readonly prefix: string = '/courses'

  private static readonly courseService: typeof CourseService = CourseService

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
  private static readonly createCourse = async (path = this.path('/')) => {
    this.router.post(
      path,
      requireAuth(),
      requireRole([Role.INSTRUCTOR]),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const instractorId = req.locals.user.id

        const payload = CourseDtos.createCourseDto.parse(req.body)

        const course = await this.courseService.createCourse(
          instractorId,
          payload
        )

        const r = exres().success(201).data(course).exec()
        res.status(r.code).json(r)
      })
    )
  }

  private static readonly getCourses = async (path = this.path('/')) => {
    this.router.get(
      path,
      requireAuth({ passThrough: true }),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const instructorId =
          req.locals?.user.role === Role.INSTRUCTOR
            ? req.locals.user.id
            : undefined

        const payload = CourseDtos.getCoursesDto.parse(req.params)

        const courses = await this.courseService.getCourses({
          instructorId,
          ...payload,
        })

        const r = exres().success(200).data(courses).exec()
        res.status(r.code).json(r)
      })
    )
  }

  private static readonly getSingleCourse = async (
    path = this.path('/:courseId')
  ) => {
    this.router.get(
      path,
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const courseId = z.uuid().parse(req.params.courseId) as ID
        const course = await this.courseService.getSingleCourse(courseId)

        const r = exres().success(200).data(course).exec()
        res.status(r.code).json(r)
      })
    )
  }

  private static readonly updateCourse = async (
    path = this.path('/:courseId')
  ) => {
    this.router.patch(
      path,
      requireAuth(),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const courseId = z.uuid().parse(req.params.courseId) as ID
        const instructorId = req.locals.user.id
        const payload = CourseDtos.updateCourseDto.parse(req.body)

        const course = await this.courseService.updateCourse(
          courseId,
          instructorId,
          payload
        )

        const r = exres()
          .success(200)
          .data(course)
          .message('Course updated')
          .exec()
        res.status(r.code).json(r)
      })
    )
  }

  private static readonly updateCoursePrice = async (
    path = this.path('/:courseId/price')
  ) => {
    this.router.patch(
      path,
      requireAuth(),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const courseId = z.uuid().parse(req.params.courseId) as ID
        const instructorId = req.locals.user.id
        const payload = CourseDtos.updateCoursePriceDto.parse(req.body)

        const course = await this.courseService.updateCoursePrice(
          courseId,
          instructorId,
          payload
        )

        const r = exres()
          .success(200)
          .data(course)
          .message('Course price updated')
          .exec()
        res.status(r.code).json(r)
      })
    )
  }

  private static readonly reserveCourse = async (
    path = this.path('/:courseId/reserveSeat')
  ) => {
    this.router.patch(
      path,
      requireSrvAuth(),
      requireAuth(),
      requireRole([Role.USER]),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const courseId = z.uuid().parse(req.params.courseId) as ID
        const userId = z.uuid().parse(req.locals.user.id) as ID

        await this.courseService.reserveCourse(courseId, userId)

        const r = exres()
          .success(200)
          .data({ courseId })
          .message('Course reserved successfully.')
          .message('Pay before expiration.')
          .exec()
        res.status(r.code).json(r)
      })
    )
  }

  private static readonly confirmBooking = async (
    path = this.path('/:courseId/confirm')
  ) => {
    this.router.patch(
      path,
      requireSrvAuth(),
      requireAuth(),
      requireRole([Role.USER]),
      catchAsync(async (req: ReqWithUser, res: Response) => {
        const courseId = z.uuid().parse(req.params.courseId) as ID
        const userId = z.uuid().parse(req.locals.user.id) as ID

        await this.courseService.confirmBooking(courseId, userId)

        const r = exres()
          .success(200)
          .data({ courseId })
          .message('Course confirmed successfully.')
          .exec()
        res.status(r.code).json(r)
      })
    )
  }
}

export default CourseController.module as Router
