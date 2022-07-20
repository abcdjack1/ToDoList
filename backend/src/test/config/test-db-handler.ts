import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoMemoryServer: MongoMemoryServer

export const connectTestDB = async () => {
  mongoMemoryServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoMemoryServer.getUri())
}


export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  mongoMemoryServer.stop()
}

export const clearTestDB = async () => {
  mongoose.connection.dropDatabase()
}