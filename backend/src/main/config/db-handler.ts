import mongoose from "mongoose"

export const dbConnection = (url: string) => {
  mongoose.connect(url)
}