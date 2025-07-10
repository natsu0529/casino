import { useState, useEffect } from 'react'

const RouletteGame = ({ currentUser, onNavigateHome, onUpdateBalance }) => {
  // ルーレットの数字と色の定義（ヨーロピアンルーレット）
  const rouletteNumbers = [
    { number: 0, color: 'green' },
    { number: 32, color: 'red' }, { number: 15, color: 'black' }, { number: 19, color: 'red' },
    { number: 4, color: 'black' }, { number: 21, color: 'red' }, { number: 2, color: 'black' },
    { number: 25, color: 'red' }, { number: 17, color: 'black' }, { number: 34, color: 'red' },
    { number: 6, color: 'black' }, { number: 27, color: 'red' }, { number: 13, color: 'black' },
    { number: 36, color: 'red' }, { number: 11, color: 'black' }, { number: 30, color: 'red' },
    { number: 8, color: 'black' }, { number: 23, color: 'red' }, { number: 10, color: 'black' },
    { number: 5, color: 'red' }, { number: 24, color: 'black' }, { number: 16, color: 'red' },
    { number: 33, color: 'black' }, { number: 1, color: 'red' }, { number: 20, color: 'black' },
    { number: 14, color: 'red' }, { number: 31, color: 'black' }, { number: 9, color: 'red' },
    { number: 22, color: 'black' }, { number: 18, color: 'red' }, { number: 29, color: 'black' },
    { number: 7, color: 'red' }, { number: 28, color: 'black' }, { number: 12, color: 'red' },
    { number: 35, color: 'black' }, { number: 3, color: 'red' }, { number: 26, color: 'black' }
  ]

  // 赤と黒の数字を分類
  const redNumbers = rouletteNumbers.filter(n => n.color === 'red').map(n => n.number)
  const blackNumbers = rouletteNumbers.filter(n => n.color === 'black').map(n => n.number)

  // ゲーム状態
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [bets, setBets] = useState({})
  const [totalBet, setTotalBet] = useState(0)
  const [message, setMessage] = useState('')
  const [gameHistory, setGameHistory] = useState([])
  const [selectedBetAmount, setSelectedBetAmount] = useState(10)

  // ベットの種類
  const betTypes = {
    // 数字ベット
    straight: { name: 'ストレート', payout: 35, description: '単一の数字' },
    // 色ベット
    red: { name: '赤', payout: 1, description: '赤の数字' },
    black: { name: '黒', payout: 1, description: '黒の数字' },
    // 偶数/奇数
    even: { name: '偶数', payout: 1, description: '偶数（0除く）' },
    odd: { name: '奇数', payout: 1, description: '奇数' },
    // ハイ/ロー
    low: { name: 'ロー', payout: 1, description: '1-18' },
    high: { name: 'ハイ', payout: 1, description: '19-36' },
    // ダズン
    dozen1: { name: '1st 12', payout: 2, description: '1-12' },
    dozen2: { name: '2nd 12', payout: 2, description: '13-24' },
    dozen3: { name: '3rd 12', payout: 2, description: '25-36' },
    // コラム
    column1: { name: '1st Col', payout: 2, description: '1,4,7,10,13,16,19,22,25,28,31,34' },
    column2: { name: '2nd Col', payout: 2, description: '2,5,8,11,14,17,20,23,26,29,32,35' },
    column3: { name: '3rd Col', payout: 2, description: '3,6,9,12,15,18,21,24,27,30,33,36' }
  }

  // ベットを追加
  const placeBet = (betType, value = null) => {
    if (spinning) return
    if (selectedBetAmount > currentUser.balance) {
      setMessage('残高が不足しています。')
      return
    }

    const betKey = value !== null ? `${betType}_${value}` : betType
    const newBets = { ...bets }
    
    if (newBets[betKey]) {
      newBets[betKey] += selectedBetAmount
    } else {
      newBets[betKey] = selectedBetAmount
    }

    setBets(newBets)
    setTotalBet(Object.values(newBets).reduce((sum, bet) => sum + bet, 0))
    setMessage('')
  }

  // ベットをクリア
  const clearBets = () => {
    setBets({})
    setTotalBet(0)
    setMessage('')
  }

  // スピン実行
  const spin = () => {
    if (spinning) return
    if (totalBet === 0) {
      setMessage('ベットを置いてください。')
      return
    }
    if (totalBet > currentUser.balance) {
      setMessage('残高が不足しています。')
      return
    }

    setSpinning(true)
    setMessage('ルーレットを回転中...')
    
    // 残高から賭け金を引く
    onUpdateBalance(currentUser.balance - totalBet)

    // スピンアニメーション（3-5秒）
    const spinDuration = 3000 + Math.random() * 2000
    
    setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 37) // 0-36
      const winningData = rouletteNumbers.find(n => n.number === winningNumber)
      
      setResult(winningData)
      setSpinning(false)
      
      // 結果判定
      setTimeout(() => {
        checkWinnings(winningData)
      }, 1000)
    }, spinDuration)
  }

  // 勝敗判定
  const checkWinnings = (winningData) => {
    let totalWinnings = 0
    const winningBets = []

    Object.entries(bets).forEach(([betKey, betAmount]) => {
      const [betType, value] = betKey.split('_')
      let isWin = false
      let payout = 0

      switch (betType) {
        case 'straight':
          if (parseInt(value) === winningData.number) {
            isWin = true
            payout = betTypes.straight.payout
          }
          break
        case 'red':
          if (winningData.color === 'red') {
            isWin = true
            payout = betTypes.red.payout
          }
          break
        case 'black':
          if (winningData.color === 'black') {
            isWin = true
            payout = betTypes.black.payout
          }
          break
        case 'even':
          if (winningData.number !== 0 && winningData.number % 2 === 0) {
            isWin = true
            payout = betTypes.even.payout
          }
          break
        case 'odd':
          if (winningData.number !== 0 && winningData.number % 2 === 1) {
            isWin = true
            payout = betTypes.odd.payout
          }
          break
        case 'low':
          if (winningData.number >= 1 && winningData.number <= 18) {
            isWin = true
            payout = betTypes.low.payout
          }
          break
        case 'high':
          if (winningData.number >= 19 && winningData.number <= 36) {
            isWin = true
            payout = betTypes.high.payout
          }
          break
        case 'dozen1':
          if (winningData.number >= 1 && winningData.number <= 12) {
            isWin = true
            payout = betTypes.dozen1.payout
          }
          break
        case 'dozen2':
          if (winningData.number >= 13 && winningData.number <= 24) {
            isWin = true
            payout = betTypes.dozen2.payout
          }
          break
        case 'dozen3':
          if (winningData.number >= 25 && winningData.number <= 36) {
            isWin = true
            payout = betTypes.dozen3.payout
          }
          break
        case 'column1':
          if (winningData.number > 0 && (winningData.number - 1) % 3 === 0) {
            isWin = true
            payout = betTypes.column1.payout
          }
          break
        case 'column2':
          if (winningData.number > 0 && (winningData.number - 2) % 3 === 0) {
            isWin = true
            payout = betTypes.column2.payout
          }
          break
        case 'column3':
          if (winningData.number > 0 && winningData.number % 3 === 0) {
            isWin = true
            payout = betTypes.column3.payout
          }
          break
      }

      if (isWin) {
        const winAmount = betAmount * (payout + 1) // ベット額 + 配当
        totalWinnings += winAmount
        winningBets.push({ betKey, betAmount, winAmount, payout })
      }
    })

    // 残高を更新
    if (totalWinnings > 0) {
      onUpdateBalance(currentUser.balance + totalWinnings)
      setMessage(`🎉 ${totalWinnings.toLocaleString()}コイン獲得！ 当選: ${winningBets.length}件`)
    } else {
      setMessage(`残念！ ${winningData.number} ${winningData.color === 'green' ? '緑' : winningData.color === 'red' ? '赤' : '黒'}`)
    }

    // ゲーム履歴に追加
    const newHistory = {
      result: winningData,
      totalBet: totalBet,
      totalWin: totalWinnings,
      winningBets: winningBets,
      timestamp: new Date().toLocaleTimeString()
    }
    setGameHistory(prev => [newHistory, ...prev.slice(0, 4)])

    // ベットをクリア
    setBets({})
    setTotalBet(0)
  }

  // 数字の色を取得
  const getNumberColor = (number) => {
    if (number === 0) return 'green'
    return redNumbers.includes(number) ? 'red' : 'black'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-4xl font-bold text-white">🎯 ルーレット 🎯</h1>
          <div className="text-white text-right">
            <div className="text-lg font-bold">👤 {currentUser.username}</div>
            <div className="text-yellow-300 font-bold">💰 {currentUser.balance.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* ルーレットホイール */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-full w-80 h-80 mx-auto mb-6 relative flex items-center justify-center shadow-2xl">
          <div className={`bg-gradient-to-br from-amber-400 to-amber-600 rounded-full w-64 h-64 flex items-center justify-center ${
            spinning ? 'animate-spin' : ''
          }`}>
            <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center text-4xl font-bold">
              {result ? (
                <span className={`${
                  result.color === 'red' ? 'text-red-600' : 
                  result.color === 'black' ? 'text-black' : 'text-green-600'
                }`}>
                  {result.number}
                </span>
              ) : '?'}
            </div>
          </div>
          {/* ボール */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
        </div>

        {/* ベットエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 数字ベット */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <h3 className="text-white font-bold mb-4 text-center">数字ベット (35倍)</h3>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 37 }, (_, i) => i).map(number => (
                <button
                  key={number}
                  onClick={() => placeBet('straight', number)}
                  disabled={spinning}
                  className={`w-12 h-12 rounded text-white font-bold text-sm transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'
                  } ${
                    number === 0 ? 'bg-green-600 hover:bg-green-700' :
                    getNumberColor(number) === 'red' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-gray-800 hover:bg-gray-700'
                  } ${
                    bets[`straight_${number}`] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  {number}
                  {bets[`straight_${number}`] && (
                    <div className="text-xs text-yellow-300">
                      {bets[`straight_${number}`]}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 外側ベット */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <h3 className="text-white font-bold mb-4 text-center">外側ベット</h3>
            <div className="space-y-2">
              {/* 色ベット */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => placeBet('red')}
                  disabled={spinning}
                  className={`bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.red ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  赤 (2倍) {bets.red && `[${bets.red}]`}
                </button>
                <button
                  onClick={() => placeBet('black')}
                  disabled={spinning}
                  className={`bg-gray-800 hover:bg-gray-700 text-white py-3 rounded font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.black ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  黒 (2倍) {bets.black && `[${bets.black}]`}
                </button>
              </div>

              {/* 偶数/奇数 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => placeBet('even')}
                  disabled={spinning}
                  className={`bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.even ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  偶数 (2倍) {bets.even && `[${bets.even}]`}
                </button>
                <button
                  onClick={() => placeBet('odd')}
                  disabled={spinning}
                  className={`bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.odd ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  奇数 (2倍) {bets.odd && `[${bets.odd}]`}
                </button>
              </div>

              {/* ハイ/ロー */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => placeBet('low')}
                  disabled={spinning}
                  className={`bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.low ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  1-18 (2倍) {bets.low && `[${bets.low}]`}
                </button>
                <button
                  onClick={() => placeBet('high')}
                  disabled={spinning}
                  className={`bg-pink-600 hover:bg-pink-700 text-white py-3 rounded font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.high ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  19-36 (2倍) {bets.high && `[${bets.high}]`}
                </button>
              </div>

              {/* ダズン */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => placeBet('dozen1')}
                  disabled={spinning}
                  className={`bg-orange-600 hover:bg-orange-700 text-white py-2 rounded text-sm font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.dozen1 ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  1-12 (3倍) {bets.dozen1 && `[${bets.dozen1}]`}
                </button>
                <button
                  onClick={() => placeBet('dozen2')}
                  disabled={spinning}
                  className={`bg-orange-600 hover:bg-orange-700 text-white py-2 rounded text-sm font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.dozen2 ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  13-24 (3倍) {bets.dozen2 && `[${bets.dozen2}]`}
                </button>
                <button
                  onClick={() => placeBet('dozen3')}
                  disabled={spinning}
                  className={`bg-orange-600 hover:bg-orange-700 text-white py-2 rounded text-sm font-bold transition-all duration-300 ${
                    spinning ? 'cursor-not-allowed opacity-50' : ''
                  } ${bets.dozen3 ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  25-36 (3倍) {bets.dozen3 && `[${bets.dozen3}]`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* コントロールエリア */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-white font-medium">ベット額:</label>
              <select
                value={selectedBetAmount}
                onChange={(e) => setSelectedBetAmount(parseInt(e.target.value))}
                disabled={spinning}
                className="px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
              >
                <option value={5}>5コイン</option>
                <option value={10}>10コイン</option>
                <option value={25}>25コイン</option>
                <option value={50}>50コイン</option>
                <option value={100}>100コイン</option>
              </select>
            </div>

            <div className="text-white font-bold">
              総ベット: {totalBet.toLocaleString()}コイン
            </div>

            <button
              onClick={clearBets}
              disabled={spinning}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-colors duration-300"
            >
              ベットクリア
            </button>

            <button
              onClick={spin}
              disabled={spinning || totalBet === 0}
              className={`px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                spinning || totalBet === 0
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:scale-105'
              }`}
            >
              {spinning ? 'スピン中...' : 'スピン'}
            </button>
          </div>
        </div>

        {/* メッセージエリア */}
        {message && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
            <p className="text-white text-center text-lg font-bold">{message}</p>
          </div>
        )}

        {/* ゲーム履歴 */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-white font-bold mb-4 text-center">最近のゲーム</h3>
          <div className="space-y-2">
            {gameHistory.length === 0 ? (
              <p className="text-gray-300 text-center">まだゲームをプレイしていません</p>
            ) : (
              gameHistory.map((game, index) => (
                <div key={index} className="bg-white/5 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        game.result.color === 'red' ? 'bg-red-600' :
                        game.result.color === 'black' ? 'bg-gray-800' : 'bg-green-600'
                      }`}>
                        {game.result.number}
                      </div>
                      <div className="text-white text-sm">
                        <div>ベット: {game.totalBet}コイン</div>
                        <div>当選: {game.winningBets.length}件</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${game.totalWin > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {game.totalWin > 0 ? `+${game.totalWin}` : `-${game.totalBet}`}
                      </div>
                      <div className="text-xs text-gray-300">{game.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ルール説明 */}
        <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 mt-6">
          <h4 className="text-white font-bold mb-2">ゲームルール:</h4>
          <p className="text-gray-300 text-sm">
            ヨーロピアンルーレット（0-36）。数字、色、偶数/奇数、ハイ/ローなど様々なベットが可能です。
            数字ベットは35倍、色・偶数奇数・ハイローは2倍、ダズンは3倍の配当です。
          </p>
        </div>
      </div>
    </div>
  )
}

export default RouletteGame

