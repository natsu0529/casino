import React, { useState, useEffect } from 'react';

const TexasPokerGame = ({ currentUser, onBalanceUpdate, onNavigateHome }) => {
  const [gameState, setGameState] = useState('betting'); // betting, preflop, flop, turn, river, showdown
  const [playerCards, setPlayerCards] = useState([]);
  const [computerCards, setComputerCards] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [deck, setDeck] = useState([]);
  const [pot, setPot] = useState(0);
  const [playerBet, setPlayerBet] = useState(0);
  const [computerBet, setComputerBet] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [raiseAmount, setRaiseAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [playerAction, setPlayerAction] = useState('');
  const [computerAction, setComputerAction] = useState('');

  const rulesText = `
  Texas Poker Rules:
  - ゲーム開始時に両プレイヤーが10コインの固定ベットを行います
  - コンピュータの行動はハンドの強さに基づいて決定されます
  - フォールド時は引き分けとなり参加料が返還されます
  - 勝者はプール金全額を獲得します
  `;

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
    const fixedBet = 10; // 固定ベット額
    if (!currentUser || currentUser.balance < fixedBet) {
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
    setPot(fixedBet * 2); // 固定ベット×2
    setPlayerBet(fixedBet);
    setComputerBet(fixedBet);
    setGameState('preflop');
    setMessage('プリフロップ: 両プレイヤーが10コインずつベットしました。アクションを選択してください');
    setPlayerAction('');
    setComputerAction('');

    // 残高から固定ベット額を引く
    const newBalance = currentUser.balance - fixedBet;
    console.log(`=== GAME START (FIXED BET) ===`);
    console.log(`Before: ${currentUser.balance}, Fixed Bet: ${fixedBet}, After: ${newBalance}`);
    onBalanceUpdate(newBalance);
    
    console.log(`New game started - Fixed bet: ${fixedBet}, Pot: ${fixedBet * 2}, Player balance: ${newBalance}`);
    
    // プリフロップでコンピュータのアクションをチェック（少し遅延させる）
    setTimeout(() => {
      checkComputerPreflop();
    }, 1000);
  };

  const dealCommunityCards = (count) => {
    if (deck.length < count) {
      console.error('デッキに十分なカードがありません');
      return;
    }
    
    const newCommunityCards = [...communityCards];
    const currentDeck = [...deck];
    
    // 必要な枚数のカードを一度に取得
    for (let i = 0; i < count; i++) {
      newCommunityCards.push(currentDeck[i]);
    }
    
    // デッキから使用したカードを除去
    setDeck(currentDeck.slice(count));
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

  const getComputerActionForRaise = () => {
    // レイズに対する特別な判断ロジック
    const handInfo = evaluateComputerHandStrength();
    const currentBetSize = Math.max(playerBet, computerBet);
    const initialBet = 10; // 固定初期ベット額
    const raiseFactor = currentBetSize / initialBet; // 現在のベット倍率
    
    console.log(`Computer hand evaluation: rank=${handInfo.rank}, type=${handInfo.type}, raiseFactor=${raiseFactor}`);
    
    // レイズに対する判断
    if (handInfo.rank >= 3) { // スリーカード以上
      console.log('Strong hand (3+ of a kind) - never fold');
      return Math.random() < 0.3 ? 'raise' : 'call'; // 絶対降りない、むしろ反撃も
    } else if (handInfo.rank === 2) { // ツーペア
      if (raiseFactor <= 10) {
        console.log('Two pair within 10x limit - staying in');
        return Math.random() < 0.8 ? 'call' : 'raise'; // 10倍以内なら積極的にコール
      } else {
        console.log('Two pair but raise too high - considering fold');
        return Math.random() < 0.4 ? 'call' : 'fold';
      }
    } else if (handInfo.rank === 1) { // ワンペア
      if (raiseFactor <= 5) {
        console.log('One pair within 5x limit - staying in');
        return Math.random() < 0.7 ? 'call' : 'fold'; // 5倍以内なら基本的にコール
      } else {
        console.log('One pair but raise too high - likely fold');
        return Math.random() < 0.15 ? 'call' : 'fold'; // 5倍超えたらほぼ降りる
      }
    } else { // ハイカードのみ
      if (handInfo.highCard >= 13) { // K以上
        if (raiseFactor <= 2) {
          console.log('High card (K+) with small raise - might call');
          return Math.random() < 0.4 ? 'call' : 'fold';
        } else {
          console.log('High card (K+) but big raise - fold');
          return 'fold';
        }
      } else {
        console.log('Weak hand - fold to raise');
        return 'fold'; // 弱いハンドはレイズに対して即フォールド
      }
    }
  };

  const getComputerAction = (isResponseToRaise = false) => {
    if (isResponseToRaise) {
      return getComputerActionForRaise();
    }
    
    const handInfo = evaluateComputerHandStrength();
    
    // 新しいシンプルなアルゴリズム
    if (handInfo.rank >= 7) { // フォーカード以上
      return 'raise';
    } else if (handInfo.rank >= 4) { // ストレート以上
      return Math.random() < 0.7 ? 'call' : 'raise';
    } else if (handInfo.rank >= 1) { // ワンペア以上
      return Math.random() < 0.6 ? 'call' : 'fold';
    } else { // ハイカードのみ
      if (handInfo.highCard >= 12) { // Q以上
        return Math.random() < 0.4 ? 'call' : 'fold';
      } else {
        return Math.random() < 0.2 ? 'call' : 'fold';
      }
    }
  };

  const evaluateComputerHandStrength = () => {
    if (communityCards.length === 0) {
      // プリフロップでのハンド評価
      const card1 = computerCards[0];
      const card2 = computerCards[1];
      
      if (card1.value === card2.value) {
        // ポケットペア - ペアの強さに応じて評価
        return { rank: 1, highCard: card1.value, type: 'pocket_pair' };
      }
      
      // ハイカードのみ
      const highCard = Math.max(card1.value, card2.value);
      return { rank: 0, highCard: highCard, type: 'high_card' };
    } else {
      // コミュニティカードがある場合の実際のハンド評価
      const bestHand = getBestHand(computerCards, communityCards);
      return {
        rank: bestHand.rank,
        highCard: bestHand.highCard,
        type: getHandTypeName(bestHand.rank)
      };
    }
  };

  const getHandTypeName = (rank) => {
    const handTypes = [
      'high_card',      // 0
      'one_pair',       // 1
      'two_pair',       // 2
      'three_of_kind',  // 3
      'straight',       // 4
      'flush',          // 5
      'full_house',     // 6
      'four_of_kind',   // 7
      'straight_flush', // 8
      'royal_flush'     // 9
    ];
    return handTypes[rank] || 'unknown';
  };

  const handlePlayerAction = (action) => {
    setPlayerAction(action);
    
    if (action === 'fold') {
      // プレイヤーがフォールドした場合は引き分け（参加料を返還）
      const returnAmount = betAmount; // 初期参加料のみ返還
      const newBalance = currentUser.balance + returnAmount;
      onBalanceUpdate(newBalance);
      console.log(`=== PLAYER FOLDED - DRAW ===`);
      console.log(`Player folded - Return amount: ${returnAmount}, New balance: ${newBalance}`);
      setMessage('あなたがフォールドしました。引き分けです。参加料が返還されました。');
      addToHistory('フォールド', '引き分け', 0); // 損益なし
      setGameState('betting');
      // ベット額をリセット
      setPlayerBet(0);
      setComputerBet(0);
      setPot(0);
      return;
    }
    
    if (action === 'call') {
      // コンピュータのアクションを決定（通常のロジック使用）
      const computerActionType = getComputerAction(false);
      setComputerAction(computerActionType);
      
      if (computerActionType === 'fold') {
        // プレイヤーがコール・レイズ後のコンピュータフォールド
        // → プレイヤーがプール金全額を獲得
        const winAmount = pot;
        const newBalance = currentUser.balance + winAmount;
        onBalanceUpdate(newBalance);
        const profit = winAmount - playerBet;
        console.log(`=== COMPUTER FOLDED AFTER PLAYER CALL ===`);
        console.log(`Computer folded after player's call - Win amount: ${winAmount}, Player bet: ${playerBet}, Profit: ${profit}, New balance: ${newBalance}`);
        setMessage(`コンピュータがフォールドしました。あなたの勝利です！ プール金${winAmount}コイン獲得（利益: ${profit}コイン）`);
        addToHistory('コール', 'あなた', profit);
        setGameState('betting');
        // ベット額をリセット
        setPlayerBet(0);
        setComputerBet(0);
        setPot(0);
        return;
      }
      
      // 次のフェーズに進む
      proceedToNextPhase();
    }
    
    if (action === 'raise') {
      if (currentUser.balance < raiseAmount) {
        setMessage('残高が不足しています');
        return;
      }
      
      setPot(prev => prev + raiseAmount);
      setPlayerBet(prev => prev + raiseAmount);
      
      console.log(`Player raises - Raise amount: ${raiseAmount}, New pot will be: ${pot + raiseAmount}, Player bet will be: ${playerBet + raiseAmount}`);
      
      // レイズに対するコンピュータのアクションを決定（レイズ専用ロジック使用）
      const computerActionType = getComputerAction(true); // レイズに対する判断
      setComputerAction(computerActionType);
      
      if (computerActionType === 'fold') {
        // プレイヤーがレイズ後のコンピュータフォールド
        // → プレイヤーがプール金全額を獲得
        const winAmount = pot + raiseAmount; // 更新後のポット値を正しく計算
        // 残高更新を1回にまとめる：レイズ分を引いてプール金全額を加算
        const finalBalance = currentUser.balance - raiseAmount + winAmount;
        console.log(`=== COMPUTER FOLDED AFTER PLAYER RAISE ===`);
        console.log(`Before: ${currentUser.balance}, Raise: ${raiseAmount}, Win: ${winAmount}, After: ${finalBalance}`);
        onBalanceUpdate(finalBalance);
        const totalPlayerBet = playerBet + raiseAmount; // レイズ後のプレイヤー総ベット額
        const profit = winAmount - totalPlayerBet;
        console.log(`Computer folded after raise - Win amount: ${winAmount}, Total player bet: ${totalPlayerBet}, Profit: ${profit}, New balance: ${finalBalance}`);
        setMessage(`コンピュータがフォールドしました。あなたの勝利です！ プール金${winAmount}コイン獲得（利益: ${profit}コイン）`);
        addToHistory('レイズ', 'あなた', profit);
        setGameState('betting');
        // ベット額をリセット
        setPlayerBet(0);
        setComputerBet(0);
        setPot(0);
        return;
      } else if (computerActionType === 'call') {
        const newPot = pot + raiseAmount;
        const newComputerBet = computerBet + raiseAmount;
        setPot(newPot);
        setComputerBet(newComputerBet);
        setMessage(`コンピュータがコールしました`);
        proceedToNextPhase();
      } else if (computerActionType === 'raise') {
        // コンピュータが再レイズ
        const newPot = pot + raiseAmount * 2;
        const newComputerBet = computerBet + raiseAmount * 2;
        setPot(newPot);
        setComputerBet(newComputerBet);
        setMessage(`コンピュータがレイズしました！`);
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

  // プリフロップでコンピュータが最初にフォールドする可能性をチェック
  const checkComputerPreflop = () => {
    if (gameState === 'preflop' && playerBet === betAmount && computerBet === betAmount) {
      const computerActionType = getComputerAction(false);
      setComputerAction(computerActionType);
      
      if (computerActionType === 'fold') {
        // プリフロップでコンピュータが自発的にフォールド
        // → プレイヤーがプール金全額を獲得
        const winAmount = pot;
        const newBalance = currentUser.balance + winAmount;
        onBalanceUpdate(newBalance);
        const profit = winAmount - playerBet;
        console.log(`=== COMPUTER FOLDED IN PREFLOP (SPONTANEOUS) ===`);
        console.log(`Computer folded in preflop (spontaneous) - Win amount: ${winAmount}, Player bet: ${playerBet}, Profit: ${profit}, New balance: ${newBalance}`);
        setMessage(`コンピュータがプリフロップでフォールドしました。あなたの勝利です！ プール金${winAmount}コイン獲得（利益: ${profit}コイン）`);
        addToHistory('プリフロップ', 'あなた', profit);
        setGameState('betting');
        setPlayerBet(0);
        setComputerBet(0);
        setPot(0);
        return true; // フォールドした
      }
    }
    return false; // フォールドしなかった
  };

  const showdown = () => {
    setGameState('showdown');
    
    console.log(`=== SHOWDOWN DEBUG ===`);
    console.log(`Current user balance before showdown: ${currentUser.balance}`);
    console.log(`Pot: ${pot}, Player bet: ${playerBet}, Computer bet: ${computerBet}`);
    
    const playerBestHand = getBestHand(playerCards, communityCards);
    const computerBestHand = getBestHand(computerCards, communityCards);
    
    let winner = '';
    let winAmount = 0;
    let profit = 0;
    
    if (playerBestHand.rank > computerBestHand.rank || 
        (playerBestHand.rank === computerBestHand.rank && playerBestHand.highCard > computerBestHand.highCard)) {
      // プレイヤーの勝利 - プール金全額を獲得
      winner = 'あなた';
      winAmount = pot; // プール金全額を獲得
      profit = winAmount - playerBet;
      const newBalance = currentUser.balance + winAmount;
      console.log(`=== PLAYER WINS (SHOWDOWN) ===`);
      console.log(`Before: ${currentUser.balance}, Win amount: ${winAmount}, After: ${newBalance}, Profit: ${profit}`);
      onBalanceUpdate(newBalance);
      console.log(`Player wins! Pot: ${pot}, Player bet: ${playerBet}, Win amount: ${winAmount}, Profit: ${profit}, New balance: ${newBalance}`);
    } else if (computerBestHand.rank > playerBestHand.rank || 
               (computerBestHand.rank === playerBestHand.rank && computerBestHand.highCard > playerBestHand.highCard)) {
      // コンピュータの勝利 - プレイヤーは何も獲得しない
      winner = 'コンピュータ';
      winAmount = 0; // プレイヤーは何も獲得しない
      profit = -playerBet; // プレイヤーの損失（支払った分がすべて損失）
      console.log(`Computer wins! Player bet: ${playerBet}, Loss: ${profit}`);
    } else {
      // 引き分け - プレイヤーの参加料のみ返還
      winner = '引き分け';
      winAmount = playerBet; // プレイヤーの参加料のみ戻る
      profit = 0; // 損益なし
      const newBalance = currentUser.balance + winAmount;
      onBalanceUpdate(newBalance);
      console.log(`=== DRAW (SHOWDOWN) ===`);
      console.log(`Draw! Player gets back: ${winAmount}, New balance: ${newBalance}`);
    }
    
    const resultMessage = winner === 'あなた' 
      ? `ショーダウン！ ${winner}の勝利！ プール金${winAmount}コイン獲得（利益: ${profit}コイン）`
      : winner === '引き分け'
      ? `ショーダウン！ 引き分けです！ 参加料${winAmount}コイン返還`
      : `ショーダウン！ ${winner}の勝利！ 参加料${Math.abs(profit)}コイン没収`;
    
    setMessage(`${resultMessage} あなた: ${playerBestHand.description}, コンピュータ: ${computerBestHand.description}`);
    addToHistory('ショーダウン', winner, profit);
    
    setTimeout(() => {
      setGameState('betting');
      // ゲーム終了時にベット額をリセット
      setPlayerBet(0);
      setComputerBet(0);
      setPot(0);
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
        <div className="w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 lg:w-16 lg:h-24 bg-blue-600 border-2 border-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xs xs:text-sm sm:text-base">
          ?
        </div>
      );
    }
    
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className={`w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 lg:w-16 lg:h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center ${isRed ? 'text-red-600' : 'text-black'} font-bold shadow-md`}>
        <div className="text-xs xs:text-sm sm:text-base">{card.rank}</div>
        <div className="text-sm xs:text-base sm:text-lg">{card.suit}</div>
      </div>
    );
  };

  if (!currentUser) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 p-1 xs:p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col xs:flex-row justify-between items-center mb-2 xs:mb-4 sm:mb-6 gap-2 xs:gap-0">
          <button 
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg text-xs xs:text-sm sm:text-base order-1 xs:order-none"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-1 xs:gap-2 order-2 xs:order-none text-center">
            🃏 テキサスポーカー
          </h1>
          <div className="text-white text-center xs:text-right order-3 xs:order-none">
            <div className="text-xs xs:text-sm sm:text-base">ユーザー: {currentUser.username}</div>
            <div className="text-xs xs:text-sm sm:text-base">残高: {currentUser.balance}コイン</div>
          </div>
        </div>

        {/* ルール説明ボタン */}
        <div className="mb-2 xs:mb-3 sm:mb-4">
          <button 
            onClick={() => setShowRules(!showRules)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg text-xs xs:text-sm sm:text-base"
          >
            {showRules ? 'ルールを隠す' : 'ルールを表示'}
          </button>
        </div>

        {/* ルール説明 */}
        {showRules && (
          <div className="bg-white p-2 xs:p-3 sm:p-4 lg:p-6 rounded-lg mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-2 xs:mb-3 sm:mb-4">テキサスポーカーのルール</h3>
            <div className="space-y-1 xs:space-y-2 text-xs xs:text-sm">
              <p><strong>基本ルール:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 xs:space-y-1 ml-2 xs:ml-4">
                <li>各プレイヤーは2枚のホールカード（手札）を受け取ります</li>
                <li>5枚のコミュニティカードが段階的に公開されます</li>
                <li>ホールカード2枚とコミュニティカード5枚から最高の5枚を選んで役を作ります</li>
              </ul>
              <p><strong>ゲームの流れ:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 xs:space-y-1 ml-2 xs:ml-4">
                <li>プリフロップ: ホールカード2枚が配られた後のベッティング</li>
                <li>フロップ: コミュニティカード3枚が公開された後のベッティング</li>
                <li>ターン: 4枚目のコミュニティカードが公開された後のベッティング</li>
                <li>リバー: 5枚目のコミュニティカードが公開された後のベッティング</li>
                <li>ショーダウン: 手札を比較して勝敗を決定</li>
              </ul>
              <p><strong>参加料とプール金:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-green-600">
                <li>ゲーム開始時に両プレイヤーが参加料（ベット額）をプールに投入</li>
                <li>プール金は参加料の合計（通常は20コイン）</li>
              </ul>
              <p><strong>勝敗のルール:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-red-600">
                <li><strong>プレイヤーがフォールド:</strong> 引き分け（参加料が返還）</li>
                <li><strong>コンピュータがフォールド:</strong> プレイヤーがプール金全額獲得</li>
                <li><strong>両者がリバーまで残る:</strong> ハンドが強い方がプール金全額獲得</li>
                <li><strong>ショーダウンで引き分け:</strong> 各自の参加料のみ返還</li>
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
        <div className="bg-green-700 rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
          {/* コンピュータのカード */}
          <div className="text-center mb-4 xs:mb-6">
            <h3 className="text-white text-sm xs:text-base sm:text-lg mb-1 xs:mb-2">コンピュータ</h3>
            <div className="flex justify-center gap-1 xs:gap-2">
              {computerCards.map((card, index) => (
                <div key={index}>
                  {renderCard(card, gameState !== 'showdown')}
                </div>
              ))}
            </div>
            {computerAction && (
              <div className="text-yellow-300 mt-1 xs:mt-2 text-xs xs:text-sm">アクション: {computerAction}</div>
            )}
          </div>

          {/* コミュニティカード */}
          <div className="text-center mb-4 xs:mb-6">
            <h3 className="text-white text-sm xs:text-base sm:text-lg mb-1 xs:mb-2">コミュニティカード</h3>
            <div className="flex justify-center gap-1 xs:gap-2 overflow-x-auto">
              {communityCards.map((card, index) => (
                <div key={index}>
                  {renderCard(card)}
                </div>
              ))}
              {/* 空のスロット */}
              {Array.from({ length: 5 - communityCards.length }).map((_, index) => (
                <div key={`empty-${index}`} className="w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 lg:w-16 lg:h-24 border-2 border-dashed border-gray-400 rounded-lg flex-shrink-0"></div>
              ))}
            </div>
          </div>

          {/* ポット情報 */}
          <div className="text-center mb-4 xs:mb-6">
            <div className="text-white text-base xs:text-lg sm:text-xl">ポット: {pot}コイン</div>
            {gameState !== 'betting' && (
              <div className="text-yellow-300 text-xs xs:text-sm sm:text-base">
                あなたのベット: {playerBet}コイン | コンピュータのベット: {computerBet}コイン
              </div>
            )}
          </div>

          {/* プレイヤーのカード */}
          <div className="text-center">
            <h3 className="text-white text-sm xs:text-base sm:text-lg mb-1 xs:mb-2">あなたの手札</h3>
            <div className="flex justify-center gap-1 xs:gap-2">
              {playerCards.map((card, index) => (
                <div key={index}>
                  {renderCard(card)}
                </div>
              ))}
            </div>
            {playerAction && (
              <div className="text-yellow-300 mt-1 xs:mt-2 text-xs xs:text-sm">あなたのアクション: {playerAction}</div>
            )}
          </div>
        </div>

        {/* ゲームコントロール */}
        <div className="bg-white rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
          {gameState === 'betting' && (
            <div className="text-center">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-2 xs:mb-3 sm:mb-4">新しいゲームを開始</h3>
              <div className="mb-2 xs:mb-3 sm:mb-4 text-sm xs:text-base">
                <p className="text-gray-600 mb-2">固定ベット: 10コイン（両プレイヤー）</p>
                <p className="text-gray-500 text-xs xs:text-sm">※ベット額の変更はできません</p>
              </div>
              <button 
                onClick={startNewGame}
                disabled={currentUser.balance < 10}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 xs:px-6 xs:py-2 sm:px-8 sm:py-3 rounded-lg text-sm xs:text-base sm:text-lg font-bold"
              >
                ゲーム開始 (10コイン)
              </button>
            </div>
          )}

          {gameState !== 'betting' && gameState !== 'showdown' && (
            <div className="text-center">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-2 xs:mb-3 sm:mb-4">アクションを選択してください</h3>
              
              {/* レイズ額入力 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">レイズ額 (10-1000コイン):</label>
                <input 
                  type="number"
                  min="10"
                  max="1000"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Math.max(10, Math.min(1000, parseInt(e.target.value) || 10)))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-center"
                />
              </div>
              
              <div className="flex flex-col xs:flex-row justify-center gap-2 xs:gap-3 sm:gap-4">
                <button 
                  onClick={() => handlePlayerAction('fold')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs xs:text-sm sm:text-base"
                >
                  フォールド
                </button>
                <button 
                  onClick={() => handlePlayerAction('call')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs xs:text-sm sm:text-base"
                >
                  コール
                </button>
                <button 
                  onClick={() => handlePlayerAction('raise')}
                  disabled={currentUser.balance < raiseAmount}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs xs:text-sm sm:text-base"
                >
                  レイズ (+{raiseAmount})
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="mt-2 xs:mt-3 sm:mt-4 p-2 xs:p-3 sm:p-4 bg-blue-100 border border-blue-300 rounded-lg text-center">
              <p className="text-blue-800 font-medium text-xs xs:text-sm sm:text-base">{message}</p>
            </div>
          )}
        </div>

        {/* ゲーム履歴 */}
        {gameHistory.length > 0 && (
          <div className="bg-white rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6">
            <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-2 xs:mb-3 sm:mb-4">ゲーム履歴</h3>
            <div className="space-y-1 xs:space-y-2">
              {gameHistory.map((entry, index) => (
                <div key={index} className="flex flex-col xs:flex-row justify-between items-start xs:items-center p-2 bg-gray-50 rounded gap-1 xs:gap-2">
                  <span className="text-xs xs:text-sm">{entry.timestamp}</span>
                  <span className="text-xs xs:text-sm">{entry.action}</span>
                  <span className="text-xs xs:text-sm">勝者: {entry.winner}</span>
                  <span className={`text-xs xs:text-sm ${entry.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

