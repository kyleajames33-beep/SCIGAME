import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      totalCoins: user.totalCoins,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
      bestStreak: user.bestStreak,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
