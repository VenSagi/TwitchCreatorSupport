import { Controller, Get, Param, Query } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { Public } from '../auth/public.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Public()
  @Get(':campaignId/feed')
  feed(@Param('campaignId') campaignId: string, @Query('take') take?: string) {
    return this.campaigns.getFeed(campaignId, take ? parseInt(take, 10) : 50);
  }

  @Public()
  @Get(':campaignId/leaderboard')
  leaderboard(@Param('campaignId') campaignId: string, @Query('take') take?: string) {
    return this.campaigns.getLeaderboard(campaignId, take ? parseInt(take, 10) : 20);
  }

  @Public()
  @Get(':campaignId/stats')
  stats(@Param('campaignId') campaignId: string) {
    return this.campaigns.getStats(campaignId);
  }
}
