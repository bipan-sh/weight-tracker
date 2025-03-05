import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT /api/partners/[id] - Accept or reject a partner request
export async function PUT(
  req: Request,
  { params }: { params: { partnerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify the partnership exists and the user is the recipient
    const partnership = await prisma.partnership.findFirst({
      where: {
        id: params.partnerId,
        partnerId: session.user.id,
        status: 'PENDING',
      },
    });

    if (!partnership) {
      return NextResponse.json(
        { message: 'Partnership request not found' },
        { status: 404 }
      );
    }

    if (status === 'REJECTED') {
      // Delete the partnership request if rejected
      await prisma.partnership.delete({
        where: { id: params.partnerId },
      });

      return NextResponse.json({ message: 'Partnership request rejected' });
    }

    // Update the partnership status to accepted
    const updatedPartnership = await prisma.partnership.update({
      where: { id: params.partnerId },
      data: { status: 'ACCEPTED' },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPartnership);
  } catch (error) {
    console.error('Partnership update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/partners/[id] - Remove a partner
export async function DELETE(
  req: Request,
  { params }: { params: { partnerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify the partnership exists and the user is involved
    const partnership = await prisma.partnership.findFirst({
      where: {
        id: params.partnerId,
        OR: [
          { userId: session.user.id },
          { partnerId: session.user.id },
        ],
        status: 'ACCEPTED',
      },
    });

    if (!partnership) {
      return NextResponse.json(
        { message: 'Partnership not found' },
        { status: 404 }
      );
    }

    // Delete the partnership
    await prisma.partnership.delete({
      where: { id: params.partnerId },
    });

    return NextResponse.json({ message: 'Partnership removed successfully' });
  } catch (error) {
    console.error('Partnership deletion error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 