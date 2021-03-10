import express, { Request, Response, NextFunction } from 'express'

import jwt from 'jsonwebtoken'
import axios from 'axios'
import querystring from 'querystring'

import { Users, User } from '../../models/user.model'
import * as ClientError from '../../error/error.handler'


export const checkUniqueEmail = async (req: Request, res: Response, next: NextFunction) => {
	try {
        const email = req.email
        const user: User | any = await Users.findOne({ email: email.trim().toLowerCase() })
        if(user) return next(new ClientError.ForbiddenError("Email already exits."))
        next()
    }
    catch(err){
        next(err)
    }
}

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const firstName = req.firstName
        const lastName = req.lastName
        const email = req.email
        const user = await Users.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            profilePic: req.profilePic
        })
        req.userID = user._id
        next()
	}
	catch(err){
    	next(err)
	}
}

export const checkUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
	    const email = req.email
	    const user = await Users.findOne({ email: email.trim().toLowerCase() })
        if(!user) return next(new ClientError.NotFoundError("User not found with this email!"))
        req.userID = user._id
        next()
	}
	catch(err){
		next(err)
	}
}

export const getToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.email
        req.accessToken = await jwt.sign({ email: email.trim(), userID: req.userID },
                                     String(process.env.ACCESS_TOKEN_SECRET), { expiresIn: '5000m' })
        next()
    }
    catch(err){
        next(err)
    }
}

export const tokenVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization']
        if(!authHeader) return next(new ClientError.NotAuthorizedError("Token Required for authorization"))
        const token = authHeader && authHeader.split(' ')
        const accessToken = token[1]
        const userInfo: any = await jwt.verify(accessToken, String(process.env.ACCESS_TOKEN_SECRET))
        req.userID = userInfo.userID
        req.email = userInfo.email
        next()
    }
    catch(err) {
        if(err.message == "jwt expired") next(new ClientError.NotAuthorizedError("Unauthorised!!!"))
        next(new ClientError.BadRequestError(err.message))
    }
}

export const authenticateGoogleUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authCode = req.body.authCode
        const data: any = {
        	grant_type: "authorization_code",
            client_id:  process.env.CLIENT_ID,
            client_secret:  process.env.CLIENT_SECRET,
            code: authCode,
            redirect_uri: "http://localhost:5000"
        }
        const result: any = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify(data))
        const tokenID = result.data.id_token
        const decodedResult: any = jwt.decode(tokenID)
        req.email = decodedResult.email
        req.firstName = decodedResult.given_name
        req.lastName = decodedResult.family_name
        req.profilePic = decodedResult.picture
        next()
    }
    catch(err) {
        next(err)
    }
}








