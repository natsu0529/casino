import { useState, useEffect } from 'react'

const BaccaratGame = ({ currentUser, onNavigateHome, onUpdateBalance }) => {
  const [gameState, setGameState] = useState('betting') // betting, dealing, result
  const [playerHand, setPlayerHand] = useState([])
  const [bankerHand, setBankerHand] = useState([])
  const [playerScore, setPlayerScore] = useState(0)
  const [bankerScore, setBankerScore] = useState(0)
  const [bets, setBets] = useState({ player: 0, banker: 0, tie: 0 })
  const [betAmount, setBetAmount] = useState(10)
  const [result, setResult] = useState('')
  const [winnings, setWinnings] = useState(0)
  const [gameHistory, setGameHistory] = useState([])
  const [isDealing, setIsDealing] = useState(false)

  // カードデッキを作成
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck = []
    
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank })
      }
    }
    
    // シャッフル
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    
    return deck
  }

  // カードの値を計算（バカラルール）
  const getCardValue = (card) => {
    if (card.rank === 'A') return 1
    if (['J', 'Q', 'K'].includes(card.rank)) return 0
    return parseInt(card.rank)
  }

  // 手札のスコアを計算（バカラルール：下一桁のみ）
  const calculateScore = (hand) => {
    const total = hand.reduce((sum, card) => sum + getCardValue(card), 0)
    return total % 10
  }

  // ベットを追加
  const placeBet = (betType) => {
    if (gameState !== 'betting') return
    
    setBets(prev => ({
      ...prev,
      [betType]: prev[betType] + betAmount
    }))
  }

  // ベットをクリア
  const clearBets = () => {
    setBets({ player: 0, banker: 0, tie: 0 })
  }

  // 総ベット額を計算
  const getTotalBet = () => {
    return bets.player + bets.banker + bets.tie
  }

  // 3枚目のカードが必要かチェック（バカラルール）
  const needsThirdCard = (playerScore, bankerScore, playerThirdCard = null) => {
    const playerNeeds = playerScore <= 5
    
    if (!playerNeeds) {
      // プレイヤーが3枚目を引かない場合、バンカーは5以下で引く
      return { player: false, banker: bankerScore <= 5 }
    }
    
    // プレイヤーが3枚目を引く場合のバンカーのルール
    let bankerNeeds = false
    if (playerThirdCard !== null) {
      const thirdCardValue = getCardValue(playerThirdCard)
      if (bankerScore <= 2) bankerNeeds = true
      else if (bankerScore === 3 && thirdCardValue !== 8) bankerNeeds = true
      else if (bankerScore === 4 && [2, 3, 4, 5, 6, 7].includes(thirdCardValue)) bankerNeeds = true
      else if (bankerScore === 5 && [4, 5, 6, 7].includes(thirdCardValue)) bankerNeeds = true
      else if (bankerScore === 6 && [6, 7].includes(thirdCardValue)) bankerNeeds = true
    } else {
      bankerNeeds = bankerScore <= 5
    }
    
    return { player: playerNeeds, banker: bankerNeeds }
  }

  // ゲームを開始
  const startGame = async () => {
    const totalBet = getTotalBet()
    if (totalBet === 0) {
      alert('ベットを置いてください')
      return
    }
    
    if (currentUser.balance < totalBet) {
      alert('残高が不足しています')
      return
    }

    setGameState('dealing')
    setIsDealing(true)
    setResult('')
    setWinnings(0)

    // 残高からベット額を引く
    onUpdateBalance(currentUser.balance - totalBet)

    const deck = createDeck()
    let deckIndex = 0

    // 初期カード配布（プレイヤー、バンカー各2枚）
    const initialPlayerHand = [deck[deckIndex++], deck[deckIndex++]]
    const initialBankerHand = [deck[deckIndex++], deck[deckIndex++]]

    setPlayerHand(initialPlayerHand)
    setBankerHand(initialBankerHand)

    const initialPlayerScore = calculateScore(initialPlayerHand)
    const initialBankerScore = calculateScore(initialBankerHand)

    setPlayerScore(initialPlayerScore)
    setBankerScore(initialBankerScore)

    // ディーリングアニメーション
    await new Promise(resolve => setTimeout(resolve, 2000))

    // ナチュラル（8または9）チェック
    if (initialPlayerScore >= 8 || initialBankerScore >= 8) {
      finishGame(initialPlayerHand, initialBankerHand, initialPlayerScore, initialBankerScore)
      return
    }

    // 3枚目のカードルール
    const thirdCardRules = needsThirdCard(initialPlayerScore, initialBankerScore)
    let finalPlayerHand = [...initialPlayerHand]
    let finalBankerHand = [...initialBankerHand]
    let playerThirdCard = null

    if (thirdCardRules.player) {
      playerThirdCard = deck[deckIndex++]
      finalPlayerHand.push(playerThirdCard)
      setPlayerHand(finalPlayerHand)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const finalPlayerScore = calculateScore(finalPlayerHand)
    setPlayerScore(finalPlayerScore)

    const bankerThirdCardRules = needsThirdCard(initialPlayerScore, initialBankerScore, playerThirdCard)
    if (bankerThirdCardRules.banker) {
      const bankerThirdCard = deck[deckIndex++]
      finalBankerHand.push(bankerThirdCard)
      setBankerHand(finalBankerHand)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const finalBankerScore = calculateScore(finalBankerHand)
    setBankerScore(finalBankerScore)

    finishGame(finalPlayerHand, finalBankerHand, finalPlayerScore, finalBankerScore)
  }

  // ゲーム終了処理
  const finishGame = (playerHand, bankerHand, playerScore, bankerScore) => {
    let gameResult = ''
    let totalWinnings = 0

    if (playerScore > bankerScore) {
      gameResult = 'プレイヤーの勝ち'
      totalWinnings += bets.player * 2 // 1:1配当
    } else if (bankerScore > playerScore) {
      gameResult = 'バンカーの勝ち'
      totalWinnings += bets.banker * 1.95 // 1:0.95配当（5%手数料）
    } else {
      gameResult = '引き分け'
      totalWinnings += bets.tie * 9 // 8:1配当
      totalWinnings += bets.player + bets.banker // 引き分けの場合、プレイヤーとバンカーベットは返金
    }

    setResult(gameResult)
    setWinnings(Math.floor(totalWinnings))
    
    if (totalWinnings > 0) {
      // 現在の残高に勝利分を追加
      onUpdateBalance(currentUser.balance + Math.floor(totalWinnings))
    }

    // ゲーム履歴に追加
    const newGame = {
      playerScore,
      bankerScore,
      result: gameResult,
      winnings: Math.floor(totalWinnings),
      timestamp: new Date().toLocaleTimeString()
    }
    setGameHistory(prev => [newGame, ...prev.slice(0, 4)])

    setGameState('result')
    setIsDealing(false)
  }

  // 新しいゲーム
  const newGame = () => {
    setGameState('betting')
    setPlayerHand([])
    setBankerHand([])
    setPlayerScore(0)
    setBankerScore(0)
    setBets({ player: 0, banker: 0, tie: 0 })
    setResult('')
    setWinnings(0)
  }

  // カードを表示
  const renderCard = (card, isHidden = false) => {
    if (isHidden) {
      return (
        <div className="w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 lg:w-16 lg:h-24 bg-blue-600 border-2 border-blue-800 rounded-lg flex items-center justify-center text-white font-bold shadow-lg text-xs xs:text-sm sm:text-base md:text-lg">
          ?
        </div>
      )
    }

    const isRed = card.suit === '♥' || card.suit === '♦'
    return (
      <div className={`w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 lg:w-16 lg:h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center shadow-lg ${isRed ? 'text-red-600' : 'text-black'} font-bold`}>
        <div className="text-xs xs:text-sm sm:text-base md:text-lg">{card.rank}</div>
        <div className="text-sm xs:text-base sm:text-lg md:text-xl">{card.suit}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-1 xs:p-2 sm:p-4">
      {/* ヘッダー */}
      <div className="flex flex-col xs:flex-row justify-between items-center mb-2 xs:mb-4 sm:mb-6 gap-2 xs:gap-0">
        <button
          onClick={() => onNavigateHome()}
          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs xs:text-sm sm:text-base order-1 xs:order-none"
        >
          ← ホーム
        </button>
        <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-1 xs:gap-2 order-2 xs:order-none text-center">
          💎 バカラ 💎
        </h1>
        <div className="text-white text-center xs:text-right order-3 xs:order-none">
          <div className="text-xs xs:text-sm sm:text-lg font-bold">👤 {currentUser.username}</div>
          <div className="text-xs xs:text-sm sm:text-xl font-bold text-yellow-300">💰 {currentUser.balance.toLocaleString()}コイン</div>
        </div>
      </div>

      {/* ゲームエリア */}
      <div className="max-w-6xl mx-auto">
        {/* バンカーエリア */}
        <div className="bg-red-900 bg-opacity-50 rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mb-2 xs:mb-3 sm:mb-4">
          <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4 text-center">🏦 バンカー (スコア: {bankerScore})</h2>
          <div className="flex justify-center gap-0.5 xs:gap-1 sm:gap-2">
            {bankerHand.map((card, index) => (
              <div key={index} className="transform transition-transform hover:scale-105">
                {renderCard(card)}
              </div>
            ))}
          </div>
        </div>

        {/* プレイヤーエリア */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4 text-center">👤 プレイヤー (スコア: {playerScore})</h2>
          <div className="flex justify-center gap-0.5 xs:gap-1 sm:gap-2">
            {playerHand.map((card, index) => (
              <div key={index} className="transform transition-transform hover:scale-105">
                {renderCard(card)}
              </div>
            ))}
          </div>
        </div>

        {/* ベットエリア */}
        <div className="bg-green-700 bg-opacity-50 rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
          <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4 text-center">ベットエリア</h3>
          
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
            <button
              onClick={() => placeBet('player')}
              disabled={gameState !== 'betting'}
              className={`bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 xs:p-3 sm:p-4 rounded-lg font-bold text-xs xs:text-sm sm:text-base lg:text-lg transition-colors ${bets.player > 0 ? 'ring-2 xs:ring-4 ring-yellow-400' : ''}`}
            >
              プレイヤー (1:1)
              {bets.player > 0 && <div className="text-yellow-300 text-xs xs:text-sm">[{bets.player}]</div>}
            </button>
            
            <button
              onClick={() => placeBet('tie')}
              disabled={gameState !== 'betting'}
              className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-2 xs:p-3 sm:p-4 rounded-lg font-bold text-xs xs:text-sm sm:text-base lg:text-lg transition-colors ${bets.tie > 0 ? 'ring-2 xs:ring-4 ring-yellow-400' : ''}`}
            >
              引き分け (8:1)
              {bets.tie > 0 && <div className="text-yellow-300 text-xs xs:text-sm">[{bets.tie}]</div>}
            </button>
            
            <button
              onClick={() => placeBet('banker')}
              disabled={gameState !== 'betting'}
              className={`bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white p-2 xs:p-3 sm:p-4 rounded-lg font-bold text-xs xs:text-sm sm:text-base lg:text-lg transition-colors ${bets.banker > 0 ? 'ring-2 xs:ring-4 ring-yellow-400' : ''}`}
            >
              バンカー (1:0.95)
              {bets.banker > 0 && <div className="text-yellow-300 text-xs xs:text-sm">[{bets.banker}]</div>}
            </button>
          </div>

          {/* コントロール */}
          <div className="flex flex-col xs:flex-row justify-center items-center gap-2 xs:gap-3 sm:gap-4 flex-wrap">
            <div className="flex flex-col xs:flex-row items-center gap-1 xs:gap-2">
              <label className="text-white font-bold text-xs xs:text-sm sm:text-base">ベット額:</label>
              <select
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value))}
                disabled={gameState !== 'betting'}
                className="bg-white border border-gray-300 rounded px-2 py-1 xs:px-3 xs:py-1 text-xs xs:text-sm sm:text-base"
              >
                <option value={5}>5コイン</option>
                <option value={10}>10コイン</option>
                <option value={25}>25コイン</option>
                <option value={50}>50コイン</option>
                <option value={100}>100コイン</option>
              </select>
            </div>
            
            <div className="text-white font-bold text-xs xs:text-sm sm:text-base">
              総ベット: {getTotalBet()}コイン
            </div>
            
            <button
              onClick={clearBets}
              disabled={gameState !== 'betting'}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs xs:text-sm sm:text-base"
            >
              ベットクリア
            </button>
            
            {gameState === 'betting' && (
              <button
                onClick={startGame}
                disabled={getTotalBet() === 0}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-3 py-1 xs:px-4 xs:py-2 sm:px-6 sm:py-2 rounded-lg font-bold transition-colors text-xs xs:text-sm sm:text-base"
              >
                ディール
              </button>
            )}
            
            {gameState === 'result' && (
              <button
                onClick={newGame}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 xs:px-4 xs:py-2 sm:px-6 sm:py-2 rounded-lg font-bold transition-colors text-xs xs:text-sm sm:text-base"
              >
                新しいゲーム
              </button>
            )}
          </div>
        </div>

        {/* 結果表示 */}
        {isDealing && (
          <div className="bg-yellow-600 text-white p-2 xs:p-3 sm:p-4 rounded-lg mb-2 xs:mb-3 sm:mb-4 lg:mb-6 text-center">
            <div className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold">カードを配布中...</div>
          </div>
        )}

        {result && (
          <div className={`p-2 xs:p-3 sm:p-4 rounded-lg mb-2 xs:mb-3 sm:mb-4 lg:mb-6 text-center ${winnings > 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            <div className="text-lg xs:text-xl sm:text-2xl font-bold">{result}</div>
            {winnings > 0 && (
              <div className="text-base xs:text-lg sm:text-xl">🎉 {winnings}コイン獲得！</div>
            )}
          </div>
        )}

        {/* ゲーム履歴 */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">最近のゲーム</h3>
          {gameHistory.length === 0 ? (
            <p className="text-gray-300 text-xs xs:text-sm sm:text-base">まだゲームをプレイしていません。</p>
          ) : (
            <div className="space-y-1 xs:space-y-2">
              {gameHistory.map((game, index) => (
                <div key={index} className="bg-gray-700 p-2 xs:p-3 rounded flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 xs:gap-2">
                  <div className="text-white text-xs xs:text-sm sm:text-base">
                    プレイヤー: {game.playerScore} vs バンカー: {game.bankerScore}
                  </div>
                  <div className="text-white font-bold text-xs xs:text-sm sm:text-base">{game.result}</div>
                  <div className={`font-bold text-xs xs:text-sm sm:text-base ${game.winnings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {game.winnings > 0 ? `+${game.winnings}` : '0'}
                  </div>
                  <div className="text-gray-400 text-xs">{game.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ルール説明 */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mt-2 xs:mt-3 sm:mt-4 lg:mt-6">
          <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">ゲームルール</h3>
          <div className="text-gray-300 space-y-1 xs:space-y-2 text-xs xs:text-sm sm:text-base">
            <p>• プレイヤーとバンカーのどちらが勝つか、または引き分けかにベットします</p>
            <p>• カードの値: A=1, 2-9=額面通り, 10・J・Q・K=0</p>
            <p>• 手札の合計の下一桁がスコアになります（例：7+8=15→スコア5）</p>
            <p>• 9に近い方が勝ちです</p>
            <p>• 配当: プレイヤー1:1, バンカー1:0.95, 引き分け8:1</p>
            <p>• 3枚目のカードは自動的にバカラルールに従って配布されます</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BaccaratGame

