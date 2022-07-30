export type AppError = ValidationError | DataNotFoundError | DatabaseError | RuntimeError;

export type ValidationError = {
  _tag: 'ValidationError'
  message: string
}

export type DataNotFoundError = {
  _tag: 'DataNotFoundError'
  message: string
}

export type DatabaseError = {
  _tag: 'DatabaseError'
  message: string
}

export type RuntimeError = {
  _tag: 'RuntimeError'
  message: string
}

export const validationErrorOf = (message: string): Readonly<ValidationError> => ({
  _tag: 'ValidationError',
  message: message
})

export const dataNotFoundErrorOf = (message: string): Readonly<DataNotFoundError> => ({
  _tag: 'DataNotFoundError',
  message: message
})

export const databaseErrorOf = (message: string): Readonly<DatabaseError> => ({
  _tag: 'DatabaseError',
  message: message
})

export const runtimeErrorOf = (message: string): Readonly<RuntimeError> => ({
  _tag: 'RuntimeError',
  message: message
})