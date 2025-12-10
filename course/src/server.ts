import initApp from '@/app'

const PORT = process.env.PORT || 3000

const bootstrap = async () => {
  const app = await initApp()

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

bootstrap()
