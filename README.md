# My Virtual Gallery

> 作品を選ぶだけ。あなたの個展ができる。

画像をアップロードするだけで、自分だけの **3D メタバース個展** を作って公開できる Web アプリです。
Unity や Blender の知識は必要ありません。ユーザーがやることは「作品を選ぶ」「会場を選ぶ」「公開する」だけです。

- 個展作成ウィザード（名前 → 会場 → 作品 → 展示方法 → 完成）
- 会場は 8 種類（白い美術館・星空・和風・城下町・森・海辺・ハロウィン・シンプル）
- 見た目の調整：壁の色（8 色＋自由選択）・額縁（木・金・白・黒・額なし）・作品の名札（タイトルと作者名）
- 背景（実写）：実際の 360° 風景写真（草原・運河の街・水辺・砂浜・星空）に囲まれた屋外展示。写真は Poly Haven（CC0）
- 動画（MP4）作品：3D 空間では音なしで自動再生（近くにいるときだけ）、クリックすると音ありで再生
- 作品は壁に自動で展示（多いときは「次の部屋」を自動生成）
- ブラウザで歩ける 3D ギャラリー（PC: WASD/矢印キー + ドラッグ、スマホ: スティック + スワイプ）
- 作品をクリック/タップすると詳細（タイトル・作者・説明）
- 「次の作品 ›」ボタンで作品を順番に鑑賞（スマホでも迷わない）
- 公開 URL（`/gallery/[slug]`）を「URLをコピー」で共有

---

## 技術構成

| 分類     | 使用技術                                                               |
| -------- | ---------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router) / React 19 / TypeScript (strict) / Tailwind v4 |
| 3D       | Three.js / React Three Fiber / Drei                                    |
| Backend  | Supabase（Auth / PostgreSQL / Storage / Row Level Security）           |
| 品質     | ESLint / Prettier / Vitest（ユニット）/ Playwright（E2E スクリプト）   |
| デプロイ | Vercel                                                                 |

### デモモードについて

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が未設定の場合、アプリは **デモモード** で起動します。
データはブラウザ内（IndexedDB）に保存され、どんなメールアドレス/パスワードでもログインできます。
Supabase を用意しなくてもすぐに全機能を試せますが、**他の人と共有するには Supabase の設定が必要** です。
（デモモードの公開 URL は同じブラウザでしか開けません。）

---

## セットアップ

必要なもの: Node.js 20.9 以上 / npm

```bash
git clone <this repository>
cd laughing-octo-journey
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます（Supabase 未設定ならデモモード）。

### 環境変数

`.env.example` をコピーして `.env.local` を作ります。

```bash
cp .env.example .env.local
```

| 変数                            | 説明                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase の Project URL                                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon (public) key                                   |
| `NEXT_PUBLIC_SITE_URL`          | 公開サイトの URL（OGP 用。例: `https://my-gallery.vercel.app`） |

> ⚠️ `service_role` キーなどの秘密鍵は **絶対に** `NEXT_PUBLIC_` で始まる変数に入れないでください。
> このアプリは anon key と RLS だけで動作するため、秘密鍵は不要です。

---

## Supabase の設定

1. https://supabase.com でプロジェクトを作成します。
2. **Project Settings → API** から `Project URL` と `anon public` キーを `.env.local` に設定します。
3. **DB migration** を実行します（下記）。
4. **Authentication → URL Configuration** の `Site URL` にアプリの URL（ローカルなら `http://localhost:3000`）を、
   `Redirect URLs` に `http://localhost:3000/auth/callback` と本番の `https://<your-domain>/auth/callback` を追加します。
5. （任意）すぐに試したい場合は **Authentication → Providers → Email** の「Confirm email」をオフにすると、
   登録後すぐにログインできます。オンの場合は確認メールのリンクを開いてからログインします。

### DB migration

`supabase/migrations/` の SQL ファイルを **ファイル名の順に** 実行します。

| ファイル                            | 内容                            |
| ----------------------------------- | ------------------------------- |
| `20260929000000_initial_schema.sql` | テーブル・RLS・Storage バケット |
| `20261001000000_artist_names.sql`   | 作者名（個展ごと・作品ごと）    |
| `20261002000000_video_artworks.sql` | 動画作品（MP4、50MB まで）      |

