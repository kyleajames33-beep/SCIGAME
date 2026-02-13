import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Beaker, ArrowRight, Flame, Zap, 
  Coins, Play, Rocket, Shield, Sparkles, Users
} from 'lucide-react'
import Link from 'next/link'

const GAME_MODES = [
  {
    id: 'classic',
    name: 'Classic',
    description: '10 questions with 30 seconds each. Perfect for a quick study session.',
    icon: <Play className="w-8 h-8" />,
    color: 'from-purple-500 to-blue-500',
    features: ['10 Questions', '30s Timer', 'All Power-ups']
  },
  {
    id: 'rush',
    name: 'Rush',
    description: '20 questions, 15 seconds each. Speed matters - bonus points for fast answers!',
    icon: <Rocket className="w-8 h-8" />,
    color: 'from-orange-500 to-red-500',
    features: ['20 Questions', '15s Timer', 'Speed Bonus']
  },
  {
    id: 'survival',
    name: 'Survival',
    description: 'You have 3 lives. How long can you survive? Go for the high score!',
    icon: <Shield className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500',
    features: ['3 Lives', '25s Timer', 'Endless']
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl" />
              <Beaker className="w-24 h-24 text-white relative" />
              <Sparkles className="w-10 h-10 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            ChemQuest
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-2">
            HSC Chemistry Module 1
          </p>
          <p className="text-lg text-white/70 mb-6">
            Properties & Structure of Matter
          </p>
        </div>

        {/* Play Buttons */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/game" className="block">
              <Button className="w-full bg-white hover:bg-gray-100 text-purple-600 text-lg py-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all font-bold group h-auto">
                <div className="flex flex-col items-center">
                  <Play className="w-8 h-8 mb-2" />
                  <span>Solo Play</span>
                </div>
              </Button>
            </Link>
            <Link href="/game/multiplayer" className="block">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-lg py-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all font-bold group h-auto">
                <div className="flex flex-col items-center">
                  <Users className="w-8 h-8 mb-2" />
                  <span>Multiplayer</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* Game Modes Section */}
        <div className="max-w-5xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Solo Game Modes</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {GAME_MODES.map((mode) => (
              <Card key={mode.id} className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 transition-all">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    {mode.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{mode.name}</h3>
                  <p className="text-white/70 text-sm mb-4">{mode.description}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {mode.features.map((feature, i) => (
                      <Badge key={i} className="bg-white/20 text-white border-white/30 text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Multiplayer Card */}
        <div className="max-w-2xl mx-auto mb-10">
          <Card className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur border-pink-300/30 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shrink-0">
                  <Users className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Multiplayer Mode</h3>
                  <p className="text-white/80 mb-3">Challenge your friends in real-time! Host a game, share the code, and compete for the top spot on the live leaderboard.</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/20 text-white border-white/30">Live Leaderboard</Badge>
                    <Badge className="bg-white/20 text-white border-white/30">Game Codes</Badge>
                    <Badge className="bg-white/20 text-white border-white/30">Real-time</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="bg-yellow-400/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coins className="w-7 h-7 text-yellow-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Earn & Spend Coins</h3>
              <p className="text-white/70 text-sm">
                Get coins for correct answers and buy power-ups in the shop!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="bg-purple-400/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-purple-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Power-ups</h3>
              <p className="text-white/70 text-sm">
                Time Freeze, 50/50, Double Points, and Skip Question!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="bg-orange-400/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Flame className="w-7 h-7 text-orange-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Streak Bonuses</h3>
              <p className="text-white/70 text-sm">
                Build streaks for up to 5x point multipliers!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-white/60 text-sm">
          <p>Built for HSC Chemistry students 🧪</p>
        </div>
      </div>
    </div>
  )
}
