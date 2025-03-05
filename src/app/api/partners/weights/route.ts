import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface Weight {
  date: Date;
  value: number;
}

interface PartnershipWithWeights {
  id: string;
  userId: string;
  partnerId: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    weights: Weight[];
  };
  partner: {
    id: string;
    name: string | null;
    weights: Weight[];
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all accepted partners and their weights
    const partnerships = await prisma.partnership.findMany({
      where: {
        OR: [
          { userId: session.user.id, status: 'ACCEPTED' },
          { partnerId: session.user.id, status: 'ACCEPTED' }
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            weights: {
              select: {
                date: true,
                value: true,
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            weights: {
              select: {
                date: true,
                value: true,
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
      },
    });

    // Transform the data to match the expected format
    const partnerWeights = partnerships.map((p: PartnershipWithWeights) => {
      // If the current user is the userId, then partner info is in partner field
      // If the current user is the partnerId, then partner info is in user field
      const isUserTheRequester = p.userId === session.user.id;
      const partnerInfo = isUserTheRequester ? p.partner : p.user;

      return {
        partnerId: partnerInfo.id,
        partnerName: partnerInfo.name || 'Unknown',
        weights: partnerInfo.weights,
      };
    });

    return NextResponse.json({ partnerWeights });
  } catch (error) {
    console.error('Error fetching partner weights:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 