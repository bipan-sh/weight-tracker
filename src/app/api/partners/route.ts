import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface PartnerUser {
  id: string;
  name: string | null;
  email: string;
}

interface Partnership {
  id: string;
  userId: string;
  partnerId: string;
  status: string;
  user: PartnerUser;
  partner: PartnerUser;
}

export async function GET() {
  try {
    console.log('GET /api/partners - Start');

    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user,
      expires: session?.expires,
    });

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Fetching partnerships for user:', session.user.id);

    // Get all partners and pending requests
    const [partnerships, pendingRequests] = await Promise.all([
      // Get accepted partnerships
      prisma.partnership.findMany({
        where: {
          OR: [
            { userId: session.user.id, status: 'ACCEPTED' },
            { partnerId: session.user.id, status: 'ACCEPTED' }
          ],
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          partner: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      // Get pending requests
      prisma.partnership.findMany({
        where: {
          partnerId: session.user.id,
          status: 'PENDING',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    console.log('Found partnerships:', partnerships.length);
    console.log('Found pending requests:', pendingRequests.length);

    // Transform partnerships data
    const transformedPartners = partnerships.map((p: Partnership) => {
      const isUserTheRequester = p.userId === session.user.id;
      const partnerInfo = isUserTheRequester ? p.partner : p.user;
      
      return {
        id: p.id,
        partnerId: partnerInfo.id,
        name: partnerInfo.name,
        email: partnerInfo.email,
      };
    });

    console.log('Transformed partners:', transformedPartners.length);

    return NextResponse.json({
      partners: transformedPartners,
      pendingRequests,
    });
  } catch (error) {
    console.error('GET /api/partners - Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/partners - Start');

    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user,
      expires: session?.expires,
    });

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { partnerId } = body;

    if (!partnerId) {
      console.log('Missing partnerId in request');
      return new NextResponse('Partner ID is required', { status: 400 });
    }

    // Check if partnership already exists
    console.log('Checking for existing partnership between', session.user.id, 'and', partnerId);
    const existingPartnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { userId: session.user.id, partnerId },
          { userId: partnerId, partnerId: session.user.id },
        ],
      },
    });

    if (existingPartnership) {
      console.log('Found existing partnership:', existingPartnership);
      return new NextResponse('Partnership already exists', { status: 400 });
    }

    // Create new partnership request
    console.log('Creating new partnership request');
    const partnership = await prisma.partnership.create({
      data: {
        userId: session.user.id,
        partnerId,
      },
    });

    console.log('Partnership request created:', partnership);
    return NextResponse.json(partnership);
  } catch (error) {
    console.error('POST /api/partners - Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 