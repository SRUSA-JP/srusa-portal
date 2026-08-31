# srusa-portal

SRUSAの情報をまとめる、MkDocsベースの小さなポータルサイトです。現在は「ホーム」「登山部」「マインクラフト」「このサーバーについて」の入口ページを管理しています。

## 管理対象

このリポジトリでは、次のものを管理します。

- `docs/`配下のMarkdownコンテンツ
- MkDocsの設定と固定したPython依存関係
- Cloudflare Pagesで共有Basic認証を行う小さなPages Functionsミドルウェア
- ZedとVS Codeで利用できるDev Container
- Cloudflare PagesのGit連携によるビルド、本番公開、ブランチPreview
- 開発者、運用者、AIエージェント向けのルール

このポータルのコンテンツ生成はMkDocs専用です。React、Node.js、Viteなどを使うアプリケーションや、そのビルド成果物は管理しません。`functions/_middleware.js`はCloudflare Pagesの公開経路をBasic認証で保護するためだけに使用します。インタラクティブな試験機能は別サービスで運用し、ポータルからは外部リンクで案内します。

## サイト構成

| コンテンツ | ファイル |
| --- | --- |
| ホーム | `docs/index.md` |
| 登山部 | `docs/登山部/` |
| マインクラフト | `docs/マインクラフト/` |
| このサーバーについて | `docs/このサーバーについて/` |

ナビゲーションは`docs/`のディレクトリとMarkdownファイルから自動生成します。個別ページのパスは`mkdocs.yml`へ列挙しません。`docs/index.md`の見出しとディレクトリ名がトップタブの表示名に使われ、表示順はファイル構成により決まり固定しません。

以前の`/mountaineering/`と活動記録URLには、`docs/mountaineering/`配下の静的HTMLで新しい日本語URLへのリダイレクトを提供します。このディレクトリにはMarkdownを追加しません。

Basic認証のJavaScriptは、次の責務に分けます。

| パス | 責務 |
| --- | --- |
| `functions/_middleware.js` | Cloudflare Pagesが要求する外側のアダプター |
| `src/authentication/createBasicAuthentication.js` | Cloudflareに依存しない共有Basic認証 |
| `src/authentication/createBasicAuthentication.test.js` | 認証オブジェクトと同居する単体テスト |
| `tests/functions/onRequest.test.js` | Cloudflareアダプターとの接続テスト |

`functions/`はCloudflare Pagesプロジェクトのルートに置く必要があり、配下のJavaScriptはデプロイ対象になるため、テストを置きません。アプリケーションロジックを`src/`へ分離して単体テストを同居させ、Cloudflareアダプターのテストは実装構成を反映した`tests/functions/`へ置きます。

`docs/`直下へのページやディレクトリの追加、サイト固有のデザイン、公開URLや独自ドメインは未決事項です。変更する場合は、実装前にIssueで影響を確認します。

## 開発環境

Pythonのバージョンは`.python-version`で3.11に固定しています。Dev ContainerとGitHub Actionsも同じバージョンを使用します。

### Dev Containerを使用する（推奨）

Dockerと、Dev Containerに対応したエディターを用意します。

最初にターミナルで`docker version`を実行し、ClientとServerの両方が表示されることを確認します。Serverへの接続エラーが表示された場合は、Docker DesktopまたはDocker daemonを起動してからやり直してください。

- Zed: リポジトリを開いたときに表示される`Open in Container`を選びます。表示されない場合は、コマンドパレットの`Project: Open Remote`からDev Containerを選びます。
- VS Code: Dev Containers拡張機能を導入し、コマンドパレットから`Dev Containers: Reopen in Container`を実行します。

コンテナ作成時に`requirements.txt`の依存関係が自動的にインストールされます。コンテナ内のターミナルでプレビューを起動してください。

```shell
mkdocs serve --dev-addr=0.0.0.0:8000
```

エディターに表示される転送済みポートの案内から、ブラウザでサイトを開きます。

### ホスト環境を使用する

Python 3.11と`venv`モジュールを用意し、リポジトリのルートで次を実行します。

```shell
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

DebianやUbuntuで`venv`を利用できない場合は、Python 3.11に対応した`python3-venv`パッケージを先に導入してください。

## 基本コマンド

ローカルプレビューを起動します。

```shell
mkdocs serve
```

表示されたURL（通常は<http://127.0.0.1:8000/>）をブラウザで開きます。

公開用ファイルを生成し、設定と内部リンクを厳密に検証します。

```shell
mkdocs build --strict
```

生成される`site/`はコミットしません。

Node.js 20以降を利用できる環境では、Pages FunctionsのBasic認証をテストできます。`package.json`はES Modules形式とテストコマンドを定義するために使用し、外部パッケージは使用しません。

```shell
npm test
```

## 公開先と認証

Cloudflare Pagesの本番候補URLは<https://srusa-portal.pages.dev/>です。`main`以外のブランチをpushすると、Cloudflare PagesがブランチごとのPreview URLを作成します。

サイト全体に共有Basic認証を適用します。ユーザー名とパスワードはCloudflare PagesのProductionとPreviewへ暗号化Secretとして登録し、リポジトリには保存しません。設定名と切り替え手順は[運用ガイド](OPERATIONS.md)を参照してください。

GitHub PagesはCloudflare Pagesへの移行確認中だけ切り戻し先として維持し、Issue #6の完了確認後に停止します。Basic認証の資格情報を知っている利用者を個別に識別・失効することはできないため、正式なDiscord認証・認可は後続MVPで扱います。

## 変更を送る

変更前にIssueで目的を確認し、最新の`main`からIssue番号を含むブランチを作成します。Markdownの書き方、プライバシー、コミット、Pull Requestのルールは[コントリビューションガイド](CONTRIBUTING.md)を参照してください。

作業ブランチをpushするとCloudflare Pages Previewが自動で作成されます。移行中のGitHub Pages、Cloudflare Pagesの本番・Preview、Basic認証、失敗時の復旧方法は[運用ガイド](OPERATIONS.md)にまとめています。

## 関連ドキュメント

- [コントリビューションガイド](CONTRIBUTING.md): 変更、検証、コミット、Pull Requestのルール
- [運用ガイド](OPERATIONS.md): Cloudflare Pages、Basic認証、移行中のGitHub Pagesと切り戻し
- [AIエージェント向け作業ガイド](AGENTS.md): AIが変更するときの範囲と禁止事項
- [`mkdocs.yml`](mkdocs.yml): サイト、テーマ、自動ナビゲーションの設定
- [`requirements.txt`](requirements.txt): 固定したPython依存関係

## 管理しないもの

- React、Node.js、Viteなどを使う別アプリケーションのソースとビルド成果物
- Sandbox側のタグ、コンテナイメージ、リリース成果物
- APIキー、token、パスワードなどの認証情報
- Pages Functions用の`.dev.vars`と、Cloudflareへ登録したSecretの値
- 個人用の`.env`、仮想環境、キャッシュ、ログ
- MkDocsが生成する`site/`

`pages-content`はGitHub Pagesを切り戻し先として維持している間だけ残すデプロイ専用ブランチです。通常の開発や`main`へのマージには使用せず、Cloudflare Pagesの移行確認後にGitHub Pagesとともに廃止します。
