import { ID, USER } from '@/db'
import { exres } from '@/libs'
import { CreateUserDto } from './user.dtos'

export default class UserService {
  static readonly createUser = async (id: ID, payload: CreateUserDto) => {
    USER.set(id, {
      id: id,
      firstName: payload.firstName,
      lastName: payload.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return USER.get(id)!
  }

  static readonly getSingleUser = async (userId: ID) => {
    const user = USER.get(userId)

    if (!user) throw exres().error(404).message('User not found').exec()

    return user
  }

  private static readonly updateUser = async (
    id: ID,
    payload: Partial<CreateUserDto>
  ) => {
    const user = USER.get(id)

    if (!user) throw exres().error(404).message('User not found').exec()

    USER.set(id, {
      ...user,
      ...payload,
      updatedAt: new Date(),
    })

    return USER.get(id)!
  }

  private static readonly getUserById = async (id: ID) => {
    const user = USER.get(id)

    if (!user) throw exres().error(404).message('User not found').exec()

    return user
  }

  private static readonly deleteUserById = async (id: ID) => {
    const user = USER.get(id)

    if (!user) throw exres().error(404).message('User not found').exec()

    USER.delete(id)

    return user
  }

  private static readonly getAllUsers = async () => Array.from(USER.values())
}
