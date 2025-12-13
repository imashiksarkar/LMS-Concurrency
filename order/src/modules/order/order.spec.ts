import initApp from '@/app'
import { ORDER } from '@/db'
import { faker } from '@faker-js/faker'
import { Express } from 'express'
import request from 'supertest'
import { PayOrderDto } from './order.dtos'

beforeEach(() => {
  ORDER.clear()
})

process.env.SERVICE_SESSION = 'acebe65b-232f-415d-b56a-2b901ce53d2b'

describe('- Order Service', () => {
  const getSignUpPayload = () => ({
    email: faker.internet.email(),
    password: faker.internet.password(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'user',
  })

  const getCreateCoursePayload = () => ({
    content: faker.lorem.paragraph(),
    title: faker.lorem.words(),
    price: faker.number.int(),
    seats: faker.number.int(),
  })

  describe('- Order Module', () => {
    describe('- E2E', () => {
      let courseServiceUrl = 'http://localhost:8080/course-srv'
      let app: Express
      beforeAll(async () => {
        app = await initApp()
      })

      it('should be defined', () => {
        expect(app).toBeDefined()
      })

      it('checks course service health', async () => {
        const orderSrvHealthRes = await request(courseServiceUrl).get('/health')

        expect(orderSrvHealthRes.status).toBe(200)
      })

      it('should be able to create an order', async () => {
        const instructorPayload = getSignUpPayload()
        instructorPayload.role = 'instructor'

        const instructorSignUpRes = await request(courseServiceUrl)
          .post('/auth/signup')
          .send(instructorPayload)

        expect(instructorSignUpRes.status).toBe(201)

        const signInAsInstructor = await request(courseServiceUrl)
          .post('/auth/signin')
          .send({
            email: instructorPayload.email,
            password: instructorPayload.password,
          })

        expect(signInAsInstructor.status).toBe(200)
        const instructorSession = signInAsInstructor.body.data.session
        expect(instructorSession).toBeDefined()

        const coursePayload = getCreateCoursePayload()
        const createCourseRes = await request(courseServiceUrl)
          .post('courses')
          .send(coursePayload)
          .set('x-session', instructorSession)

        expect(createCourseRes.status).toBe(201)
        const courseId = createCourseRes.body.data.id
        expect(courseId).toBeDefined()

        const userPayload = getSignUpPayload()
        const userSignUpRes = await request(courseServiceUrl)
          .post('/auth/signup')
          .send(userPayload)

        expect(userSignUpRes.status).toBe(201)

        const userSignInRes = await request(courseServiceUrl)
          .post('/auth/signin')
          .send({
            email: userPayload.email,
            password: userPayload.password,
          })

        expect(userSignInRes.status).toBe(200)
        const session = userSignInRes.body.data.session
        expect(session).toBeDefined()

        const createOrderRes = await request(app)
          .post('/orders')
          .set('x-session', session)
          .send({
            courseId,
          })

        expect(createOrderRes.status).toBe(201)
        expect(createOrderRes.body.data.status).toBe('awaiting_payment')
      })

      it('should be able to get orders', async () => {
        const instructorPayload = getSignUpPayload()
        instructorPayload.role = 'instructor'

        const instructorSignUpRes = await request(courseServiceUrl)
          .post('/auth/signup')
          .send(instructorPayload)

        expect(instructorSignUpRes.status).toBe(201)

        const signInAsInstructor = await request(courseServiceUrl)
          .post('/auth/signin')
          .send({
            email: instructorPayload.email,
            password: instructorPayload.password,
          })

        expect(signInAsInstructor.status).toBe(200)
        const instructorSession = signInAsInstructor.body.data.session
        expect(instructorSession).toBeDefined()

        const coursePayload = getCreateCoursePayload()
        const createCourseRes = await request(courseServiceUrl)
          .post('courses')
          .send(coursePayload)
          .set('x-session', instructorSession)

        expect(createCourseRes.status).toBe(201)
        const courseId = createCourseRes.body.data.id
        expect(courseId).toBeDefined()

        const userPayload = getSignUpPayload()
        const userSignUpRes = await request(courseServiceUrl)
          .post('/auth/signup')
          .send(userPayload)

        expect(userSignUpRes.status).toBe(201)

        const userSignInRes = await request(courseServiceUrl)
          .post('/auth/signin')
          .send({
            email: userPayload.email,
            password: userPayload.password,
          })

        expect(userSignInRes.status).toBe(200)
        const session = userSignInRes.body.data.session
        expect(session).toBeDefined()

        const createOrderRes = await request(app)
          .post('/orders')
          .set('x-session', session)
          .send({
            courseId,
          })

        expect(createOrderRes.status).toBe(201)
        expect(createOrderRes.body.data.status).toBe('awaiting_payment')

        const getOrderRes = await request(app)
          .get('/orders')
          .set('x-session', session)

        expect(getOrderRes.status).toBe(200)
        expect(getOrderRes.body.data).toHaveLength(1)
      })

      it('should be able to pay for a valid order', async () => {
        const instructorPayload = getSignUpPayload()
        instructorPayload.role = 'instructor'

        const instructorSignUpRes = await request(courseServiceUrl)
          .post('/auth/signup')
          .send(instructorPayload)
        expect(instructorSignUpRes.status).toBe(201)

        const instructorSignInRes = await request(courseServiceUrl)
          .post('/auth/signin')
          .send({
            email: instructorPayload.email,
            password: instructorPayload.password,
          })

        expect(instructorSignInRes.status).toBe(200)
        const instructorSession: string =
          instructorSignInRes?.body?.data?.session
        expect(instructorSession).toBeDefined()

        const coursePayload = getCreateCoursePayload()

        const createCourseRes = await request(courseServiceUrl)
          .post('/courses')
          .set('x-session', instructorSession)
          .send(coursePayload)

        expect(createCourseRes.status).toBe(201)
        const courseId: string = createCourseRes?.body?.data?.id
        expect(courseId).toBeDefined()

        const userPayload = getSignUpPayload()
        const userSignUpRes = await request(courseServiceUrl)
          .post('/auth/signup')
          .send(userPayload)

        expect(userSignUpRes.status).toBe(201)

        const userSignInRes = await request(courseServiceUrl)
          .post('/auth/signin')
          .send({
            email: userPayload.email,
            password: userPayload.password,
          })

        expect(userSignInRes.status).toBe(200)
        const userSsession = userSignInRes?.body?.data?.session
        expect(userSsession).toBeDefined()

        const orderRes = await request(app)
          .post('/orders')
          .set('x-session', userSsession)
          .send({
            courseId,
          })

        expect(orderRes.status).toBe(201)
        const orderId = orderRes.body.data.id

        const validCard = {
          number: '4242 4242 4242 4242',
          cvc: '123',
          expiry: '12/12',
        } satisfies PayOrderDto

        const paymentRes = await request(app)
          .post(`/orders/${orderId}/pay`)
          .set('x-session', userSsession)
          .send(validCard)

        expect(paymentRes.status).toBe(200)
        expect(paymentRes.body.data.status).toBe('paid')
      })
    })
  })
})
