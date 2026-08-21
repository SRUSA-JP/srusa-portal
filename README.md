# srusa-portal

SRUSA の情報をまとめる、MkDocs ベースのポータルサイト用リポジトリです。

現在は「ホーム」と「登山部」の入口ページを持つ、最小構成のサイトです。

## 合意済みの内容

- 静的サイトジェネレーターには MkDocs を使用する
- 最初のトップレベルナビゲーションとして、次のタブを用意する
  - ホーム
  - 登山部
- MkDocs の実装より先に、README とエージェント向け作業方針を整備する
- テーマには Material for MkDocs を使用する
- コンテンツは `docs/` 配下、登山部のページは `docs/mountaineering/` 配下に置く
- Python 依存関係は `requirements.txt` でバージョンを固定する
- 現在の本番サイトと Pull Request Preview は GitHub Pages へデプロイする
- Cloudflare Pages への移行はまだ実施せず、現在の CI/CD からは使用しない

## 未決事項

次の内容はまだ確定していません。実装時に候補と影響を整理して決めます。

- 各タブに掲載する具体的な情報
- サイト固有の色、ロゴなどのデザイン
- 公開URLと独自ドメインの有無

## 現在の管理対象

- [README.md](README.md): リポジトリの目的、合意事項、未決事項
- [AGENTS.md](AGENTS.md): AI エージェントを含む作業者向けのリポジトリ固有ルール
- [.gitignore](.gitignore): ローカル環境、生成物、秘密情報の除外設定
- [mkdocs.yml](mkdocs.yml): サイト名、テーマ、ナビゲーションなどの MkDocs 設定
- [requirements.txt](requirements.txt): Python 依存関係と固定バージョン
- [.python-version](.python-version): ローカルと GitHub Actions で使用する Python のバージョン
- [docs/](docs/): サイトの Markdown コンテンツ
- [.devcontainer/](.devcontainer/): Zed や VS Code から利用できる Dev Container 開発環境
- [.github/workflows/build-pr.yml](.github/workflows/build-pr.yml): Pull Request の手動ビルドと Preview 公開設定
- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml): GitHub Pages へのビルド・デプロイ設定

## 開発環境

### Dev Container を使用する場合（推奨）

Dockerと、Dev Containerに対応したエディターを用意します。

- Zed: リポジトリを開いたときに表示される `Open in Container` を選択します。表示されない場合は、コマンドパレットの `Project: Open Remote` から Dev Container を選択します。
- VS Code: Dev Containers 拡張機能を導入し、コマンドパレットから `Dev Containers: Reopen in Container` を実行します。

コンテナ作成後、`requirements.txt` の依存関係が自動的にインストールされます。コンテナ内のターミナルでローカルプレビューを起動します。

```shell
mkdocs serve --dev-addr=0.0.0.0:8000
```

エディターに表示される転送済みポートの案内から、ブラウザでサイトを確認できます。

### ホスト環境を使用する場合

Python 3.8 以上と、Python の `venv` モジュールが必要です。Debian/Ubuntu で `venv` がない場合は、使用する Python バージョンに対応した `python3-venv` パッケージを先に導入してください。

仮想環境を作成し、依存関係をインストールします。

