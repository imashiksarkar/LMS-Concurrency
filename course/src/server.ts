import initApp from '@/app'
import { env } from '@/config'

const bootstrap = async () => {
  const app = await initApp()

  app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`))
}

bootstrap()
