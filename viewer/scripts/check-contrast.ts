/**
 * 画面に出る文字色が背景とのコントラスト比を満たすかを検査する。
 *
 * 色は theme/palette.ts の関数だけが決める決まりなので、ここではその出力を検証する。
 * 配色やしきい値を変えたら `npm run check:contrast` を通すこと。
 */
import {
  CONTRAST_MIN_LARGE, CONTRAST_MIN_TEXT, DARK_THEME, LIGHT_THEME,
  chartText, contrastRatio, readableTextOn, tooltipSurface,
} from '../src/theme/palette';

let failed = 0;
const check = (name: string, fg: string, bg: string, min: number) => {
  const ratio = contrastRatio(fg, bg);
  const ok = ratio >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'OK ' : 'NG '} ${name.padEnd(42)} ${ratio.toFixed(2)} (下限 ${min})`);
};

for (const theme of [LIGHT_THEME, DARK_THEME]) {
  console.log(`\n--- ${theme.mode} ---`);
  const tip = tooltipSurface(theme);
  check('ツールチップ 見出し / 背景', tip.titleColor, tip.background, CONTRAST_MIN_TEXT);
  check('ツールチップ 本文 / 背景', tip.textColor, tip.background, CONTRAST_MIN_TEXT);
  check('軸ラベル / グラフ面', chartText(theme), theme.surface, CONTRAST_MIN_TEXT);
  check('主要文字 / グラフ面', chartText(theme, 'primary'), theme.surface, CONTRAST_MIN_TEXT);
  theme.categorical.forEach((color, i) => {
    check(`系列${i + 1} ドット / ツールチップ背景`, tip.seriesColor(color), tip.background, CONTRAST_MIN_LARGE);
    check(`系列${i + 1} 上の値ラベル`, readableTextOn(color, theme), color, CONTRAST_MIN_TEXT);
  });
}
console.log(failed === 0 ? '\nすべて基準を満たしています' : `\n未達: ${failed} 件`);
process.exit(failed === 0 ? 0 : 1);
