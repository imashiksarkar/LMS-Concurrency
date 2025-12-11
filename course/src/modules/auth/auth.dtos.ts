import z from 'zod'
import { createUserDto } from '../user/user.dtos'
import { Role } from '@/db'

const createAuthDto = z.object({
  email: z.email(),
  password: z.string().min(6).max(32),
  role: z.enum(Role).optional().default(Role.USER),
})

export const signInDto = z.object({
  email: z.email(),
  password: z.string().min(6).max(32),
})

export const signUpDto = createAuthDto.extend(createUserDto.shape)

export type CreateAuthDto = z.infer<typeof createAuthDto>
export type SignUpDto = z.infer<typeof signUpDto>
export type SignInDto = z.infer<typeof signInDto>
