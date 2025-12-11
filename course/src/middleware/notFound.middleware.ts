import { Request, Response } from 'express'

const notFoundHandler = () => (_req: Request, res: Response) => {
  res.status(404).send({
    success: false,
    error: {
      code: 404,
      message: ['Route not found'],
    },
  })
}

export default notFoundHandler