**方法 A: SQL Editor（かんたん）**
Supabase ダッシュボードの **SQL Editor** に各ファイルの中身を順番に貼り付けて **Run** します。

**方法 B: Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

作成されるもの:

| テーブル         | 内容                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| `profiles`       | 表示名（作者名）など。サインアップ時にトリガーで自動作成                            |
| `galleries`      | 個展（title, artist_name, slug, template, status, layout_mode, lighting, bgm_url…） |
| `artworks`       | 作品（画像 URL、サムネイル、配置 position/rotation/scale、media_type）              |
| `gallery_visits` | 来場記録（`visitor_id` は匿名 ID にも対応）                                         |
| `likes`          | いいね（将来機能・テーブルと RLS のみ）                                             |
| `comments`       | コメント（将来機能・テーブルと RLS のみ）                                           |

Storage: `gallery-assets` バケット（公開読み取り、10MB 上限、画像/音声 MIME のみ）。
保存先は `gallery-assets/{user_id}/{gallery_id}/{asset_id}.webp` です。

### セキュリティ（RLS）

- 個展・作品を作成/編集/削除できるのは **所有者だけ**（DB の RLS で強制）
- `published` の個展と作品は **ログインしていない人でも閲覧可能**
- 他ユーザーの下書き・非公開の個展は閲覧不可
- Storage への書き込みは自分のフォルダ（`{自分のuser_id}/{自分のgallery_id}/`）のみ
- `/dashboard` 以下はサーバー側（`proxy.ts`）で未ログインをブロック
- 画像はブラウザで再エンコード（最大 1600px, WebP）→ EXIF（位置情報など）も除去
- 入力はサニタイズ・長さ制限（DB 側にも CHECK 制約）、`?next=` のオープンリダイレクト対策、
  画像/音声 URL のスキーム検証、セキュリティヘッダー

> 補足: 画像は公開バケットに保存されます（推測できない UUID のパス）。下書き中の作品画像も URL を知っていれば表示できます。
> 厳密に非公開にしたい場合は、将来的に非公開バケット + 署名付き URL に切り替えてください。

---

## 使い方（ユーザー目線）

1. トップページで **「個展を作る」**
2. ログイン / アカウント作成（初回は 3 ステップの案内が出ます）
3. **STEP 1** 個展の名前 → **STEP 2** 会場を選ぶ → **STEP 3** 作品を追加（ドラッグ＆ドロップ可・複数可）
   → **STEP 4** 展示方法（おまかせ / 均等に展示 / 大きく展示 / 自分で配置）→ **STEP 5** 完成！
4. **「ギャラリーを見る」** で来場者と同じ視点のプレビュー
5. 編集画面（左: 設定メニュー / 右: 3D プレビュー）
   - 作品をクリック →「大きくする」「小さくする」「左へ」「右へ」「少し上へ」「少し下へ」
   - 会場・照明・BGM（MP3/WAV）を変更、**保存**
6. **「公開する」** → 共有 URL が表示されるので **「URLをコピー」** して友達へ

---

## 開発コマンド

```bash
npm run dev         # 開発サーバー
npm run build       # 本番ビルド
npm run start       # 本番サーバー
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run format      # Prettier で整形
npm test            # ユニットテスト（レイアウト・バリデーション・slug など）

# E2E（デモモードでユーザー操作を通しで確認。スクリーンショットは ./screenshots）
npm run build && npx next start -p 3100 &
BASE_URL=http://localhost:3100 npm run test:e2e
```

E2E スクリプトは Chromium を使います（`CHROMIUM_PATH` で実行ファイルを指定可能）。
新規登録 → ウィザード → 画像アップロード → 3D プレビューで作品クリック → 編集・保存 → 会場変更 → 公開
→ 公開 URL を開く → スマホ表示（スティック、「次の作品」、オンボーディング）までを確認します。

---

## Vercel へのデプロイ

1. このリポジトリを GitHub に push
2. https://vercel.com/new でリポジトリを Import（Framework: Next.js は自動検出）
3. **Environment Variables** に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
   `NEXT_PUBLIC_SITE_URL`（例: `https://<project>.vercel.app`）を設定
