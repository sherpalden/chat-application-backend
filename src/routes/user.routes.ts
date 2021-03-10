import express, { Request, Response, NextFunction} from 'express'

const router = express.Router()

import * as userAuthCtrl from '../controllers/http/user.authentication.controller'

// @route    POST api/user/signUp/google
// @desc     Register a new user with google account
// @access   Public
router.post('/signUp/google', 
    userAuthCtrl.authenticateGoogleUser,
    userAuthCtrl.checkUniqueEmail,
    userAuthCtrl.registerUser,
    userAuthCtrl.getToken, 
    (req: Request, res: Response) => {
    res.status(200);
    res.send({
        "message": "SignUp With Google Successful",
        "accessToken": req.accessToken
    })
})

// @route    POST api/user/login/google
// @desc     Authenticate the user for login into the system with google
// @access   Public
router.post('/login/google', 
    userAuthCtrl.authenticateGoogleUser, 
    userAuthCtrl.checkUser,
    userAuthCtrl.getToken,     
    (req: Request, res: Response) => {
    res.status(200);
    res.send({
        "message": "Login With Google Successful",
        "accessToken": req.accessToken,
    })
});


export default router