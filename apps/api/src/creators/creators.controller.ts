import { Controller, Get, Param } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { Public } from '../auth/public.decorator';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creators: CreatorsService) {}

  @Public()
  @Get(':creatorId')
  getOne(@Param('creatorId') creatorId: string) {
    return this.creators.getById(creatorId);
  }

  @Public()
  @Get(':creatorId/campaigns')
  listCampaigns(@Param('creatorId') creatorId: string) {
    return this.creators.listCampaigns(creatorId);
  }

  @Public()
  @Get(':creatorId/products')
  listProducts(@Param('creatorId') creatorId: string) {
    return this.creators.listProducts(creatorId);
  }
}
