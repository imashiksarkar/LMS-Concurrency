import { constants } from '@/config'
import {
  AUTH,
  AUTH_EMAIL_INDEX,
  generateID,
  IAuth,
  ID,
  ISession,
  IUser,
  Role,
  SESSION,
  USER,
} from '@/db'
import { exres } from '@/libs'
import { UserService } from '../user'
import { CreateAuthDto, SignInDto, SignUpDto } from './auth.dtos'

type User = IAuth & IUser
type SignIn = {
  session: string
  userId: ID
}

export default class AuthService {
  private static readonly userService: typeof UserService = UserService

  static readonly signUp = async (payload: SignUpDto): Promise<User> => {
    const { email, password, role, ...userPayload } = payload

    const auth = await this.createAuth({
      email,
      password,
      role,
    })

    const user = await this.userService.createUser(auth.id, userPayload)

    return { ...auth, ...user }
  }

  static readonly signIn = async (payload: SignInDto): Promise<SignIn> => {
    const user = await this.searchByEmail(payload.email)

    if (!user) throw exres().error(404).message('User not found').exec()

    if (!(user.email === payload.email && user.password === payload.password))
      throw exres().error(401).message('Invalid credentials').exec()

    const sessionPayload: ISession = {
      sub: user.id,
      email: user.email,
      role: user.role,
      expiresAt:
        Date.now() + constants.SESSION_TOKEN_VALIDITY_MINUTES * 60 * 1000,
      salt: crypto.randomUUID(),
    }

    const session = Buffer.from(JSON.stringify(sessionPayload)).toString(
      'base64'
    )

    SESSION.add(session)

    return { session, userId: user.id }
  }

  static readonly signOut = async (sessionToken: string) => {
    const isLoggedOut = SESSION.delete(sessionToken)

    if (!isLoggedOut)
      throw exres().error(401).message('Invalid session token').exec()
  }

  private static readonly searchByEmail = async (
    email: string
  ): Promise<User | null> => {
    const id = AUTH_EMAIL_INDEX.get(email)
    if (!id) return null

    const auth = AUTH.get(id)
    if (!auth) return null

    const user = USER.get(id)
    if (!user) return null

    return { ...auth, ...user }
  }

  private static readonly createAuth = async (
    payload: CreateAuthDto
  ): Promise<IAuth> => {
    const auth = await this.searchByEmail(payload.email)
    if (auth) throw exres().error(400).message('User already exists').exec()

    const id = generateID()

    AUTH_EMAIL_INDEX.set(payload.email, id)

    const newAuth = AUTH.set(id, {
      id: id,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return newAuth.get(id)!
  }
}
