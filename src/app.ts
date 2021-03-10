import express, { Application, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { UserFacingError } from './error/error.handler'
import userRoutes from './routes/user.routes'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { ChatServer } from './chat.server'
import path from 'path'

mongoose.connect(String(process.env.MONGO_URI), {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
mongoose.connection.on('connected', () => {
    console.log('Database connected')
})
mongoose.connection.on('error', err => {
    console.error('Mongo_Connection_Error: ' + err)
})
mongoose.connection.on('disconnected', () => {
    console.log('Database disconnected')
})

const app: Application = express()

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(express.static('build'))

//enable cors
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'content-type,X-Requested-With,authorization')
    next()
})


//userRoutes
app.use('/api/user', userRoutes)

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

// error handler
app.use( (err: UserFacingError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message)
	const status = err.status || 500
	const message = err.message || 'Something went wrong'
	res.status(status).send({status, message})
})

process.on('uncaughtException', err => {
  console.error('uncaughtError', err)
  process.exit(1) //mandatory (as per the Node.js docs)
})

export const server = createServer(app)
const io = new SocketIOServer(server, {
  perMessageDeflate: false, 
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
})

const chatServer = new ChatServer(io)


