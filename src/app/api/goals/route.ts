import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as z from 'zod';

const goalSchema = z.object({
  targetWeight: z.number().positive(),
  startWeight: z.number().positive(),
  targetDate: z.string().datetime(),
});

// POST /api/goals - Create a new goal
export async function POST(req: Request) {
  try {
    console.log('POST /api/goals - Start');

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

    const { targetWeight, startWeight, targetDate } = goalSchema.parse(body);
    console.log('Parsed goal data:', { targetWeight, startWeight, targetDate });

    // Check if user already has an active goal
    console.log('Checking for existing active goal');
    const existingGoal = await prisma.goal.findFirst({
      where: {
        userId: session.user.id,
        achieved: false,
      },
    });

    if (existingGoal) {
      console.log('Active goal found:', existingGoal);
      return NextResponse.json(
        { message: 'You already have an active goal' },
        { status: 400 }
      );
    }

    // Create new goal
    console.log('Creating new goal');
    const goal = await prisma.goal.create({
      data: {
        targetWeight,
        startWeight,
        targetDate: new Date(targetDate),
        userId: session.user.id,
      },
    });

    console.log('Goal created:', goal);
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('POST /api/goals - Error');
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Goal creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/goals - Get user's goals
export async function GET(req: Request) {
  try {
    console.log('GET /api/goals - Start');

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

    console.log('Fetching goals for user:', session.user.id);
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found goals:', goals.length);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('GET /api/goals - Error');
    console.error('Goal fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 