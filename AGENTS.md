# srusa-portal AIエージェント作業ガイド

この文書は、AIエージェントがこのリポジトリを変更するときの固有ルールです。人を含む共通の変更手順は[CONTRIBUTING.md](CONTRIBUTING.md)、公開・復旧手順は[OPERATIONS.md](OPERATIONS.md)を参照してください。

## 作業を始める前に

1. `README.md`、`CONTRIBUTING.md`、`OPERATIONS.md`を読む
2. 対象Issueと現在のブランチを確認する
3. `mkdocs.yml`、実際のファイル構成、現在の差分を確認する
4. 合意済みの内容、提案、未決事項を区別する

他リポジトリは参考情報としてだけ扱い、その構成、命名、依存関係、公開方法をこのリポジトリの規約として流用しないでください。

## 変更できる範囲

このリポジトリのコンテンツ生成はMkDocs専用です。主な変更対象は、Markdownコンテンツ、MkDocs設定、Python依存関係、Cloudflare Pagesの認証ミドルウェア、Dev Container、公開設定、開発・運用ドキュメントです。

次のものは追加しないでください。

- React、Node.js、Viteなどを使うアプリケーション
- Basic認証以外の動的機能を担うPages FunctionsやWorker
- Sandboxのソースコード、タグ、コンテナイメージ、ビルド成果物
- 生成された`site/`
- token、secret、credential、private key、個人用`.env`、セッション、ログ

Sandboxは独立した外部サービスとして扱い、このポータルには外部リンクだけを掲載します。Sandbox側の変更やリリースを、このリポジトリの作業として推測・実行しないでください。

## 維持する仕様

- 静的サイトジェネレーターはMkDocs、テーマはMaterial for MkDocsを使用する
- コンテンツは`docs/`、登山部は`docs/登山部/`、マインクラフトは`docs/マインクラフト/`、団体に関する入口は`docs/このサーバーについて/`で管理する
- トップタブには「ホーム」「登山部」「マインクラフト」「このサーバーについて」を含める。表示順は`docs/`のファイル構成で決まり、固定しない
- `docs/mountaineering/`は旧URLを新しい日本語URLへ転送する静的HTMLだけを置く互換用ディレクトリとし、Markdownを追加しない
- `mkdocs.yml`に`nav`を定義せず、ナビゲーションは`docs/`の構成から自動生成する
- `navigation.indexes`を有効にし、各ディレクトリの`index.md`をセクションの入口として扱う
- Python依存関係は`requirements.txt`で固定し、Python 3.11を使用する
- Dev ContainerはZedとVS Codeのどちらでも利用できる状態を維持する
- 本番サイトとブランチPreviewはCloudflare Pagesで公開する
- `functions/_middleware.js`で全公開経路へ共有Basic認証を適用する
- Basic認証のユーザー名とパスワードはCloudflareの暗号化Secretだけに保存し、コード、Issue、ログへ記載しない
- Secretがない場合と認証処理に失敗した場合はfail-closedとし、静的コンテンツを公開しない
- GitHub Pagesと`pages-content`はIssue #6の移行確認中だけ切り戻し先として維持し、確認後に廃止する

`docs/`直下へのページやディレクトリの追加、依存関係、公開先を追加する場合は、未決事項としてナビゲーション、URL、運用への影響を提示し、ユーザーの合意を得てから変更してください。表示名や並び順を固定する目的で`nav`を再追加しないでください。

## コンテンツ作成時の制約

- 団体、活動、日程、場所、連絡先、登山ルート、安全情報などの事実を推測で補わない
- 不明な情報はユーザーに確認するか、TODOであることを明示する
- 天候、交通、施設情報など、日時で変わる情報を固定的な事実として記載しない
- 写真、地図、行動記録では、個人情報、位置情報、公開範囲を確認する
- Previewも公開URLであることを前提に、限定公開情報を含めない
- ファイルパス、ナビゲーション、リンクの大文字・小文字を一致させる

## 作業の進め方

- 目的に必要な範囲で、小さくレビューしやすい変更を作る
- 実行可能な手順を変更したら、READMEと関連ガイドも更新する
- 公開設定を変更する場合は、権限、秘密情報、公開先、失敗時の復旧方法を確認する
- Issueのcloseやreopen、Pull Requestのcloseなどの状態変更は、ユーザーから明示的な指示がある場合だけ行う
- ユーザー向けの文章とコミットメッセージは、特に指定がなければ日本語にする

コミットメッセージは`[prefix]要約`形式とし、`[add]`、`[update]`、`[remove]`、`[clean]`から主目的に合うものを使用します。

## 変更後の確認

最低限、次を実行します。

```shell
mkdocs build --strict
git diff --check
```

`functions/_middleware.js`を変更した場合は、Node.js 20以降で次も実行します。

```shell
node --test tests/basic-auth.test.mjs
```

さらに、READMEと実際の構成・コマンド、Markdownリンクとナビゲーション、秘密情報や不要な生成物の混入を確認してください。実行できなかった確認は、理由と影響をPull Requestに記載します。
