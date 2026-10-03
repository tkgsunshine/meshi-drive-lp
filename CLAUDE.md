# meshi-drive-lp

Antigravity(AG)から Claude Code(CC)へ引き継ぎ済み。今後の開発はCCで行う。

- 静的LP（`index.html` / `css` / `js`）。ビルドは `npm run build`（`scripts/build.js`、出力は `dist/`）。作業完了前に実行して通す。
- 作業ブランチで変更し、PRで反映する。Vercelの1日100回デプロイ制限があるため、変更はまとめて1回のcommit/pushにする。
- 依頼のないファイル削除・無関係な改変をしない。事実は検証してから報告する。

## LPの版の記録（採用方針は未決定）
- **お悩み訴求が先の版（現行）:** ヒーロー見出し「Uber Eatsを始めたけど、売れない。」。`322c2c1` で導入。
- **消費税訴求が先の版（採用候補・保存済み）:** ヒーロー見出し「テイクアウト・デリバリーの消費税が 10% ➔ 1% へ。」。Gitタグ `lp-v1-tax-first`（コミット `fee0b87`）で復元できる。`index-v1-tax-focus.html`（本番で `/index-v1-tax-focus.html`）にも同じ内容が残っている。
- どちらを採用するかはユーザーが未決定。決まるまで、両方とも消さない。
