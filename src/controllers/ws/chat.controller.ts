import { Socket } from 'socket.io'
import mongoose from 'mongoose'

import { Users, User } from '../../models/user.model'
import { Conversations, Conversation } from '../../models/conversation.model'
import { Messages, Message } from '../../models/message.model'

import { ExtendedSocket } from '../../interfaces/extended.socket.interface'

import * as ClientError from '../../error/error.handler'

interface SocketIOError {

}

interface ClientResponse {
	messages?: Message[]
	totalMessages?: number
	nextSkip?: number

	message?: Message

	room?: string
	sender?: User

	users?: User[] | mongoose.Document<any>[]
	directConversations?: any
	oppID?: string
}

interface CallBack {
	(error: SocketIOError | null, response?: ClientResponse): void
}

interface InputData {
	skip?: string
	limit?: string
	receiverID?: string
	text?: string
	files?: string[]

	members?: string[]
	groupName?: string

	conversationID?: string

}


export const loadUsers = async (extSocket: ExtendedSocket, cb: CallBack) => {
	try{
		const userID = extSocket.userID
		let users: mongoose.Document<any>[] = await Users.find()
		users = users.filter(user => String(user._id) !== userID)
		const dataToSend: ClientResponse = {
			users: users
		}									
		return cb(null, dataToSend)
	}
	catch(err){
		return cb({msg: err.message});
	}
}

export const loadDirectConversations = async (extSocket: ExtendedSocket, data: InputData, cb: CallBack) => {
	try{
		const userID = extSocket.userID
		const limit = Number(data.limit)
		const skip = Number(data.skip)
		let directConversations: Conversation[] = await Conversations.aggregate([
			{ $match: {type: "dm"}},
			{ $sort: {lastMessagedAt: -1}},
			{ $skip: skip},
			{ $limit: limit}
		])
		if(directConversations.length < 1) return cb(null, {directConversations: []})
		directConversations = directConversations.filter(conv => conv.members.includes(userID))
		if(directConversations.length < 1) return cb(null, {directConversations: []})
		let conversationList = []
		for(let conversation of directConversations){
			let tempConversation: any = {}
			tempConversation._id = conversation._id
			let members: string[] = conversation.members
			members = members.filter(memberID => memberID !== userID)
			const oppID = members[0]
			const user: User | any = await Users.findOne({_id: oppID})
			if(user){
				tempConversation.oppUser = {
					_id: user._id,
					firstName: user.firstName,
					lastName: user.lastName,
					profilePic: user.profilePic,
				}
			}
			const messageLists = await Messages.aggregate([
				{$match: {conversationID: conversation._id}},
				{$sort: {_id: -1}},
				{$skip: 0},
				{$limit: 20},
			])
			tempConversation.messages = messageLists
			conversationList.push(tempConversation)
		}
		return cb(null, {directConversations: conversationList})
	}
	catch(err){
		console.error(err)
		return cb({msg: err.message});
	}
}

export const getDmMessages = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		let skip = 0, limit = 10;
        if(data.skip) {skip = parseInt(data.skip);}
        if(data.limit) {limit = parseInt(data.limit);}
		let nextSkip = limit + skip;

		if(!data.conversationID) return cb({msg: "conversationID of receipent is required"});
		if(data.conversationID.split('').length != 24) return cb({msg: "Invalid conversationID"});

		const senderID = extSocket.userID;
		if(senderID == data.receiverID) return cb({msg: "receiverID cannot be yourself"})

		let totalMessages: number, conversation: mongoose.Document | null;

		let messageLists = [];
		conversation = await Conversations.findOne({_id: data.conversationID})

		if(!conversation) return cb({msg: "conversation not found"})

		messageLists = await Messages.aggregate([
			{$match: {conversationID: conversation._id}},
			{$sort: {_id: -1}},
			{$skip: skip},
			{$limit: limit},
		])
		totalMessages = await Messages.countDocuments({conversationID: conversation._id})

		if(nextSkip >= totalMessages){
            nextSkip = 0
        } 

        const dataToSend: ClientResponse = {
            messages: messageLists,
            totalMessages: totalMessages,
            nextSkip: nextSkip
        }
        return cb(null, dataToSend);
	}
	catch(err) {
		return cb({msg: err.message});
	}
}

