import initApp from '@/app'
import { ORDER } from '@/db'
import { faker } from '@faker-js/faker'
import { Express } from 'express'
import request from 'supertest'
import { PayOrderDto } from './order.dtos'

beforeEach(() => {
  ORDER.clear()
})

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
      let courseServiceUrl = 'http://localhost:5000'
      let app: Express
      beforeAll(async () => {
        app = await initApp()
      })

      it('should be defined', () => {
        expect(app).toBeDefined()
      })

      it('should be able to create an order', async () => {
        const instructorPayload = getSignUpPayload()
        instructorPayload.role = 'instructor'
        await fetch(courseServiceUrl + '/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(instructorPayload),
        })

        const signInAsInstructor: any = await fetch(
          courseServiceUrl + '/auth/signin',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: instructorPayload.email,
              password: instructorPayload.password,
            }),
          }
        ).then((res) => res.json())
        const instructorSession = signInAsInstructor.data.session

        const coursePayload = getCreateCoursePayload()
        const courseId = await fetch(courseServiceUrl + '/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session': instructorSession,
          },
          body: JSON.stringify(coursePayload),
        })
          .then((res) => res.json())
          .then((res: any) => res.data.id)

        const userPayload = getSignUpPayload()
        await fetch(courseServiceUrl + '/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userPayload),
        })
        const signIn: any = await fetch(courseServiceUrl + '/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userPayload.email,
            password: userPayload.password,
          }),
        }).then((res) => res.json())
        const session = signIn.data.session

        const res = await request(app)
          .post('/orders')
          .set('x-session', session)
          .send({
            courseId,
          })

        expect(res.status).toBe(201)
        expect(res.body.data.status).toBe('awaiting_payment')
      })

      it('should be able to pay for a valid order', async () => {
        const instructorPayload = getSignUpPayload()
        instructorPayload.role = 'instructor'
        await fetch(courseServiceUrl + '/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(instructorPayload),
        })

        const signInAsInstructor: any = await fetch(
          courseServiceUrl + '/auth/signin',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: instructorPayload.email,
              password: instructorPayload.password,
            }),
          }
        ).then((res) => res.json())
        const instructorSession = signInAsInstructor.data.session

        const coursePayload = getCreateCoursePayload()
        const courseId = await fetch(courseServiceUrl + '/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session': instructorSession,
          },
          body: JSON.stringify(coursePayload),
        })
          .then((res) => res.json())
          .then((res: any) => res.data.id)

        const userPayload = getSignUpPayload()
        await fetch(courseServiceUrl + '/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userPayload),
        })
        const signIn: any = await fetch(courseServiceUrl + '/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userPayload.email,
            password: userPayload.password,
          }),
        }).then((res) => res.json())
        const session = signIn.data.session

        const orderRes = await request(app)
          .post('/orders')
          .set('x-session', session)
          .send({
            courseId,
          })
        const orderId = orderRes.body.data.id

        const validCard = {
          number: '4242 4242 4242 4242',
          cvc: '123',
          expiry: '12/12',
        } satisfies PayOrderDto

        const paymentRes = await request(app)
          .post(`/orders/${orderId}/pay`)
          .set('x-session', session)
          .send(validCard)

        expect(paymentRes.status).toBe(200)
        expect(paymentRes.body.data.status).toBe('paid')
      })
    })
  })
})
