import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { db, users } from '@marketsmaps/database';
import { eq } from 'drizzle-orm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-jwt-key',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { passwordHash, ...result } = user;
    return result;
  }
}
