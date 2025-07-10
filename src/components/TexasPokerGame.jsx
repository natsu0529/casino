import React, { useState, useEffect } from 'react';

const TexasPokerGame = ({ currentUser, onBalanceUpdate, onNavigateHome }) => {
  const [user, setUser] = useState(currentUser);
  const [gameState, setGameState] = useState('betting'); // betting, preflop, flop, turn, river, showdown
  const [playerCards, setPlayerCards] = useState([]);
  const [computerCards, setComputerCards] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [deck, setDeck] = useState([]);
  const [pot, setPot] = useState(0);
  const [playerBet, setPlayerBet] = useState(0);
  const [computerBet, setComputerBet] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [playerAction, setPlayerAction] = useState('');
  const [computerAction, setComputerAction] = useState('');

  useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);

  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck = [];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        newDeck.push({ suit, rank, value: getCardValue(rank) });
      }
    }
    
    return shuffleDeck(newDeck);
  };

  const getCardValue = (rank) => {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
  };

  const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startNewGame = () => {
    if (!user || user.balance < betAmount) {
      setMessage('残高が不足しています');
      return;
    }

    const newDeck = createDeck();
    const playerHand = [newDeck[0], newDeck[1]];
    const computerHand = [newDeck[2], newDeck[3]];
    
    setDeck(newDeck.slice(4));
    setPlayerCards(playerHand);
    setComputerCards(computerHand);
    setCommunityCards([]);
    setPot(betAmount * 2);
    setPlayerBet(betAmount);
    setComputerBet(betAmount);
    setGameState('preflop');
    setMessage('プリフロップ: アクションを選択してください');
    setPlayerAction('');
    setComputerAction('');

    // 残高から初期ベット額を引く
    const updatedUser = { ...user, balance: user.balance - betAmount };
    setUser(updatedUser);
    onBalanceUpdate(updatedUser.balance);
  };

  const dealCommunityCards = (count) => {
    const newCommunityCards = [...communityCards];
    for (let i = 0; i < count; i++) {
      if (deck.length > 0) {
        newCommunityCards.push(deck[0]);
        setDeck(prev => prev.slice(1));
      }
    }
    setCommunityCards(newCommunityCards);
  };

  const evaluateHand = (cards) => {
    if (cards.length < 5) return { rank: 0, description: 'ハイカード' };
    
    const sortedCards = [...cards].sort((a, b) => b.value - a.value);
    const suits = cards.map(card => card.suit);
    const values = cards.map(card => card.value);
    const valueCounts = {};
    
    values.forEach(value => {
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = checkStraight(values);
    
    if (isFlush && isStraight && Math.min(...values) === 10) {
      return { rank: 9, description: 'ロイヤルストレートフラッシュ', highCard: 14 };
    }
    if (isFlush && isStraight) {
      return { rank: 8, description: 'ストレートフラッシュ', highCard: Math.max(...values) };
    }
    if (counts[0] === 4) {
      return { rank: 7, description: 'フォーカード', highCard: getHighCardForCount(valueCounts, 4) };
    }
    if (counts[0] === 3 && counts[1] === 2) {
      return { rank: 6, description: 'フルハウス', highCard: getHighCardForCount(valueCounts, 3) };
    }
    if (isFlush) {
      return { rank: 5, description: 'フラッシュ', highCard: Math.max(...values) };
    }
    if (isStraight) {
      return { rank: 4, description: 'ストレート', highCard: Math.max(...values) };
    }
    if (counts[0] === 3) {
      return { rank: 3, description: 'スリーカード', highCard: getHighCardForCount(valueCounts, 3) };
    }
    if (counts[0] === 2 && counts[1] === 2) {
      return { rank: 2, description: 'ツーペア', highCard: Math.max(...getHighCardsForCount(valueCounts, 2)) };
    }
    if (counts[0] === 2) {
      return { rank: 1, description: 'ワンペア', highCard: getHighCardForCount(valueCounts, 2) };
    }
    
    return { rank: 0, description: 'ハイカード', highCard: Math.max(...values) };
  };

  const checkStraight = (values) => {
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    if (uniqueValues.length < 5) return false;
    
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      let consecutive = true;
      for (let j = 1; j < 5; j++) {
        if (uniqueValues[i + j] !== uniqueValues[i] + j) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) return true;
    }
    
    // A-2-3-4-5のストレート
    if (uniqueValues.includes(14) && uniqueValues.includes(2) && 
        uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
      return true;
    }
    
    return false;
  };

  const getHighCardForCount = (valueCounts, count) => {
    for (let value in valueCounts) {
      if (valueCounts[value] === count) {
        return parseInt(value);
      }
    }
    return 0;
  };

  const getHighCardsForCount = (valueCounts, count) => {
    const cards = [];
    for (let value in valueCounts) {
      if (valueCounts[value] === count) {
        cards.push(parseInt(value));
      }
    }
    return cards;
  };

  const getBestHand = (holeCards, communityCards) => {
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length < 5) return evaluateHand(allCards);
    
    let bestHand = { rank: -1 };
    
    // 7枚から5枚を選ぶ全ての組み合わせを評価
    for (let i = 0; i < allCards.length; i++) {
      for (let j = i + 1; j < allCards.length; j++) {
        for (let k = j + 1; k < allCards.length; k++) {
          for (let l = k + 1; l < allCards.length; l++) {
            for (let m = l + 1; m < allCards.length; m++) {
              const hand = [allCards[i], allCards[j], allCards[k], allCards[l], allCards[m]];
              const evaluation = evaluateHand(hand);
              if (evaluation.rank > bestHand.rank || 
                  (evaluation.rank === bestHand.rank && evaluation.highCard > bestHand.highCard)) {
                bestHand = evaluation;
              }
            }
          }
        }
      }
    }
    
    return bestHand;
  };

  const getComputerAction = () => {
    const handStrength = evaluateComputerHandStrength();
    const potOdds = pot > 0 ? betAmount / pot : 0;
    
    if (handStrength >= 0.8) {
      return Math.random() < 0.8 ? 'raise' : 'call';
    } else if (handStrength >= 0.6) {
      return Math.random() < 0.6 ? 'call' : 'fold';
    } else if (handStrength >= 0.4) {
      return Math.random() < 0.4 ? 'call' : 'fold';
    } else {
      return Math.random() < 0.2 ? 'call' : 'fold';
    }
  };

  const evaluateComputerHandStrength = () => {
    if (communityCards.length === 0) {
      // プリフロップでのハンド評価
      const card1 = computerCards[0];
      const card2 = computerCards[1];
      
      if (card1.value === card2.value) return 0.9; // ポケットペア
      if (card1.suit === card2.suit) return 0.7; // スーテッド
      if (Math.abs(card1.value - card2.value) <= 4) return 0.6; // コネクター
      if (card1.value >= 11 || card2.value >= 11) return 0.5; // ハイカード
      return 0.3;
    } else {
      // コミュニティカードがある場合の評価
      const bestHand = getBestHand(computerCards, communityCards);
      return Math.min(0.9, bestHand.rank / 9 + 0.1);
    }
  };

  const handlePlayerAction = (action) => {
    setPlayerAction(action);
    
    if (action === 'fold') {
      setMessage('あなたがフォールドしました。コンピュータの勝利です。');
      addToHistory('フォールド', 'コンピュータ', -betAmount);
      setGameState('betting');
      return;
    }
    
    if (action === 'call') {
      // コンピュータのアクションを決定
      const computerActionType = getComputerAction();
      setComputerAction(computerActionType);
      
      if (computerActionType === 'fold') {
        const winAmount = pot;
        const updatedUser = { ...user, balance: user.balance + winAmount };
        setUser(updatedUser);
        onBalanceUpdate(updatedUser.balance);
        setMessage(`コンピュータがフォールドしました。あなたの勝利です！ ${winAmount}コイン獲得`);
        addToHistory('コール', 'あなた', winAmount - betAmount);
        setGameState('betting');
        return;
      }
      
      // 次のフェーズに進む
      proceedToNextPhase();
    }
    
    if (action === 'raise') {
      const raiseAmount = betAmount;
      if (user.balance < raiseAmount) {
        setMessage('残高が不足しています');
        return;
      }
      
      setPot(prev => prev + raiseAmount);
      setPlayerBet(prev => prev + raiseAmount);
      const updatedUser = { ...user, balance: user.balance - raiseAmount };
      setUser(updatedUser);
      onBalanceUpdate(updatedUser.balance);
      
      // コンピュータのアクションを決定
      const computerActionType = getComputerAction();
      setComputerAction(computerActionType);
      
      if (computerActionType === 'fold') {
        const winAmount = pot + raiseAmount;
        const finalUser = { ...updatedUser, balance: updatedUser.balance + winAmount };
        setUser(finalUser);
        onBalanceUpdate(finalUser.balance);
        setMessage(`コンピュータがフォールドしました。あなたの勝利です！ ${winAmount}コイン獲得`);
        addToHistory('レイズ', 'あなた', winAmount - betAmount - raiseAmount);
        setGameState('betting');
        return;
      } else {
        setPot(prev => prev + raiseAmount);
        setComputerBet(prev => prev + raiseAmount);
        proceedToNextPhase();
      }
    }
  };

  const proceedToNextPhase = () => {
    if (gameState === 'preflop') {
      dealCommunityCards(3);
      setGameState('flop');
      setMessage('フロップ: 3枚のコミュニティカードが配られました');
    } else if (gameState === 'flop') {
      dealCommunityCards(1);
      setGameState('turn');
      setMessage('ターン: 4枚目のコミュニティカードが配られました');
    } else if (gameState === 'turn') {
      dealCommunityCards(1);
      setGameState('river');
      setMessage('リバー: 5枚目のコミュニティカードが配られました');
    } else if (gameState === 'river') {
      showdown();
    }
  };

  const showdown = () => {
    setGameState('showdown');
    
    const playerBestHand = getBestHand(playerCards, communityCards);
    const computerBestHand = getBestHand(computerCards, communityCards);
    
    let winner = '';
    let winAmount = 0;
    
    if (playerBestHand.rank > computerBestHand.rank || 
        (playerBestHand.rank === computerBestHand.rank && playerBestHand.highCard > computerBestHand.highCard)) {
      winner = 'あなた';
      winAmount = pot;
      const updatedUser = { ...user, balance: user.balance + winAmount };
      setUser(updatedUser);
      onBalanceUpdate(updatedUser.balance);
    } else if (computerBestHand.rank > playerBestHand.rank || 
               (computerBestHand.rank === playerBestHand.rank && computerBestHand.highCard > playerBestHand.highCard)) {
      winner = 'コンピュータ';
      winAmount = 0;
    } else {
      winner = '引き分け';
      winAmount = pot / 2;
      const updatedUser = { ...user, balance: user.balance + winAmount };
      setUser(updatedUser);
      onBalanceUpdate(updatedUser.balance);
    }
    
    setMessage(`ショーダウン！ ${winner}の勝利！ あなた: ${playerBestHand.description}, コンピュータ: ${computerBestHand.description}`);
    addToHistory('ショーダウン', winner, winAmount - playerBet);
    
    setTimeout(() => {
      setGameState('betting');
    }, 3000);
  };

  const addToHistory = (action, winner, profit) => {
    const newEntry = {
      action,
      winner,
      profit,
      timestamp: new Date().toLocaleTimeString()
    };
    setGameHistory(prev => [newEntry, ...prev.slice(0, 4)]);
  };

  const renderCard = (card, hidden = false) => {
    if (hidden) {
      return (
        <div className="w-16 h-24 bg-blue-600 border-2 border-blue-800 rounded-lg flex items-center justify-center text-white font-bold">
          ?
        </div>
      );
    }
    
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className={`w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center ${isRed ? 'text-red-600' : 'text-black'} font-bold shadow-md`}>
        <div className="text-sm">{card.rank}</div>
        <div className="text-lg">{card.suit}</div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">ログインが必要です</h2>
          <button 
            onClick={() => onNavigateHome()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center">
            🃏 テキサスホールデムポーカー
          </h1>
          <div className="text-white text-right">
            <div>ユーザー: {user.username}</div>
            <div>残高: {user.balance}コイン</div>
          </div>
        </div>

        {/* ルール説明ボタン */}
        <div className="mb-4">
          <button 
            onClick={() => setShowRules(!showRules)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {showRules ? 'ルールを隠す' : 'ルールを表示'}
          </button>
        </div>

        {/* ルール説明 */}
        {showRules && (
          <div className="bg-white p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-4">テキサスホールデムポーカーのルール</h3>
            <div className="space-y-2 text-sm">
              <p><strong>基本ルール:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>各プレイヤーは2枚のホールカード（手札）を受け取ります</li>
                <li>5枚のコミュニティカードが段階的に公開されます</li>
                <li>ホールカード2枚とコミュニティカード5枚から最高の5枚を選んで役を作ります</li>
              </ul>
              <p><strong>ゲームの流れ:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>プリフロップ: ホールカード2枚が配られた後のベッティング</li>
                <li>フロップ: コミュニティカード3枚が公開された後のベッティング</li>
                <li>ターン: 4枚目のコミュニティカードが公開された後のベッティング</li>
                <li>リバー: 5枚目のコミュニティカードが公開された後のベッティング</li>
                <li>ショーダウン: 手札を比較して勝敗を決定</li>
              </ul>
              <p><strong>アクション:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>コール: 相手のベットに合わせる</li>
                <li>レイズ: ベット額を上げる</li>
                <li>フォールド: 降りる（負けを認める）</li>
              </ul>
            </div>
          </div>
        )}

        {/* ゲームエリア */}
        <div className="bg-green-700 rounded-lg p-6 mb-6">
          {/* コンピュータのカード */}
          <div className="text-center mb-6">
            <h3 className="text-white text-lg mb-2">コンピュータ</h3>
            <div className="flex justify-center gap-2">
              {computerCards.map((card, index) => (
                <div key={index}>
                  {renderCard(card, gameState !== 'showdown')}
                </div>
              ))}
            </div>
            {computerAction && (
              <div className="text-yellow-300 mt-2">アクション: {computerAction}</div>
            )}
          </div>

          {/* コミュニティカード */}
          <div className="text-center mb-6">
            <h3 className="text-white text-lg mb-2">コミュニティカード</h3>
            <div className="flex justify-center gap-2">
              {communityCards.map((card, index) => (
                <div key={index}>
                  {renderCard(card)}
                </div>
              ))}
              {/* 空のスロット */}
              {Array.from({ length: 5 - communityCards.length }).map((_, index) => (
                <div key={`empty-${index}`} className="w-16 h-24 border-2 border-dashed border-gray-400 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* ポット情報 */}
          <div className="text-center mb-6">
            <div className="text-white text-xl">ポット: {pot}コイン</div>
            {gameState !== 'betting' && (
              <div className="text-yellow-300">
                あなたのベット: {playerBet}コイン | コンピュータのベット: {computerBet}コイン
              </div>
            )}
          </div>

          {/* プレイヤーのカード */}
          <div className="text-center">
            <h3 className="text-white text-lg mb-2">あなたの手札</h3>
            <div className="flex justify-center gap-2">
              {playerCards.map((card, index) => (
                <div key={index}>
                  {renderCard(card)}
                </div>
              ))}
            </div>
            {playerAction && (
              <div className="text-yellow-300 mt-2">あなたのアクション: {playerAction}</div>
            )}
          </div>
        </div>

        {/* ゲームコントロール */}
        <div className="bg-white rounded-lg p-6 mb-6">
          {gameState === 'betting' && (
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">新しいゲームを開始</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">ベット額を選択:</label>
                <div className="flex justify-center gap-2 flex-wrap">
                  {[10, 25, 50, 100, 250].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      className={`px-4 py-2 rounded-lg ${betAmount === amount ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={startNewGame}
                disabled={user.balance < betAmount}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg text-lg font-bold"
              >
                ゲーム開始 ({betAmount}コイン)
              </button>
            </div>
          )}

          {gameState !== 'betting' && gameState !== 'showdown' && (
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">アクションを選択してください</h3>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => handlePlayerAction('fold')}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold"
                >
                  フォールド
                </button>
                <button 
                  onClick={() => handlePlayerAction('call')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
                >
                  コール
                </button>
                <button 
                  onClick={() => handlePlayerAction('raise')}
                  disabled={user.balance < betAmount}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold"
                >
                  レイズ (+{betAmount})
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg text-center">
              <p className="text-blue-800 font-medium">{message}</p>
            </div>
          )}
        </div>

        {/* ゲーム履歴 */}
        {gameHistory.length > 0 && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">ゲーム履歴</h3>
            <div className="space-y-2">
              {gameHistory.map((entry, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{entry.timestamp}</span>
                  <span>{entry.action}</span>
                  <span>勝者: {entry.winner}</span>
                  <span className={entry.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {entry.profit >= 0 ? '+' : ''}{entry.profit}コイン
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TexasPokerGame;