export const postDmTextAlt = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		if(!data.receiverID) return cb({msg: "receiverID of receipent is required"});
		if(data.receiverID.split('').length != 24) return cb({msg: "Invalid receiverID"});

		if(!data.text) return cb({msg: "empty message cannot be sent"})

		const senderID = extSocket.userID;

		let conversation: Conversation | any = await Conversations.findOne({
			$and:[
			{type: "dm"},
			{members: {$in: mongoose.Types.ObjectId(data.receiverID)}},
			{members: {$in: mongoose.Types.ObjectId(senderID)}},
		]})

		if(!conversation){
			conversation = await Conversations.create({
				type: 'dm',
				members: [senderID, data.receiverID]
			})
		}

		const message: Message | any = await Messages.create({
			conversationID: conversation._id,
			senderID: senderID,
			text: data.text,
		})
		conversation.lastMessagedAt = Date.now()
		await conversation.save()
		return cb(null, {message: message})
	}
	catch(err){
		return cb({msg: err.message})
	}
}

export const postDmFilesAlt = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		if(!data.receiverID) return cb({msg: "receiverID of receipent is required"});
		if(data.receiverID.split('').length != 24) return cb({msg: "Invalid receiverID"});

		if(!data.files || (data.files.length < 1)) return cb({msg: "empty message cannot be sent"});

		const senderID = extSocket.userID;

		let conversation: Conversation | any = await Conversations.findOne({
			$and:[
			{type: "dm"},
			{members: {$in: mongoose.Types.ObjectId(data.receiverID)}},
			{members: {$in: mongoose.Types.ObjectId(senderID)}},
		]})

		if(!conversation) return cb({msg: "conversation not found"})

		const message: Message | any = await Messages.create({
			conversationID: conversation._id,
			senderID: senderID,
			files: data.files,
		})
		conversation.lastMessagedAt = Date.now()
		await conversation.save()
		return cb(null, {message: message})
	}
	catch(err){
		return cb({msg: err.message})
	}
}

export const postDmText = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		if(!data.conversationID) return cb({msg: "conversationID is required"});
		if(data.conversationID.split('').length != 24) return cb({msg: "Invalid conversationID"});

		if(!data.text) return cb({msg: "empty message cannot be sent"})

		const senderID = extSocket.userID;
		const sender: any | User = await Users.findOne({_id: senderID})

		let conversation: Conversation | any = await Conversations.findOne({_id: data.conversationID})

		if(!conversation) return cb({msg: "conversation not found"})
		const members: string[] = conversation.members
		const oppID = members.filter(memberID => memberID !== extSocket.userID)[0] 

		const message: Message | any = await Messages.create({
			conversationID: conversation._id,
			senderID: senderID,
			text: data.text,
		})
		conversation.lastMessagedAt = Date.now()
		await conversation.save()
		return cb(null, {message: message, oppID, sender})
	}
	catch(err){
		return cb({msg: err.message})
	}
}

export const postDmFiles = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		if(!data.conversationID) return cb({msg: "conversationID of receipent is required"});
		if(data.conversationID.split('').length != 24) return cb({msg: "Invalid conversationID"});

		if(!data.files || (data.files.length < 1)) return cb({msg: "empty message cannot be sent"});

		const senderID = extSocket.userID;

		let conversation: Conversation | any = await Conversations.findOne({_id: data.conversationID})

		if(!conversation) return cb({msg: "conversation not found"})

		const message: Message | any = await Messages.create({
			conversationID: conversation._id,
			senderID: senderID,
			files: data.files,
		})
		conversation.lastMessagedAt = Date.now()
		await conversation.save()
		return cb(null, {message: message})
	}
	catch(err){
		return cb({msg: err.message})
	}
}




export const createGroupConversation = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		if(!data.members || (data.members.length < 2)) return cb({msg: "A group conversation requires at least two members excluding yourself"});
		if(!data.groupName) return cb({msg: "Group name is required for group conversation"});
		for(let memberID of data.members){
			if(memberID.split('').length != 24) return cb({msg: "Invalid memberID " +memberID});
		}
		data.members.push(extSocket.userID)
		const conversation = await Conversations.create({
			type: "gm",
			room: data.groupName,
			members: data.members
		})
		return cb(null, {})
	}
	catch(err) {
		return cb({msg: err.message});
	}
}

