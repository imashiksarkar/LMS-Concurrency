import initApp from '@/app'
import { AUTH, AUTH_EMAIL_INDEX, Role, SESSION, USER } from '@/db'
import { faker } from '@faker-js/faker'
import { Express } from 'express'
import request from 'supertest'

beforeEach(() => {
  USER.clear()
  AUTH.clear()
  AUTH_EMAIL_INDEX.clear()
  SESSION.clear()
})

const getSignUpPayload = () => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  role: Role.USER,
})

describe.only('User Service', () => {
  describe('- E2E', () => {
    let app: Express
    beforeAll(async () => {
      app = await initApp()
    })

    it('should be defined', () => {
      expect(app).toBeDefined()
    })

    it('should get own profile', async () => {
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

      const profileRes = await request(app)
        .get('/users/profile')
        .set('x-session', session)

      expect(profileRes.status).toBe(200)
      expect(profileRes.body.firstName).toBe(payload.firstName)
    })

    it('should user profile as anonymous', async () => {
      const payload = getSignUpPayload()
      const signUpRes = await request(app)
        .post('/auth/signup')
        .send(payload)
        .expect(201)

      const profileRes = await request(app).get(
        `/users/${signUpRes.body.data.userId}`
      )

      expect(profileRes.status).toBe(200)
      expect(profileRes.body.firstName).toBe(payload.firstName)
    })
  })
})
