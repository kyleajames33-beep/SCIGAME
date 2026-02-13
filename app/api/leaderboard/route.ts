import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gameMode = searchParams.get('gameMode') || 'classic'
    const questionSetId = searchParams.get('questionSetId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const whereClause: Record<string, unknown> = {
      gameMode,
    }

    if (questionSetId) {
      whereClause.questionSetId = questionSetId
    }

    const entries = await prisma.leaderboardEntry.findMany({
      where: whereClause,
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    })

    const leaderboard = entries.map((entry, index) => ({
      rank: index + 1,
      username: entry.user.username,
      displayName: entry.user.displayName,
      score: entry.score,
      accuracy: Math.round(entry.accuracy * 100),
      maxStreak: entry.maxStreak,
      timeTaken: entry.timeTaken,
      createdAt: entry.createdAt.toISOString(),
    }))

    return NextResponse.json({ entries: leaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
