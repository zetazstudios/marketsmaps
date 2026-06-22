import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Body() dto: CreateReportDto, @Body('userId') userId?: string) {
    return this.reportsService.create(dto, userId);
  }

  @Get()
  async getReports() {
    return this.reportsService.findAll();
  }
}
