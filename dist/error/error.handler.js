"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.NotFoundError = exports.NotAuthorizedError = exports.BadRequestError = exports.UserFacingError = void 0;
class UserFacingError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.message = message;
    }
}
exports.UserFacingError = UserFacingError;
class BadRequestError extends UserFacingError {
    constructor(message) {
        super(400, message);
    }
}
exports.BadRequestError = BadRequestError;
class NotAuthorizedError extends UserFacingError {
    constructor(message) {
        super(401, message);
    }
}
exports.NotAuthorizedError = NotAuthorizedError;
class NotFoundError extends UserFacingError {
    constructor(message) {
        super(404, message);
    }
}
exports.NotFoundError = NotFoundError;
class ForbiddenError extends UserFacingError {
    constructor(message) {
        super(403, message);
    }
}
exports.ForbiddenError = ForbiddenError;
