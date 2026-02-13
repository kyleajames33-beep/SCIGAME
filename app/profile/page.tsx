'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, Trophy, Coins, Flame, Target, Gamepad2, 
  ArrowLeft, Loader2, LogOut, Clock, Crown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getModeDisplay } from '@/lib/game-config'

interface UserProfile {
  id: string
  username: string
  displayName: string
  email: string | null
  role: string
  totalCoins: number
  totalScore: number
  gamesPlayed: number
  bestStreak: number
}

interface GameHistory {
  id: string
  gameMode: string
  score: number
  accuracy: number
  maxStreak: number
  totalQuestions: number
  completedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [recentGames, setRecentGames] = useState<GameHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        const data = await response.json()
        setUser(data.user)
        setRecentGames(data.recentGames || [])
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-300 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalAnswered = recentGames.reduce((sum, g) => sum + g.totalQuestions, 0)
  const avgAccuracy = recentGames.length > 0
    ? Math.round(recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <User className="w-8 h-8" />
                Profile
              </h1>
              <p className="text-purple-200">Your ChemQuest journey</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20 mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    {user.displayName}
                    {user.role === 'teacher' && (
                      <Badge className="bg-blue-500">Teacher</Badge>
                    )}
                    {user.role === 'admin' && (
                      <Badge className="bg-red-500">Admin</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-purple-200">@{user.username}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-400">{user.totalCoins.toLocaleString()}</p>
              <p className="text-yellow-200 text-sm">Total Coins</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-400">{user.totalScore.toLocaleString()}</p>
              <p className="text-purple-200 text-sm">Total Score</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-400">{user.gamesPlayed}</p>
              <p className="text-blue-200 text-sm">Games Played</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/20">
            <CardContent className="p-4 text-center">
              <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-400">{user.bestStreak}</p>
              <p className="text-orange-200 text-sm">Best Streak</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Target className="w-10 h-10 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">{avgAccuracy}%</p>
                <p className="text-purple-200 text-sm">Avg Accuracy</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Crown className="w-10 h-10 text-pink-400" />
              <div>
                <p className="text-2xl font-bold text-pink-400">{totalAnswered}</p>
                <p className="text-purple-200 text-sm">Questions Answered</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Games
              </CardTitle>
              <CardDescription className="text-purple-200">
                Your last 20 games
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentGames.length === 0 ? (
                <div className="text-center py-8 text-purple-200">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No games played yet.</p>
                  <Link href="/game">
                    <Button className="mt-4 bg-purple-600 hover:bg-purple-700">Play Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentGames.map((game, index) => {
                    const modeDisplay = getModeDisplay(game.gameMode as 'classic' | 'rush' | 'survival')
                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-3 rounded-lg bg-white/5"
                      >
                        <Badge
                          className={`${
                            game.gameMode === 'classic'
                              ? 'bg-purple-600'
                              : game.gameMode === 'rush'
                              ? 'bg-orange-600'
                              : 'bg-red-600'
                          }`}
                        >
                          {modeDisplay?.name}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-purple-200 text-sm">
                            {game.completedAt ? formatDate(game.completedAt) : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-yellow-400 font-bold">{game.score.toLocaleString()}</p>
                            <p className="text-purple-300 text-xs">Score</p>
                          </div>
                          <div className="text-center hidden sm:block">
                            <p className="text-green-400 font-bold">{game.accuracy}%</p>
                            <p className="text-purple-300 text-xs">Accuracy</p>
                          </div>
                          <div className="text-center hidden sm:block">
                            <p className="text-orange-400 font-bold">{game.maxStreak}</p>
                            <p className="text-purple-300 text-xs">Streak</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
