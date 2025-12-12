import { constants } from '@/config'
import { exres } from '@/libs'
import type { UUID } from 'node:crypto'

export type ID = UUID

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

export interface ISession {
  sub: ID
  email: string
  role: Role
  expiresAt: number
  salt: ID
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

enum ReservationStatus {
  ALLOCATED = 'allocated',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  CONFIRMED = 'confirmed',
}

export class Reservation {
  private readonly SEATS_BOOKED = new Map<ID, number>() // courseId, seatsBooked
  private readonly COURSE_RESERVATION = new Map<
    ID,
    Map<
      ID,
      {
        courseId: ID
        userId: ID
        expiresAt: Date
        status: ReservationStatus
      }
    >
  >() // userId

  readonly reserve = async (courseId: ID, userId: ID) => {
    const totalSeats = COURSE.get(courseId)?.seats ?? 0
    const reservedSeats = this.SEATS_BOOKED.get(courseId) ?? 0
    const isSeatsAvailable = reservedSeats < totalSeats

    if (!isSeatsAvailable)
      throw exres().error(400).message('Seats not available').exec()

    const reservation = this.COURSE_RESERVATION.get(userId)
    if (!reservation) this.COURSE_RESERVATION.set(userId, new Map())

    const reservationInfo = reservation?.get(courseId)
    if (reservationInfo) {
      const isReserved = [
        ReservationStatus.CONFIRMED,
        ReservationStatus.ALLOCATED,
      ].includes(reservationInfo.status)
      if (isReserved) return { reservationInfo, isNew: false }
    }

    const expiresAt = new Date(
      Date.now() + constants.COURSE_RESERVATION_EXPIRY_MINUTES * 60 * 1000
    )
    this.SEATS_BOOKED.set(courseId, reservedSeats + 1)
    this.COURSE_RESERVATION.get(userId)!.set(courseId, {
      courseId,
      userId,
      expiresAt,
      status: ReservationStatus.ALLOCATED,
    })

    const extendedExpiresAt = new Date(expiresAt.getTime())
    extendedExpiresAt.setMinutes(extendedExpiresAt.getMinutes() + 1) // extend by 2 minutes
    this.releaseCourseReservation(courseId, userId, extendedExpiresAt) // release in the background

    return {
      reservationInfo: this.COURSE_RESERVATION.get(userId)!.get(courseId)!,
      isNew: true,
    }
  }

  readonly getAvailableSeats = async (courseId: ID) => {
    const totalSeats = COURSE.get(courseId)?.seats ?? 0
    const reservedSeats = this.SEATS_BOOKED.get(courseId) ?? 0
    return totalSeats - reservedSeats
  }

  readonly releaseCourseReservation = async (
    courseId: ID,
    userId: ID,
    releaseAt: Date
  ) => {
    const now = Date.now()
    const releaseAtTime = releaseAt.getTime()
    const delay = releaseAtTime - now

    setTimeout(() => {
      const reservationInfo =
        this.COURSE_RESERVATION.get(userId)?.get(courseId)?.status

      if (reservationInfo !== ReservationStatus.ALLOCATED) return

      this.SEATS_BOOKED.set(courseId, this.SEATS_BOOKED.get(courseId)! - 1)
      this.COURSE_RESERVATION.get(userId)?.delete(courseId)
    }, delay)
  }

  private readonly isValidReservation = async (courseId: ID, userId: ID) => {
    const reservationInfo = this.COURSE_RESERVATION.get(userId)?.get(courseId)

    if (!reservationInfo) return false

    const now = new Date().getTime()
    const expiresAt = reservationInfo.expiresAt.getTime()
    const timeDelta = expiresAt - now

    if (reservationInfo?.status !== ReservationStatus.ALLOCATED) return false
    if (timeDelta < 200) {
      this.SEATS_BOOKED.set(courseId, this.SEATS_BOOKED.get(courseId)! - 1)
      this.COURSE_RESERVATION.get(userId)?.delete(courseId)
      return false
    }

    return true
  }

  private readonly deplay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  readonly confirmBooking = async (courseId: ID, userId: ID) => {
    const isValid = await this.isValidReservation(courseId, userId)

    this.releaseCourseReservation(courseId, userId, new Date())
    await this.deplay(10)

    const course = COURSE.get(courseId)
    if (!course) throw exres().error(404).message('Course not found').exec()

    COURSE.set(courseId, {
      ...course,
      seats: course.seats - 1,
    })

    if (!isValid) throw exres().error(400).message('Invalid reservation').exec()
  }
}
