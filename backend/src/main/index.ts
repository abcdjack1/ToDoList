import { dbConnection } from "./config/db-handler"
import { env } from "./config/env-provider"
import { startServer } from "./server"

dbConnection(env.DB_URL)
startServer(env)