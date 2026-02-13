'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Medal, Award, Clock, Target, Flame, ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { GameMode } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'

interface LeaderboardEntry {
  rank: number
  username: string
  displayName: string
  score: number
  accuracy: number
  maxStreak: number
  timeTaken: number
  createdAt: string
}

const RANK_ICONS = {
  1: <Trophy className="w-5 h-5 text-yellow-400" />,
  2: <Medal className="w-5 h-5 text-gray-300" />,
  3: <Award className="w-5 h-5 text-amber-600" />,
}

export default function LeaderboardPage() {
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/leaderboard?gameMode=${gameMode}&limit=50`)
        const data = await response.json()
        setEntries(data.entries || [])
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [gameMode])

  const modeDisplay = getModeDisplay(gameMode)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-purple-200">Top performers in ChemQuest</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
            <CardHeader>
              <Tabs value={gameMode} onValueChange={(v) => setGameMode(v as GameMode)}>
                <TabsList className="grid grid-cols-3 bg-purple-900/50">
                  <TabsTrigger value="classic" className="data-[state=active]:bg-purple-600">
                    Classic
                  </TabsTrigger>
                  <TabsTrigger value="rush" className="data-[state=active]:bg-orange-600">
                    Rush
                  </TabsTrigger>
                  <TabsTrigger value="survival" className="data-[state=active]:bg-red-600">
                    Survival
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <CardDescription className="text-purple-200 mt-4">
                {modeDisplay?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-300 animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-purple-200">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scores yet for {modeDisplay?.name} mode.</p>
                  <p className="text-sm mt-2">Be the first to set a record!</p>
                  <Link href="/game">
                    <Button className="mt-4 bg-purple-600 hover:bg-purple-700">Play Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <motion.div
                      key={`${entry.username}-${entry.createdAt}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent' : 'bg-white/5'
                      }`}
                    >
                      <div className="w-10 text-center">
                        {entry.rank <= 3 ? (
                          RANK_ICONS[entry.rank as 1 | 2 | 3]
                        ) : (
                          <span className="text-purple-300 font-bold">#{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{entry.displayName}</p>
                        <p className="text-purple-300 text-sm">@{entry.username}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-yellow-400 font-bold">{entry.score.toLocaleString()}</p>
                          <p className="text-purple-300 text-xs">Score</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-green-400 font-bold flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {entry.accuracy}%
                          </p>
                          <p className="text-purple-300 text-xs">Accuracy</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-orange-400 font-bold flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {entry.maxStreak}
                          </p>
                          <p className="text-purple-300 text-xs">Streak</p>
                        </div>
                        <div className="text-center hidden md:block">
                          <p className="text-blue-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.timeTaken)}
                          </p>
                          <p className="text-purple-300 text-xs">Time</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
