import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    console.log('POST /api/auth/signup - Start');

    const body = await req.json();
    console.log('Request body:', {
      name: body.name,
      email: body.email,
      hasPassword: !!body.password,
    });

    const { name, email, password } = signUpSchema.parse(body);

    // Check if user already exists
    console.log('Checking if user exists:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('Hashing password');
    const hashedPassword = await hash(password, 12);

    // Create user
    console.log('Creating user:', email);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Create default privacy settings
        privacySettings: {
          create: {
            shareWeight: false,
            shareGoals: false,
            shareProgress: false,
            publicProfile: false,
          },
        },
      },
    });

    console.log('User created successfully:', user.id);
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/signup - Error');
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 