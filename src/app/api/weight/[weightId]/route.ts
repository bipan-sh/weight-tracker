import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { startOfDay, endOfDay } from 'date-fns';
import * as z from 'zod';

const weightSchema = z.object({
  value: z.number().positive('Weight must be positive'),
  date: z.string().datetime('Invalid date format'),
});

export async function PUT(
  req: Request,
  { params }: { params: { weightId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { value, date } = weightSchema.parse(body);
    const entryDate = new Date(date);

    // Verify the weight entry exists and belongs to the user
    const existingEntry = await prisma.weight.findFirst({
      where: {
        id: params.weightId,
        userId: session.user.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { message: 'Weight entry not found' },
        { status: 404 }
      );
    }

    // Check if there's already an entry for the new date (excluding the current entry)
    const conflictingEntry = await prisma.weight.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfDay(entryDate),
          lte: endOfDay(entryDate),
        },
        NOT: {
          id: params.weightId,
        },
      },
    });

    if (conflictingEntry) {
      return NextResponse.json(
        { message: `Weight already recorded for ${entryDate.toLocaleDateString()}` },
        { status: 400 }
      );
    }

    // Update the weight entry
    const updatedWeight = await prisma.weight.update({
      where: {
        id: params.weightId,
      },
      data: {
        value,
        date: entryDate,
      },
    });

    return NextResponse.json(updatedWeight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Weight update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { weightId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify the weight entry exists and belongs to the user
    const weightEntry = await prisma.weight.findFirst({
      where: {
        id: params.weightId,
        userId: session.user.id,
      },
    });

    if (!weightEntry) {
      return NextResponse.json(
        { message: 'Weight entry not found' },
        { status: 404 }
      );
    }

    // Delete the weight entry
    await prisma.weight.delete({
      where: {
        id: params.weightId,
      },
    });

    return NextResponse.json({ message: 'Weight entry deleted successfully' });
  } catch (error) {
    console.error('Weight entry deletion error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 