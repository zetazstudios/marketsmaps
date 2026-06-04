import { Injectable } from '@nestjs/common';
import { db, locations } from '@marketsmaps/database';
import { sql } from 'drizzle-orm';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const pointSql = sql`ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)`;
    
    await db.execute(sql`
      INSERT INTO locations (user_id, coordinate, accuracy, speed, heading, updated_at)
      VALUES (${userId}, ${pointSql}, ${dto.accuracy || null}, ${dto.speed || null}, ${dto.heading || null}, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        coordinate = EXCLUDED.coordinate,
        accuracy = EXCLUDED.accuracy,
        speed = EXCLUDED.speed,
        heading = EXCLUDED.heading,
        updated_at = NOW()
    `);

    return { success: true };
  }

  async getNearbySellers(lat: number, lng: number, radiusMeters: number = 5000) {
    const result = await db.execute(sql`
      SELECT 
        l.user_id as "userId",
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.avatar_url as "avatarUrl",
        u.user_type as "userType",
        u.reputation as "reputation",
        u.is_online as "isOnline",
        u.location_privacy as "locationPrivacy",
        ST_Distance(l.coordinate::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as "distanceMeters",
        CASE 
          WHEN u.location_privacy = 'exact' THEN ST_AsText(l.coordinate)
          WHEN u.location_privacy = 'approximate' THEN ST_AsText(ST_Project(l.coordinate::geography, (random() * 300 + 200), radians(random() * 360))::geometry)
          WHEN u.location_privacy = 'city' THEN ST_AsText(ST_Project(l.coordinate::geography, (random() * 6000 + 4000), radians(random() * 360))::geometry)
          ELSE NULL
        END as "coordinateWkt"
      FROM locations l
      JOIN users u ON l.user_id = u.id
      WHERE u.location_privacy != 'invisible'
        AND u.is_online = true
        AND ST_DWithin(l.coordinate::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
      ORDER BY "distanceMeters" ASC
    `);

    return this.parseSpatialResults(result.rows);
  }

  private parseSpatialResults(rows: any[]) {
    return rows.map(row => {
      let lat = null;
      let lng = null;
      if (row.coordinateWkt) {
        const match = row.coordinateWkt.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      }
      return {
        userId: row.userId,
        name: `${row.firstName} ${row.lastName}`,
        avatarUrl: row.avatarUrl,
        userType: row.userType,
        reputation: parseFloat(row.reputation),
        isOnline: row.isOnline,
        locationPrivacy: row.locationPrivacy,
        distanceMeters: parseFloat(row.distanceMeters),
        location: lat !== null && lng !== null ? { lat, lng } : null,
      };
    });
  }
}
