// キャンバスとコンテキストの設定
let canvas;
let ctx;

// ゲームの設定
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 15 / 2; // 直径15pxなので半径は7.5px
const PADDLE_SPEED = 5; // パドルの移動速度を遅く調整
const BLOCK_WIDTH = 60; // ブロックの幅
const BLOCK_HEIGHT = 20; // ブロックの高さ
const BLOCK_GAP = 5; // ブロック間の間隔
const BLOCK_ROWS = 4; // ブロックの行数
const BLOCK_COLS = 6; // ブロックの列数
let score = 0;

// ゲームの状態
let gameOver = false;
let gameCleared = false;

// ネオン風の色を生成する関数
function getRandomNeonColor() {
  const neonColors = [
    '#FF00FF', // マゼンタ
    '#00FFFF', // シアン
    '#FF0099', // ピンク
    '#00FF00', // ライムグリーン
    '#FFA500', // オレンジ
    '#FFFF00', // イエロー
    '#9D00FF'  // パープル
  ];
  return neonColors[Math.floor(Math.random() * neonColors.length)];
}

// ブロックの配列
let blocks = [];

// ブロックを初期化する関数
function initBlocks() {
  blocks = [];
  
  // ブロックの開始位置（中央揃え）
  const startX = (canvas.width - (BLOCK_COLS * BLOCK_WIDTH + (BLOCK_COLS - 1) * BLOCK_GAP)) / 2;
  const startY = 50; // 上から50pxの位置から開始
  
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      const blockX = startX + col * (BLOCK_WIDTH + BLOCK_GAP);
      const blockY = startY + row * (BLOCK_HEIGHT + BLOCK_GAP);
      
      blocks.push({
        x: blockX,
        y: blockY,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: getRandomNeonColor(),
        glow: true // ネオン効果用のフラグ
      });
    }
  }
}

// パドルの初期位置
let paddleX = (canvas.width - PADDLE_WIDTH) / 2;
const paddleY = canvas.height - 30; // 下から30pxの位置

// ボールの初期位置と速度
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 2; // X方向の速度を遅く調整
let ballSpeedY = -2; // Y方向の速度を遅く調整

// キー入力の状態を追跡
let rightPressed = false;
let leftPressed = false;

// タッチ操作のための変数
let touchX = null;
let lastTouchX = null;

// パドルの移動を処理する関数
function movePaddle() {
  // キーボード操作
  if (rightPressed && paddleX < canvas.width - PADDLE_WIDTH) {
    paddleX += PADDLE_SPEED;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= PADDLE_SPEED;
  }
  
  // パドルが画面外に出ないように制限
  if (paddleX < 0) {
    paddleX = 0;
  } else if (paddleX > canvas.width - PADDLE_WIDTH) {
    paddleX = canvas.width - PADDLE_WIDTH;
  }
}

// ボールとブロックの衝突をチェックする関数
function checkBlockCollision() {
  // 全てのブロックに対して衝突判定
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // ボールとブロックの衝突判定
    if (ballX + BALL_RADIUS > block.x && 
        ballX - BALL_RADIUS < block.x + block.width && 
        ballY + BALL_RADIUS > block.y && 
        ballY - BALL_RADIUS < block.y + block.height) {
      
      // 衝突したブロックを配列から削除
      blocks.splice(i, 1);
      
      // スコアを加算
      score++;
      
      // 衝突方向に基づいてボールの反射方向を決定
      // 上下からの衝突
      if (ballY + BALL_RADIUS <= block.y + 5 || ballY - BALL_RADIUS >= block.y + block.height - 5) {
        ballSpeedY = -ballSpeedY;
      } else { // 左右からの衝突
        ballSpeedX = -ballSpeedX;
      }
      
      // 一度に複数のブロックと衝突しないようにする
      return;
    }
  }
}

// ボールの移動と反射を処理する関数
function moveBall() {
  // ボールを移動
  ballX += ballSpeedX;
  ballY += ballSpeedY;
  
  // ブロックとの衝突判定
  checkBlockCollision();
  
  // 左右の壁との衝突判定と反射
  if (ballX - BALL_RADIUS < 0 || ballX + BALL_RADIUS > canvas.width) {
    ballSpeedX = -ballSpeedX; // X方向の速度を反転
    
    // 壁の内側にボールを保つ
    if (ballX - BALL_RADIUS < 0) {
      ballX = BALL_RADIUS;
    } else {
      ballX = canvas.width - BALL_RADIUS;
    }
  }
  
  // 天井との衝突判定と反射
  if (ballY - BALL_RADIUS < 0) {
    ballSpeedY = -ballSpeedY; // Y方向の速度を反転
    ballY = BALL_RADIUS; // 天井の内側にボールを保つ
  }
  
  // パドルとの衝突判定と反射
  if (ballY + BALL_RADIUS > paddleY && 
      ballY + BALL_RADIUS < paddleY + PADDLE_HEIGHT && 
      ballX > paddleX && 
      ballX < paddleX + PADDLE_WIDTH) {
    
    // パドルに当たった位置によって反射角度を変える
    const hitPoint = ballX - (paddleX + PADDLE_WIDTH / 2);
    const normalizedHitPoint = hitPoint / (PADDLE_WIDTH / 2); // -1から1の範囲に正規化
    
    // 反射角度を計算（-60度から60度の範囲）
    const angle = normalizedHitPoint * Math.PI / 3; // ±π/3 ラジアン（60度）
    
    // ボールの速度を計算
    const speed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
    ballSpeedX = speed * Math.sin(angle);
    ballSpeedY = -speed * Math.cos(angle); // 上向きに反射させるためにマイナス
    
    // パドルの上にボールを配置して重複衝突を防止
    ballY = paddleY - BALL_RADIUS;
  }
  
  // 画面下部に落ちた場合（ゲームオーバー）
  if (ballY + BALL_RADIUS > canvas.height) {
    gameOver = true;
  }
  
  // すべてのブロックを壊した場合（ゲームクリア）
  if (blocks.length === 0 && !gameOver) {
    gameCleared = true;
  }
}

