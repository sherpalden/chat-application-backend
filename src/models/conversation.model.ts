import mongoose from 'mongoose'

export interface Conversation extends Document {
	_id: mongoose.Schema.Types.ObjectId
	type: string
	room?: string
	members: string[],
	lastMessagedAt: { type: number}
}

const ConversationSchema = new mongoose.Schema({
	type: {
		type: String, //dm(direct_messaging)/ gm(groupMessaging)
		required: true
	},
	room: {
		type: String, //exists only if type is gm
	},
  	members: [
  		{
  			type: String, required: true
  		}
	],
	lastMessagedAt: { type: Number}
});

export const Conversations = mongoose.model('Conversation', ConversationSchema)