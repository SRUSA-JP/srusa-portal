/**
 * スキンの定義（src/config/skins.ts）から、ポータル側の CSS を作る。
 *
 * アプリ（iframe の中）とページ（MkDocs のヘッダー・本文）で同じ見た目に
 * したいが、両者は別のビルドなので、そのままだと書体や色を 2 か所に
 * 書くことになる。それを避けるため、CSS はここで機械的に作る。
 *
 * 出力先の docs/stylesheets/skins.css は生成物なので直接編集しない。
 * 見た目を変えるときは src/config/skins.ts を編集して `npm run build:skins`。
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_SKIN, SKINS, type Skin } from '../src/config/skins';

/* npm script として viewer/ から実行される前提のパス */
const OUTPUT = resolve(process.cwd(), '../docs/stylesheets/skins.css');

/** ページ側に反映するものを持つスキンだけを対象にする。 */
function isPageSkin(skin: Skin): boolean {
  return skin.id !== DEFAULT_SKIN.id;
}

function selector(skin: Skin, scheme?: 'default' | 'slate'): string {
  const page = `[data-portal-skin='${skin.id}']`;
  return scheme ? `${page}[data-md-color-scheme='${scheme}']` : page;
}

function block(selectorText: string, declarations: string[]): string {
  if (declarations.length === 0) return '';
  return `${selectorText} {\n${declarations.map((line) => `  ${line}`).join('\n')}\n}\n\n`;
}

function scheme(skin: Skin, mode: 'light' | 'dark'): string {
  const accent = skin.accent?.[mode];
  const background = skin.background?.[mode];
  return block(selector(skin, mode === 'light' ? 'default' : 'slate'), [
    ...(accent ? [`--portal-header: ${accent};`, `--portal-link: ${accent};`, `--portal-accent: ${accent};`] : []),
    ...(background ? [`--portal-page-background: ${background};`] : []),
  ]);
}

/* 書体の読み込みは CSS の先頭でなければ効かないので、まとめて先に出す */
const imports = [
  ...new Set(SKINS.filter(isPageSkin).map((skin) => skin.font.url).filter(Boolean)),
]
  .map((url) => `@import url('${url}');\n`)
  .join('');

const rules = SKINS.filter(isPageSkin)
  .map((skin) =>
    [
      `/* ${skin.label}: ${skin.description} */\n`,
      block(selector(skin), [`--md-text-font-family: ${skin.font.family};`]),
      skin.crispEdges
        ? block(`${selector(skin)} img`, ['image-rendering: pixelated;'])
        : '',
      scheme(skin, 'light'),
      scheme(skin, 'dark'),
    ].join(''),
  )
  .join('');

const css = `/**
 * ページ単位の見た目（スキン）。
 *
 * このファイルは viewer/src/config/skins.ts から作られる生成物です。
 * 直接編集せず、\`npm run build:skins\` で作り直してください。
 *
 * ここで決めた変数は docs/stylesheets/portal.css が Material のテーマ変数へ
 * 流し込みます。どのページがどのスキンかは Markdown の \`?skin=\` が決めます。
 */
${imports}
${rules}`;

writeFileSync(OUTPUT, css);
console.log(`スキンの CSS を書き出しました: ${OUTPUT}`);
