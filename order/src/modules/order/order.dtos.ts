import z from 'zod'

export const payOrderDto = z.object({
  number: z.string().nonempty(),
  cvc: z.string().nonempty(),
  expiry: z.string().nonempty(),
})

export type PayOrderDto = z.infer<typeof payOrderDto>
