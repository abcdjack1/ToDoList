import mongoose from "mongoose"
import { env } from "./env-provider"

export const dbConnection = () => {
  mongoose.connect(env.DB_URL)
}