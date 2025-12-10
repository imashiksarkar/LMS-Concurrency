import { Request, Response, Router } from 'express'
import { catchAsync } from '@/libs'
import CourseService from './course.service'
import * as CourseDtos from './course.dtos'

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
  private static readonly test = async (path = this.path('/')) => {
    this.router.post(
      path,
      catchAsync(async (req: Request, res: Response) => {})
    )
  }
}

export default CourseController.module as Router
