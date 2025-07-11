# Casino App

オンラインでカジノゲーム（ブラックジャック、ポーカー、スロットなど）が楽しめるWebアプリです。  
Supabaseでデータベース・認証を管理し、Vercelで本番運用しています。

---

## 🚀 本番環境URL

[https://casino-beta-pearl.vercel.app/#](https://casino-beta-pearl.vercel.app/#)

---

## 主な機能

- Google認証・メール認証によるログイン
- ブラックジャック、ポーカー、スロット、ルーレット、バカラなどのカジノゲーム
- 仮想コインによる資産管理とランキング
- Supabaseによるデータ永続化

---

## 開発・運用技術

- フロントエンド: React + Vite
- バックエンド: Supabase (PostgreSQL, Auth)
- デプロイ: Vercel

---

## セットアップ方法（開発者向け）

1. このリポジトリをクローン
2. `.env.local` ファイルを作成し、SupabaseのURLとAnon Keyを設定
3. 必要に応じてGoogle OAuthの設定も追加
4. 依存パッケージをインストール

```bash
npm install
```

5. 開発サーバーを起動

```bash
npm run dev
```

---

## 注意事項

- 本アプリは仮想コインのみを使用し、実際のお金のやり取りはありません。
- Google認証を利用する場合は、Google Cloud ConsoleでOAuth設定が必要です。
- メール認証がうまくいかない場合は、Googleアカウントでの登録を推奨しています。

---

## ライセンス

このプロジェクトはMITライセンスです。
