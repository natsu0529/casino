import React from "react";
import VipMessageBoard from "./VipMessageBoard";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useNavigate } from "react-router-dom";

export default function VipPage() {
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && (!user || !profile?.title)) {
      // 爵位を持たない場合はホームへリダイレクト
      navigate("/");
    }
  }, [user, profile, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user || !profile?.title) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-yellow-700">VIPページ</h1>
      <VipMessageBoard />
      {/* ここにVIP専用ゲームなどを追加予定 */}
    </div>
  );
}
