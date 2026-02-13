'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { GameMode, Question, PowerUpId } from '@/lib/game-types'
import { GAME_MODE_CONFIG, INITIAL_COINS, INITIAL_LIVES } from '@/lib/game-config'

// Decomposed components
import { ModeSelect } from './ModeSelect'
import { LobbyScreen } from './LobbyScreen'
import { ResultsScreen } from './ResultsScreen'
import { StatsBar } from './StatsBar'
import { ProgressBar } from './ProgressBar'
import { PowerUpBar } from './PowerUpBar'
import { PowerUpShop } from './PowerUpShop'
import { QuestionCard } from './QuestionCard'
import { CoinAnimation } from './CoinAnimation'

type GameState = 'mode-select' | 'lobby' | 'playing' | 'results'

export default function QuizGame() {
  // Core state
  const [gameState, setGameState] = useState<GameState>('mode-select')
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [gameCode, setGameCode] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(INITIAL_COINS)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [baseTime, setBaseTime] = useState(30)
  const [isAnswered, setIsAnswered] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isLoading, setIsLoading] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [coinAnimation, setCoinAnimation] = useState<number | null>(null)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0) // Track coins earned this session
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id: string; username: string; displayName: string; totalCoins: number } | null>(null)
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null) // Explanation for current question
  
  // Refs to avoid stale closures in timer callbacks
  const livesRef = useRef(lives)
  const gameModeRef = useRef(gameMode)
  const isAnsweredRef = useRef(isAnswered)
  const sessionIdRef = useRef(sessionId)
  const questionsRef = useRef(questions)
  const currentQuestionIndexRef = useRef(currentQuestionIndex)
  const questionStartTimeRef = useRef(questionStartTime)
  const coinsEarnedRef = useRef(coinsEarned)
  
  // Keep refs in sync with state
  useEffect(() => { livesRef.current = lives }, [lives])
  useEffect(() => { gameModeRef.current = gameMode }, [gameMode])
  useEffect(() => { isAnsweredRef.current = isAnswered }, [isAnswered])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex }, [currentQuestionIndex])
  useEffect(() => { questionStartTimeRef.current = questionStartTime }, [questionStartTime])
  useEffect(() => { coinsEarnedRef.current = coinsEarned }, [coinsEarned])
  
  // Power-up states
  const [isTimeFrozen, setIsTimeFrozen] = useState(false)
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([])
  const [hasDoublePoints, setHasDoublePoints] = useState(false)
  const [ownedPowerUps, setOwnedPowerUps] = useState<Record<PowerUpId, number>>({
    timeFreeze: 0,
    fiftyFifty: 0,
    doublePoints: 0,
    skip: 0
  })

  // Stable handleTimeOut that uses refs for current values
  const handleTimeOut = useCallback(async () => {
    if (isAnsweredRef.current) return
    setIsAnswered(true)
    toast.error("Time's up!")
    
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    
    try {
      await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          questionId: questionsRef.current?.[currentQuestionIndexRef.current]?.id,
          selectedAnswer: -1,
          timeSpent,
        }),
      })

      setStreak(0)
      setIncorrectAnswers((prev) => prev + 1)
      setQuestionsAnswered(prev => prev + 1)
      
      // Handle lives for survival mode
      if (gameModeRef.current === 'survival') {
        const currentLives = livesRef.current
        const newLives = currentLives - 1
        setLives(newLives)
        if (newLives <= 0) {
          setTimeout(() => finishGame(), 1500)
          return
        }
      }
    } catch (error) {
      console.error('Submit timeout error:', error)
    }

    setTimeout(() => {
      nextQuestion()
    }, 2000)
  }, [])

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing' || isAnswered || timeLeft <= 0 || isTimeFrozen) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, isAnswered, timeLeft, isTimeFrozen, handleTimeOut])

  // Question set state
  const [questionSetId, setQuestionSetId] = useState<string | null>(null)

  const selectMode = (mode: GameMode, qSetId?: string | null) => {
    setGameMode(mode)
    setQuestionSetId(qSetId ?? null)
    setGameState('lobby')
  }

  const startGame = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameMode, questionSetId }),
      })

      if (!response?.ok) throw new Error('Failed to start game')

      const data = await response.json()
      setGameCode(data?.gameCode || '')
      setSessionId(data?.sessionId || '')
      setQuestions(data?.questions || [])
      setBaseTime(data?.config?.timePerQuestion || 30)
      setTimeLeft(data?.config?.timePerQuestion || 30)
      if (data?.config?.lives) {
        setLives(data.config.lives)
      }
      // Use authenticated user's coins if available, otherwise default
      if (data?.user) {
        setAuthenticatedUser(data.user)
        setCoins(data.user.totalCoins || INITIAL_COINS)
      } else {
        setCoins(INITIAL_COINS)
      }
      setCoinsEarned(0) // Reset coins earned for new game
      setGameState('playing')
      setQuestionStartTime(Date.now())
    } catch (error) {
      toast.error('Failed to start game. Please try again.')
      console.error('Start game error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCoins = (amount: number) => {
    setCoinAnimation(amount)
    setCoins(prev => prev + amount)
    setCoinsEarned(prev => prev + amount) // Track earned coins for persistence
    setTimeout(() => setCoinAnimation(null), 1000)
  }

  const handleAnswerSelect = async (answerIndex: number) => {
    if (isAnswered) return

    setSelectedAnswer(answerIndex)
    setIsAnswered(true)
    setIsTimeFrozen(false)

    const currentQuestion = questions?.[currentQuestionIndex]
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    const timeRemaining = timeLeft

    try {
      const response = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion?.id,
          selectedAnswer: answerIndex,
          timeSpent,
        }),
      })

      if (!response?.ok) throw new Error('Failed to submit answer')

      const data = await response.json()
      const isCorrect = data?.isCorrect
      
      // Store the correct answer for UI display
      if (currentQuestion) {
        currentQuestion.correctAnswer = data?.correctAnswer
      }
      
      // Store explanation (if available)
      setCurrentExplanation(data?.explanation || null)
      
      setQuestionsAnswered(prev => prev + 1)
      
      if (isCorrect) {
        const newStreak = (streak || 0) + 1
        let pointsEarned = data?.pointsEarned || 100
        let coinsEarned = data?.coinsEarned || (50 + (newStreak * 10))
        
        // Rush mode: bonus for speed
        if (gameMode === 'rush' && timeRemaining > 10) {
          toast.success(`⚡ Speed bonus!`, { duration: 1500 })
        }
        
        // Apply double points if active
        if (hasDoublePoints) {
          pointsEarned *= 2
          coinsEarned *= 2
          setHasDoublePoints(false)
          toast.success(`⚡ Double Points! +${pointsEarned} points`, { duration: 2000 })
        }
        
        setScore((prev) => (prev || 0) + pointsEarned)
        setStreak(newStreak)
        setMaxStreak((prev) => Math.max(prev || 0, newStreak))
        setCorrectAnswers((prev) => (prev || 0) + 1)
        addCoins(coinsEarned)
        
        if (newStreak >= 7) {
          toast.success(`🔥 Amazing! ${newStreak} streak! +${pointsEarned} points (5x bonus)`, { duration: 2000 })
        } else if (newStreak >= 5) {
          toast.success(`🔥 Great streak! ${newStreak} in a row! +${pointsEarned} points (3x bonus)`, { duration: 2000 })
        } else if (newStreak >= 3) {
          toast.success(`🔥 Nice streak! ${newStreak} correct! +${pointsEarned} points (2x bonus)`, { duration: 2000 })
        } else {
          toast.success(`Correct! +${pointsEarned} points`, { duration: 2000 })
        }
      } else {
        setStreak(0)
        setHasDoublePoints(false)
        setIncorrectAnswers((prev) => (prev || 0) + 1)
        
        // Handle lives for survival mode
        if (gameMode === 'survival') {
          const newLives = lives - 1
          setLives(newLives)
          toast.error(`Wrong! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining`, { duration: 2000 })
          if (newLives <= 0) {
            toast.error('Game Over!', { duration: 2000 })
            setTimeout(() => finishGame(), 1500)
            return
          }
        } else {
          toast.error('Incorrect answer', { duration: 2000 })
        }
      }
    } catch (error) {
      console.error('Submit answer error:', error)
      toast.error('Failed to submit answer')
    }

    setTimeout(() => {
      nextQuestion()
    }, 2000)
  }

  const nextQuestion = () => {
    setHiddenOptions([])
    setIsTimeFrozen(false)
    setCurrentExplanation(null) // Reset explanation for next question
    
    const isLastQuestion = (currentQuestionIndex || 0) >= (questions?.length || 0) - 1
    const outOfLives = gameMode === 'survival' && lives <= 0
    
    if (isLastQuestion || outOfLives) {
      finishGame()
    } else {
      setCurrentQuestionIndex((prev) => (prev || 0) + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setTimeLeft(baseTime)
      setQuestionStartTime(Date.now())
    }
  }

  const finishGame = async () => {
    try {
      await fetch('/api/game/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: sessionIdRef.current, 
          coinsEarned: coinsEarnedRef.current 
        }),
      })
    } catch (error) {
      console.error('Finish game error:', error)
    }
    setGameState('results')
  }

  const restartGame = () => {
    setGameState('mode-select')
    setGameCode('')
    setSessionId('')
    setQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setCoins(INITIAL_COINS)
    setStreak(0)
    setMaxStreak(0)
    setCorrectAnswers(0)
    setIncorrectAnswers(0)
    setTimeLeft(30)
    setBaseTime(30)
    setIsAnswered(false)
    setShowShop(false)
    setIsTimeFrozen(false)
    setHiddenOptions([])
    setHasDoublePoints(false)
    setLives(INITIAL_LIVES)
    setQuestionsAnswered(0)
    setCoinsEarned(0)
    setAuthenticatedUser(null)
    setQuestionSetId(null)
    setCurrentExplanation(null)
    setOwnedPowerUps({
      timeFreeze: 0,
      fiftyFifty: 0,
      doublePoints: 0,
      skip: 0
    })
  }

  const buyPowerUp = (powerUpId: PowerUpId, cost: number) => {
    if (coins < cost) {
      toast.error("Not enough coins!")
      return
    }
    setCoins(prev => prev - cost)
    setOwnedPowerUps(prev => ({
      ...prev,
      [powerUpId]: (prev[powerUpId] || 0) + 1
    }))
    toast.success(`Purchased power-up!`)
  }

  const usePowerUp = (powerUpId: PowerUpId) => {
    if (ownedPowerUps[powerUpId] <= 0 || isAnswered) return

    const currentQuestion = questions?.[currentQuestionIndex]
    
    switch (powerUpId) {
      case 'timeFreeze':
        setIsTimeFrozen(true)
        toast.success('⏸️ Timer frozen!')
        break
      case 'fiftyFifty':
        if (currentQuestion && currentQuestion.correctAnswer !== undefined) {
          const wrongOptions = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctAnswer)
          const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2)
          setHiddenOptions(toHide)
          toast.success('✂️ Two wrong answers removed!')
        }
        break
      case 'doublePoints':
        setHasDoublePoints(true)
        toast.success('⚡ Double points activated!')
        break
      case 'skip':
        toast.success('⏭️ Question skipped!')
        setQuestionsAnswered(prev => prev + 1)
        setTimeout(() => nextQuestion(), 500)
        break
    }
    
    setOwnedPowerUps(prev => ({
      ...prev,
      [powerUpId]: prev[powerUpId] - 1
    }))
  }

  // Mode Selection Screen
  if (gameState === 'mode-select') {
    return <ModeSelect onSelectMode={selectMode} />
  }

  // Lobby Screen
  if (gameState === 'lobby') {
    return (
      <LobbyScreen
        gameMode={gameMode}
        isLoading={isLoading}
        onStartGame={startGame}
        onBack={() => setGameState('mode-select')}
      />
    )
  }

  // Results Screen
  if (gameState === 'results') {
    return (
      <ResultsScreen
        gameMode={gameMode}
        score={score}
        coins={coins}
        correctAnswers={correctAnswers}
        incorrectAnswers={incorrectAnswers}
        maxStreak={maxStreak}
        questionsAnswered={questionsAnswered}
        lives={lives}
        onRestart={restartGame}
      />
    )
  }

  // Game Playing Screen
  const currentQuestion = questions?.[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      {/* Shop Modal */}
      <PowerUpShop
        isOpen={showShop}
        coins={coins}
        ownedPowerUps={ownedPowerUps}
        onClose={() => setShowShop(false)}
        onBuy={buyPowerUp}
      />

      {/* Coin Animation */}
      <CoinAnimation amount={coinAnimation} />

      <div className="max-w-5xl mx-auto p-4 py-6">
        {/* Mode Badge & Progress */}
        <ProgressBar
          gameMode={gameMode}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions?.length || 0}
          questionsAnswered={questionsAnswered}
          hasDoublePoints={hasDoublePoints}
          topic={currentQuestion?.topic || 'Chemistry'}
        />

        {/* Top Stats Bar */}
        <StatsBar
          score={score}
          coins={coins}
          streak={streak}
          lives={lives}
          timeLeft={timeLeft}
          isTimeFrozen={isTimeFrozen}
          gameMode={gameMode}
          onOpenShop={() => setShowShop(true)}
        />

        {/* Power-ups Bar */}
        <PowerUpBar
          ownedPowerUps={ownedPowerUps}
          isAnswered={isAnswered}
          onUsePowerUp={usePowerUp}
          onOpenShop={() => setShowShop(true)}
        />

        {/* Question Card */}
        <QuestionCard
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswer}
          isAnswered={isAnswered}
          hiddenOptions={hiddenOptions}
          explanation={currentExplanation}
          onSelectAnswer={handleAnswerSelect}
        />
      </div>
    </div>
  )
}
