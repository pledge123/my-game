let robot = document.getElementsByClassName("robot") ;

//固定データ（変わらないデータ）
let window1 = { sx:640, sy:480 } //ウィンドウの横の長さと縦の長さ
let timerno //タイマー制御用
let timerv = 30 //ゲームの実行タイマ値(小さいと速い)
let robots = { sx:60, sy:60, move:10 } //ロボットの横と縦の長さと上下移動スピード
let inryokus = 1.02 //引力値（大きいとすぐ落ちる）
let ugokihaba = 10  //動作単位
let menhaba = window1.sx / ugokihaba //１面の動作数(64)

//作業データ（ゲームの状態によって値が変わります）
let timer = timerv //ゲームの実行タイマー
let mode = 0 //ゲームの状態（0:タイトル画面,1:プレイ画面,9:ゴール画面）
let counter = 0 //カウンター（0～511）
let haikeikaisi = 0 //背景画像の表示開始位置
let robotno = 1 //ロボット番号（0：スロー 1:ノーマル 2:ハイスピード）
let robotd = { x:40, y:210 } //ロボットの座標
let keyue = 0 //↑キーが押されているか
let keyshita = 0 //↓キーが押されているか
let score = 0 //スコア
let oldtimer = timer //変更前のタイマー
let itemscore = 0 //アイテムスコア
let inryoku = inryokus //現在の引力
let robomapy1 //ロボットの高さで得たアイテム位置の上端
let robomapy2 //ロボットの高さで得たアイテム位置の下端
let robomapx1 //ロボットの幅でで得たアイテム位置の左端
let robomapx2 //ロボットの幅でで得たアイテム位置の右端

//最初に１回だけやること（起動処理）
function init() {
    ctx = document.getElementById('canvas').getContext('2d') //プログラムと画面（コンテント）をつなぐ
    addEventListener('keydown', keyDown, true) //キーが押し終わった時にやることを示す
    addEventListener('keyup', keyUp, true) //キーが押された時にやることを示す
    for (let i = 0; i < 9; i++) { //全面についてくり返す
        for (let j = 0; j < 16; j++) { //各列についてくり返す
            maps[i * 16 + j] = new Array(12) //各列の中に行数分の配列を作る
        }
    }
    start() //開始処理を呼ぶ
}

//ロボットの高さと幅で接触するアイテムの位置の範囲を得る
function itemxy() {
    robomapy1 = Math.floor(robotd.y / 40) //ロボットの高さでアイテム位置の上端を得る
    robomapy2 = Math.floor((robotd.y + 60) / 40) //ロボットの高さでアイテム位置の下端を得る
    robomapx1 = Math.floor(-haikeikaisi / 40) //背景の開始位置でアイテム位置の左端を得る
    robomapx2 = Math.floor((-haikeikaisi + 70)/ 40) //背景の開始位置でアイテム位置の右端を得る
}

//ボーナスアイテムに触れたらボーナスゲットにして加点
function bonusscore(n) { //n：点数
    for (let i = robomapx1; i <= robomapx2; i++) { //ロボットと接触する横の範囲についてくり返す
        for (let j = robomapy1; j <= robomapy2; j++) { //ロボットと接触する縦の範囲についてくり返す
            if (maps[i][j] === 2) { //ボーナスアイテムならば
                maps[i][j] = 5 //ボーナスゲットにする
                score += n //スコア加算
            }
        }
    }
}

//スピードアップに触れたらアイテムゲットにして加点＆スピードアップ
function speedupscore(n, m) { //スピードアップに触れたらn点ゲット、スピードm％アップ
    for (let i = robomapx1; i <= robomapx2; i++) { //ロボットと接触する横の範囲についてくり返す
        for (let j = robomapy1; j <= robomapy2; j++) { //ロボットと接触する縦の範囲についてくり返す
            if (maps[i][j] === 3) { //スピードアップアイテムならば
                maps[i][j] = 6 //アイテムゲットにする
                timer = Math.floor(timer * (1.0 - m / 100) + 0.5) //スピードアップ
                itemscore += n //アイテムスコア加算
            }
        }
    }
}

