import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import z, { ZodError } from 'zod'
import response, { Res } from '@/libs/exres'

const serializeZodError = (err: ZodError) => {
  const error = z.treeifyError(err) as unknown as {
    properties: any | undefined
    errors: string[]
  }

  const fields = Object.keys(error?.properties ?? {}).reduce((acc, key) => {
    return {
      ...acc,
      [key]: error.properties[key].errors,
    }
  }, {})

  const errors = error.errors.length ? error.errors : ['Validation Error']

  return {
    errors,
    fields,
  }
}

const errorHandler =
  () =>
  (
    err: ErrorRequestHandler,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (err instanceof Res) return res.status(err.code).json(err)

    let e = response().error(500).message('Something went wrong').exec()

    if (err instanceof ZodError) {
      const fieldError = serializeZodError(err)
      e = response()
        .error(400)
        .message(fieldError.errors)
        .fields(fieldError.fields)
        .exec()
    } else if (err instanceof Error)
      e = response().error(500).message(err.message).exec()

    const code = /duplicate/gi.test(e.error!.message.join('\n')) ? 409 : null

    e = response()
      .error(code || e.code)
      .message(e.error!.message)
      .fields(e.error!.fields ?? {})
      .exec()

    res.status(e.code).json(e)
  }

export default errorHandler
