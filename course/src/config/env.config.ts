import z from 'zod'

const envDto = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production', 'dev', 'prod'])
      .default('test'),
    PORT: z.coerce.number().default(3000),
    // OODER_SERVICE_URL: z.string().trim().min(2),
  })
  .transform((e) => ({
    ...e,
    IS_PRODUCTION: ['production', 'prod'].includes(e.NODE_ENV),
    IS_DEVELOPMENT: ['development', 'dev'].includes(e.NODE_ENV),
    IS_TEST: ['test'].includes(e.NODE_ENV),
  }))

const validated = envDto.safeParse(process.env)

if (!validated.success) {
  console.error(z.treeifyError(validated.error))
  process.exit(1)
}

export default validated.data
