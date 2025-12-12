import { ID } from '@/db'
import z from 'zod'

export const createCourseDto = z.object({
  title: z.string().min(1).max(50),
  content: z.string().min(1).max(5000),
  price: z.number().min(5),
  seats: z.number().min(0),
})

export const updateCourseDto = createCourseDto
  .omit({ price: true, seats: true })
  .partial()
export const updateCoursePriceDto = createCourseDto.pick({ price: true })

export const getCoursesDto = z.object({
  limit: z.number().optional().default(10),
  skip: z.number().optional().default(0),
})

export type CreateCourseDto = z.infer<typeof createCourseDto>
export type UpdateCourseDto = z.infer<typeof updateCourseDto>
export type UpdateCoursePriceDto = z.infer<typeof updateCoursePriceDto>
export type GetCoursesDto = z.infer<typeof getCoursesDto>
