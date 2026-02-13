'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Coins, Flame, Clock, Heart } from 'lucide-react'
import { GameMode } from '@/lib/game-types'

type StatsBarProps = {
  score: number
  coins: number
  streak: number
  lives: number
  timeLeft: number
  isTimeFrozen: boolean
  gameMode: GameMode
  onOpenShop: () => void
}

export function StatsBar({
  score,
  coins,
  streak,
  lives,
  timeLeft,
  isTimeFrozen,
  gameMode,
  onOpenShop
}: StatsBarProps) {
  return (
    <div className={`grid ${gameMode === 'survival' ? 'grid-cols-5' : 'grid-cols-4'} gap-3 mb-4`}>
      <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
        <CardContent className="p-4 text-center">
          <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{score}</p>
          <p className="text-xs text-gray-600">Score</p>
        </CardContent>
      </Card>

      <Card 
        className="bg-white/95 backdrop-blur shadow-lg border-0 cursor-pointer hover:bg-yellow-50 transition-colors"
        onClick={onOpenShop}
      >
        <CardContent className="p-4 text-center relative">
          <Coins className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-yellow-600">{coins}</p>
          <p className="text-xs text-gray-600">Coins</p>
          <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-1.5">
            Shop
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
        <CardContent className="p-4 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-orange-600">{streak}</p>
          <p className="text-xs text-gray-600">Streak</p>
        </CardContent>
      </Card>

      {gameMode === 'survival' && (
        <Card className={`backdrop-blur shadow-lg border-0 transition-colors ${
          lives <= 1 ? 'bg-red-100' : 'bg-white/95'
        }`}>
          <CardContent className="p-4 text-center">
            <Heart className={`w-6 h-6 mx-auto mb-1 ${lives <= 1 ? 'text-red-500 animate-pulse' : 'text-pink-500'}`} />
            <p className={`text-2xl font-bold ${lives <= 1 ? 'text-red-600' : 'text-pink-600'}`}>{lives}</p>
            <p className="text-xs text-gray-600">Lives</p>
          </CardContent>
        </Card>
      )}

      <Card className={`backdrop-blur shadow-lg border-0 transition-colors ${
        isTimeFrozen ? 'bg-cyan-100' : timeLeft <= 10 ? 'bg-red-100' : 'bg-white/95'
      }`}>
        <CardContent className="p-4 text-center">
          <Clock className={`w-6 h-6 mx-auto mb-1 ${
            isTimeFrozen ? 'text-cyan-500' : timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-500'
          }`} />
          <p className={`text-2xl font-bold ${
            isTimeFrozen ? 'text-cyan-600' : timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {isTimeFrozen ? '⏸️' : `${timeLeft}s`}
          </p>
          <p className="text-xs text-gray-600">{isTimeFrozen ? 'Frozen!' : 'Time'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
