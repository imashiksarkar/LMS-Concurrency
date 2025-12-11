import { Mutex } from 'async-mutex'
import { COURSE, generateID, ICourse, ID, Reservation } from '@/db'
import { exres } from '@/libs'
import {
  CreateCourseDto,
  GetCoursesDto,
  UpdateCourseDto,
  UpdateCoursePriceDto,
} from './course.dtos'
import { constants } from '@/config'

interface GetCoursesOptions extends GetCoursesDto {
  instructorId?: ID
}

export default class CourseService {
  private static readonly mutex = new Mutex()
  private static readonly reservation = new Reservation()

  static readonly createCourse = async (
    instructorId: ID,
    payload: CreateCourseDto
  ): Promise<ICourse> => {
    const id = generateID()

    const course = COURSE.set(id, {
      id,
      ...payload,
      instructorId: instructorId,
      version: 1,
      updatedAt: new Date(),
      createdAt: new Date(),
    })

    return course.get(id)!
  }

  static readonly getSingleCourse = async (courseId: ID) => {
    const course = COURSE.get(courseId)

    if (!course) throw exres().error(404).message('Course not found').exec()

    return course
  }

  private static readonly getCoursesAsAnonymous = async (
    options: GetCoursesOptions
  ) => {
    if (options.instructorId) return

    return Array.from(COURSE.values()).splice(options.skip || 0, options.limit)
  }
  // get own courses
  private static readonly getCoursesAsInstructor = async (
    options: GetCoursesOptions
  ) => {
    if (!options.instructorId) return

    const courses: ICourse[] = []

    COURSE.forEach((course) => {
      if (course.instructorId === options.instructorId) courses.push(course)
    })

    return courses.splice(options.skip || 0, options.limit)
  }

  static readonly getCourses = async (options: GetCoursesOptions) => {
    const courses = await Promise.all([
      this.getCoursesAsAnonymous(options),
      this.getCoursesAsInstructor(options),
    ]).then((res) => res.find((c) => !!c))

    if (!courses)
      throw exres().error(500).message('Error fetching courses').exec()

    return courses
  }

  static readonly updateCourse = async (
    courseId: ID,
    instructorId: ID,
    payload: UpdateCourseDto
  ): Promise<ICourse> => {
    const course = COURSE.get(courseId)
    if (!course) throw exres().error(404).message('Course not found').exec()
    else if (course.instructorId !== instructorId)
      throw exres().error(403).message('Not allowed').exec()

    COURSE.set(courseId, {
      ...course,
      ...payload,
      version: course.version + 1,
      updatedAt: new Date(),
    })

    return COURSE.get(courseId)!
  }

  static readonly updateCoursePrice = async (
    courseId: ID,
    instractorId: ID,
    payload: UpdateCoursePriceDto
  ): Promise<ICourse> => {
    const course = COURSE.get(courseId)
    if (!course) throw exres().error(404).message('Course not found').exec()
    else if (course.instructorId !== instractorId)
      throw exres().error(403).message('Not allowed').exec()

    COURSE.set(courseId, {
      ...course,
      ...payload,
      version: course.version + 1,
      updatedAt: new Date(),
    })

    return COURSE.get(courseId)!
  }

  static readonly reserveCourse = async (courseId: ID, userId: ID) => {
    return await this.mutex.runExclusive(async () => {
      const course = COURSE.get(courseId)
      if (!course) throw exres().error(404).message('Course not found').exec()

      for (let attempt = 0; attempt < constants.BOOKING_ATTEMPTS; attempt++) {
        const isReserved = await this.reservation.reserve(courseId, userId)

        if (isReserved) return isReserved

        await this.delay(10) // wait 10ms
      }

      throw exres().error(500).message('Failed to reserve course').exec()
    })
  }

  private static readonly delay = async (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
