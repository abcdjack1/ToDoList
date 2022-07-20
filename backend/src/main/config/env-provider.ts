import { cleanEnv, port, str, url } from 'envalid'
import dotEnv from 'dotenv'

dotEnv.config({ path: 'env/.env' })

export type EnvConfig = {
  SERVER_PORT: number,
  DB_URL: string
  API_VERSION: string
}

export const env: EnvConfig = cleanEnv(process.env, {
  SERVER_PORT: port({ default: 8080 }),
  DB_URL: url(),
  API_VERSION: str()
})