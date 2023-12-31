import { app } from './app'
import { env } from './env/index'

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log(`Server running on port ${env.PORT}`)
  })
