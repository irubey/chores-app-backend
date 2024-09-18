"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.getFileInfo = exports.uploadMiddleware = void 0;
const multer_1 = __importStar(require("multer")); // Import MulterError
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const errorHandler_1 = require("./errorHandler"); // Updated import
// Configure multer for file storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Make sure this directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${(0, uuid_1.v4)()}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
// Configure file filter
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.BadRequestError('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
    }
};
// Configure multer
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    },
});
// Middleware function
const uploadMiddleware = (fieldName) => {
    return (req, res, next) => {
        const multerMiddleware = upload.single(fieldName);
        multerMiddleware(req, res, (err) => {
            if (err instanceof multer_1.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new errorHandler_1.BadRequestError('File size exceeds the 5MB limit.'));
                }
                return next(new errorHandler_1.BadRequestError(err.message));
            }
            else if (err) {
                return next(err);
            }
            next();
        });
    };
};
exports.uploadMiddleware = uploadMiddleware;
// Helper function to get file information
const getFileInfo = (req) => {
    const file = req.file;
    if (!file) {
        throw new errorHandler_1.BadRequestError('No file uploaded');
    }
    return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
    };
};
exports.getFileInfo = getFileInfo;
