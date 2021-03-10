"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateGoogleUser = exports.tokenVerification = exports.getToken = exports.checkUser = exports.registerUser = exports.checkUniqueEmail = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const querystring_1 = __importDefault(require("querystring"));
const user_model_1 = require("../../models/user.model");
const ClientError = __importStar(require("../../error/error.handler"));
const checkUniqueEmail = async (req, res, next) => {
    try {
        const email = req.email;
        const user = await user_model_1.Users.findOne({ email: email.trim().toLowerCase() });
        if (user)
            return next(new ClientError.ForbiddenError("Email already exits."));
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.checkUniqueEmail = checkUniqueEmail;
const registerUser = async (req, res, next) => {
    try {
        const firstName = req.firstName;
        const lastName = req.lastName;
        const email = req.email;
        const user = await user_model_1.Users.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            profilePic: req.profilePic
        });
        req.userID = user._id;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.registerUser = registerUser;
const checkUser = async (req, res, next) => {
    try {
        const email = req.email;
        const user = await user_model_1.Users.findOne({ email: email.trim().toLowerCase() });
        if (!user)
            return next(new ClientError.NotFoundError("User not found with this email!"));
        req.userID = user._id;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.checkUser = checkUser;
const getToken = async (req, res, next) => {
    try {
        const email = req.email;
        req.accessToken = await jsonwebtoken_1.default.sign({ email: email.trim(), userID: req.userID }, String(process.env.ACCESS_TOKEN_SECRET), { expiresIn: '5000m' });
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.getToken = getToken;
const tokenVerification = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader)
            return next(new ClientError.NotAuthorizedError("Token Required for authorization"));
        const token = authHeader && authHeader.split(' ');
        const accessToken = token[1];
        const userInfo = await jsonwebtoken_1.default.verify(accessToken, String(process.env.ACCESS_TOKEN_SECRET));
        req.userID = userInfo.userID;
        req.email = userInfo.email;
        next();
    }
    catch (err) {
        if (err.message == "jwt expired")
            next(new ClientError.NotAuthorizedError("Unauthorised!!!"));
        next(new ClientError.BadRequestError(err.message));
    }
};
exports.tokenVerification = tokenVerification;
const authenticateGoogleUser = async (req, res, next) => {
    try {
        const authCode = req.body.authCode;
        const data = {
            grant_type: "authorization_code",
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: authCode,
            redirect_uri: "http://localhost:5000"
        };
        const result = await axios_1.default.post('https://oauth2.googleapis.com/token', querystring_1.default.stringify(data));
        const tokenID = result.data.id_token;
        const decodedResult = jsonwebtoken_1.default.decode(tokenID);
        req.email = decodedResult.email;
        req.firstName = decodedResult.given_name;
        req.lastName = decodedResult.family_name;
        req.profilePic = decodedResult.picture;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authenticateGoogleUser = authenticateGoogleUser;
