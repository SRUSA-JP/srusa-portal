# srusa-portal

SRUSAの情報をまとめる、MkDocsベースの小さなポータルサイトです。現在は「このサーバーについて」「登山部」「マインクラフト」の入口ページを管理しています。

## 管理対象

このリポジトリでは、次のものを管理します。

- `docs/`配下のMarkdownコンテンツ
- MkDocsの設定と固定したPython依存関係
- ZedとVS Codeで利用できるDev Container
- GitHub Actionsによるビルド、本番公開、Pull Request Preview
- 開発者、運用者、AIエージェント向けのルール

このポータルはMkDocs専用です。React、Node.js、Viteなどを使うアプリケーションや、そのビルド成果物は管理しません。インタラクティブな試験機能は別サービスで運用し、ポータルからは外部リンクで案内します。

## サイト構成

| コンテンツ | ファイル |
| --- | --- |
| このサーバーについて | `docs/index.md` |
| マインクラフト | `docs/マインクラフト/` |
| 登山部 | `docs/登山部/` |

ナビゲーションは`docs/`のディレクトリとMarkdownファイルから自動生成します。個別ページのパスは`mkdocs.yml`へ列挙しません。`docs/index.md`の見出しとディレクトリ名がトップタブの表示名に使われます。

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

## 変更を送る

変更前にIssueで目的を確認し、最新の`main`からIssue番号を含むブランチを作成します。Markdownの書き方、プライバシー、コミット、Pull Requestのルールは[コントリビューションガイド](CONTRIBUTING.md)を参照してください。

Pull Requestでは、必要に応じて`preview`とコメントするとGitHub Pages Previewを公開できます。本番公開、Preview、`pages-content`ブランチ、失敗時の復旧方法は[運用ガイド](OPERATIONS.md)にまとめています。

## 関連ドキュメント

- [コントリビューションガイド](CONTRIBUTING.md): 変更、検証、コミット、Pull Requestのルール
- [運用ガイド](OPERATIONS.md): GitHub Pagesの本番・Preview公開と切り戻し
- [AIエージェント向け作業ガイド](AGENTS.md): AIが変更するときの範囲と禁止事項
- [`mkdocs.yml`](mkdocs.yml): サイト、テーマ、自動ナビゲーションの設定
- [`requirements.txt`](requirements.txt): 固定したPython依存関係

## 管理しないもの

- React、Node.js、Viteなどを使う別アプリケーションのソースとビルド成果物
- Sandbox側のタグ、コンテナイメージ、リリース成果物
- APIキー、token、パスワードなどの認証情報
- 個人用の`.env`、仮想環境、キャッシュ、ログ
- MkDocsが生成する`site/`

`pages-content`だけは公開状態を保持するデプロイ専用ブランチとして、GitHub Actionsが生成物を保存します。このブランチを通常の開発や`main`へのマージには使用しません。
