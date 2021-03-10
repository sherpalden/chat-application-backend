"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.NotFoundError = exports.NotAuthorizedError = exports.BadRequestError = exports.UserFacingError = void 0;
var UserFacingError = /** @class */ (function (_super) {
    __extends(UserFacingError, _super);
    function UserFacingError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UserFacingError;
}(Error));
exports.UserFacingError = UserFacingError;
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError(message, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, message) || this;
        for (var _i = 0, _a = Object.entries(options); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            _this[key] = value;
        }
        return _this;
    }
    Object.defineProperty(BadRequestError.prototype, "statusCode", {
        get: function () {
            return 400;
        },
        enumerable: false,
        configurable: true
    });
    return BadRequestError;
}(UserFacingError));
exports.BadRequestError = BadRequestError;
var NotAuthorizedError = /** @class */ (function (_super) {
    __extends(NotAuthorizedError, _super);
    function NotAuthorizedError(message, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, message) || this;
        for (var _i = 0, _a = Object.entries(options); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            _this[key] = value;
        }
        return _this;
    }
    Object.defineProperty(NotAuthorizedError.prototype, "statusCode", {
        get: function () {
            return 401;
        },
        enumerable: false,
        configurable: true
    });
    return NotAuthorizedError;
}(UserFacingError));
exports.NotAuthorizedError = NotAuthorizedError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, message) || this;
        for (var _i = 0, _a = Object.entries(options); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            _this[key] = value;
        }
        return _this;
    }
    Object.defineProperty(NotFoundError.prototype, "statusCode", {
        get: function () {
            return 404;
        },
        enumerable: false,
        configurable: true
    });
    return NotFoundError;
}(UserFacingError));
exports.NotFoundError = NotFoundError;
var ForbiddenError = /** @class */ (function (_super) {
    __extends(ForbiddenError, _super);
    function ForbiddenError(message, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, message) || this;
        for (var _i = 0, _a = Object.entries(options); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            _this[key] = value;
        }
        return _this;
    }
    Object.defineProperty(ForbiddenError.prototype, "statusCode", {
        get: function () {
            return 403;
        },
        enumerable: false,
        configurable: true
    });
    return ForbiddenError;
}(UserFacingError));
exports.ForbiddenError = ForbiddenError;
