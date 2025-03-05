import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('GET /api/user/profile - Start');

    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user,
      expires: session?.expires,
    });
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      console.log('Session object:', session);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Fetching user profile for ID:', session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        isFirstLogin: true,
      },
    });

    console.log('Found user:', user);

    if (!user) {
      console.log('User not found in database');
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('GET /api/user/profile - Success');
    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/user/profile - Error');
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

export async function PUT(request: Request) {
  try {
    console.log('PUT /api/user/profile - Start');

    const session = await getServerSession(authOptions);
    console.log('Session details:', {
      exists: !!session,
      user: session?.user,
      expires: session?.expires,
    });

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      console.log('Session object:', session);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { isFirstLogin } = body;

    console.log('Updating user profile for ID:', session.user.id);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { isFirstLogin },
      select: {
        id: true,
        name: true,
        email: true,
        isFirstLogin: true,
      },
    });

    console.log('Updated user:', updatedUser);
    console.log('PUT /api/user/profile - Success');

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT /api/user/profile - Error');
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