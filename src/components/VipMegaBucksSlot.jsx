import { useState, useEffect, useRef } from 'react'
import { getJackpotAmount, resetJackpot, incrementJackpot } from '../lib/jackpot'

const JACKPOT_INITIAL = 10000000

const VipMegaBucksSlot = ({ currentUser, onNavigation, onNavigateHome, onUpdateBalance, onRecordGame }) => {
  // 安全なbalanceアクセス
  const safeBalance = currentUser?.balance || 0
  
  // currentUserが存在しない場合の早期リターン
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">読み込み中...</h1>
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
            onClick={onNavigateHome}
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }
  // MEGA BUCKS風シンボル（期待値150%調整版）
  const symbols = [
    { symbol: '💎', name: 'ダイヤモンド', value: 500, weight: 5 },     // 超高配当
    { symbol: '💰', name: 'マネーバッグ', value: 200, weight: 8 },     // 高配当
    { symbol: '🔔', name: 'ベル', value: 100, weight: 12 },           // 中高配当
    { symbol: '⭐', name: 'スター', value: 50, weight: 15 },          // 中配当
    { symbol: '🍒', name: 'チェリー', value: 20, weight: 25 },        // 中配当
    { symbol: '🍋', name: 'レモン', value: 10, weight: 35 },          // 低配当
  ]

  // ベット額オプション（VIP専用高額）
  const betOptions = [20000, 50000, 100000, 200000]

  // ゲーム状態
  const [reels, setReels] = useState([
    [0, 1, 2], // リール1（上、中、下）
    [0, 1, 2], // リール2
    [0, 1, 2]  // リール3
  ])
  const [spinning, setSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(20000) // 最低2万コイン
  const [message, setMessage] = useState('VIP専用 MEGA BUCKS スロット')
  const [lastWin, setLastWin] = useState(0)
  const [gameHistory, setGameHistory] = useState([])
  const [jackpotPool, setJackpotPool] = useState(10000000) // 1000万コインジャックポット
  const [autoSpin, setAutoSpin] = useState(false)
  const [autoSpinCount, setAutoSpinCount] = useState(0)
  const [maxAutoSpins, setMaxAutoSpins] = useState(10)
  
  // 最新の残高を追跡するref
  const currentBalanceRef = useRef(safeBalance)
  const autoSpinRef = useRef(false)
  const autoSpinCountRef = useRef(0)
  const maxAutoSpinsRef = useRef(10)
  
  // 残高とautoSpinの更新を追跡
  useEffect(() => {
    currentBalanceRef.current = safeBalance
  }, [safeBalance])
  
  useEffect(() => {
    autoSpinRef.current = autoSpin
  }, [autoSpin])

  useEffect(() => {
    autoSpinCountRef.current = autoSpinCount
  }, [autoSpinCount])

  useEffect(() => {
    maxAutoSpinsRef.current = maxAutoSpins
  }, [maxAutoSpins])

  // ジャックポット額をDBから取得
  useEffect(() => {
    let mounted = true;
    async function fetchJackpot() {
      try {
        console.log('ジャックポット額を取得中...')
        const amount = await getJackpotAmount('vip_mega_bucks')
        console.log('取得したジャックポット額:', amount)
        if (mounted) setJackpotPool(amount)
      } catch (e) {
        console.error('ジャックポット取得失敗:', e)
        // 取得失敗時はデフォルト値維持
        if (mounted) setJackpotPool(JACKPOT_INITIAL)
      }
    }
    fetchJackpot()
    return () => { mounted = false }
  }, [])

  // 重み付きランダム選択
  const getWeightedRandomSymbol = () => {
    const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < symbols.length; i++) {
      random -= symbols[i].weight
      if (random <= 0) {
        return i
      }
    }
    return 0
  }

  // ペイライン判定（MEGA BUCKS風）
  const checkPaylines = async (reelResults) => {
    const paylines = [
      [[0,0], [1,0], [2,0]], // 上段ライン
      [[0,1], [1,1], [2,1]], // 中段ライン（メインライン）
      [[0,2], [1,2], [2,2]], // 下段ライン
      [[0,0], [1,1], [2,2]], // 右下がり対角線
      [[0,2], [1,1], [2,0]], // 右上がり対角線
    ]

    let totalWin = 0
    let winningLines = []
    let jackpotHit = false

    // ジャックポット判定（中段に💎💎💎）
    const centerLine = [[0,1], [1,1], [2,1]];
    const centerSymbols = centerLine.map(([reel, pos]) => reelResults[reel][pos]);
    const isJackpot = centerSymbols.every(symbol => symbol === 0); // 全てダイヤモンド

    for (let lineIndex = 0; lineIndex < paylines.length; lineIndex++) {
      const line = paylines[lineIndex];
      const lineSymbols = line.map(([reel, pos]) => reelResults[reel][pos]);
      // 💎💎💎中段はジャックポット
      if (lineIndex === 1 && isJackpot) {
        // 中段💎💎💎は他の配当を上書き
        totalWin = betAmount * 500 + jackpotPool;
        winningLines = [{ line: 2, win: betAmount * 500 + jackpotPool, symbols: [0,0,0] }];
        jackpotHit = true;
        setMessage(`🎉 MEGA BUCKS JACKPOT! ${(betAmount * 500 + jackpotPool).toLocaleString()}コイン獲得！`);
        try {
          await resetJackpot('vip_mega_bucks', JACKPOT_INITIAL); // DBリセット
          setJackpotPool(JACKPOT_INITIAL); // ローカルリセット
        } catch (e) {
          console.error('ジャックポットリセットエラー:', e);
          // エラー時でもローカルはリセット
          setJackpotPool(JACKPOT_INITIAL);
        }
        break;
      }
      // 💎💎💎が他のラインなら通常配当
      if (!jackpotHit) {
        const lineWin = calculateLineWin(lineSymbols, lineIndex)
        if (lineWin > 0) {
          totalWin += lineWin
          winningLines.push({ line: lineIndex + 1, win: lineWin, symbols: lineSymbols })
        }
      }
    }

    return { totalWin, winningLines }
  }

  // ライン勝利計算
  const calculateLineWin = (lineSymbols, lineIndex) => {
    // 3つ同じシンボルの場合のみ勝利
    if (lineSymbols[0] === lineSymbols[1] && lineSymbols[1] === lineSymbols[2]) {
      const symbol = symbols[lineSymbols[0]]
      // 💎はジャックポット判定で処理済みなのでここは通常配当
      if (lineSymbols[0] === 0) {
        return betAmount * 500
      }
      // 通常マーク
      return betAmount * symbol.value
    }
    // チェリーの特別ルール（左端だけ or 左2つだけチェリー）
    if (lineSymbols[0] === 4) { // 左端がチェリー
      if (lineSymbols[1] === 4 && lineSymbols[2] !== 4) { // 左2つだけチェリー
        return betAmount * symbols[4].value * 0.5
      }
      if (lineSymbols[1] !== 4 && lineSymbols[2] !== 4) { // 左1つだけチェリー
        return betAmount * symbols[4].value * 0.2
      }
    }
    return 0
  }

  // 連続スピン制御
  const startAutoSpin = (count) => {
    if (spinning || autoSpin) return
    if (currentBalanceRef.current < betAmount) {
      setMessage('残高が不足しています。')
      return
    }
    
    setAutoSpin(true)
    autoSpinRef.current = true
    setAutoSpinCount(0)
    autoSpinCountRef.current = 0
    setMaxAutoSpins(count)
    maxAutoSpinsRef.current = count
    spin()
  }

  const stopAutoSpin = () => {
    setAutoSpin(false)
    autoSpinRef.current = false
    setAutoSpinCount(0)
    autoSpinCountRef.current = 0
    setMessage('VIP専用 MEGA BUCKS スロット')
  }

  // スピン実行
  const spin = async () => {
    if (spinning) return
    if (currentBalanceRef.current < betAmount) {
      setMessage('残高が不足しています。')
      return
    }

    setSpinning(true)
    setMessage('スピン中...')

    // ベット額を残高から差し引き
    const newBalance = currentBalanceRef.current - betAmount
    try {
      onUpdateBalance(newBalance)
      currentBalanceRef.current = newBalance
    } catch (error) {
      console.error('残高更新エラー（スピン開始時）:', error)
      // エラーが発生してもゲームは続行
    }

    // ジャックポット積立（ベット額の1%）
    const jackpotAddAmount = Math.floor(betAmount * 0.01);
    console.log('ジャックポット積立開始:', jackpotAddAmount);
    
    try {
      await incrementJackpot('vip_mega_bucks', jackpotAddAmount);
      // DB反映後に最新値取得
      const latest = await getJackpotAmount('vip_mega_bucks');
      console.log('ジャックポット更新後:', latest);
      setJackpotPool(latest);
    } catch (e) {
      console.error('ジャックポット加算エラー:', e);
      // エラー時はローカルで加算のみ
      setJackpotPool(prev => {
        const newAmount = prev + jackpotAddAmount;
        console.log('ローカルジャックポット更新:', prev, '+', jackpotAddAmount, '=', newAmount);
        return newAmount;
      });
    }

    // リール結果生成
    const newReels = [
      [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()],
      [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()],
      [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()]
    ]

    // スピン演出
    let spinCount = 0
    const spinInterval = setInterval(() => {
      setReels([
        [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()],
        [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()],
        [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()]
      ])
      spinCount++
      if (spinCount >= 15) {
        clearInterval(spinInterval)
        setReels(newReels)
        // 勝利判定
        (async () => {
          const { totalWin, winningLines } = await checkPaylines(newReels)
          if (totalWin > 0) {
            const finalBalance = currentBalanceRef.current + totalWin
            try {
              onUpdateBalance(finalBalance)
              currentBalanceRef.current = finalBalance
            } catch (error) {
              console.error('残高更新エラー（勝利時）:', error)
            }
            setLastWin(totalWin)
            if (winningLines.some(l => l.line === 2 && l.symbols.every(s => s === 0))) {
              setMessage(`🎉 MEGA BUCKS JACKPOT! ${totalWin.toLocaleString()}コイン獲得！`)
              // ジャックポットリセット後の最新値取得
              try {
                const latest = await getJackpotAmount('vip_mega_bucks');
                setJackpotPool(latest);
              } catch {}
            } else {
              setMessage(`🎉 ${totalWin.toLocaleString()}コイン獲得！`)
            }
          } else {
            setMessage('ハズレ... 次回に期待！')
            setLastWin(0)
          }

          // ゲーム履歴に記録
          const gameResult = {
            type: 'VIP MEGA BUCKS',
            bet: betAmount,
            win: totalWin,
            profit: totalWin - betAmount,
            timestamp: new Date().toLocaleString(),
            reels: newReels,
            winningLines
          }
          setGameHistory(prev => [gameResult, ...prev.slice(0, 9)])
          
          // ゲーム記録（外部関数）
          if (onRecordGame) {
            try {
              onRecordGame(gameResult)
            } catch (error) {
              console.error('ゲーム履歴記録エラー:', error)
              // エラーが発生してもゲームは続行
            }
          }

          setSpinning(false)

          // 連続スピン処理
          if (autoSpinRef.current) {
            const newCount = autoSpinCountRef.current + 1
            setAutoSpinCount(newCount)
            autoSpinCountRef.current = newCount

            if (newCount < maxAutoSpinsRef.current && currentBalanceRef.current >= betAmount) {
              setTimeout(() => {
                if (autoSpinRef.current) {
                  spin()
                }
              }, 2000)
            } else {
              stopAutoSpin()
              if (newCount >= maxAutoSpinsRef.current) {
                setMessage('連続スピン完了！')
              } else {
                setMessage('残高不足で連続スピン終了')
              }
            }
          }
        })();
      }
    }, 100)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white min-h-screen">
      {/* ヘッダー */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          VIP MEGA BUCKS
        </h1>
        <div className="mt-4 p-4 bg-yellow-600 rounded-lg">
          <div className="text-2xl font-bold">💰 JACKPOT: {jackpotPool.toLocaleString()}コイン</div>
        </div>
      </div>

      {/* ゲーム情報 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-800 p-4 rounded">
          <div className="text-sm text-purple-300">残高</div>
          <div className="text-xl font-bold">{safeBalance.toLocaleString()}コイン</div>
        </div>
        <div className="bg-purple-800 p-4 rounded">
          <div className="text-sm text-purple-300">最後の勝利</div>
          <div className="text-xl font-bold text-yellow-400">{lastWin.toLocaleString()}コイン</div>
        </div>
      </div>

      {/* スロットマシン */}
      <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 p-6 rounded-lg mb-6 border-4 border-yellow-400">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {reels.map((reel, reelIndex) => (
            <div key={reelIndex} className="bg-black rounded border-2 border-yellow-500">
              {reel.map((symbolIndex, posIndex) => (
                <div
                  key={posIndex}
                  className={`h-20 flex items-center justify-center text-4xl border-b border-yellow-600 last:border-b-0 ${
                    spinning ? 'animate-pulse' : ''
                  }`}
                >
                  {symbols[symbolIndex].symbol}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div className="text-center text-black font-bold text-xl mb-4">
          {message}
        </div>
      </div>

      {/* ベット設定 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-800 p-4 rounded">
          <div className="text-sm text-purple-300 mb-2">ベット額</div>
          <select
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full p-2 bg-purple-700 border border-purple-600 rounded text-white"
            disabled={spinning}
          >
            {betOptions.map(amount => (
              <option key={amount} value={amount}>
                {amount.toLocaleString()}コイン
              </option>
            ))}
          </select>
        </div>
        <div className="bg-purple-800 p-4 rounded">
          <div className="text-sm text-purple-300 mb-2">連続スピン</div>
          <select
            value={maxAutoSpins}
            onChange={(e) => setMaxAutoSpins(Number(e.target.value))}
            className="w-full p-2 bg-purple-700 border border-purple-600 rounded text-white"
            disabled={spinning || autoSpin}
          >
            <option value={10}>10回</option>
            <option value={25}>25回</option>
            <option value={50}>50回</option>
            <option value={100}>100回</option>
          </select>
        </div>
      </div>

      {/* ゲームボタン */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded disabled:opacity-50 transition"
          onClick={spin}
          disabled={spinning || safeBalance < betAmount}
        >
          {spinning ? 'スピン中...' : 'スピン'}
        </button>
        
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded disabled:opacity-50 transition"
          onClick={() => startAutoSpin(maxAutoSpins)}
          disabled={spinning || autoSpin || safeBalance < betAmount}
        >
          連続スピン開始
        </button>
        
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded disabled:opacity-50 transition"
          onClick={stopAutoSpin}
          disabled={!autoSpin}
        >
          停止
        </button>
      </div>

      {/* ペイテーブル */}
      <div className="bg-purple-800 p-4 rounded mb-6">
        <h3 className="text-lg font-bold mb-3 text-yellow-400">配当表</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {symbols.map((symbol, index) => (
            <div key={index} className="flex justify-between">
              <span>{symbol.symbol} {symbol.name}</span>
              <span className="text-yellow-300">{symbol.value.toLocaleString()}倍</span>
            </div>
          ))}
          <div className="col-span-2 border-t border-purple-600 pt-2 mt-2">
            <div className="flex justify-between font-bold text-yellow-400">
              <span>💎💎💎 (中段)</span>
              <span>JACKPOT!</span>
            </div>
          </div>
        </div>
        {/* ▼▼▼ 特別配当ルール説明を追加 ▼▼▼ */}
        <div className="mt-4 p-2 bg-purple-900 rounded text-xs text-purple-200">
          <div className="font-bold text-yellow-300 mb-1">🍒 チェリーの特別配当</div>
          <ul className="list-disc ml-5">
            <li>左端だけチェリー：ベット額 × 20 × 0.2（4倍）</li>
            <li>左2つチェリー：ベット額 × 20 × 0.5（10倍）</li>
            <li>3つ揃いは通常配当（ベット額 × 20倍）</li>
          </ul>
        </div>
        {/* ▲▲▲ ここまで ▲▲▲ */}
      </div>

      {/* 連続スピン状況 */}
      {autoSpin && (
        <div className="bg-blue-800 p-4 rounded mb-6">
          <div className="text-center">
            <div className="text-lg font-bold">連続スピン実行中</div>
            <div className="text-sm">{autoSpinCount} / {maxAutoSpins} 回完了</div>
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="flex gap-4">
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
          onClick={() => onNavigation('vip')}
        >
          VIPルームに戻る
        </button>
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
          onClick={onNavigateHome}
        >
          ホームに戻る
        </button>
      </div>

      {/* ゲーム履歴 */}
      {gameHistory.length > 0 && (
        <div className="mt-6 bg-purple-800 p-4 rounded">
          <h3 className="text-lg font-bold mb-3 text-yellow-400">最近のゲーム履歴</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {gameHistory.map((game, index) => (
              <div key={index} className="text-sm bg-purple-700 p-2 rounded">
                <div className="flex justify-between">
                  <span>{game.timestamp}</span>
                  <span className={game.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {game.profit >= 0 ? '+' : ''}{game.profit.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VipMegaBucksSlot
