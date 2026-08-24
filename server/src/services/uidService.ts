import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * Safely generates the next Unique ID in format MSC26-XXXX.
 * Must be executed within a transaction to avoid race conditions.
 */
export async function generateNextUniqueId(tx: Prisma.TransactionClient): Promise<string> {
  const yearPrefix = 'MSC26';
  
  // Find all existing confirmed non-null UIDs sorted descending
  const lastConfirmed = await tx.registration.findFirst({
    where: {
      uniqueId: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      uniqueId: 'desc',
    },
    select: {
      uniqueId: true,
    },
  });

  let nextNumber = 1;
  if (lastConfirmed && lastConfirmed.uniqueId) {
    const parts = lastConfirmed.uniqueId.split('-');
    if (parts.length === 2) {
      const parsedNum = parseInt(parts[1], 10);
      if (!isNaN(parsedNum)) {
        nextNumber = parsedNum + 1;
      }
    }
  }

  const padded = String(nextNumber).padStart(4, '0');
  return `${yearPrefix}-${padded}`;
}
