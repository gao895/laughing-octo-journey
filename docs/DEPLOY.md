# 本番公開ガイド（Supabase ＋ Vercel）

このガイドの通りに進めると、My Virtual Gallery をインターネットに公開し、友達があなたの個展を見られるようになります。
所要時間の目安は 30〜40 分です。プログラミングの知識は要りません。

進め方は次の 5 ステップです。

1. Supabase（データベースと画像の保存場所）を作る
2. データベースの準備（SQL を 1 回貼り付けて実行）
3. Vercel（サイトの公開場所）に公開する
4. ログインの設定（URL を 2 か所に登録）
5. セットアップ確認ページで最終チェック

> 用意するもの：GitHub アカウント（このリポジトリがあるもの）とメールアドレス。
> Supabase と Vercel は無料プランで始められます。無料プランには容量や使い方の上限があるので、最新の条件は各サービスの料金ページで確認してください。

---

## 1. Supabase のプロジェクトを作る

1. https://supabase.com を開き、**Start your project** から GitHub アカウントでサインアップします。
2. **New project** を押して、次のように入力します。
   - **Name**：わかりやすい名前（例：`my-virtual-gallery`）
   - **Database Password**：**Generate a password** で作り、どこかに控えておきます（このガイドでは使いませんが、あとで必要になることがあります）
   - **Region**：日本の利用者が多いなら **Northeast Asia (Tokyo)**
3. **Create new project** を押し、準備が終わるまで 1〜2 分待ちます。

## 2. データベースの準備（SQL を 1 回実行）

データベースの表、アクセスの決まり（RLS）、画像・動画の保存場所を、1 つのファイルでまとめて作ります。

1. GitHub でこのリポジトリの **`supabase/setup.sql`** を開き、右上の **Copy raw file**（コピーのアイコン）を押して中身を全部コピーします。
2. Supabase の左メニューから **SQL Editor** を開き、**New query** を押します。
3. コピーした内容を貼り付けて、右下の **Run** を押します。
4. 下に **Success. No rows returned** と出れば完了です。

> 何度実行しても大丈夫です。アプリを更新して `supabase/setup.sql` が新しくなったときも、同じ手順でもう一度実行してください。

### ログイン方法の設定

1. 左メニューの **Authentication** → **Sign In / Providers** で **Email** が有効になっていることを確認します（初期状態で有効です）。
2. 同じ画面の **Confirm email**（登録時の確認メール）について：
   - **オン（おすすめ）**：登録すると確認メールが届き、メール内のリンクを開くとログインできます。
   - **オフ**：登録後すぐにログインできます。まず自分で試したいときはオフでも構いません。

> Supabase の標準のメール送信は、1 時間に送れる数が少なく設定されています。多くの人に登録してもらう前に、**Authentication → Emails → SMTP Settings** で自分のメール送信サービスを設定してください。

### 接続情報を控える

1. 左下の歯車 **Project Settings** → **API Keys**（または **Data API**）を開きます。
2. 次の 2 つをメモ帳などにコピーしておきます。
   - **Project URL**（`https://xxxx.supabase.co` の形）
   - **anon public** キー（または **Publishable key**。`eyJ...` や `sb_publishable_...` で始まる長い文字列）

> ⚠️ **service_role** キーや **Secret key** は絶対に使わないでください。このアプリに必要なのは公開用のキーだけで、データは RLS（アクセスの決まり）で守られています。

## 3. Vercel に公開する

1. https://vercel.com を開き、**Sign Up** から **Continue with GitHub** で登録します（個人利用は **Hobby** プラン）。
2. **Add New… → Project** を押し、一覧から **laughing-octo-journey** の **Import** を押します。
   一覧にない場合は **Adjust GitHub App Permissions** からこのリポジトリへのアクセスを許可します。
