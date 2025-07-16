import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import VipMessageBoard from "./VipMessageBoard";
import { getJackpotAmount } from "../lib/jackpot";

export default function VipPage({ onNavigation, onNavigateHome }) {
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const [jackpot, setJackpot] = useState(null);
  const [jackpotError, setJackpotError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchJackpot() {
      try {
        const amount = await getJackpotAmount();
        if (mounted) setJackpot(amount);
      } catch (e) {
        setJackpotError("ジャックポット額の取得に失敗しました");
      }
    }
    fetchJackpot();
    // 10秒ごとに自動更新
    const timer = setInterval(fetchJackpot, 10000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  if (!user || loading) {
    return <div className="p-4">読み込み中...</div>;
  }
  if (!profile?.title) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-700">
        VIP（爵位）保持者のみ入室できます。
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-yellow-800">VIPルーム</h1>
      <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-900">
        <span className="font-bold">現在のジャックポット:</span>{' '}
        {jackpotError ? (
          <span className="text-red-600">{jackpotError}</span>
        ) : jackpot === null ? (
          <span>取得中...</span>
        ) : (
          <span className="text-2xl font-mono text-yellow-700">{jackpot.toLocaleString()} コイン</span>
        )}
      </div>
      <div className="flex gap-4 mb-6">
        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
          onClick={onNavigateHome}
        >
          ホームに戻る
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          onClick={() => onNavigation('vip-mega-bucks')}
        >
          💰 VIP MEGA BUCKS スロット
        </button>
      </div>
      <VipMessageBoard />
    </div>
  );
}
