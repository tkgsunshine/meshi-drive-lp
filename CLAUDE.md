# meshi-drive-lp

Antigravity(AG)から Claude Code(CC)へ引き継ぎ済み。今後の開発はCCで行う。

- 静的LP（`index.html` / `css` / `js`）。ビルドは `npm run build`（`scripts/build.js`、出力は `dist/`）。作業完了前に実行して通す。
- 作業ブランチで変更し、PRで反映する。Vercelの1日100回デプロイ制限があるため、変更はまとめて1回のcommit/pushにする。
- 依頼のないファイル削除・無関係な改変をしない。事実は検証してから報告する。

## LPの版の記録（採用方針は未決定）
- **お悩み訴求が先の版（現行）:** ヒーロー見出し「Uber Eatsを始めたけど、売れない。」。`322c2c1` で導入。
- **消費税訴求が先の版（採用候補・保存済み）:** ヒーロー見出し「テイクアウト・デリバリーの消費税が 10% ➔ 1% へ。」。ブランチ `claude/archive-lp-v1-tax-first`（コミット `fee0b87`）に保存してある。`index-v1-tax-focus.html`（本番で `/index-v1-tax-focus.html`）にも同じ内容が残っている。
- どちらを採用するかはユーザーが未決定。決まるまで、両方とも消さない。
- 開発アイデア: ユーザーが新機能・改善のアイデアを話したら、`.claude/agents/dev-employee.md` の「ホーム」の節に従い、ホームのダッシュボード（https://claude.ai/artifact/9eu8jRktA8nGCC8HKN7L8A）の `ideas` に保存する（実装は依頼があるまでしない）。

## AI社員ホームへの報告
作業を終えたとき（PRの作成・マージ、調査の完了、不具合の修正など）は、チャットへの報告と同じ要点を、ホーム（https://claude.ai/artifact/9eu8jRktA8nGCC8HKN7L8A）のDBのコレクション `feed` に1件書く（ArtifactData の set）。
- ID: `YYYYMMDD-HHMMSS-<area>`（日本時間）／ at: `YYYY-MM-DD HH:MM`（日本時間）
- area: marketing / dev / x / other（開発の作業は dev）／ who: 「Meshi Drive 開発」
- text: 1〜2文。専門用語を避け、何が変わったか・ユーザーが確認すべきことを書く。link は任意（PRなどのURL）
- 書かない: 小さな途中の作業、個人情報・秘密情報（トークン、メールアドレスなど）
- ホームのDBに書けない環境のときは、書けなかったことをチャットで伝える。
