import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { startOfDay, endOfDay } from 'date-fns';
import * as z from 'zod';

const weightSchema = z.object({
  value: z.number().positive('Weight must be positive'),
  date: z.string().datetime('Invalid date format'),
});

// POST /api/weight - Create a new weight entry
export async function POST(req: Request) {
  try {
    console.log('POST /api/weight - Start');

    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user,
      expires: session?.expires,
    });

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    const { value, date } = weightSchema.parse(body);
    const entryDate = new Date(date);
    console.log('Parsed weight data:', { value, date: entryDate });

    // Check if user already has an entry for the specified date
    console.log('Checking for existing entry on:', entryDate);
    const existingEntry = await prisma.weight.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfDay(entryDate),
          lte: endOfDay(entryDate),
        },
      },
    });

    if (existingEntry) {
      console.log('Existing entry found:', existingEntry);
      return NextResponse.json(
        { message: `Weight already recorded for ${entryDate.toLocaleDateString()}` },
        { status: 400 }
      );
    }

    // Create new weight entry
    console.log('Creating new weight entry');
    const weight = await prisma.weight.create({
      data: {
        value,
        date: entryDate,
        userId: session.user.id,
      },
    });

    console.log('Weight entry created:', weight);
    return NextResponse.json(weight, { status: 201 });
  } catch (error) {
    console.error('POST /api/weight - Error');
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Weight entry error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/weight - Get weight entries
export async function GET(req: Request) {
  try {
    console.log('GET /api/weight - Start');

    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user,
      expires: session?.expires,
    });

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching weights for user:', session.user.id);
    const weights = await prisma.weight.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log('Found weights:', weights.length);
    return NextResponse.json(weights);
  } catch (error) {
    console.error('GET /api/weight - Error');
    console.error('Weight fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 