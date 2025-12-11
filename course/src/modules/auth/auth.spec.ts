import { Role, USER, AUTH, AUTH_EMAIL_INDEX, SESSION } from '@/db'
import AuthService from './auth.service'
import request from 'supertest'
import initApp from '@/app'
import { Express } from 'express'
import { faker } from '@faker-js/faker'

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

describe('Auth Service', () => {
  describe('- Unit & Integration', () => {
    it('should sign up a user', async () => {
      const result = await AuthService.signUp({
        email: 'email@gmail.com',
        password: 'password',
        firstName: 'Ashik',
        lastName: 'Sarkar',
        role: Role.USER,
      })

      expect(result).toBeDefined()
      expect(result.email).toEqual('email@gmail.com')
    })

    it('should sign in a user', async () => {
      await AuthService.signUp({
        email: 'email@gmail.com',
        password: 'password',
        firstName: 'Ashik',
        lastName: 'Sarkar',
        role: Role.USER,
      })

      const result = await AuthService.signIn({
        email: 'email@gmail.com',
        password: 'password',
      })

      expect(result).toBeDefined()
      expect(result.session).toBeDefined()
    })
  })

  describe('- E2E', () => {
    let app: Express
    beforeAll(async () => {
      app = await initApp()
    })

    it('should be defined', () => {
      expect(app).toBeDefined()
    })

    it('should sign up a user', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send(getSignUpPayload())

      expect(res.status).toBe(201)
      expect(res.body.message[0]).toMatch(/success/i)
    })

    it('should not sign up a duplicate user', async () => {
      const payload = getSignUpPayload()
      await request(app).post('/auth/signup').send(payload)
      const res = await request(app).post('/auth/signup').send(payload)

      expect(res.status).toBe(400)
      expect(res.body.error.message[0]).toMatch(/exists/i)
    })

    it('should sign in a user', async () => {
      const payload = getSignUpPayload()
      await request(app).post('/auth/signup').send(payload).expect(201)

      const res = await request(app).post('/auth/signin').send({
        email: payload.email,
        password: payload.password,
      })

      expect(res.status).toBe(200)
      expect(res.body.data.session).toBeDefined()
    })

    it('should sign out a user', async () => {
      const payload = getSignUpPayload()
      await request(app).post('/auth/signup').send(payload).expect(201)

      const loginRes = await request(app)
        .post('/auth/signin')
        .send({
          email: payload.email,
          password: payload.password,
        })
        .expect(200)

      const res = await request(app)
        .post('/auth/logout')
        .set('x-session', loginRes.body.data.session)

      expect(res.status).toBe(200)
      expect(res.body.message[0]).toMatch(/success/i)

      const res2 = await request(app)
        .post('/auth/logout')
        .set('x-session', loginRes.body.data.session)

      expect(res2.status).toBe(401)
      expect(res2.body.error.message[0]).toMatch(/invalid/i)
    })
  })
})
