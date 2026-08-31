# 運用ガイド

この文書は、Cloudflare PagesでMkDocsサイトを公開し、共有Basic認証を設定・変更・復旧する方法をまとめます。

## 公開構成

| 対象 | 起点 | 公開先 | 認証 |
| --- | --- | --- | --- |
| Cloudflare Production | `main`へのpush | `https://srusa-portal.pages.dev/` | Pages Functionsの共有Basic認証 |
| Cloudflare Preview | `main`以外へのpush | ブランチaliasとデプロイ固有URL | Pages Functionsの共有Basic認証 |

Cloudflare PagesプロジェクトはGitHubの`SRUSA-JP/srusa-portal`と連携し、Production branchに`main`を使用します。

GitHub PagesとGitHub Actionsによるデプロイは使用しません。`main`へのマージまたはpushでProductionが、`main`以外へのpushでPreviewがCloudflare Pagesから自動デプロイされます。

| 設定 | 値 |
| --- | --- |
| Project name | `srusa-portal` |
| Build command | `npm test && python -m pip install -r requirements.txt && mkdocs build --strict` |
| Build output directory | `site` |
| Root directory | リポジトリルート |
| Python | `.python-version`の3.11 |

## Basic認証の仕組み

`functions/_middleware.js`はすべてのリクエストより前に実行されます。

1. Cloudflareの暗号化Secretからユーザー名とパスワードを取得する
2. Secretが未設定なら`503 Service Unavailable`を返し、コンテンツを公開しない
3. Authorizationヘッダーがない、壊れている、または資格情報が違う場合は`401 Unauthorized`を返す
4. 正しい場合だけMkDocsの静的ファイルへ処理を渡す
5. 認証後のレスポンスへ`Cache-Control: private, no-store`と`Vary: Authorization`を付ける

Basic認証は共有資格情報を知る人を同じ利用者として扱います。利用者ごとの失効、所属確認、ロール確認、詳細な監査には使用できません。Discordによる正式な認証・認可は後続MVPで扱います。

Pages FunctionsのリクエストはWorkers Freeプランの上限へ算入されます。認証に必要なFunctionsが実行できない場合に静的ファイルを公開しないよう、Pagesプロジェクトの`Settings` → `Runtime` → `Fail open/closed`は`Fail closed`にします。

## Secretを登録する

Secretの値をIssue、Pull Request、コミット、ログへ書かないでください。チャットで共有せず、Cloudflare Dashboardへ直接入力します。

1. Cloudflare Dashboardの`Workers & Pages`を開く
2. `srusa-portal`を開く
3. `Settings` → `Variables and Secrets`を開く
4. Preview環境へ次の2つを追加し、それぞれ`Encrypt`を選ぶ
   - `BASIC_AUTH_USERNAME`
   - `BASIC_AUTH_PASSWORD`
5. Production環境にも同じ名前の2つを追加し、それぞれ`Encrypt`を選ぶ
6. 保存後、新しいデプロイを実行する。Secret登録前のデプロイには新しいSecretが反映されない

ユーザー名にはコロンを使用しません。パスワードは十分に長いランダムな値にし、他サービスと共用しません。共有先から外す人が出た場合や漏えいが疑われる場合は、パスワードを変更して再デプロイします。

## Previewを確認する

1. 作業ブランチをpushし、Cloudflare PagesのPreviewデプロイ成功を確認する
2. Preview用Secretが設定された状態で、新しいデプロイを実行する
3. シークレットウィンドウでブランチalias URLを開き、ブラウザのBasic認証ダイアログが出ることを確認する
4. 誤った資格情報では表示できず、正しい資格情報で表示できることを確認する
5. `/登山部/`、`/search/search_index.json`、CSSなどの静的asset、`/mountaineering/`も直接開いて同じ認証が必要なことを確認する

想定するHTTP応答は次のとおりです。

| 条件 | 応答 |
| --- | --- |
| Secret未設定 | `503` |
| Authorizationなし | `401`と`WWW-Authenticate: Basic` |
| 誤った資格情報 | `401` |
| 正しい資格情報 | 元の静的コンテンツの応答 |

## Productionへ切り替える

1. Previewの確認結果をPull RequestとIssueへ記録する
2. Production用Secretを登録済みであることを確認する
3. Pull Requestを`main`へマージする
4. Cloudflare PagesのProductionデプロイが成功したことを確認する
5. シークレットウィンドウでProduction URLを開き、Basic認証の正常系と異常系を確認する

## 手動で再デプロイする

通常はGitへのpushだけでデプロイされるため、手動操作は不要です。同じコミットをもう一度ビルドしたい場合だけ、Cloudflare Dashboardの`Workers & Pages` → `srusa-portal` → `Deployments`から対象のデプロイを開き、`Retry deployment`を実行します。

GitHub上の任意のボタンから再デプロイする仕組みは、Deploy HookまたはCloudflare API tokenをGitHub ActionsのSecretに登録すれば作れます。ただし新たなSecretと権限管理が必要になるため、必要性をIssueで確認してから追加します。

## 資格情報を変更する

1. PreviewとProductionの`BASIC_AUTH_PASSWORD`を新しい値へ更新する
2. Previewを再デプロイし、新旧パスワードの挙動を確認する
3. Productionを再デプロイする
4. Productionで新しいパスワードだけが使えることを確認する
5. 新しいパスワードを許可する利用者だけに安全な経路で共有する

ユーザー名も同様に変更できます。ブラウザが古い資格情報を保持している場合は、シークレットウィンドウを使うかブラウザを完全に終了して確認します。

## 問題を確認する

| 症状 | 主な確認先 | 対応 |
| --- | --- | --- |
| `503`になる | Preview／ProductionのSecret | 2つのSecretを対象環境へ登録し、新しいデプロイを実行する |
| Basic認証が出ずAccess画面になる | Zero Trust Access Application | 対象hostnameがまだAccessのDestinationに残っていないか確認する |
| 正しい資格情報でも`401`になる | Secret名、対象環境、ブラウザの保存値 | Secret名を一致させ、再デプロイ後にシークレットウィンドウで確認する |
| Functionsの上限到達時に公開される | PagesのRuntime設定 | `Fail closed`へ変更する |
| MkDocsのビルドに失敗する | Cloudflare Deploymentsのbuild log | Basic認証テスト、依存関係のinstall、`mkdocs build --strict`の順に最初の失敗を直す |

## 切り戻す

1. Cloudflare Pagesの直前に正常だったデプロイを確認する
2. 問題を起こしたコミットをrevertするPull Requestを作る
3. PreviewでBasic認証と主要URLを確認する
4. `main`へマージし、Productionデプロイを確認する

GitHub Pagesは切り戻し先として使用しません。Cloudflare側の設定変更が原因の場合は、変更前の設定へ戻し、必要ならCloudflareのデプロイを再試行します。

## 以前のGitHub Pagesを停止する

GitHub Pagesを以前利用していた場合は、GitHubの`Settings` → `Pages`で公開を停止します。停止後、以前の公開URLへアクセスできないことを確認してから、不要な`pages-content`ブランチを削除します。

## 公開情報と外部サービス

Basic認証は暫定的な閲覧制限であり、リポジトリのソース自体は公開されています。認証情報、個人情報、公開について同意を確認していない写真・位置情報・行動記録をコミットしません。

SRUSA Sandboxは別リポジトリ・別サービスで管理します。このポータルは外部リンクだけを掲載し、Sandboxのソース、タグ、コンテナイメージ、ビルド成果物を取得・保存・デプロイしません。