// ブロックを描画する関数
function drawBlocks() {
  blocks.forEach(block => {
    // ネオン効果を追加
    if (block.glow) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = block.color;
    }
    
    // ブロックを描画
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, block.height);
    
    // シャドウをリセット
    ctx.shadowBlur = 0;
  });
}

// 再開ボタンの設定
const restartButton = {
  x: canvas.width / 2 - 60,
  y: canvas.height / 2 + 40,
  width: 120,
  height: 40,
  text: 'RESTART'
};

// ゲームオーバーメッセージを表示する関数
function drawGameOver() {
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#FF0000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  
  // 再開ボタンを表示
  drawRestartButton();
}

// ゲームクリアメッセージを表示する関数
function drawGameClear() {
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#00FF00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME CLEAR!', canvas.width / 2, canvas.height / 2);
  
  // 再開ボタンを表示
  drawRestartButton();
}

// 再開ボタンを表示する関数
function drawRestartButton() {
  // ボタンの背景
  ctx.fillStyle = '#4444FF';
  ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
  
  // ボタンのテキスト
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(restartButton.text, restartButton.x + restartButton.width / 2, restartButton.y + restartButton.height / 2);
}

// ゲーム描画関数
function draw() {
  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 黒い背景を描画
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // ブロックを描画
  drawBlocks();
  
  // パドルを描画
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
  
  // ボールを描画
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.closePath();
  
  // スコアを表示
  ctx.font = '16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${score}`, canvas.width - 20, 30);
  
  // ゲームオーバーまたはゲームクリアの場合
  if (gameOver) {
    drawGameOver();
  } else if (gameCleared) {
    drawGameClear();
  } else {
    // ゲームが進行中の場合のみパドルとボールを移動
    movePaddle();
    moveBall();
  }
  
  // アニメーションを続ける
  requestAnimationFrame(draw);
}

// キーボードイベントリスナー
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'Right') {
    rightPressed = true;
  } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
    leftPressed = true;
  } else if (e.key === 'r' || e.key === 'R') {
    // Rキーでゲーム再開
    if (gameOver || gameCleared) {
      initGame();
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'Right') {
    rightPressed = false;
  } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
    leftPressed = false;
  }
});

// クリックイベントリスナー
canvas.addEventListener('click', (e) => {
  // ゲームオーバーまたはゲームクリア時のみ再開ボタンを有効にする
  if (gameOver || gameCleared) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // 再開ボタンがクリックされたかチェック
    if (clickX > restartButton.x && 
        clickX < restartButton.x + restartButton.width && 
        clickY > restartButton.y && 
        clickY < restartButton.y + restartButton.height) {
      initGame();
    }
  }
});

// タッチイベントリスナー（スマホ用）
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // デフォルトの動作を防止
  
  // ゲームオーバーまたはゲームクリア時のみ再開ボタンを有効にする
  if (gameOver || gameCleared) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    // 再開ボタンがタッチされたかチェック
    if (touchX > restartButton.x && 
        touchX < restartButton.x + restartButton.width && 
        touchY > restartButton.y && 
        touchY < restartButton.y + restartButton.height) {
      initGame();
      return;
    }
  }
  
  // 通常のタッチ操作
  const touch = e.touches[0];
  touchX = touch.clientX;
  lastTouchX = touchX;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault(); // デフォルトの動作を防止
  
  // ゲーム中のみパドル操作を有効にする
  if (!gameOver && !gameCleared) {
    const touch = e.touches[0];
    touchX = touch.clientX;
    
    // 前回のタッチ位置との差分でパドルを移動
    if (lastTouchX !== null) {
      const diff = touchX - lastTouchX;
      paddleX += diff;
      
      // パドルが画面外に出ないように制限
      if (paddleX < 0) {
        paddleX = 0;
      } else if (paddleX > canvas.width - PADDLE_WIDTH) {
        paddleX = canvas.width - PADDLE_WIDTH;
      }
    }
    
    lastTouchX = touchX;
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault(); // デフォルトの動作を防止
  touchX = null;
  lastTouchX = null;
});

// ゲームを初期化する
function initGame() {
  // ブロックを初期化
  initBlocks();
  
  // パドルを初期位置にセット
  paddleX = (canvas.width - PADDLE_WIDTH) / 2;
  
  // ボールを初期位置にセット
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 2; // 遅く調整
  ballSpeedY = -2; // 遅く調整
  
  // スコアをリセット
  score = 0;
  
  // ゲーム状態をリセット
  gameOver = false;
  gameCleared = false;
}

// HTMLが完全に読み込まれた後にゲームを初期化
window.onload = function() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // ゲームを初期化して開始
  initGame();
  draw();
};
