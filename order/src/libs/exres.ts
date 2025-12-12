import { STATUS_CODES } from 'node:http'

type Data = Record<any, any> | Array<any>

export class Res {
  success = false
  code = 500
  status = 'UNKNOWN'
  data?: Data
  message?: string[]
  error?: {
    message: string[]
    fields?: {
      [key: string]: string[]
    }
  };
  [key: string]: any
}

class ExRes {
  constructor(private readonly res: Res) {}

  static readonly new = () => {
    const { success, error } = new ExRes(new Res())

    return { success, error }
  }

  exec = () => {
    if (!this.res.success) delete this.res.data
    if (!this.res.message?.length) delete this.res.message

    if (this.res.success) {
      delete this.res.error
      return this.res
    }

    if (!Object.keys(this.res.error?.fields ?? {}).length)
      delete this.res.error?.fields
    if (!this.res.error?.message!.length) delete this.res.error

    return this.res
  }

  message = (msg: string | string[]) => {
    if (this.res.success) {
      !this.res.message && (this.res.message = [])
      if (typeof msg === 'string') this.res.message?.push(msg)
      else this.res.message?.push(...msg)
    } else {
      !this.res.error && (this.res.error = { message: [] })
      if (typeof msg === 'string') this.res.error?.message?.push(msg)
      else this.res.error?.message?.push(...msg)
    }

    const { data, message, fields, exec, add } = this

    return {
      data,
      message,
      fields,
      exec,
      add,
    }
  }

  data = (data: Data) => {
    this.res.data = data

    const { message, exec, add } = this
    return { message, exec, add }
  }

  success = (code: number) => {
    this.res.success = true
    this.res.code = code
    this.res.status = STATUS_CODES[code] ?? 'Unknown'

    const { data, message, exec, add } = this
    return {
      data,
      message,
      exec,
      add,
    }
  }

  fields = (fields: { [key: string]: string[] }) => {
    this.res.error!.fields = fields

    const { message, exec, add } = this
    return { message, exec, add }
  }

  error = (code: number) => {
    this.res.success = false
    this.res.code = code
    this.res.status = STATUS_CODES[code] ?? 'Unknown'

    const { message, exec, add } = this
    return {
      message,
      exec,
      add,
    }
  }

  add = (key: string, value: any, shouldAdd = true) => {
    if (shouldAdd) this.res[key] = value

    const { message, exec } = this
    return { message, exec }
  }
}

export default ExRes.new
