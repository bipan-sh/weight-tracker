import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as z from 'zod';

const updateGoalSchema = z.object({
  targetWeight: z.number().positive().optional(),
  targetDate: z.string().datetime().optional(),
  achieved: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/goals/[id] - Get a specific goal
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.id;
    
    const goal = await prisma.goal.findUnique({
      where: {
        id: goalId,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update a goal
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.id;
    const body = await request.json();
    
    // Validate input data
    const { targetWeight, targetDate, achieved } = updateGoalSchema.parse(body);
    
    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id: goalId,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: {
        id: goalId,
      },
      data: {
        ...(targetWeight !== undefined && { targetWeight }),
        ...(targetDate !== undefined && { targetDate: new Date(targetDate) }),
        ...(achieved !== undefined && { achieved }),
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.id;
    
    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id: goalId,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
    }

    // Delete the goal
    await prisma.goal.delete({
      where: {
        id: goalId,
      },
    });

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 