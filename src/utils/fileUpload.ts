import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { promisify } from 'util';
import { Readable } from 'stream';
import multer from 'multer';
import multerS3 from 'multer-s3';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';
import logger from './logger';
import { BadRequestError } from '../middlewares/errorHandler';
import type { Request } from 'express';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const randomBytes = promisify(crypto.randomBytes);

export interface UploadedFile {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  checksum: string;
}

export async function generatePresignedUrl(
  filename: string,
  contentType: string
): Promise<string> {
  const key = `uploads/${Date.now()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return signedUrl;
}

export async function uploadFile(
  file: Express.Multer.File
): Promise<UploadedFile> {
  try {
    const { originalname, buffer, mimetype, size } = file;
    const key = `uploads/${Date.now()}-${originalname}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    };

    await s3.send(new PutObjectCommand(params));

    const url = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    const checksum = crypto.createHash('md5').update(buffer).digest('hex');

    logger.info(`File uploaded successfully: ${originalname}`);

    return {
      url,
      filename: originalname,
      mimeType: mimetype,
      size,
      checksum,
    };
  } catch (error: unknown) {
    logger.error('Error uploading file:', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new BadRequestError('File upload failed');
  }
}

export function validateFileType(
  file: Express.Multer.File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(file.mimetype);
}

export function validateFileSize(
  file: Express.Multer.File,
  maxSizeInBytes: number
): boolean {
  return file.size <= maxSizeInBytes;
}

export async function generateUniqueFilename(
  originalFilename: string
): Promise<string> {
  const bytes = await randomBytes(16);
  const hash = bytes.toString('hex');
  const extension = originalFilename.split('.').pop();
  return `${hash}.${extension}`;
}

export function calculateChecksum(file: Express.Multer.File): string {
  return crypto.createHash('md5').update(file.buffer).digest('hex');
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Define allowed file types using regex
const allowedFileTypes = /jpeg|jpg|png|pdf/;

// Multer-S3 storage configuration
const storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME!,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const uniqueSuffix = Date.now().toString();
    const extension = path.extname(file.originalname);
    cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter to validate uploaded files
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only JPEG, PNG, and PDF files are allowed'));
  }
};

// Initialize Multer with S3 storage, file size limit, and file filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter,
});

export default upload;

// Add a new function for handling multiple file uploads
export async function uploadMultipleFiles(
  files: Express.Multer.File[]
): Promise<UploadedFile[]> {
  try {
    const uploadPromises = files.map((file) => uploadFile(file));
    const uploadedFiles = await Promise.all(uploadPromises);
    logger.info(`${files.length} files uploaded successfully`);
    return uploadedFiles;
  } catch (error: unknown) {
    logger.error('Error uploading multiple files:', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new BadRequestError('Multiple file upload failed');
  }
}

// Add a function to delete a file from S3
export async function deleteFile(key: string): Promise<void> {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(params));
    logger.info(`File deleted successfully: ${key}`);
  } catch (error: unknown) {
    logger.error('Error deleting file:', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new BadRequestError('File deletion failed');
  }
}
