import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import VipMessageBoard from "./VipMessageBoard";

export default function VipPage() {
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);

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
      <div className="flex gap-4 mb-6">
        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
          onClick={() => window.location.href = '/'}
        >
          ホームに戻る
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          onClick={() => window.location.hash = '#vip-mega-bucks'}
        >
          💰 VIP MEGA BUCKS スロット
        </button>
      </div>
      <VipMessageBoard />
    </div>
  );
}
