import { useState, useEffect } from 'react'

const PokerGame = ({ currentUser, onNavigateHome, onUpdateBalance }) => {
  // カードデッキの作成
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const deck = []
    
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank, value: getRankValue(rank) })
      }
    }
    
    return shuffleDeck(deck)
  }

  const getRankValue = (rank) => {
    if (rank === 'A') return 14
    if (rank === 'K') return 13
    if (rank === 'Q') return 12
    if (rank === 'J') return 11
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
  const [computerHand, setComputerHand] = useState([])
  const [gamePhase, setGamePhase] = useState('betting') // betting, deal, draw, showdown, finished
  const [betAmount, setBetAmount] = useState(10)
  const [selectedCards, setSelectedCards] = useState([])
  const [message, setMessage] = useState('')
  const [playerHandRank, setPlayerHandRank] = useState('')
  const [computerHandRank, setComputerHandRank] = useState('')

  // ポーカーハンドの評価
  const evaluateHand = (hand) => {
    const sortedHand = [...hand].sort((a, b) => b.value - a.value)
    const ranks = sortedHand.map(card => card.value)
    const suits = sortedHand.map(card => card.suit)
    
    // 同じランクの数をカウント
    const rankCounts = {}
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1
    })
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a)
    const isFlush = suits.every(suit => suit === suits[0])
    const isStraight = checkStraight(ranks)
    
    // ハンド評価
    if (isFlush && isStraight && ranks[0] === 14) {
      return { rank: 10, name: 'ロイヤルストレートフラッシュ' }
    } else if (isFlush && isStraight) {
      return { rank: 9, name: 'ストレートフラッシュ' }
    } else if (counts[0] === 4) {
      return { rank: 8, name: 'フォーカード' }
    } else if (counts[0] === 3 && counts[1] === 2) {
      return { rank: 7, name: 'フルハウス' }
    } else if (isFlush) {
      return { rank: 6, name: 'フラッシュ' }
    } else if (isStraight) {
      return { rank: 5, name: 'ストレート' }
    } else if (counts[0] === 3) {
      return { rank: 4, name: 'スリーカード' }
    } else if (counts[0] === 2 && counts[1] === 2) {
      return { rank: 3, name: 'ツーペア' }
    } else if (counts[0] === 2) {
      return { rank: 2, name: 'ワンペア' }
    } else {
      return { rank: 1, name: 'ハイカード' }
    }
  }

  const checkStraight = (ranks) => {
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a)
    if (uniqueRanks.length !== 5) return false
    
    // 通常のストレート
    for (let i = 0; i < 4; i++) {
      if (uniqueRanks[i] - uniqueRanks[i + 1] !== 1) {
        // A-2-3-4-5のストレート（ローストレート）をチェック
        if (uniqueRanks[0] === 14 && uniqueRanks[1] === 5 && uniqueRanks[2] === 4 && uniqueRanks[3] === 3 && uniqueRanks[4] === 2) {
          return true
        }
        return false
      }
    }
    return true
  }

  // コンピュータのAI（ベーシックストラテジー）
  const getComputerDrawDecision = (hand) => {
    const evaluation = evaluateHand(hand)
    const ranks = hand.map(card => card.value)
    const suits = hand.map(card => card.suit)
    
    // 既に強いハンドの場合はドローしない
    if (evaluation.rank >= 5) {
      return []
    }
    
    // ワンペア以上の場合、ペア以外を交換
    if (evaluation.rank >= 2) {
      const rankCounts = {}
      ranks.forEach(rank => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1
      })
      
      const pairRanks = Object.keys(rankCounts).filter(rank => rankCounts[rank] >= 2).map(Number)
      return hand.map((card, index) => !pairRanks.includes(card.value) ? index : -1).filter(i => i !== -1)
    }
    
    // フラッシュドロー（4枚同じスーツ）
    const suitCounts = {}
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1
    })
    const maxSuitCount = Math.max(...Object.values(suitCounts))
    if (maxSuitCount === 4) {
      const majorSuit = Object.keys(suitCounts).find(suit => suitCounts[suit] === 4)
      return hand.map((card, index) => card.suit !== majorSuit ? index : -1).filter(i => i !== -1)
    }
    
    // ストレートドロー（オープンエンド）
    const sortedRanks = [...new Set(ranks)].sort((a, b) => a - b)
    if (sortedRanks.length === 4) {
      // 4枚連続の場合
      let isOpenEnded = true
      for (let i = 0; i < 3; i++) {
        if (sortedRanks[i + 1] - sortedRanks[i] !== 1) {
          isOpenEnded = false
          break
        }
      }
      if (isOpenEnded && sortedRanks[0] > 2 && sortedRanks[3] < 14) {
        // 両端が開いているストレートドロー
        const neededRanks = new Set(sortedRanks)
        return hand.map((card, index) => !neededRanks.has(card.value) ? index : -1).filter(i => i !== -1)
      }
    }
    
    // 高いカード（J以上）を残す
    const highCards = hand.map((card, index) => card.value >= 11 ? index : -1).filter(i => i !== -1)
    if (highCards.length > 0) {
      return hand.map((card, index) => card.value < 11 ? index : -1).filter(i => i !== -1)
    }
    
    // デフォルト：全て交換
    return [0, 1, 2, 3, 4]
  }

  // カードを引く
  const drawCards = (count) => {
    const newDeck = [...deck]
    const drawnCards = []
    for (let i = 0; i < count; i++) {
      if (newDeck.length > 0) {
        drawnCards.push(newDeck.pop())
      }
    }
    setDeck(newDeck)
    return drawnCards
  }

  // ゲーム開始
  const startGame = () => {
    if (betAmount > currentUser.balance) {
      setMessage('残高が不足しています。')
      return
    }

    const newDeck = createDeck()
    setDeck(newDeck)
    
    // 初期カード配布（プレイヤーとコンピュータに5枚ずつ）
    const playerCards = []
    const computerCards = []
    
    for (let i = 0; i < 5; i++) {
      playerCards.push(newDeck.pop())
      computerCards.push(newDeck.pop())
    }
    
    setPlayerHand(playerCards)
    setComputerHand(computerCards)
    setGamePhase('draw')
    setMessage('交換したいカードを選択してください（最大5枚）')
    setSelectedCards([])
    
    // 残高から賭け金を引く
    onUpdateBalance(currentUser.balance - betAmount)
    
    setDeck(newDeck.slice(0, -10)) // 配布した10枚を除く
  }

  // カード選択の切り替え
  const toggleCardSelection = (index) => {
    if (selectedCards.includes(index)) {
      setSelectedCards(selectedCards.filter(i => i !== index))
    } else {
      setSelectedCards([...selectedCards, index])
    }
  }

  // ドロー実行
  const executeDraw = () => {
    // プレイヤーのドロー
    const newPlayerHand = [...playerHand]
    const drawnCards = drawCards(selectedCards.length)
    
    selectedCards.forEach((cardIndex, i) => {
      if (drawnCards[i]) {
        newPlayerHand[cardIndex] = drawnCards[i]
      }
    })
    
    // コンピュータのドロー
    const computerDrawIndices = getComputerDrawDecision(computerHand)
    const computerDrawnCards = drawCards(computerDrawIndices.length)
    const newComputerHand = [...computerHand]
    
    computerDrawIndices.forEach((cardIndex, i) => {
      if (computerDrawnCards[i]) {
        newComputerHand[cardIndex] = computerDrawnCards[i]
      }
    })
    
    setPlayerHand(newPlayerHand)
    setComputerHand(newComputerHand)
    setGamePhase('showdown')
    
    // ハンド評価
    const playerEval = evaluateHand(newPlayerHand)
    const computerEval = evaluateHand(newComputerHand)
    
    setPlayerHandRank(playerEval.name)
    setComputerHandRank(computerEval.name)
    
    // 勝敗判定
    setTimeout(() => {
      determineWinner(playerEval, computerEval, newPlayerHand, newComputerHand)
    }, 2000)
  }

  // 勝敗判定
  const determineWinner = (playerEval, computerEval, playerCards, computerCards) => {
    setGamePhase('finished')
    
    if (playerEval.rank > computerEval.rank) {
      setMessage(`あなたの勝ちです！ ${playerEval.name} vs ${computerEval.name}`)
      // ベット額を戻して、さらに勝利分を追加
      onUpdateBalance(currentUser.balance + betAmount * 2)
    } else if (playerEval.rank < computerEval.rank) {
      setMessage(`コンピュータの勝ちです。 ${computerEval.name} vs ${playerEval.name}`)
      // 既にベット額は差し引かれているので何もしない
    } else {
      // 同じランクの場合、キッカーで判定（簡略化）
      const playerHigh = Math.max(...playerCards.map(c => c.value))
      const computerHigh = Math.max(...computerCards.map(c => c.value))
      
      if (playerHigh > computerHigh) {
        setMessage(`あなたの勝ちです！ ${playerEval.name}（キッカー勝ち）`)
        // ベット額を戻して、さらに勝利分を追加
        onUpdateBalance(currentUser.balance + betAmount * 2)
      } else if (playerHigh < computerHigh) {
        setMessage(`コンピュータの勝ちです。 ${computerEval.name}（キッカー勝ち）`)
        // 既にベット額は差し引かれているので何もしない
      } else {
        setMessage(`引き分けです。 ${playerEval.name}`)
        // ベット額のみ戻す
        onUpdateBalance(currentUser.balance + betAmount)
      }
    }
  }

  // 新しいゲーム
  const newGame = () => {
    setPlayerHand([])
    setComputerHand([])
    setGamePhase('betting')
    setMessage('')
    setSelectedCards([])
    setPlayerHandRank('')
    setComputerHandRank('')
    setBetAmount(10)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-4xl font-bold text-white">🃏 ポーカー 🃏</h1>
          <div className="text-white text-right">
            <div className="text-lg font-bold">👤 {currentUser.username}</div>
            <div className="text-yellow-300 font-bold">💰 {currentUser.balance.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* ゲームエリア */}
        <div className="bg-green-800 rounded-lg p-6 mb-6">
          {/* コンピュータエリア */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">
              コンピュータ {computerHandRank && `(${computerHandRank})`}
            </h3>
            <div className="flex space-x-2 justify-center">
              {computerHand.map((card, index) => (
                <div key={index} className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center text-sm font-bold ${
                  gamePhase === 'showdown' || gamePhase === 'finished' ? 'bg-white text-black' : 'bg-blue-900 text-blue-300'
                }`}>
                  {gamePhase === 'showdown' || gamePhase === 'finished' ? (
                    <>
                      <div>{card.rank}</div>
                      <div>{card.suit}</div>
                    </>
                  ) : '?'}
                </div>
              ))}
            </div>
          </div>

          {/* プレイヤーエリア */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              あなた {playerHandRank && `(${playerHandRank})`}
            </h3>
            <div className="flex space-x-2 justify-center">
              {playerHand.map((card, index) => (
                <div 
                  key={index} 
                  className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center text-sm font-bold cursor-pointer transition-all duration-300 ${
                    selectedCards.includes(index) 
                      ? 'bg-yellow-300 text-black transform -translate-y-2' 
                      : 'bg-white text-black hover:bg-gray-100'
                  } ${gamePhase === 'draw' ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => gamePhase === 'draw' && toggleCardSelection(index)}
                >
                  <div>{card.rank}</div>
                  <div>{card.suit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ベットエリア */}
        {gamePhase === 'betting' && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">賭け金を選択してください</h3>
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[10, 25, 50, 100, 250].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > currentUser.balance}
                  className={`py-3 px-4 rounded-lg font-bold transition-colors ${
                    betAmount === amount 
                      ? 'bg-yellow-500 text-black border-2 border-yellow-300' 
                      : amount > currentUser.balance
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <div className="text-center mb-4">
              <span className="text-white text-lg">選択した賭け金: </span>
              <span className="text-yellow-300 font-bold text-xl">{betAmount}コイン</span>
            </div>
            <div className="text-center">
              <button
                onClick={startGame}
                disabled={betAmount > currentUser.balance}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
              >
                ゲーム開始
              </button>
            </div>
          </div>
        )}

        {/* ドローエリア */}
        {gamePhase === 'draw' && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-white mb-4">選択されたカード: {selectedCards.length}枚</p>
              <button
                onClick={executeDraw}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                ドロー実行
              </button>
            </div>
          </div>
        )}

        {/* メッセージエリア */}
        {message && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
            <p className="text-white text-center text-lg font-bold">{message}</p>
          </div>
        )}

        {/* 新しいゲームボタン */}
        {gamePhase === 'finished' && (
          <div className="text-center">
            <button
              onClick={newGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              新しいゲーム
            </button>
          </div>
        )}

        {/* ルール説明 */}
        <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 mt-6">
          <h4 className="text-white font-bold mb-2">ゲームルール:</h4>
          <p className="text-gray-300 text-sm">
            5カードドローポーカー。最初に5枚のカードが配られ、不要なカードを選択して交換できます。
            最終的により強いハンドを作った方が勝利です。
          </p>
        </div>
      </div>
    </div>
  )
}

export default PokerGame

