import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db, users } from '@marketsmaps/database';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const [existing] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const [newUser] = await db.insert(users).values({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatarUrl: dto.avatarUrl || null,
      userType: dto.userType || 'personal',
    }).returning();

    return this.generateToken(newUser.id, newUser.email);
  }

  async login(dto: LoginDto) {
    const [user] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user.id, user.email);
  }

  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
