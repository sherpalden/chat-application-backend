//Require Mongoose
import mongoose from 'mongoose'

export interface Message extends mongoose.Document {
	_id: string
	conversationID: string
	senderID: string
	text?: string
	files?: string[]
	date: string  
}

const MessageSchema = new mongoose.Schema({
	conversationID: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	senderID: {type: mongoose.Schema.Types.ObjectId, required: true},	
	text: {
		type: String,
	},
	files:[
		{
			type: String,
		}
	],
	date: { type: Date, default: Date.now, expires: 120000000},
});

export const Messages = mongoose.model('Message', MessageSchema)
