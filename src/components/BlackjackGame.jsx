import { useState, useEffect } from 'react'

const BlackjackGame = ({ currentUser, onNavigateHome, onUpdateBalance }) => {
  // カードデッキの作成
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck = []
    
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank, value: getCardValue(rank) })
      }
    }
    
    return shuffleDeck(deck)
  }

  const getCardValue = (rank) => {
    if (rank === 'A') return 11
    if (['J', 'Q', 'K'].includes(rank)) return 10
    return parseInt(rank)
  }

  const shuffleDeck = (deck) => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // ゲーム状態
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [playerScore, setPlayerScore] = useState(0)
  const [dealerScore, setDealerScore] = useState(0)
  const [gameStatus, setGameStatus] = useState('betting') // betting, playing, dealer, finished
  const [betAmount, setBetAmount] = useState(10)
  const [message, setMessage] = useState('')
  const [canDoubleDown, setCanDoubleDown] = useState(false)
  const [canSplit, setCanSplit] = useState(false)
  const [insurance, setInsurance] = useState(false)

  // スコア計算（エースの処理を含む）
  const calculateScore = (hand) => {
    let score = 0
    let aces = 0
    
    for (let card of hand) {
      if (card.rank === 'A') {
        aces++
        score += 11
      } else {
        score += card.value
      }
    }
    
    // エースを1として計算し直す
    while (score > 21 && aces > 0) {
      score -= 10
      aces--
    }
    
    return score
  }

  // カードを引く
  const drawCard = () => {
    if (deck.length === 0) return null
    const newDeck = [...deck]
    const card = newDeck.pop()
    setDeck(newDeck)
    return card
  }

  // ゲーム開始
  const startGame = () => {
    if (betAmount > currentUser.balance) {
      setMessage('残高が不足しています。')
      return
    }

    const newDeck = createDeck()
    
    // 初期カード配布
    const playerCards = [newDeck.pop(), newDeck.pop()]
    const dealerCards = [newDeck.pop(), newDeck.pop()]
    
    setPlayerHand(playerCards)
    setDealerHand(dealerCards)
    setPlayerScore(calculateScore(playerCards))
    setDealerScore(calculateScore([dealerCards[0]])) // ディーラーの1枚目のみ
    setGameStatus('playing')
    setMessage('')
    
    // ダブルダウンとスプリットの判定
    setCanDoubleDown(playerCards.length === 2 && betAmount * 2 <= currentUser.balance)
    setCanSplit(playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank && betAmount * 2 <= currentUser.balance)
    
    // インシュランスの判定
    setInsurance(dealerCards[0].rank === 'A')
    
    // 残高から賭け金を引く
    onUpdateBalance(currentUser.balance - betAmount)
    
    setDeck(newDeck) // 残りのデッキをセット（既に4枚は取り除かれている）
  }

  // ヒット
  const hit = () => {
    const card = drawCard()
    if (!card) return
    
    const newHand = [...playerHand, card]
    const newScore = calculateScore(newHand)
    
    setPlayerHand(newHand)
    setPlayerScore(newScore)
    setCanDoubleDown(false)
    setCanSplit(false)
    
    if (newScore > 21) {
      setGameStatus('finished')
      setMessage('バスト！あなたの負けです。')
    }
  }

  // スタンド
  const stand = () => {
    setGameStatus('dealer')
    setCanDoubleDown(false)
    setCanSplit(false)
    
    // ディーラーのターン
    dealerTurn()
  }

  // ダブルダウン
  const doubleDown = () => {
    if (betAmount * 2 > currentUser.balance + betAmount) {
      setMessage('残高が不足しています。')
      return
    }
    
    // 追加の賭け金を引く
    onUpdateBalance(currentUser.balance - betAmount)
    setBetAmount(betAmount * 2)
    
    // 1枚だけ引いてスタンド
    const card = drawCard()
    if (!card) return
    
    const newHand = [...playerHand, card]
    const newScore = calculateScore(newHand)
    
    setPlayerHand(newHand)
    setPlayerScore(newScore)
    
    if (newScore > 21) {
      setGameStatus('finished')
      setMessage('バスト！あなたの負けです。')
    } else {
      setGameStatus('dealer')
      dealerTurn()
    }
  }

  // ディーラーのターン
  const dealerTurn = () => {
    setTimeout(() => {
      let currentDealerHand = [...dealerHand]
      let currentDealerScore = calculateScore(currentDealerHand)
      
      // ディーラーは17以上になるまで引く
      while (currentDealerScore < 17) {
        const card = drawCard()
        if (!card) break
        currentDealerHand.push(card)
        currentDealerScore = calculateScore(currentDealerHand)
      }
      
      setDealerHand(currentDealerHand)
      setDealerScore(currentDealerScore)
      
      // 勝敗判定
      determineWinner(playerScore, currentDealerScore)
    }, 1000)
  }

  // 勝敗判定
  const determineWinner = (pScore, dScore) => {
    setGameStatus('finished')
    
    if (pScore > 21) {
      setMessage('バスト！あなたの負けです。')
      // 既にベット額は差し引かれているので何もしない
    } else if (dScore > 21) {
      setMessage('ディーラーがバスト！あなたの勝ちです！')
      // ベット額を戻して、さらに勝利分を追加
      onUpdateBalance(currentUser.balance + betAmount * 2)
    } else if (pScore > dScore) {
      setMessage('あなたの勝ちです！')
      // ベット額を戻して、さらに勝利分を追加
      onUpdateBalance(currentUser.balance + betAmount * 2)
    } else if (pScore < dScore) {
      setMessage('ディーラーの勝ちです。')
      // 既にベット額は差し引かれているので何もしない
    } else {
      setMessage('引き分けです。')
      // ベット額のみ戻す
      onUpdateBalance(currentUser.balance + betAmount)
    }
  }

  // 新しいゲーム
  const newGame = () => {
    setPlayerHand([])
    setDealerHand([])
    setPlayerScore(0)
    setDealerScore(0)
    setGameStatus('betting')
    setMessage('')
    setCanDoubleDown(false)
    setCanSplit(false)
    setInsurance(false)
    setBetAmount(10)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-1 xs:p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col xs:flex-row justify-between items-center mb-2 xs:mb-3 sm:mb-4 md:mb-6 gap-1 xs:gap-2">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base order-1 xs:order-none"
          >
            ← ホーム
          </button>
          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white order-2 xs:order-none text-center">♠ ブラックジャック ♠</h1>
          <div className="text-white text-center xs:text-right order-3 xs:order-none">
            <div className="text-xs xs:text-sm sm:text-lg font-bold">👤 {currentUser.username}</div>
            <div className="text-yellow-300 font-bold text-xs xs:text-sm sm:text-base">💰 {currentUser.balance.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* ゲームエリア */}
        <div className="bg-green-800 rounded-lg p-2 xs:p-3 sm:p-6 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
          {/* ディーラーエリア */}
          <div className="mb-3 xs:mb-4 sm:mb-8">
            <h3 className="text-sm xs:text-base sm:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">ディーラー (スコア: {gameStatus === 'playing' ? '?' : dealerScore})</h3>
            <div className="flex flex-wrap justify-center gap-0.5 xs:gap-1 sm:gap-2">
              {dealerHand.map((card, index) => (
                <div key={index} className={`w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-16 md:h-24 rounded-md flex flex-col items-center justify-center text-xs xs:text-sm sm:text-lg font-bold ${
                  index === 1 && gameStatus === 'playing' ? 'bg-blue-900 text-blue-300' : 'bg-white text-black'
                }`}>
                  {index === 1 && gameStatus === 'playing' ? '?' : (
                    <>
                      <div className={['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'}>{card.rank}</div>
                      <div className={['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'}>{card.suit}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* プレイヤーエリア */}
          <div>
            <h3 className="text-sm xs:text-base sm:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">あなた (スコア: {playerScore})</h3>
            <div className="flex flex-wrap justify-center gap-0.5 xs:gap-1 sm:gap-2">
              {playerHand.map((card, index) => (
                <div key={index} className="w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-16 md:h-24 bg-white rounded-md flex flex-col items-center justify-center text-xs xs:text-sm sm:text-lg font-bold">
                  <div className={['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'}>{card.rank}</div>
                  <div className={['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'}>{card.suit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ベットエリア */}
        {gameStatus === 'betting' && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-6 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
            <h3 className="text-sm xs:text-base sm:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4 text-center">賭け金を選択してください</h3>
            <div className="grid grid-cols-3 xs:grid-cols-5 gap-1 xs:gap-2 sm:gap-4 mb-2 xs:mb-3 sm:mb-6">
              {[10, 25, 50, 100, 250].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > currentUser.balance}
                  className={`py-2 px-2 xs:py-3 xs:px-4 rounded-lg font-bold transition-colors text-xs xs:text-sm sm:text-base ${
                    betAmount === amount 
                      ? 'bg-yellow-500 text-black border-2 border-yellow-300' 
                      : amount > currentUser.balance
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <div className="text-center mb-2 xs:mb-3 sm:mb-4">
              <span className="text-white text-xs xs:text-sm sm:text-lg">選択した賭け金: </span>
              <span className="text-yellow-300 font-bold text-sm xs:text-base sm:text-xl">{betAmount}コイン</span>
            </div>
            <div className="text-center">
              <button
                onClick={startGame}
                disabled={betAmount > currentUser.balance}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 xs:py-3 xs:px-6 sm:py-3 sm:px-8 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base"
              >
                ゲーム開始
              </button>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        {gameStatus === 'playing' && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-6 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
            <div className="grid grid-cols-2 xs:flex xs:flex-wrap gap-1 xs:gap-2 sm:gap-4">
              <button
                onClick={hit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 xs:py-3 xs:px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base"
              >
                ヒット
              </button>
              <button
                onClick={stand}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 xs:py-3 xs:px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base"
              >
                スタンド
              </button>
              {canDoubleDown && (
                <button
                  onClick={doubleDown}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 xs:py-3 xs:px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base"
                >
                  ダブルダウン
                </button>
              )}
              {canSplit && (
                <button
                  onClick={() => setMessage('スプリット機能は今後実装予定です。')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 xs:py-3 xs:px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base"
                >
                  スプリット
                </button>
              )}
              {insurance && (
                <button
                  onClick={() => setMessage('インシュランス機能は今後実装予定です。')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 xs:py-3 xs:px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base"
                >
                  インシュランス
                </button>
              )}
            </div>
          </div>
        )}

        {/* メッセージエリア */}
        {message && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-4 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
            <p className="text-white text-center text-xs xs:text-sm sm:text-lg font-bold">{message}</p>
          </div>
        )}

        {/* 新しいゲームボタン */}
        {gameStatus === 'finished' && (
          <div className="text-center">
            <button
              onClick={newGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 xs:py-3 xs:px-6 sm:py-3 sm:px-6 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base"
            >
              新しいゲーム
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlackjackGame

