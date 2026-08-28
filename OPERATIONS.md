# 運用ガイド

この文書は、現在使用しているGitHub Pagesの公開方法と、問題が起きたときの確認・復旧方法をまとめます。

## 現在の公開構成

本番サイトとPull Request Previewは、どちらもGitHub Pagesで公開します。Cloudflare Pagesは導入していません。

| 対象 | 起点 | 保存先 | 公開先 |
| --- | --- | --- | --- |
| 本番サイト | `main`へのpush、または手動実行 | `pages-content`のルート | GitHub PagesのルートURL |
| Pull Request Preview | PRの`preview`コメント、または手動実行 | `pages-content/previews/pr-<PR番号>/` | GitHub Pages配下のPR別URL |

公開処理は次の順序で進みます。

1. 対象のソースを読み取り専用権限でcheckoutする
2. Python 3.11と`requirements.txt`を使い、`mkdocs build --strict`を実行する
3. 生成した`site/`を短期間のGitHub Actions artifactとして受け渡す
4. 公開ジョブが`pages-content`を更新する
5. `pages-content`全体をGitHub Pagesへデプロイする

本番とPreviewは同じ`pages` concurrency groupを使用し、`pages-content`の同時更新を避けます。現在の処理に外部サービスのtokenやRepository secretsは不要です。

## 初回設定

GitHubのリポジトリ画面で、`Settings` → `Pages` → `Build and deployment` → `Source`を開き、`GitHub Actions`を選択します。

ワークフローに必要な権限は各YAMLの`permissions`で宣言しています。権限を追加する変更では、目的に必要な最小範囲になっていることをレビューしてください。

## 本番サイトを公開する

[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)は、`main`へのpushで自動実行されます。手動で再実行する場合は次の手順を使います。

1. GitHubの`Actions`タブで`Deploy MkDocs to GitHub Pages`を開く
2. `Run workflow`を選ぶ
3. 対象ブランチが`main`であることを確認して実行する
4. buildとdeployの両ジョブが成功したことを確認する
5. deployジョブの`github-pages` environmentから公開URLを開く

## Pull Request Previewを公開する

[`.github/workflows/build-pr.yml`](.github/workflows/build-pr.yml)は、同じリポジトリ内のopenなPull Requestを対象にします。forkからのPull Requestには対応していません。

通常は対象Pull Requestの`Conversation`に、次の1行だけをコメントします。

```text
preview
```

`/preview`でも実行できます。コメントから実行できるのは、このリポジトリにwrite、maintain、adminのいずれかの権限を持つユーザーです。

GitHub Actionsから手動実行する場合は次の手順を使います。

1. `Actions`タブで`Publish pull request preview`を開く
2. `Run workflow`を選び、実行対象ブランチを`main`のままにする
3. `pull_request_number`にopenなPull Requestの番号を入力する
4. 実行完了後、PRの`preview/github-pages` checkまたは案内コメントからPreviewを開く

同じPull Requestで再実行してもPreview URLは変わりません。Pull Requestを閉じると、対応するPreviewを`pages-content`から削除し、残りの本番サイトとPreviewを再公開します。

## `pages-content`ブランチ

`pages-content`は、GitHub Pagesへ公開する状態だけを保持するデプロイ専用ブランチです。

- 通常の開発ブランチとして使用しない
- Pull Requestのbaseにしない
- `main`へマージしない
- 通常は手作業で編集せず、GitHub Actionsから更新する
- 本番サイトはルート、Previewは`previews/pr-<PR番号>/`に保存する

ブランチが存在しない初回は、公開ワークフローがorphan branchとして作成します。

## 問題を確認する

GitHubの`Actions`タブで失敗したrunを開き、最初に失敗したstepから確認します。

| 症状 | 主な確認先 | 対応 |
| --- | --- | --- |
| MkDocsのビルド失敗 | `Build site` | エラーになった設定、Markdown、リンクを修正して再実行する |
| artifactの受け渡し失敗 | upload/download artifactのstep | buildが`site/`を生成したか確認し、runを再実行する |
| `pages-content`の更新失敗 | `Prepare Pages content branch`、`Save Pages content` | ブランチの存在、Actionsのcontents権限、同時実行の有無を確認する |
| GitHub Pagesのデプロイ失敗 | configure/upload/deploy Pagesのstep | PagesのSource設定とGitHubの障害情報を確認して再実行する |
| Previewの案内だけ表示されない | status/commentのstep | PR番号、権限、ワークフローrunのURLを確認する |

Previewのビルドまたは公開に失敗した場合は、PRのcheckと案内コメントから失敗したrunを開けます。原因を修正してから、もう一度`preview`とコメントしてください。

## 切り戻す

### 本番サイト

1. 直前に正常だったコミットと、問題を起こした変更を確認する
2. 問題のコミットを打ち消すrevert用Pull Requestを作成する
3. `mkdocs build --strict`と必要なPreview確認を行う
4. `main`へマージし、自動デプロイの完了を確認する

緊急時に既知の正常なGitHub Actions runを再実行することもできますが、原因を追跡できるように`main`の修正を残してください。履歴を書き換えるresetや、`pages-content`の手動上書きを通常の切り戻し方法にはしません。

### Pull Request Preview

変更を修正して`preview`を再実行します。不要になったPreviewはPull Requestを閉じると自動削除されます。削除ジョブが失敗した場合は、失敗したrunをGitHub Actionsから再実行します。

## 公開情報と外部サービス

本番サイトとPull Request Previewは公開URLです。認証情報、個人情報、限定公開情報を含めないでください。写真、地図、位置情報、行動記録は、公開範囲と本人の同意を確認してから追加します。

SRUSA Sandboxは別リポジトリ・別サービスで管理します。このポータルは外部リンクだけを掲載し、Sandboxのソース、タグ、コンテナイメージ、ビルド成果物を取得・保存・デプロイしません。Sandbox側の障害やリリースはSandbox側で対応し、URLが変わった場合だけポータルのリンクを更新します。

Cloudflare Pagesへの移行は未決定です。移行を決めるまでは、Cloudflareのプロジェクト、token、ワークフロー、移行手順をこのリポジトリの現行運用として追加しません。
