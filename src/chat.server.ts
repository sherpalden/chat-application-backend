import { Socket, Server, Namespace } from 'socket.io'
import jwt from 'jsonwebtoken'
import { ExtendedSocket } from './interfaces/extended.socket.interface'
import * as chatCtrl from './controllers/ws/chat.controller'

export class ChatServer {
	private rootSocket: Namespace
	private users: {[key: string]: string}
	constructor(io: Server) {
		this.users = {}
		this.rootSocket = io.of('/')
		this.attachMiddlewares()
		this.attachEventHandlers(io)
	}

	private attachMiddlewares() {
		this.rootSocket.use(async (socket: Socket, next: any) => {
			try {
				const extSocket = socket as ExtendedSocket
	            const token = extSocket.handshake.auth.token
	            const userInfo: any = await jwt.verify(token, String(process.env.ACCESS_TOKEN_SECRET))
	            extSocket.userID = userInfo.userID
	            next()
	        }
	        catch(err){    
	            next(err)
	        }
		})
	}

	private findUserSocketID(userID: string) {
		if(this.users[userID]) return this.users[userID]
		else return "0"
	}

	private attachEventHandlers(io: Server) {
		this.rootSocket.on('connection', (socket: Socket) => {
			const extSocket = socket as ExtendedSocket
			this.users[extSocket.userID] = extSocket.id
			
			extSocket.on('loadUsers', (res: any) => {
				chatCtrl.loadUsers(extSocket, (err, resData) => {
					if(err) return res(err)
					return res(null, resData)
				})
			})

			extSocket.on('startConversation', (data: any, res: any) => {
				chatCtrl.postDmTextAlt(extSocket, data, (err, resData) => {
					if(err) return res(err)
					return res(null, resData)
				})
			})

			extSocket.on('loadDirectConversations', (data: any, res: any) => {
				chatCtrl.loadDirectConversations(extSocket, data, (err, resData) => {
					if(err) return res(err)
					return res(null, resData)
				})
			})

			extSocket.on('sendDM', (data: any, res: any) => {
				chatCtrl.postDmText(extSocket, data, (err, resData) => {
					if(resData && resData.oppID){
						const oppID = this.findUserSocketID(resData.oppID)
						if(oppID !== "0"){
							this.rootSocket.to(oppID).emit(
								'newDM',
								{message: resData.message, sender: resData.sender}
							)
						}
					}
					if(err) return res(err)
					return res(null, resData)
				})
			})

			extSocket.on('disconnect', () => {
            	delete this.users[extSocket.userID]
        	})
		})
	}
}