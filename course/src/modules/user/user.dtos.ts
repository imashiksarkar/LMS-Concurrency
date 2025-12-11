import { ID } from '@/db'
import z from 'zod'

export const createUserDto = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
})

export const getUserDto = z
  .object({
    userId: z.uuid(),
  })
  .transform(({ userId }) => ({ userId: userId as ID }))

export type CreateUserDto = z.infer<typeof createUserDto>
