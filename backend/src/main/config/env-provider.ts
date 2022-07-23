import { cleanEnv, port, str, url } from 'envalid'
import dotEnv from 'dotenv'

dotEnv.config({ path: 'env/.env' })

export type EnvConfig = {
  SERVER_PORT: number,
  DB_URL: string,
  LOG_LEVEL: string
}

export const env: EnvConfig = cleanEnv(process.env, {
  SERVER_PORT: port({ default: 8080 }),
  DB_URL: url(),
  LOG_LEVEL: str({ default: 'error' })
})