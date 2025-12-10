import crypto from 'node:crypto'

export type ID = string

export enum Role {
  USER = 'user',
  INSTRUCTOR = 'instructor',
}

export interface IAuth {
  id: ID
  email: string // unique
  password: string
  role: Role
  updatedAt: Date
  createdAt: Date
}

export interface IUser {
  id: ID // auth id (fk)
  firstName: string
  lastName: string
  updatedAt: Date
  createdAt: Date
}

export const AUTH_EMAIL_INDEX = new Map<string, ID>()
export const AUTH = new Map<ID, IAuth>()

export const USER = new Map<ID, IUser>()

export const SESSION = new Set<string>()

export const generateID = (): ID => crypto.randomUUID()

export interface ICourse {
  id: ID
  title: string
  content: string
  price: number
  seats: number
  instructorId: ID
  version: number
  updatedAt: Date
  createdAt: Date
}

export const COURSE = new Map<ID, ICourse>()
