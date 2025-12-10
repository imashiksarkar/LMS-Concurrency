import { NextFunction, Request, Response } from 'express'

const catchAsync =
  <T = undefined>(cb: Function) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return (await cb(req, res, next)) as T
    } catch (error) {
      next(error)
    }
  }

export default catchAsync