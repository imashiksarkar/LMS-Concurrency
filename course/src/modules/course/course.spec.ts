import initApp from '@/app'
import { AUTH, AUTH_EMAIL_INDEX, COURSE, Role, SESSION, USER } from '@/db'
import { faker } from '@faker-js/faker'
import { Express } from 'express'
import request from 'supertest'
import { CreateCourseDto } from './course.dtos'
import { SignUpDto } from '@/modules/auth/auth.dtos'

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
  })
})
