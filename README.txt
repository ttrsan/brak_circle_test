ブルアカ風サークルチャット練習サイト

画像配置:
index.html と同じ階層に assets フォルダを置いてください。

構成例:

project/
  index.html
  style.css
  script.js

  assets/
    stamps/
      01/
        01.png
        02.png
      02/
      03/

画像パス:
assets/stamps/01/01.png ～ 20.png
assets/stamps/02/01.png ～ 20.png
assets/stamps/03/01.png ～ 32.png


変更内容:
- iPhone 12 Pro Safari向けの最終スマホレイアウト調整を追加
- 横幅390px前後でもチャット欄、入力欄、設定欄、スタンプ一覧が収まるよう調整
- Safariのアドレスバー変動を考慮して100dvhを使用


変更内容:
- スマホ表示時に Author: X @ttr_san を表示するよう修正
- スタンプ一覧の一部が見切れる問題を修正
- iPhone Safari のモーダル内部スクロールを改善


変更内容:
- iPhone 12 Safariで左パネル（テストサークル / サークルID / メンバー / 挨拶）を表示するよう修正
- スマホ縦表示を前提にレイアウト再調整
- Safariで一部スタンプ画像が ? 表示になる問題へ対策
- loading="lazy" を削除
- 読み込み失敗時の検知を追加


変更内容:
- assets/stamps/02 配下の画像は表示対象から除外
- iPhone 12 Safariでサークル情報が表示されない問題への対策として、スマホ用情報ブロックをチャットパネル内に追加


変更内容:
- iPhone 12 Safari 縦表示を最優先に再調整
- サークル情報 / チャット欄 / 入力欄を同時に表示
- 入力欄を常時表示
- サークル情報を高さ固定で小さく表示
- chat-logのみスクロールする構成に修正
