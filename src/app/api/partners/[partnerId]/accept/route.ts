import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { partnerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { partnerId } = params;

    // Find the pending request
    const partnerRequest = await prisma.partnership.findFirst({
      where: {
        id: partnerId,
        partnerId: session.user.id,
        status: 'PENDING',
      },
    });

    if (!partnerRequest) {
      return new NextResponse('Partner request not found', { status: 404 });
    }

    // Update the request status to ACCEPTED
    const updatedPartnership = await prisma.partnership.update({
      where: {
        id: partnerId,
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    return NextResponse.json(updatedPartnership);
  } catch (error) {
    console.error('Error accepting partner request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 