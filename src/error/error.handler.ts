export class UserFacingError extends Error {
    status: number;
    message: string;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

export class BadRequestError extends UserFacingError {
    constructor(message: string) {
        super(400, message);
    }
}

export class NotAuthorizedError extends UserFacingError {
    constructor(message: string) {
        super(401, message);
    }
}

export class NotFoundError extends UserFacingError {
    constructor(message: string) {
        super(404, message);
    }
}

export class ForbiddenError extends UserFacingError {
    constructor(message: string) {
        super(403, message);
    }
}

