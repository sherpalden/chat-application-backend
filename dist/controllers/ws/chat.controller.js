"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postGmFiles = exports.postGmText = exports.getGmMessages = exports.getGroupConversations = exports.createGroupConversation = exports.postDmFiles = exports.postDmText = exports.postDmFilesAlt = exports.postDmTextAlt = exports.getDmMessages = exports.loadDirectConversations = exports.loadUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../../models/user.model");
const conversation_model_1 = require("../../models/conversation.model");
const message_model_1 = require("../../models/message.model");
const loadUsers = async (extSocket, cb) => {
    try {
        const userID = extSocket.userID;
        let users = await user_model_1.Users.find();
        users = users.filter(user => String(user._id) !== userID);
        const dataToSend = {
            users: users
        };
        return cb(null, dataToSend);
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.loadUsers = loadUsers;
const loadDirectConversations = async (extSocket, data, cb) => {
    try {
        const userID = extSocket.userID;
        const limit = Number(data.limit);
        const skip = Number(data.skip);
        let directConversations = await conversation_model_1.Conversations.aggregate([
            { $match: { type: "dm" } },
            { $sort: { lastMessagedAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);
        if (directConversations.length < 1)
            return cb(null, { directConversations: [] });
        directConversations = directConversations.filter(conv => conv.members.includes(userID));
        if (directConversations.length < 1)
            return cb(null, { directConversations: [] });
        let conversationList = [];
        for (let conversation of directConversations) {
            let tempConversation = {};
            tempConversation._id = conversation._id;
            let members = conversation.members;
            members = members.filter(memberID => memberID !== userID);
            const oppID = members[0];
            const user = await user_model_1.Users.findOne({ _id: oppID });
            if (user) {
                tempConversation.oppUser = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profilePic: user.profilePic,
                };
            }
            const messageLists = await message_model_1.Messages.aggregate([
                { $match: { conversationID: conversation._id } },
                { $sort: { _id: -1 } },
                { $skip: 0 },
                { $limit: 20 },
            ]);
            tempConversation.messages = messageLists;
            conversationList.push(tempConversation);
        }
        return cb(null, { directConversations: conversationList });
    }
    catch (err) {
        console.error(err);
        return cb({ msg: err.message });
    }
};
exports.loadDirectConversations = loadDirectConversations;
const getDmMessages = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        let skip = 0, limit = 10;
        if (data.skip) {
            skip = parseInt(data.skip);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        let nextSkip = limit + skip;
        if (!data.conversationID)
            return cb({ msg: "conversationID of receipent is required" });
        if (data.conversationID.split('').length != 24)
            return cb({ msg: "Invalid conversationID" });
        const senderID = extSocket.userID;
        if (senderID == data.receiverID)
            return cb({ msg: "receiverID cannot be yourself" });
        let totalMessages, conversation;
        let messageLists = [];
        conversation = await conversation_model_1.Conversations.findOne({ _id: data.conversationID });
        if (!conversation)
            return cb({ msg: "conversation not found" });
        messageLists = await message_model_1.Messages.aggregate([
            { $match: { conversationID: conversation._id } },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);
        totalMessages = await message_model_1.Messages.countDocuments({ conversationID: conversation._id });
        if (nextSkip >= totalMessages) {
            nextSkip = 0;
        }
        const dataToSend = {
            messages: messageLists,
            totalMessages: totalMessages,
            nextSkip: nextSkip
        };
        return cb(null, dataToSend);
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.getDmMessages = getDmMessages;
const postDmTextAlt = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        if (!data.receiverID)
            return cb({ msg: "receiverID of receipent is required" });
        if (data.receiverID.split('').length != 24)
            return cb({ msg: "Invalid receiverID" });
        if (!data.text)
            return cb({ msg: "empty message cannot be sent" });
        const senderID = extSocket.userID;
        let conversation = await conversation_model_1.Conversations.findOne({
            $and: [
                { type: "dm" },
                { members: { $in: mongoose_1.default.Types.ObjectId(data.receiverID) } },
                { members: { $in: mongoose_1.default.Types.ObjectId(senderID) } },
            ]
        });
        if (!conversation) {
            conversation = await conversation_model_1.Conversations.create({
                type: 'dm',
                members: [senderID, data.receiverID]
            });
        }
        const message = await message_model_1.Messages.create({
            conversationID: conversation._id,
            senderID: senderID,
            text: data.text,
        });
        conversation.lastMessagedAt = Date.now();
        await conversation.save();
        return cb(null, { message: message });
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.postDmTextAlt = postDmTextAlt;
const postDmFilesAlt = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        if (!data.receiverID)
            return cb({ msg: "receiverID of receipent is required" });
        if (data.receiverID.split('').length != 24)
            return cb({ msg: "Invalid receiverID" });
        if (!data.files || (data.files.length < 1))
            return cb({ msg: "empty message cannot be sent" });
        const senderID = extSocket.userID;
        let conversation = await conversation_model_1.Conversations.findOne({
            $and: [
                { type: "dm" },
                { members: { $in: mongoose_1.default.Types.ObjectId(data.receiverID) } },
                { members: { $in: mongoose_1.default.Types.ObjectId(senderID) } },
            ]
        });
        if (!conversation)
            return cb({ msg: "conversation not found" });
        const message = await message_model_1.Messages.create({
            conversationID: conversation._id,
            senderID: senderID,
            files: data.files,
        });
        conversation.lastMessagedAt = Date.now();
        await conversation.save();
        return cb(null, { message: message });
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.postDmFilesAlt = postDmFilesAlt;
const postDmText = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        if (!data.conversationID)
            return cb({ msg: "conversationID is required" });
        if (data.conversationID.split('').length != 24)
            return cb({ msg: "Invalid conversationID" });
        if (!data.text)
            return cb({ msg: "empty message cannot be sent" });
        const senderID = extSocket.userID;
        const sender = await user_model_1.Users.findOne({ _id: senderID });
        let conversation = await conversation_model_1.Conversations.findOne({ _id: data.conversationID });
        if (!conversation)
            return cb({ msg: "conversation not found" });
        const members = conversation.members;
        const oppID = members.filter(memberID => memberID !== extSocket.userID)[0];
        const message = await message_model_1.Messages.create({
            conversationID: conversation._id,
            senderID: senderID,
            text: data.text,
        });
        conversation.lastMessagedAt = Date.now();
        await conversation.save();
        return cb(null, { message: message, oppID, sender });
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.postDmText = postDmText;
const postDmFiles = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        if (!data.conversationID)
            return cb({ msg: "conversationID of receipent is required" });
        if (data.conversationID.split('').length != 24)
            return cb({ msg: "Invalid conversationID" });
        if (!data.files || (data.files.length < 1))
            return cb({ msg: "empty message cannot be sent" });
        const senderID = extSocket.userID;
        let conversation = await conversation_model_1.Conversations.findOne({ _id: data.conversationID });
        if (!conversation)
            return cb({ msg: "conversation not found" });
        const message = await message_model_1.Messages.create({
            conversationID: conversation._id,
            senderID: senderID,
            files: data.files,
        });
        conversation.lastMessagedAt = Date.now();
        await conversation.save();
        return cb(null, { message: message });
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.postDmFiles = postDmFiles;
const createGroupConversation = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        if (!data.members || (data.members.length < 2))
            return cb({ msg: "A group conversation requires at least two members excluding yourself" });
        if (!data.groupName)
            return cb({ msg: "Group name is required for group conversation" });
        for (let memberID of data.members) {
            if (memberID.split('').length != 24)
                return cb({ msg: "Invalid memberID " + memberID });
        }
        data.members.push(extSocket.userID);
        const conversation = await conversation_model_1.Conversations.create({
            type: "gm",
            room: data.groupName,
            members: data.members
        });
        return cb(null, {});
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.createGroupConversation = createGroupConversation;
const getGroupConversations = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        const userID = extSocket.userID;
        const myGroupConversations = await conversation_model_1.Conversations.find({
            $and: [
                { type: "gm" },
                { members: { $in: mongoose_1.default.Types.ObjectId(userID) } }
            ]
        });
        if (myGroupConversations.length < 1)
            return cb(null, {});
        for (let conversation of myGroupConversations) {
            for (let memberID of conversation.members) {
                let userData = await user_model_1.Users.find({ _id: memberID });
                let index = conversation.members.indexOf(memberID);
                if (userData) {
                    conversation.members[index] = {
                        _id: userData._id,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        profilePic: userData.profilePic
                    };
                }
            }
        }
        cb(null, myGroupConversations);
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.getGroupConversations = getGroupConversations;
const getGmMessages = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        let skip = 0, limit = 10;
        if (data.skip) {
            skip = parseInt(data.skip);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        let nextSkip = limit + skip;
        const userID = extSocket.userID;
        if (!data.conversationID)
            return cb({ msg: "Group conversationID is required" });
        if (data.conversationID.split('').length != 24)
            return cb({ msg: "Invalid conversationID" });
        const messageLists = await message_model_1.Messages.aggregate([
            { $match: { conversationID: mongoose_1.default.Types.ObjectId(data.conversationID) } },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $lookup: {
                    from: 'users',
                    let: { user_id: "$senderID" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
                    ],
                    as: '$senderInfo'
                }
            },
            { $unwind: '$senderInfo' }
        ]);
        const totalMessages = await message_model_1.Messages.countDocuments({ conversationID: mongoose_1.default.Types.ObjectId(data.conversationID) });
        if (nextSkip >= totalMessages) {
            nextSkip = 0;
        }
        let dataToSend = {
            messages: messageLists,
            totalMessages: totalMessages,
            nextSkip: nextSkip
        };
        return cb(null, dataToSend);
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.getGmMessages = getGmMessages;
const postGmText = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        if (!data.conversationID)
            return cb({ msg: "conversationID of group conversation is required" });
        if (data.conversationID.split('').length != 24)
            return cb({ msg: "Invalid conversationID" });
        if (!data.text)
            return cb({ msg: "empty message cannot be sent" });
        const senderID = extSocket.userID;
        let conversation = await conversation_model_1.Conversations.findOne({ _id: mongoose_1.default.Types.ObjectId(data.conversationID) });
        if (!conversation)
            return cb({ msg: "conversation not found" });
        const message = await message_model_1.Messages.create({
            conversationID: conversation._id,
            senderID: senderID,
            text: data.text,
        });
        const sender = user_model_1.Users.findOne({ _id: senderID });
        let dataToSend = {
            message: message,
            room: conversation.room,
            sender: sender
        };
        return cb(null, dataToSend);
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.postGmText = postGmText;
const postGmFiles = async (socket, data, cb) => {
    try {
        let extSocket = socket;
        if (!data.conversationID)
            return cb({ msg: "conversationID of group conversation is required" });
        if (data.conversationID.split('').length != 24)
            return cb({ msg: "Invalid conversationID" });
        if (!data.files || (data.files.length < 1))
            return cb({ msg: "empty message cannot be sent" });
        const senderID = extSocket.userID;
        let conversation = await conversation_model_1.Conversations.findOne({ _id: mongoose_1.default.Types.ObjectId(data.conversationID) });
        if (!conversation)
            return cb({ msg: "conversation not found" });
        const message = await message_model_1.Messages.create({
            conversationID: conversation._id,
            senderID: senderID,
            files: data.files,
        });
        const sender = user_model_1.Users.findOne({ _id: senderID });
        let dataToSend = {
            message: message,
            room: conversation.room,
            sender: sender
        };
        return cb(null, dataToSend);
    }
    catch (err) {
        return cb({ msg: err.message });
    }
};
exports.postGmFiles = postGmFiles;
