export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface Partnership {
  userId: string;
  partnerId: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Current user ID:', session.user.id);

    // First, let's check how many users exist in total
    const totalUsers = await prisma.user.count();
    console.log('Total users in database:', totalUsers);

    // Get all users except the current user and existing partners
    const currentPartnerships = await prisma.partnership.findMany({
      where: {
        OR: [
          { userId: session.user.id, status: { in: ['ACCEPTED', 'PENDING'] } },
          { partnerId: session.user.id, status: { in: ['ACCEPTED', 'PENDING'] } }
        ]
      },
      select: {
        userId: true,
        partnerId: true
      }
    });

    console.log('Found partnerships:', JSON.stringify(currentPartnerships, null, 2));

    // Get all partner IDs to exclude
    const excludeUserIds = new Set([
      session.user.id,
      ...currentPartnerships.map((p: Partnership) => p.userId),
      ...currentPartnerships.map((p: Partnership) => p.partnerId)
    ]);

    console.log('Excluding user IDs:', Array.from(excludeUserIds));

    // Fetch available users
    const availableUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(excludeUserIds)
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Found available users:', availableUsers.length);
    console.log('Available users:', JSON.stringify(availableUsers, null, 2));

    return NextResponse.json(availableUsers);
  } catch (error) {
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 