4. **Deploy**
5. Supabase の **Authentication → URL Configuration** に本番 URL と `https://<project>.vercel.app/auth/callback` を追加

---

## フォルダ構成

```
app/                         ページ（App Router）
  page.tsx                   トップ
  login/ signup/             ログイン・新規登録
  auth/callback/             確認メールのリンク処理
  explore/                   公開中の個展一覧（「作品を見る」）
  dashboard/                 マイギャラリー
    new/                     個展作成ウィザード
    gallery/[id]/edit/       編集画面
    gallery/[id]/preview/    プレビュー
  gallery/[slug]/            公開ページ（来場者用）
components/
  ui/                        ボタン・モーダル・トーストなど
  gallery/venues/            会場ごとの装飾（1 会場 = 1 ファイル）
  gallery/                   3D: GalleryScene, GalleryCamera, GalleryControls, ArtworkFrame,
                             ArtworkModal, GalleryLighting, GalleryRoom, TitleWall, GalleryViewer …
  dashboard/                 GalleryCard, ArtworkUploader, GalleryWizard, editor/ …
lib/
  supabase/                  client.ts / server.ts / middleware.ts / config.ts
  data/                      データアクセス（Supabase 実装 / デモ実装、共通インターフェース）
  gallery/                   layout.ts（自動展示）/ validation.ts / slug.ts / templates.ts
  image/                     ブラウザでの画像最適化（WebP 変換・サムネイル生成）
  i18n/                      UI 文言（日本語）。英語化はここに en.ts を追加
  ai/                        AI 機能の拡張ポイント（MVP では無効）
types/                       gallery.ts / artwork.ts / profile.ts
supabase/migrations/         DB スキーマ・RLS・Storage
proxy.ts                     認証セッション更新とダッシュボード保護（Next.js 16 の旧 middleware）
tests/                       ユニットテスト
scripts/e2e-demo.mjs         E2E スクリプト
```

---

## MVP の範囲と今後の拡張

### MVP（実装済み）

トップページ / ログイン / 新規登録 / ダッシュボード / 個展作成ウィザード / 会場選択（8 種類：白い美術館・星空・和風・城下町・森・海辺・ハロウィン・シンプル）/
画像アップロード（検証・最適化）/ 作品タイトル・説明 / 自動展示（おまかせ・均等・大きく・自分で配置）/
3D ギャラリー / WASD・矢印キー / マウス（ドラッグ）視点操作 / スマホ用スティック / 作品クリック・詳細 /
ホバーで明るく + ポインター / 保存 / プレビュー / 公開・下書き / 公開 URL・URL コピー /
BGM（MP3/WAV、ボタンで再生）/ 照明プリセット / 来場数 / Supabase RLS / エラー処理 / スマホ対応 / README

### 設計のみ対応（MVP 後に追加）

| 機能                            | 準備されているもの                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| 新しい会場                      | `lib/gallery/templates.ts` にスタイルを 1 件、`components/gallery/venues/` に装飾を 1 ファイル追加 |
| 3D（GLB）                       | `artworks.media_type`（image / video / model）                                                     |
| VRM アバター                    | `GalleryScene` に子要素として追加できる構造。カメラ制御は `GalleryControls`                        |
| 複数人同時接続・チャット        | `gallery_visits` / 匿名 `visitor_id`（`lib/visitor.ts`）→ Supabase Realtime                        |
| いいね・コメント                | `likes` / `comments` テーブルと RLS                                                                |
| SNS 共有（X / LINE）            | `lib/share.ts` の `shareLinks()`                                                                   |
| AI タイトル・説明・自動個展     | `lib/ai/index.ts` の `AiProvider`（ボタンは設置済み、サーバー経由で実装）                          |
| 高度編集モード（XYZ）           | `artworks.position_*` / `rotation_y` / `scale` に保存済み                                          |
| 壁の色など細かな設定            | `galleries.settings`（jsonb）                                                                      |
| 英語 UI                         | `lib/i18n/ja.ts` と同じ形の辞書を追加                                                              |
| NFT・販売・有料プラン・管理画面 | 未着手                                                                                             |