export const getGroupConversations = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		const userID = extSocket.userID
		const myGroupConversations: Conversation[] | any = await Conversations.find({
			$and:[
				{type: "gm"},
				{members: {$in: mongoose.Types.ObjectId(userID)}}
			]
		});
		if(myGroupConversations.length < 1) return cb(null, {})
		for(let conversation of myGroupConversations){
			for(let memberID of conversation.members){
				let userData: User | any = await Users.find({_id: memberID})
				let index = conversation.members.indexOf(memberID)
				if(userData){
					conversation.members[index] = {
						_id: userData._id, 
						firstName: userData.firstName, 
						lastName: userData.lastName, 
						profilePic: userData.profilePic
					}
				}
			}
		}
		cb(null, myGroupConversations)
	}
	catch(err) {
		return cb({msg: err.message})
	}
}

export const getGmMessages = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		let skip = 0, limit = 10;
        if(data.skip) {skip = parseInt(data.skip);}
        if(data.limit) {limit = parseInt(data.limit);}
		let nextSkip = limit + skip;

		const userID = extSocket.userID;

		if(!data.conversationID) return cb({msg: "Group conversationID is required"});
		if(data.conversationID.split('').length != 24) return cb({msg: "Invalid conversationID"});

		const messageLists = await Messages.aggregate([
			{$match: {conversationID: mongoose.Types.ObjectId(data.conversationID)}},
			{$sort: {_id: -1}},
			{$skip: skip},
			{$limit: limit},
			{$lookup: 
				{ 
					from: 'users', 
					let: { user_id: "$senderID" },
					pipeline: [
						{ $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
					],
					as: '$senderInfo'
				}
			},
			{$unwind: '$senderInfo'}
		]);

		const totalMessages = await Messages.countDocuments({conversationID: mongoose.Types.ObjectId(data.conversationID)})

		if(nextSkip >= totalMessages){
            nextSkip = 0
        } 
        let dataToSend: ClientResponse = {
            messages: messageLists,
            totalMessages: totalMessages,
            nextSkip: nextSkip
        }
        return cb(null, dataToSend);
	}
	catch(err) {
		return cb({msg: err.message});
	}
}

export const postGmText = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		if(!data.conversationID) return cb({msg: "conversationID of group conversation is required"});
		if(data.conversationID.split('').length != 24) return cb({msg: "Invalid conversationID"});

		if(!data.text) return cb({msg: "empty message cannot be sent"})

		const senderID = extSocket.userID;

		let conversation: Conversation | any = await Conversations.findOne({_id: mongoose.Types.ObjectId(data.conversationID)});

		if(!conversation) return cb({msg: "conversation not found"})
		const message: Message | any = await Messages.create({
			conversationID: conversation._id,
			senderID: senderID,
			text: data.text,
		})
		const sender: User | any = Users.findOne({_id: senderID})
		let dataToSend: ClientResponse = {
            message: message,
			room: conversation.room,
			sender: sender
        }
        return cb(null, dataToSend);
	}
	catch(err) {
		return cb({msg: err.message})
	}
}

export const postGmFiles = async (socket: Socket, data: InputData, cb: CallBack) => {
	try {
		let extSocket = socket as ExtendedSocket
		if(!data.conversationID) return cb({msg: "conversationID of group conversation is required"});
		if(data.conversationID.split('').length != 24) return cb({msg: "Invalid conversationID"});

		if(!data.files || (data.files.length < 1)) return cb({msg: "empty message cannot be sent"});

		const senderID = extSocket.userID;

		let conversation: Conversation | any = await Conversations.findOne({_id: mongoose.Types.ObjectId(data.conversationID)});

		if(!conversation) return cb({msg: "conversation not found"})
		const message: Message | any = await Messages.create({
			conversationID: conversation._id,
			senderID: senderID,
			files: data.files,
		})
		const sender: User | any = Users.findOne({_id: senderID})
		let dataToSend: ClientResponse = {
            message: message,
			room: conversation.room,
			sender: sender
        }
        return cb(null, dataToSend);
	}
	catch(err) {
		return cb({msg: err.message})
	}
}