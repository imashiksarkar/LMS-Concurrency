import { describe, it, expect } from 'bun:test'
import request from 'supertest'
import { faker } from '@faker-js/faker'

const courseSrvUrl = 'http://localhost:8080/course-srv'
const orderSrvUrl = 'http://localhost:8080/order-srv'

describe('- End To End Test', () => {
  const getSignUpPayload = () => ({
    email: faker.internet.email(),
    password: '123456',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'instructor' satisfies 'user' | 'instructor',
  })

  it('should be healthy', async () => {
    const signUpPayload = getSignUpPayload()
    const signInPayload = {
      email: signUpPayload.email,
      password: signUpPayload.password,
    }

    const signUpRes = await request(courseSrvUrl)
      .post('/auth/signup')
      .send(signUpPayload)

    expect(signUpRes.status).toBe(201)

    const signInRes = await request(courseSrvUrl)
      .post('/auth/signin')
      .send(signInPayload)

    expect(signInRes.status).toBe(200)
    expect(signInRes.body.data.session).toBeDefined()

    const session = signInRes.body.data.session

    const signInRes = await request(courseSrvUrl)
      .post('/auth/signin')
      .send(signInPayload)

    console.log(session)
  })
})
