import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class HashService {
  private readonly saltRounds = 10;

  /**
   * Hash a plain text password
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if password matches, false otherwise
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a cryptographically secure random token
   * @param length Length of the token in characters (default: 32)
   * @returns Cryptographically secure random hex token string
   *
   * Uses Node.js crypto.randomBytes() (CSPRNG) instead of Math.random()
   * which is NOT cryptographically secure and must never be used for tokens.
   */
  generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
  }
}
