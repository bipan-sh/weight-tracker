import NextAuth, { AuthOptions } from 'next-auth';
import { compare } from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('NextAuth - Authorizing credentials');

        if (!credentials?.email || !credentials?.password) {
          console.log('NextAuth - Missing email or password');
          throw new Error('Please enter an email and password');
        }

        console.log('NextAuth - Finding user with email:', credentials.email);
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          console.log('NextAuth - No user found with email:', credentials.email);
          throw new Error('No user found with this email');
        }

        console.log('NextAuth - Validating password for user:', user.id);
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.log('NextAuth - Invalid password for user:', user.id);
          throw new Error('Invalid password');
        }

        console.log('NextAuth - Authorization successful for user:', user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('NextAuth - Sign in callback:', {
        hasUser: !!user,
        hasAccount: !!account,
        hasProfile: !!profile,
        hasEmail: !!email,
        hasCredentials: !!credentials,
      });
      return true;
    },
    async jwt({ token, user, account, profile }) {
      console.log('NextAuth - JWT callback:', {
        tokenExists: !!token,
        userExists: !!user,
        accountExists: !!account,
        profileExists: !!profile,
        tokenId: token?.sub,
        userId: user?.id,
      });

      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      console.log('NextAuth - Session callback:', {
        sessionExists: !!session,
        tokenExists: !!token,
        userExists: !!user,
        tokenId: token?.sub,
        sessionUserId: session?.user?.id,
      });

      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth - Error:', { code, metadata });
    },
    warn(code) {
      console.warn('NextAuth - Warning:', { code });
    },
    debug(code, metadata) {
      console.log('NextAuth - Debug:', { code, metadata });
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 