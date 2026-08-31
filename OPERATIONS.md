# 運用ガイド

この文書は、Cloudflare PagesでMkDocsサイトを公開し、共有Basic認証を設定・変更・復旧する方法をまとめます。GitHub PagesはIssue #6の移行確認が終わるまで切り戻し先として維持します。

## 公開構成

| 対象 | 起点 | 公開先 | 認証 |
| --- | --- | --- | --- |
| Cloudflare Production | `main`へのpush | `https://srusa-portal.pages.dev/` | Pages Functionsの共有Basic認証 |
| Cloudflare Preview | `main`以外へのpush | ブランチaliasとデプロイ固有URL | Pages Functionsの共有Basic認証 |
| GitHub Pages | 移行完了まで既存Workflowを維持 | `https://srusa-jp.github.io/srusa-portal/` | なし。移行中だけの切り戻し先 |

Cloudflare PagesプロジェクトはGitHubの`SRUSA-JP/srusa-portal`と連携し、Production branchに`main`を使用します。

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

## Previewで切り替えを確認する

Cloudflare AccessからProductionとPreviewを同時に外さず、先にPreviewだけでBasic認証を確認します。

1. `issue/6`へ実装をpushし、Cloudflare PagesのPreviewデプロイ成功を確認する
2. Preview用Secretが設定された状態で、新しいデプロイを実行する
3. Zero Trustの`Access controls` → `Applications`から`srusa-portal - Cloudflare Pages`を開く
4. Destinationの`*.srusa-portal.pages.dev`だけを外し、Productionの`srusa-portal.pages.dev`は残して保存する
5. シークレットウィンドウでブランチalias URLを開き、ブラウザのBasic認証ダイアログが出ることを確認する
6. 誤った資格情報では表示できず、正しい資格情報で表示できることを確認する
7. `/登山部/`、`/search/search_index.json`、CSSなどの静的asset、`/mountaineering/`も直接開いて同じ認証が必要なことを確認する

想定するHTTP応答は次のとおりです。

| 条件 | 応答 |
| --- | --- |
| Secret未設定 | `503` |
| Authorizationなし | `401`と`WWW-Authenticate: Basic` |
| 誤った資格情報 | `401` |
| 正しい資格情報 | 元の静的コンテンツの応答 |

## Productionへ切り替える

1. Previewの確認結果をPull RequestとIssue #6へ記録する
2. Production用Secretを登録済みであることを確認する
3. Pull Requestを`main`へマージする
4. Cloudflare PagesのProductionデプロイが成功したことを確認する
5. Cloudflare Accessでログインした状態からProduction URLを開き、その先でBasic認証が動作することを確認する
6. Basic認証の正常系と異常系を確認した後、`srusa-portal - Cloudflare Pages`のAccess Applicationを削除する
7. シークレットウィンドウからProductionとPreviewを再確認し、Cloudflare AccessではなくBasic認証だけが表示されることを確認する

Access Applicationを削除する前に、ProductionとPreviewのSecret、デプロイ、Basic認証を必ず確認します。削除後に問題が起きた場合は、同じhostnameをDestinationに持つAccess ApplicationとAllow Policyを再作成します。

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

### GitHub Pagesを停止する前

1. GitHub Pagesの公開URLが表示できることを確認する
2. Cloudflare Access ApplicationへProductionとPreviewのDestinationを戻す
3. Basic認証の実装またはSecretを修正し、Previewから再確認する

GitHub Pagesは一般公開のため、切り戻し中も限定公開情報を載せません。

### GitHub Pagesを停止した後

1. Cloudflare Pagesの直前に正常だったデプロイを確認する
2. 問題を起こしたコミットをrevertするPull Requestを作る
3. 必要ならAccess Applicationを再作成し、Basic認証修正中の保護に使う
4. `main`へマージし、Productionデプロイを確認する

## GitHub Pagesを停止する

この作業はCloudflare ProductionとPreviewのBasic認証、主要URL、復旧手順を確認した後に行います。

1. `.github/workflows/deploy-pages.yml`と`.github/workflows/build-pr.yml`を削除するPull Requestを作成する
2. GitHubの`Settings` → `Pages`で公開を停止する
3. `https://srusa-jp.github.io/srusa-portal/`からコンテンツを取得できないことを確認する
4. `pages-content`ブランチが不要であることを確認して削除する
5. README、OPERATIONS、AGENTSから移行中の記述を削除する
6. Issue #6と親Issue #1へ停止結果とCloudflareへの切り戻し方法を記録する

GitHub Pagesの停止と`pages-content`ブランチ削除は復旧経路を減らすため、Cloudflare側の確認前には行いません。

## 公開情報と外部サービス

Basic認証は暫定的な閲覧制限であり、リポジトリのソース自体は公開されています。認証情報、個人情報、公開について同意を確認していない写真・位置情報・行動記録をコミットしません。

SRUSA Sandboxは別リポジトリ・別サービスで管理します。このポータルは外部リンクだけを掲載し、Sandboxのソース、タグ、コンテナイメージ、ビルド成果物を取得・保存・デプロイしません。
