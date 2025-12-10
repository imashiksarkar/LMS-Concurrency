import { Role, USER, AUTH, AUTH_EMAIL_INDEX, SESSION } from '@/db'
import AuthService from './auth.service'

beforeEach(() => {
  USER.clear()
  AUTH.clear()
  AUTH_EMAIL_INDEX.clear()
  SESSION.clear()
})

describe('Auth Service', () => {
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
