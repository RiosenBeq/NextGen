import prisma from '@/lib/db';
import { headers } from 'next/headers';

export async function createAuditLog(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: string,
  details?: any
) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AuditLog" (id, action, entity, "entityId", details, "ipAddress", "userAgent", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      id,
      action,
      entity,
      entityId,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
