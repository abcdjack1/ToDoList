import { dbConnection } from "./config/db-handler"
import { startServer } from "./server"

dbConnection()
startServer()