//スピードダウンに触れたらアイテムゲットにして加点＆スピードダウン
function speeddownscore(n, m) { //スピードダウンに触れたらn点ゲット、スピードm％ダウン
    for (let i = robomapx1; i <= robomapx2; i++) { //ロボットと接触する横の範囲についてくり返す
        for (let j = robomapy1; j <= robomapy2; j++) { //ロボットと接触する縦の範囲についてくり返す
            if (maps[i][j] === 4) { //スピードダウンアイテムならば
                maps[i][j] = 6 //アイテムゲットにする
                timer = Math.floor(timer * (1.0 + m / 100) - 0.5) //スピードダウン
                itemscore += n //アイテムスコア加算
            }
        }
    }
}

//障害物に触れたらゲームオーバー
function shogaicrash() {
    for (let i = robomapx1; i <= robomapx2; i++) { //ロボットと接触する横の範囲についてくり返す
        for (let j = robomapy1; j <= robomapy2; j++) { //ロボットと接触する縦の範囲についてくり返す
            if (maps[i][j] === 1) { //障害物ならば
                mode = 8 //ゲームオーバーにする
                return
            }
        }
    }
}

//ボーナスアイテム画像を表示
function drawbonus() {
    for (let i = 1 * 16; i < 8 * 16; i++) { //1～7面の各列についてくり返す
        if (haikeikaisi + i * 40 > -40 && haikeikaisi + i * 40 < window1.sx + 40) { //描画範囲？
            for (let j = 0; j < 12; j++) { //各行についてくり返す
                if (maps[i][j] === 2) { //ボーナスアイテム？
                    ctx.drawImage(bonusitem, haikeikaisi + i * 40, j * 40) //ボーナスアイテム画像を表示
                }
            }
        }
    }
}

//ボーナスゲット画像を表示
function drawbonusget() {
    for (let i = 1 * 16; i < 8 * 16; i++) { //1～7面の各列についてくり返す
        if (haikeikaisi + i * 40 > -40 && haikeikaisi + i * 40 < window1.sx + 40) { //描画範囲？
            for (let j = 0; j < 12; j++) { //各行についてくり返す
                if (maps[i][j] === 5) { //ボーナスゲット？
                    ctx.drawImage(bonusget, haikeikaisi + i * 40, j * 40) //ボーナスアイテム画像を表示
                }
            }
        }
    }
}

//スピードアップ画像を表示
function drawspeedup() {
    for (let i = 1 * 16; i < 8 * 16; i++) { //1～7面の各列についてくり返す
        if (haikeikaisi + i * 40 > -40 && haikeikaisi + i * 40 < window1.sx + 40) { //描画範囲？
            for (let j = 0; j < 12; j++) { //各行についてくり返す
                if (maps[i][j] === 3) { //スピードアップ？
                    ctx.drawImage(speedup, haikeikaisi + i * 40, j * 40) //ボーナスアイテム画像を表示
                }
            }
        }
    }
}

//スピードダウン画像を表示
function drawspeeddown() {
    for (let i = 1 * 16; i < 8 * 16; i++) { //1～7面の各列についてくり返す
        if (haikeikaisi + i * 40 > -40 && haikeikaisi + i * 40 < window1.sx + 40) { //描画範囲？
            for (let j = 0; j < 12; j++) { //各行についてくり返す
                if (maps[i][j] === 4) { //スピードダウン？
                    ctx.drawImage(speeddown, haikeikaisi + i * 40, j * 40) //ボーナスアイテム画像を表示
                }
            }
        }
    }
}

//アイテムゲット画像を表示
function drawspeedupget() {
    for (let i = 1 * 16; i < 8 * 16; i++) { //1～7面の各列についてくり返す
        if (haikeikaisi + i * 40 > -40 && haikeikaisi + i * 40 < window1.sx + 40) { //描画範囲？
            for (let j = 0; j < 12; j++) { //各行についてくり返す
                if (maps[i][j] === 6) { //アイテムゲット？
                    ctx.drawImage(itemget, haikeikaisi + i * 40, j * 40) //ボーナスアイテム画像を表示
                }
            }
        }
    }
}

//障害物画像を表示
function drawshogai() {
    for (let i = 1 * 16; i < 8 * 16; i++) { //1～7面の各列についてくり返す
        if (haikeikaisi + i * 40 > -40 && haikeikaisi + i * 40 < window1.sx + 40) { //描画範囲？
            for (let j = 0; j < 12; j++) { //各行についてくり返す
                if (maps[i][j] === 1) { //障害物？
                    ctx.drawImage(hazard, haikeikaisi + i * 40, j * 40) //ボーナスアイテム画像を表示
                }
            }
        }
    }
}
