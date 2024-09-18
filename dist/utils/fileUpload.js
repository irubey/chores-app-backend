"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePresignedUrl = generatePresignedUrl;
exports.uploadFile = uploadFile;
exports.validateFileType = validateFileType;
exports.validateFileSize = validateFileSize;
exports.generateUniqueFilename = generateUniqueFilename;
exports.calculateChecksum = calculateChecksum;
exports.streamToBuffer = streamToBuffer;
exports.uploadMultipleFiles = uploadMultipleFiles;
exports.deleteFile = deleteFile;
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const errorHandler_1 = require("../middlewares/errorHandler");
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const randomBytes = (0, util_1.promisify)(crypto_1.default.randomBytes);
function generatePresignedUrl(filename, contentType) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `uploads/${Date.now()}-${filename}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });
        const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
        return signedUrl;
    });
}
function uploadFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { originalname, buffer, mimetype, size } = file;
            const key = `uploads/${Date.now()}-${originalname}`;
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: mimetype,
            };
            yield s3.send(new client_s3_1.PutObjectCommand(params));
            const url = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
            const checksum = crypto_1.default.createHash('md5').update(buffer).digest('hex');
            logger_1.default.info(`File uploaded successfully: ${originalname}`);
            return {
                url,
                filename: originalname,
                mimeType: mimetype,
                size,
                checksum,
            };
        }
        catch (error) {
            logger_1.default.error('Error uploading file:', error);
            throw new errorHandler_1.BadRequestError('File upload failed');
        }
    });
}
function validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.mimetype);
}
function validateFileSize(file, maxSizeInBytes) {
    return file.size <= maxSizeInBytes;
}
function generateUniqueFilename(originalFilename) {
    return __awaiter(this, void 0, void 0, function* () {
        const bytes = yield randomBytes(16);
        const hash = bytes.toString('hex');
        const extension = originalFilename.split('.').pop();
        return `${hash}.${extension}`;
    });
}
function calculateChecksum(file) {
    return crypto_1.default.createHash('md5').update(file.buffer).digest('hex');
}
function streamToBuffer(stream) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    });
}
// Define allowed file types using regex
const allowedFileTypes = /jpeg|jpg|png|pdf/;
// Multer-S3 storage configuration
const storage = (0, multer_s3_1.default)({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
        const uniqueSuffix = Date.now().toString();
        const extension = path_1.default.extname(file.originalname);
        cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
    },
});
// File filter to validate uploaded files
const fileFilter = (req, file, cb) => {
    const extname = allowedFileTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.BadRequestError('Only JPEG, PNG, and PDF files are allowed'));
    }
};
// Initialize Multer with S3 storage, file size limit, and file filter
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: fileFilter,
});
exports.default = upload;
// Add a new function for handling multiple file uploads
function uploadMultipleFiles(files) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const uploadPromises = files.map(file => uploadFile(file));
            const uploadedFiles = yield Promise.all(uploadPromises);
            logger_1.default.info(`${files.length} files uploaded successfully`);
            return uploadedFiles;
        }
        catch (error) {
            logger_1.default.error('Error uploading multiple files:', error);
            throw new errorHandler_1.BadRequestError('Multiple file upload failed');
        }
    });
}
// Add a function to delete a file from S3
function deleteFile(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
            };
            yield s3.send(new client_s3_1.DeleteObjectCommand(params));
            logger_1.default.info(`File deleted successfully: ${key}`);
        }
        catch (error) {
            logger_1.default.error('Error deleting file:', error);
            throw new errorHandler_1.BadRequestError('File deletion failed');
        }
    });
}
