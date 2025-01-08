"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePasswords = comparePasswords;
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * Hashes a plain text password.
 * @param password - The plain text password
 * @returns The hashed password
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt_1.default.hash(password, saltRounds);
}
/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password
 * @param hashedPassword - The hashed password
 * @returns A boolean indicating if the passwords match
 */
async function comparePasswords(password, hashedPassword) {
    return await bcrypt_1.default.compare(password, hashedPassword);
}
