import initApp from '@/app'
import { AUTH, AUTH_EMAIL_INDEX, COURSE, Role, SESSION, USER } from '@/db'
import { SignUpDto } from '@/modules/auth/auth.dtos'
import { faker } from '@faker-js/faker'
import { Express } from 'express'
import request from 'supertest'
import { CreateCourseDto } from './course.dtos'
import CourseService from './course.service'

beforeEach(() => {
  USER.clear()
  AUTH.clear()
  AUTH_EMAIL_INDEX.clear()
  SESSION.clear()
  COURSE.clear()
})

const getSignUpPayload = () =>
  ({
    email: faker.internet.email(),
    password: faker.internet.password(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: Role.USER as Role,
  } satisfies SignUpDto)

const getCreateCoursePayload = () =>
  ({
    content: faker.lorem.paragraph(),
    title: faker.lorem.words(),
    price: faker.number.int(),
    seats: faker.number.int(),
  } satisfies CreateCourseDto)

describe('Course Module', () => {
  describe('- E2E', () => {
    let app: Express
    beforeAll(async () => {
      app = await initApp()
    })

    it('should be defined', () => {
      expect(app).toBeDefined()
    })

    // helper functions
    const instructorSignin = async () => {
      const payload = getSignUpPayload()
      payload.role = Role.INSTRUCTOR

      await request(app).post('/auth/signup').send(payload).expect(201)

      const instractor = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)

      return {
        payload,
        session: instractor.body.data.session,
      }
    }

    const userSignin = async () => {
      const payload = getSignUpPayload()

      await request(app).post('/auth/signup').send(payload).expect(201)

      const user = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)

      return {
        payload,
        id: user.body.data.userId,
        session: user.body.data.session,
      }
    }

    it('should allow an instructor to create a course', async () => {
      const payload = getSignUpPayload()
      payload.role = Role.INSTRUCTOR

      await request(app).post('/auth/signup').send(payload).expect(201)

      const logInRes = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)
      const session = logInRes.body.data.session

      // create a course
      const coursepayload = getCreateCoursePayload()
      const courseRes = await request(app)
        .post('/courses')
        .set('x-session', session)
        .send(coursepayload)

      expect(courseRes.status).toBe(201)
      expect(courseRes.body.data.title).toBe(coursepayload.title)
    })

    it('should not allow an user to create a course', async () => {
      const payload = getSignUpPayload()

      await request(app).post('/auth/signup').send(payload).expect(201)

      const logInRes = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)
      const session = logInRes.body.data.session

      // create a course
      const coursepayload = getCreateCoursePayload()
      const courseRes = await request(app)
        .post('/courses')
        .set('x-session', session)
        .send(coursepayload)

      expect(courseRes.status).toBe(403)
      expect(courseRes.body.error.message[0]).toMatch(/not allowed/i)
    })

    it('should be able to get a single course', async () => {
      const payload = getSignUpPayload()
      payload.role = Role.INSTRUCTOR

      await request(app).post('/auth/signup').send(payload).expect(201)

      const logInRes = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)
      const session = logInRes.body.data.session

      // create a course
      const coursepayload = getCreateCoursePayload()
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', session)
        .send(coursepayload)
        .expect(201)

      const getCourseRes = await request(app).get(
        `/courses/${createCourseRes.body.data.id}`
      )

      expect(getCourseRes.status).toBe(200)
      expect(getCourseRes.body.data.id).toBe(createCourseRes.body.data.id)
    })

    it('should be able to get all courses', async () => {
      const payload = getSignUpPayload()
      payload.role = Role.INSTRUCTOR

      await request(app).post('/auth/signup').send(payload).expect(201)

      const logInRes = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)
      const session = logInRes.body.data.session

      // create a courses
      const numCourses = 5
      await Promise.all(
        Array.from({ length: numCourses }, async () => {
          const coursepayload = getCreateCoursePayload()
          await request(app)
            .post('/courses')
            .set('x-session', session)
            .send(coursepayload)
            .expect(201)
        })
      )

      const getCoursseRes = await request(app).get(`/courses`)

      expect(getCoursseRes.status).toBe(200)
      expect(getCoursseRes.body.data).toHaveLength(numCourses)
    })

    it("shows an instructor's own courses", async () => {
      const payload1 = getSignUpPayload()
      payload1.role = Role.INSTRUCTOR

      const payload2 = getSignUpPayload()
      payload2.role = Role.INSTRUCTOR

      await request(app).post('/auth/signup').send(payload1).expect(201)
      await request(app).post('/auth/signup').send(payload2).expect(201)

      const instractor1 = await request(app)
        .post('/auth/signin')
        .send({
          email: payload1.email,
          password: payload1.password,
        })
        .expect(200)
      const session1 = instractor1.body.data.session

      const instractor2 = await request(app)
        .post('/auth/signin')
        .send({
          email: payload2.email,
          password: payload2.password,
        })
        .expect(200)
      const session2 = instractor2.body.data.session

      // create a courses
      const numCourses = 5
      await Promise.all(
        Array.from({ length: numCourses }, async () => {
          const coursepayload = getCreateCoursePayload()
          await request(app)
            .post('/courses')
            .set('x-session', session1)
            .send(coursepayload)
            .expect(201)
        })
      )

      await Promise.all(
        Array.from({ length: numCourses }, async () => {
          const coursepayload = getCreateCoursePayload()
          await request(app)
            .post('/courses')
            .set('x-session', session2)
            .send(coursepayload)
            .expect(201)
        })
      )

      const getCoursseRes1 = await request(app)
        .get(`/courses`)
        .set('x-session', session1)

      expect(getCoursseRes1.status).toBe(200)
      expect(getCoursseRes1.body.data).toHaveLength(numCourses)
    })

    it('should be able to update a course as an owner', async () => {
      const payload = getSignUpPayload()
      payload.role = Role.INSTRUCTOR

      await request(app).post('/auth/signup').send(payload).expect(201)

      const instractor1 = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)
      const session = instractor1.body.data.session

      // create a course
      const coursepayload = getCreateCoursePayload()
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', session)
        .send(coursepayload)
        .expect(201)

      const courseId = createCourseRes.body.data.id

      // update a course
      const updateCoursePayload = getCreateCoursePayload()

      // @ts-ignore
      delete updateCoursePayload.content

      const updateCourseRes = await request(app)
        .patch(`/courses/${courseId}`)
        .set('x-session', session)
        .send(updateCoursePayload)

      expect(updateCourseRes.status).toBe(200)
      expect(updateCourseRes.body.data.title).toBe(updateCoursePayload.title)
    })

    it('should be not able to update a course as not an owner', async () => {
      const instractor1 = await instructorSignin()
      const instractor2 = await instructorSignin()

      // create a course
      const coursepayload = getCreateCoursePayload()
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor1.session)
        .send(coursepayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // update a course
      const updateCoursePayload = getCreateCoursePayload()

      // @ts-ignore
      delete updateCoursePayload.content

      const updateCourseRes = await request(app)
        .patch(`/courses/${courseId}`)
        .set('x-session', instractor2.session)
        .send(updateCoursePayload)

      expect(updateCourseRes.status).toBe(403)
      expect(updateCourseRes.body.error.message[0]).toMatch(/not allowed/i)
    })

    it('should be able to update price of a course as an owner', async () => {
      const instractor = await instructorSignin()

      // create a course
      const coursepayload = getCreateCoursePayload()
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursepayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // update a course
      const updateCourseRes = await request(app)
        .patch(`/courses/${courseId}/price`)
        .set('x-session', instractor.session)
        .send({
          price: 20,
        })

      expect(updateCourseRes.status).toBe(200)
      expect(updateCourseRes.body.data.price).toBe(20)
    })

    it('should be not able to update price of a course as not an owner', async () => {
      const instractor = await instructorSignin()
      const instractor2 = await instructorSignin()

      // create a course
      const coursepayload = getCreateCoursePayload()
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursepayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // update a course
      const updateCourseRes = await request(app)
        .patch(`/courses/${courseId}/price`)
        .set('x-session', instractor2.session)
        .send({
          price: 20,
        })

      expect(updateCourseRes.status).toBe(403)
      expect(updateCourseRes.body.error.message[0]).toMatch(/not allowed/i)
    })

    it('should be able to reserve a course as a user', async () => {
      const instractor = await instructorSignin()
      const user = await userSignin()

      // create a course
      const coursepayload = getCreateCoursePayload()
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursepayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // reserve a course
      const reserveCourseRes = await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)

      expect(reserveCourseRes.status).toBe(200)
      expect(reserveCourseRes.body.message[0]).toMatch(/successful/i)
    })

    it('should not allow a user to reserve twice', async () => {
      const instractor = await instructorSignin()
      const user = await userSignin()

      // create a course
      const coursePayload = getCreateCoursePayload()
      coursePayload.seats = 5
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursePayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // reserve a course
      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)

      const reserveCourseRes = await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)

      expect(reserveCourseRes.status).toBe(400)
      expect(reserveCourseRes.body.error.message[0]).toMatch(/reserved/i)
    })

    it('should allow a multiple user to reserve', async () => {
      const instractor = await instructorSignin()
      const user = await userSignin()
      const user2 = await userSignin()

      // create a course
      const coursePayload = getCreateCoursePayload()
      coursePayload.seats = 5
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursePayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // reserve a course
      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)

      const reserveCourseRes = await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user2.session)

      expect(reserveCourseRes.status).toBe(200)
      expect(reserveCourseRes.body.message[0]).toMatch(/successful/i)
    })

    it('should not allow a multiple user to reserve more than allowed (race condition)', async () => {
      const instractor = await instructorSignin()

      // create a course
      const coursePayload = getCreateCoursePayload()
      coursePayload.seats = 2
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursePayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // reserve a course
      const concurrentRaces = 5

      const sessions: string[] = await Promise.all(
        Array.from({ length: concurrentRaces }, () => userSignin())
      ).then((res) => res.map((r) => r.session))

      const races = Array.from({ length: concurrentRaces }).map(
        async (_, index) =>
          request(app)
            .patch(`/courses/${courseId}/reserveSeat`)
            .set('x-session', sessions[index])
      )

      const res = await Promise.all(races).then((res) =>
        res.map((r) => ({
          success: r.body.success,
          message: r.body?.message?.[0] ?? r.body?.error?.message?.[0],
        }))
      )

      const success = res.filter((r) => r.success).length
      const failure = res.filter((r) => !r.success).length

      expect(success).toBe(coursePayload.seats)
      expect(failure).toBe(concurrentRaces - coursePayload.seats)
    })

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    it('should allow a user to reserve after expiration', async () => {
      const instractor = await instructorSignin()
      const user = await userSignin()

      // create a course
      const coursePayload = getCreateCoursePayload()
      coursePayload.seats = 2
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursePayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // reserve a course
      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)
        .expect(200)
      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)
        .expect(400)

      const now = new Date()
      CourseService.reservation.releaseCourseReservation(courseId, user.id, now)
      await delay(20)

      const res = await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)

      expect(res.status).toBe(200)
      expect(res.body.message[0]).toMatch(/successful/i)
    })

    it('should not allow a user to reserve before expiration', async () => {
      const instractor = await instructorSignin()
      const user = await userSignin()

      // create a course
      const coursePayload = getCreateCoursePayload()
      coursePayload.seats = 2
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursePayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      // reserve a course
      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)
        .expect(200)
      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)
        .expect(400)

      const now = new Date()
      now.setMilliseconds(now.getMilliseconds() + 200)
      CourseService.reservation.releaseCourseReservation(courseId, user.id, now)
      await delay(170)

      const res = await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)

      expect(res.status).toBe(400)
      expect(res.body.error.message[0]).toMatch(/reserved/i)
    })

    it('should make the slots permanently reserved after payment confirmation', async () => {
      const instractor = await instructorSignin()
      const user = await userSignin()

      // create a course
      const coursePayload = getCreateCoursePayload()
      coursePayload.seats = 2
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursePayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)
        .expect(200)

      const confirmRes = await request(app)
        .patch(`/courses/${courseId}/confirm`)
        .set('x-session', user.session)

      expect(confirmRes.status).toBe(200)
      expect(confirmRes.body.message[0]).toMatch(/confirmed/i)
    })

    it('should not allow duplicte cinfirmation', async () => {
      const instractor = await instructorSignin()
      const user = await userSignin()

      // create a course
      const coursePayload = getCreateCoursePayload()
      coursePayload.seats = 2
      const createCourseRes = await request(app)
        .post('/courses')
        .set('x-session', instractor.session)
        .send(coursePayload)
        .expect(201)
      const courseId = createCourseRes.body.data.id

      await request(app)
        .patch(`/courses/${courseId}/reserveSeat`)
        .set('x-session', user.session)
        .expect(200)

      await request(app)
        .patch(`/courses/${courseId}/confirm`)
        .set('x-session', user.session)
        .expect(200)
      const confirmRes = await request(app)
        .patch(`/courses/${courseId}/confirm`)
        .set('x-session', user.session)

      expect(confirmRes.status).toBe(400)
      expect(confirmRes.body.error.message[0]).toMatch(/invalid/i)
    })
  })
})
