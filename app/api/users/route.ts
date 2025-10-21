import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const userResult = await db.select().from(usersTable)
  //@ts-ignore
    .where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress));
    

  if (userResult.length === 0) {
    const result = await db.insert(usersTable).values({
      name: user?.fullName ?? 'NA',
      email: user?.primaryEmailAddress?.emailAddress ?? '',
      credits: 5
    });
    return NextResponse.json({ message: 'User created', user: result });
  }

  return NextResponse.json({ message: 'User exists', user: userResult[0] });
}