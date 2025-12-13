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

  const getCoursePayload = () => ({
    title: faker.book.title(),
    content: faker.word.words(20),
    price: 10,
    seats: 8,
  })

  const createCourse = async () => {
    const iSignUpPayload = getSignUpPayload()
    const iSignInPayload = {
      email: iSignUpPayload.email,
      password: iSignUpPayload.password,
    }

    const iSignUpRes = await request(courseSrvUrl)
      .post('/auth/signup')
      .send(iSignUpPayload)

    expect(iSignUpRes.status).toBe(201)

    const signInRes = await request(courseSrvUrl)
      .post('/auth/signin')
      .send(iSignInPayload)

    expect(signInRes.status).toBe(200)
    expect(signInRes.body.data.session).toBeDefined()

    const session = signInRes.body.data.session

    const createCourseRes = await request(courseSrvUrl)
      .post('/courses')
      .set('x-session', session)
      .send(getCoursePayload())

    expect(createCourseRes.status).toBe(201)
    const courseId = createCourseRes?.body?.data?.id
    expect(courseId).toBeDefined()

    return {
      iSignUpPayload,
      iSignInPayload,
      newCourse: createCourseRes,
    }
  }

  it('create order', async () => {
    const { iSignInPayload, iSignUpPayload, newCourse } = await createCourse()
  })
})
