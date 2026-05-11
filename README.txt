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
