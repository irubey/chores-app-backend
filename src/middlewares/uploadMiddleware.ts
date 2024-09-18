import { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer'; // Import MulterError
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError, BadRequestError } from './errorHandler'; // Updated import
import logger from '../utils/logger';

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Configure file filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// Middleware function
export const uploadMiddleware = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const multerMiddleware = upload.single(fieldName);
    
    multerMiddleware(req, res, (err: any) => {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('File size exceeds the 5MB limit.'));
        }
        return next(new BadRequestError(err.message));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

// Helper function to get file information
export const getFileInfo = (req: Request) => {
  const file = req.file;
  if (!file) {
    throw new BadRequestError('No file uploaded');
  }
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
  };
};
