import { type UUID, randomUUID } from 'node:crypto'

export type ID = UUID

export enum OrderStatus {
  AWAITING_PAYMENT = 'awaiting_payment',
  CANCELLED = 'cancelled',
  PAID = 'paid',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export interface IOrderInfo {
  id: ID
  courseId: ID
  userId: ID
  price: number
  status: OrderStatus
  courseVersion: number
  payBy: Date
  cancelBy: Date
  expiresAt: Date
  updatedAt: Date
  createdAt: Date
}

/**
 * orderID -> orderDetails
 */
export const ORDER = new Map<ID, IOrderInfo>()

export const generateId = randomUUID
