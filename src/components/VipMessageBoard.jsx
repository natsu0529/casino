import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { UserNameWithTitle } from "./TitleDisplay";

export default function VipMessageBoard() {
  const { user } = useAuth();
  // フックは常に呼ぶ（Reactのフックルール）
  const { profile, getVipMessages, postVipMessage } = useProfile(user?.id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // メッセージ取得（VIP専用関数を使用）
  const fetchMessages = React.useCallback(async () => {
    if (typeof getVipMessages !== "function") {
      setMessages([]);
      return;
    }
    try {
      const msgs = await getVipMessages(20);
      setMessages(Array.isArray(msgs) ? msgs.filter(Boolean) : []);
    } catch (error) {
      console.error('Error fetching VIP messages:', error);
      setMessages([]);
    }
  }, [getVipMessages]);

  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, 5000);
    return () => clearInterval(timer);
  }, [fetchMessages]); // fetchMessagesをメモ化したので安全

  // messagesがundefinedやnullになった場合、必ず空配列に戻す
  useEffect(() => {
    if (!Array.isArray(messages)) {
      setMessages([]);
    }
  }, [messages]);

  // VIP以外はガード
  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-700">
        VIPユーザーのみ掲示板を利用できます。
      </div>
    );
  }
  if (!profile?.title) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-700">
        VIPユーザーのみ掲示板を利用できます。
      </div>
    );
  }

  // 投稿処理（VIP専用関数を使用）
  const handlePost = async (e) => {
    e.preventDefault();
    if (!input.trim() || typeof postVipMessage !== "function") return;
    setSending(true);
    setError("");
    try {
      await postVipMessage(input);
      setInput("");
      fetchMessages();
    } catch (err) {
      setError("投稿に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded">
      <h2 className="text-xl font-bold mb-2 text-yellow-800">VIP専用掲示板</h2>
      <form onSubmit={handlePost} className="mb-4 flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={sending}
        />
        <button
          type="submit"
          className="bg-yellow-600 text-white px-4 py-1 rounded disabled:opacity-50"
          disabled={sending || !input.trim()}
        >投稿</button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(!Array.isArray(messages) || messages.length === 0) && (
          <div className="text-gray-500">まだメッセージがありません</div>
        )}
        {Array.isArray(messages) && messages.length > 0 && messages.filter(Boolean).map(msg => (
          <div key={msg.id} className="bg-white border border-yellow-200 rounded p-2">
            <div className="text-sm text-yellow-900 font-bold">
              <UserNameWithTitle 
                username={msg.username} 
                title={msg.title} 
                className="inline"
              />
              <span className="text-xs text-yellow-500 ml-2">({new Date(msg.created_at).toLocaleString()})</span>
            </div>
            <div className="text-yellow-800 whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
