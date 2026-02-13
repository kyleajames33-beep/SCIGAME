'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { GameMode, Player } from '@/lib/game-types'
import { GAME_MODE_CONFIG } from '@/lib/game-config'

// Decomposed components
import { MenuScreen } from './MenuScreen'
import { CreateGameScreen } from './CreateGameScreen'
import { JoinGameScreen } from './JoinGameScreen'
import { LobbyScreen } from './LobbyScreen'
import { MultiplayerPlay } from './MultiplayerPlay'
import { ResultsScreen } from './ResultsScreen'

type ScreenState = 'menu' | 'create' | 'join' | 'lobby' | 'playing' | 'results'

type Question = {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  topic: string
}

type GameState = {
  gameStatus: 'waiting' | 'playing' | 'finished'
  currentQuestion: number
  totalQuestions: number
  players: Player[]
  question: Question | null
  questionStartedAt: string | null
  answeredCount: number
  totalPlayers: number
}

export default function MultiplayerGame() {
  const [screen, setScreen] = useState<ScreenState>('menu')
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [gameCode, setGameCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Game state from SSE
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; correctAnswer: number; pointsEarned: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to SSE stream
  useEffect(() => {
    if (!gameCode || !playerId || (screen !== 'lobby' && screen !== 'playing' && screen !== 'results')) {
      return
    }

    const eventSource = new EventSource(`/api/multiplayer/${gameCode}/stream?playerId=${playerId}`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('gameState', (event) => {
      const data = JSON.parse(event.data) as GameState
      setGameState(data)
      
      if (data.gameStatus === 'playing' && screen === 'lobby') {
        setScreen('playing')
        setIsAnswered(false)
        setSelectedAnswer(null)
        setAnswerResult(null)
      }
      
      if (data.gameStatus === 'finished') {
        setScreen('results')
      }
    })

    eventSource.addEventListener('gameFinished', () => {
      setScreen('results')
    })

    eventSource.addEventListener('error', () => {
      console.error('SSE connection error')
    })

    return () => {
      eventSource.close()
    }
  }, [gameCode, playerId, screen])

  // Timer countdown
  useEffect(() => {
    if (screen !== 'playing' || !gameState?.questionStartedAt) return

    const config = GAME_MODE_CONFIG[gameMode]
    const startTime = new Date(gameState.questionStartedAt).getTime()
    
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, config.timePerQuestion - elapsed)
      setTimeLeft(remaining)
      
      if (remaining === 0 && !isAnswered) {
        handleTimeout()
      }
    }

    updateTimer()
    timerRef.current = setInterval(updateTimer, 100)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [screen, gameState?.questionStartedAt, gameState?.currentQuestion, gameMode, isAnswered])

  // Reset answer state when question changes
  useEffect(() => {
    setIsAnswered(false)
    setSelectedAnswer(null)
    setAnswerResult(null)
  }, [gameState?.currentQuestion])

  const handleTimeout = useCallback(async () => {
    if (isAnswered) return
    setIsAnswered(true)
    toast.error("Time's up!")
  }, [isAnswered])

  const createGame = async () => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/multiplayer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), gameMode }),
      })

      if (!response.ok) throw new Error('Failed to create game')

      const data = await response.json()
      setGameCode(data.gameCode)
      setPlayerId(data.playerId)
      setIsHost(true)
      setScreen('lobby')
    } catch (error) {
      toast.error('Failed to create game')
    } finally {
      setIsLoading(false)
    }
  }

  const joinGame = async () => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname')
      return
    }
    if (!joinCode.trim()) {
      toast.error('Please enter a game code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/multiplayer/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode: joinCode.trim(), nickname: nickname.trim() }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.error || 'Failed to join game')
        return
      }

      setGameCode(data.gameCode)
      setPlayerId(data.playerId)
      setGameMode(data.gameMode)
      setIsHost(false)
      setScreen('lobby')
    } catch (error) {
      toast.error('Failed to join game')
    } finally {
      setIsLoading(false)
    }
  }

  const startGame = async () => {
    try {
      const response = await fetch(`/api/multiplayer/${gameCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Failed to start game')
      }
    } catch (error) {
      toast.error('Failed to start game')
    }
  }

  const submitAnswer = async (answerIndex: number) => {
    if (isAnswered) return

    setSelectedAnswer(answerIndex)
    setIsAnswered(true)

    try {
      const response = await fetch(`/api/multiplayer/${gameCode}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, selectedAnswer: answerIndex }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setAnswerResult({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          pointsEarned: data.pointsEarned,
        })
        
        if (data.isCorrect) {
          toast.success(`Correct! +${data.pointsEarned} points`)
        } else {
          toast.error('Incorrect!')
        }
      }
    } catch (error) {
      toast.error('Failed to submit answer')
    }
  }

  const nextQuestion = async () => {
    try {
      await fetch(`/api/multiplayer/${gameCode}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
    } catch (error) {
      toast.error('Failed to advance game')
    }
  }

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode)
    setCopied(true)
    toast.success('Game code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const resetGame = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setScreen('menu')
    setGameCode('')
    setJoinCode('')
    setPlayerId('')
    setIsHost(false)
    setGameState(null)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setAnswerResult(null)
  }

  // Menu Screen
  if (screen === 'menu') {
    return (
      <MenuScreen
        onHostGame={() => setScreen('create')}
        onJoinGame={() => setScreen('join')}
      />
    )
  }

  // Create Game Screen
  if (screen === 'create') {
    return (
      <CreateGameScreen
        nickname={nickname}
        gameMode={gameMode}
        isLoading={isLoading}
        onNicknameChange={setNickname}
        onModeChange={setGameMode}
        onCreateGame={createGame}
        onBack={() => setScreen('menu')}
      />
    )
  }

  // Join Game Screen
  if (screen === 'join') {
    return (
      <JoinGameScreen
        nickname={nickname}
        joinCode={joinCode}
        isLoading={isLoading}
        onNicknameChange={setNickname}
        onJoinCodeChange={setJoinCode}
        onJoinGame={joinGame}
        onBack={() => setScreen('menu')}
      />
    )
  }

  // Lobby Screen
  if (screen === 'lobby') {
    return (
      <LobbyScreen
        gameCode={gameCode}
        gameMode={gameMode}
        players={gameState?.players || []}
        isHost={isHost}
        copied={copied}
        onCopyCode={copyGameCode}
        onStartGame={startGame}
        onLeaveGame={resetGame}
      />
    )
  }

  // Playing Screen
  if (screen === 'playing' && gameState) {
    const allAnswered = gameState.answeredCount === gameState.totalPlayers

    return (
      <MultiplayerPlay
        gameMode={gameMode}
        currentQuestion={gameState.currentQuestion}
        totalQuestions={gameState.totalQuestions}
        question={gameState.question}
        players={gameState.players}
        playerId={playerId}
        isHost={isHost}
        timeLeft={timeLeft}
        answeredCount={gameState.answeredCount}
        totalPlayers={gameState.totalPlayers}
        selectedAnswer={selectedAnswer}
        isAnswered={isAnswered}
        answerResult={answerResult}
        allAnswered={allAnswered}
        onSubmitAnswer={submitAnswer}
        onNextQuestion={nextQuestion}
      />
    )
  }

  // Results Screen
  if (screen === 'results' && gameState) {
    return (
      <ResultsScreen
        players={gameState.players}
        playerId={playerId}
        onPlayAgain={resetGame}
      />
    )
  }

  return null
}
