import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async update(@Body() dto: UpdateLocationDto, @Req() req: any) {
    return this.locationsService.updateLocation(req.user.id, dto);
  }

  @Get('nearby')
  async getNearby(
    @Query('latitude') lat: string,
    @Query('longitude') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.locationsService.getNearbySellers(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius) : undefined,
    );
  }
}
