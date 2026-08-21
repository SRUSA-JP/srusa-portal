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
- Cloudflare Pages の GitHub 連携を使い、`main` ブランチの内容を自動でビルド・公開する
- Cloudflare Pages での公開確認が完了するまでは、既存の GitHub Pages も維持する

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
- [.python-version](.python-version): ローカル、GitHub Actions、Cloudflare Pages で使用する Python のバージョン
- [docs/](docs/): サイトの Markdown コンテンツ
- [.devcontainer/](.devcontainer/): Zed や VS Code から利用できる Dev Container 開発環境
- [.github/workflows/build-pr.yml](.github/workflows/build-pr.yml): Pull Request のビルドと成果物の保存設定
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

Pull Request の作成時と更新時には、GitHub Actions で `mkdocs build --strict` を実行します。ビルドに成功すると、生成した `site/` が `mkdocs-site-pr-<PR番号>` という名前の artifact として7日間保存されます。

artifact は、対象ワークフロー実行の Summary に表示されるリンク、または画面下部の `Artifacts` からダウンロードできます。展開したディレクトリで次のコマンドを実行すると、ブラウザで成果物を確認できます。

```shell
python -m http.server 8000
```

この PR 用ワークフローはビルドと artifact の保存だけを行い、GitHub Pages へのデプロイは行いません。`main` ブランチへの push で動く既存の GitHub Pages デプロイとは、トリガー、権限、concurrency を分離しています。

## Cloudflare Pages へのデプロイ

Cloudflare Pages と GitHub を連携し、`main` ブランチへの push を自動でビルド・公開します。Cloudflare の API トークンは使用しないため、リポジトリや GitHub Actions に Cloudflare の認証情報を保存する必要はありません。

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

## 既存の GitHub Pages へのデプロイ

初回のみ、GitHub のリポジトリ画面で `Settings` → `Pages` → `Build and deployment` → `Source` を開き、`GitHub Actions` を選択します。

以後は `main` ブランチへの push で、次の処理が自動実行されます。

1. Python 3.11 と `requirements.txt` を使って環境を構築する
2. `mkdocs build --strict` でサイトを生成する
3. 生成した `site/` を GitHub Pages へデプロイする

GitHub の `Actions` タブから手動実行することもできます。公開URLはデプロイジョブの `github-pages` environment に表示されます。

公開後に問題が見つかった場合は、正常だった状態へ戻すコミットを `main` に反映し、ワークフローを再実行します。Cloudflare Pages の公開確認後に GitHub Pages を停止する場合は、このワークフローの削除を別の変更として実施します。

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
