import bcrypt from 'bcrypt';

/**
 * Hashes a plain text password.
 * @param password - The plain text password
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password
 * @param hashedPassword - The hashed password
 * @returns A boolean indicating if the passwords match
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}