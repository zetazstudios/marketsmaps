import { Injectable } from '@nestjs/common';
import { db, bugReports } from '@marketsmaps/database';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  async create(dto: CreateReportDto, userId?: string) {
    const [report] = await db
      .insert(bugReports)
      .values({
        userId: userId || null,
        type: dto.type,
        category: dto.category,
        description: dto.description,
        steps: dto.steps || null,
        userAgent: dto.userAgent || null,
        status: 'open',
      })
      .returning();
    
    return report;
  }

  async findAll() {
    return db.select().from(bugReports).orderBy(bugReports.createdAt);
  }
}
