import mongoose from 'mongoose'

export interface User extends mongoose.Document {
  _id: string
  firstName: string
  lastName: string
  profilePic?: string
}

const UserSchema = new mongoose.Schema({
	email: { type: String, required: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	profilePic: { type: String}
})

export const Users = mongoose.model('User', UserSchema) 