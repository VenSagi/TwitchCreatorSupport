import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { Public } from '../auth/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Current user — syncs from Clerk JWT */
  @Get('me')
  async me(@Req() req: Request) {
    const clerkUserId = req.clerkUserId!;
    const user = await this.users.syncMe(clerkUserId);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      creatorProfileId: user.creatorProfile?.id ?? null,
    };
  }

  @Public()
  @Get('health')
  health() {
    return { ok: true };
  }
}