```shell
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

仮想環境内でローカルプレビューを起動します。

```shell
mkdocs serve
```

表示された URL（通常は <http://127.0.0.1:8000/>）をブラウザで開きます。

### ビルド

公開用ファイルを `site/` に生成し、設定やリンクを検証します。

```shell
mkdocs build --strict
```

## Pull Request のビルド確認

Pull Request の内容は、PR にコマンドをコメントするか GitHub Actions から手動でビルドし、GitHub Pages の Preview URL で確認できます。成果物をダウンロードしてローカルサーバーを起動する必要はありません。

通常は、対象 Pull Request の `Conversation` で次の1行をコメントします。

```text
preview
```

`/preview` でも実行できます。コメントからの公開を開始できるのは、このリポジトリへの書き込み権限を持つユーザーだけです。

GitHub Actions の画面から実行する場合は、次の手順を使用します。

1. GitHub の `Actions` タブで `Publish pull request preview` を開く
2. `Run workflow` を選び、実行対象のブランチは `main` のままにする
3. `pull_request_number` に確認したい Pull Request の番号を入力して実行する

どちらの方法でも、完了後に対象 Pull Request の `Checks` に表示される `preview/github-pages` の `Details` から結果を開けます。案内コメントと Workflow の Summary にも Preview URL を表示します。同じ Pull Request で再実行しても Preview URL は変わりません。fork から作成された Pull Request は対象外です。

このワークフローは、書き込み権限を持たないジョブで Pull Request の内容をビルドした後、別のジョブで `pages-content` ブランチの `previews/pr-<PR番号>/` を更新し、ブランチ全体を GitHub Pages へデプロイします。外部サービスの token や Repository secrets は使用しません。

`pages-content` は本番サイトと複数の Preview を共存させるためのデプロイ状態専用ブランチです。生成物を保持しますが、`main` へマージしません。本番と Preview のデプロイは同時に実行せず、同じキューで順番に処理します。

Preview URL は公開されます。認証情報、個人情報、非公開情報を含む変更には使用しないでください。Pull Request を閉じると、対応する Preview を `pages-content` から削除してGitHub Pagesを再公開します。

## Cloudflare Pages への移行（未実施）

Cloudflare Pages への移行はまだ実施していません。現在の本番デプロイと Pull Request Preview はどちらも GitHub Pages を使用し、Cloudflare の API token や設定には依存しません。以下は将来移行するときの検討用手順です。

### 初回設定

Cloudflare ダッシュボードの `Workers & Pages` から Pages アプリケーションを作成し、GitHub 上のこのリポジトリを接続します。GitHub へのアクセス権は、可能であればこのリポジトリだけに限定します。

ビルド設定には次の値を指定します。

| 項目 | 設定値 |
| --- | --- |
| Project name | `srusa-portal` |
| Production branch | `main` |
| Framework preset | なし |
| Build command | `python -m pip install -r requirements.txt && mkdocs build --strict` |
| Build output directory | `site` |
| Root directory | 空欄（リポジトリのルート） |

Python のバージョンは、リポジトリ直下の `.python-version` により `3.11` に固定されます。現在のビルドには環境変数や Secret は不要です。

`Save and Deploy` を実行すると、最初のデプロイ後に `https://srusa-portal.pages.dev/` 形式のURLが発行されます。実際のURLは、Cloudflare Pages のデプロイ画面で確認してください。

### 公開後の確認

次を確認してから、Cloudflare Pages を正式な公開先として扱います。

1. ホームと登山部のページが表示される
2. 活動記録ページへ移動できる
3. ヤマレコの埋め込み地図が表示される
4. GitHub の別ブランチまたは Pull Request からプレビューが作成される
5. Cloudflare のビルドログで `mkdocs build --strict` が成功している

Cloudflare Pages のプレビューURLは初期状態では公開されます。将来 Cloudflare Access を導入する場合は、本番URLだけでなくプレビューURLの公開範囲も設定します。

### 切り戻し

Cloudflare Pages のデプロイに問題がある場合は、`Deployments` から直前の正常な本番デプロイへロールバックします。Cloudflare側の確認が完了するまでは、既存のGitHub Pagesを停止しません。

## GitHub Pages へのデプロイ

初回のみ、GitHub のリポジトリ画面で `Settings` → `Pages` → `Build and deployment` → `Source` を開き、`GitHub Actions` を選択します。

以後は `main` ブランチへの push で、次の処理が自動実行されます。

1. Python 3.11 と `requirements.txt` を使って環境を構築する
2. `mkdocs build --strict` でサイトを生成する
3. `pages-content` ブランチの本番部分を更新し、`previews/` は保持する
4. 本番サイトと Preview をまとめて GitHub Pages へデプロイする

GitHub の `Actions` タブから手動実行することもできます。公開URLはデプロイジョブの `github-pages` environment に表示されます。

公開後に問題が見つかった場合は、正常だった状態へ戻すコミットを `main` に反映し、ワークフローを再実行します。Pull Request Preview に問題がある場合は、対象の変更を修正して `preview` を再実行します。

## 実装順の提案

1. 「ホーム」と「登山部」に掲載する内容を決める
2. サイト固有の色やロゴなどのデザインを決める
3. コンテンツを追加し、ローカルビルドで確認する
4. 公開URLと独自ドメインの有無を決める

この順序は提案であり、未決事項の合意に応じて更新します。

## 管理しないもの

- API キー、トークン、パスワードなどの認証情報
- `.env` などのローカル専用設定（共有用のサンプルを除く）
- Python の仮想環境、キャッシュ、ログ
- MkDocs が生成する `site/`

`pages-content` ブランチだけはGitHub Pagesの公開状態を保持するため、CIが生成物をコミットします。このブランチを通常の開発や `main` へのマージには使用しません。
