import { COURSE, generateID, ICourse, ID } from '@/db'
import {
  CreateCourseDto,
  GetCoursesDto,
  UpdateCourseDto,
  UpdateCoursePriceDto,
} from './course.dtos'
import { exres } from '@/libs'

interface GetCoursesOptions extends GetCoursesDto {
  instructorId?: ID
}

export default class CourseService {
  private static readonly createCourse = async (
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

  private static readonly getSingleCourse = async (courseId: ID) => {
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

  private static readonly getCourses = async (options: GetCoursesOptions) => {
    const courses = await Promise.all([
      this.getCoursesAsAnonymous(options),
      this.getCoursesAsInstructor(options),
    ]).then((res) => res.find((c) => !!c))

    if (!courses)
      throw exres().error(500).message('Error fetching courses').exec()

    return courses
  }

  private static readonly updateCourse = async (
    courseId: ID,
    payload: UpdateCourseDto
  ): Promise<ICourse> => {
    const course = COURSE.get(courseId)

    if (!course) throw exres().error(404).message('Course not found').exec()

    COURSE.set(courseId, {
      ...course,
      ...payload,
      version: course.version + 1,
      updatedAt: new Date(),
    })

    return COURSE.get(courseId)!
  }

  private static readonly updateCoursePrice = async (
    courseId: ID,
    payload: UpdateCoursePriceDto
  ): Promise<ICourse> => {
    const course = COURSE.get(courseId)

    if (!course) throw exres().error(404).message('Course not found').exec()

    COURSE.set(courseId, {
      ...course,
      ...payload,
      version: course.version + 1,
      updatedAt: new Date(),
    })

    return COURSE.get(courseId)!
  }
}