3. **Framework Preset** が **Next.js** になっていることを確認します（自動で選ばれます）。
4. **Environment Variables** を開き、次の 3 つを追加します。

   | Key                             | Value                                            |
   | ------------------------------- | ------------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | 手順 2 で控えた Project URL                      |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 手順 2 で控えた anon public（Publishable）キー   |
   | `NEXT_PUBLIC_SITE_URL`          | いったん `https://example.com`（あとで直します） |

5. **Deploy** を押し、2〜3 分待ちます。完了すると `https://〇〇.vercel.app` のような URL が表示されます。これがあなたのサイトの URL です。
6. **Settings → Environment Variables** で `NEXT_PUBLIC_SITE_URL` をこの URL に書き換え、**Deployments** 画面の最新のデプロイの **⋯ → Redeploy** を押します。

> このリポジトリでは、GitHub の初期ブランチが公開用（Production）として使われます。以後、そのブランチに変更が入るたびに Vercel が自動で公開し直します。

## 4. ログインの設定（URL を登録）

確認メールのリンクからサイトに戻れるように、Supabase にサイトの URL を登録します。

1. Supabase の **Authentication → URL Configuration** を開きます。
2. **Site URL** に、手順 3 のサイトの URL（例：`https://my-gallery.vercel.app`）を入れて **Save** します。
3. **Redirect URLs** の **Add URL** で、次の URL を追加して **Save** します。
   `https://my-gallery.vercel.app/auth/callback`
   （`my-gallery.vercel.app` の部分はあなたの URL に置き換えてください。セットアップ確認ページからコピーもできます）

## 5. セットアップ確認ページで最終チェック

ブラウザで **`https://〇〇.vercel.app/setup`** を開きます。
設定を自動で確認して、すべて **✓ OK** なら準備完了です。**✕ 要対応** がある項目には、直し方が表示されます。

そのあと、実際に使って確かめましょう。

1. サイトの **個展を作る** からアカウントを作ります（確認メールをオンにした場合は、メールのリンクを開きます）。
2. 画像を何枚か追加して個展を作り、**公開する** を押します。
3. 表示された共有 URL を、スマホや別のブラウザ（ログインしていない状態）で開き、個展に入れることを確認します。

---

## うまくいかないとき

| 症状                                              | 確認すること                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| サイト上部に「デモモード」と表示される            | Vercel の環境変数が入っていない、または入れたあと再デプロイしていません（手順 3-4, 3-6）                 |
| `/setup` で「データベースのテーブル」が要対応     | `supabase/setup.sql` を実行していません（手順 2）                                                        |
| `/setup` で「作者名／動画／プロフィール」が要対応 | 古い SQL を実行しています。最新の `supabase/setup.sql` をもう一度実行してください                        |
| 確認メールのリンクを開くとエラーになる            | Redirect URLs に `/auth/callback` 付きの URL を登録したか確認します（手順 4）                            |
| 確認メールが届かない                              | 迷惑メールフォルダを確認します。標準のメール送信は数に上限があるので、少し時間をおくか SMTP を設定します |
| 画像や動画をアップロードできない                  | `/setup` の「保存場所（Storage）」を確認します。動画は 50MB まで、画像は 10MB までです                   |
| 友達の端末で個展が開けない                        | 個展が **公開中** になっているか確認します。下書きは本人しか見られません                                 |

## 更新するとき

- アプリの変更が GitHub の公開用ブランチに入ると、Vercel が自動で公開し直します。
- `supabase/migrations/` に新しいファイルが増えたときは、最新の **`supabase/setup.sql`** を SQL Editor でもう一度実行します（何度実行しても安全です）。

## 開発者向けメモ

- `npm run test:db`：ローカルの PostgreSQL（`initdb` / `pg_ctl`）で、全マイグレーションと RLS の 40 項目以上のテストを実行します。本番の Supabase には触れません。
- `npm run db:setup-sql`：`supabase/migrations/*.sql` から `supabase/setup.sql` を作り直します（マイグレーションを追加したら必ず実行）。
