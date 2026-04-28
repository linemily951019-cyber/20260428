// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let statusMsg = "模型載入中...";
let isWebGLSupported = true;
let bubbles = []; // 儲存泡泡物件的陣列

function preload() {
  // 檢查手機或瀏覽器是否支援 WebGL
  let canvas = document.createElement('canvas');
  let gl = null;
  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (e) {}

  if (!gl) {
    isWebGLSupported = false;
    statusMsg = "很抱歉 您的瀏覽器不支援WebGL";
  } else {
    try {
      // Initialize HandPose model with flipped video input
      handPose = ml5.handPose({ flipped: true });
    } catch (e) {
      statusMsg = "模型載入失敗";
    }
  }
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  if (!isWebGLSupported || !handPose) {
    return; // 發生錯誤時，不繼續啟動攝影機或進行模型辨識
  }

  statusMsg = "模型載入成功";

  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

// 讓畫布在視窗縮放時能夠自動調整尺寸
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background("lightblue"); // 畫布背景設定為淡藍色

  // 若不支援 WebGL 或模型載入失敗，將訊息顯示於畫面中央並停止後續渲染
  if (!isWebGLSupported || !handPose) {
    push();
    fill(220, 20, 60); // 更改為較不刺眼的 Crimson 紅色
    textSize(24);
    textAlign(CENTER, CENTER);
    text(statusMsg, width / 2, height / 2);
    pop();
    return;
  }

  // 計算 60% 的影像寬高與置中座標
  let drawW = width * 0.5;
  let drawH = height * 0.5;
  let drawX = (width - drawW) / 2;
  let drawY = (height - drawH) / 2;

  push();
  // 移動到置中的起點座標
  translate(drawX, drawY);

  // 取得影片的原始寬高 (預防剛載入時為0，預設為640x480)，並進行畫布縮放
  let vW = video.width > 0 ? video.width : 640;
  let vH = video.height > 0 ? video.height : 480;
  scale(drawW / vW, drawH / vH);

  image(video, 0, 0);

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // 依照您的需求，定義手指關節的連線群組
        let fingerConnections = [
          [0, 1, 2, 3, 4],   // 掌根與大拇指
          [5, 6, 7, 8],      // 食指
          [9, 10, 11, 12],   // 中指
          [13, 14, 15, 16],  // 無名指
          [17, 18, 19, 20]   // 小指
        ];

        stroke(0, 255, 0); // 設定線條顏色（此處示範為綠色）
        strokeWeight(4);   // 設定線條粗細
        for (let group of fingerConnections) {
          for (let j = 0; j < group.length - 1; j++) {
            let ptA = hand.keypoints[group[j]];
            let ptB = hand.keypoints[group[j + 1]];
            line(ptA.x, ptA.y, ptB.x, ptB.y);
          }
        }

        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          circle(keypoint.x, keypoint.y, 16);
        }

        // 在指尖 (4, 8, 12, 16, 20) 產生透明泡泡
        if (frameCount % 2 === 0) { // 稍微控制泡泡產生的頻率避免效能過載
          let tips = [4, 8, 12, 16, 20];
          for (let tipIdx of tips) {
            let pt = hand.keypoints[tipIdx];
            bubbles.push(new Bubble(pt.x, pt.y));
          }
        }
      }
    }
  }

  // 更新與繪製所有泡泡 (保持在畫布縮放與位移的座標系中)
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].draw();
    if (bubbles[i].life <= 0) {
      bubbles.splice(i, 1);
    }
  }
  pop();

  // 在畫面上方顯示模型載入成功的訊息
  push();
  fill(30, 144, 255); // 更改為較柔和好看的 DodgerBlue 藍色
  textSize(24);
  textAlign(CENTER, TOP);
  text(statusMsg, width / 2, 20);
  pop();

  // 將文字放置於中間視訊視窗的下方
  push();
  fill(50); // 深灰色文字
  textSize(24);
  textAlign(CENTER, TOP);
  text("414730233林子靖", width / 2, drawY + drawH + 20);
  pop();
}

// 定義泡泡的類別
class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.3, 0.3); // 減緩水平飄移速度
    this.vy = random(-1, -2.5);  // 減緩往上升的速度
    this.r = random(5, 12);   // 泡泡半徑大小
    this.life = 1;            // 存活狀態 (大於 0 代表存在)
    this.age = 0;
    this.popTime = random(50, 100); // 配合速度調慢，延長泡泡的存在時間
  }
  update() {
    this.age++;
    if (this.age > this.popTime) {
      this.life = 0; // 到達設定的時間後直接破掉 (被陣列移除)
    }
    this.x += this.vx;
    this.y += this.vy;
  }
  draw() {
    push();
    translate(this.x, this.y);
    fill(255, 50);    // 微白且高度透明的泡泡主體
    stroke(255, 200); // 帶透明度的白色邊緣
    strokeWeight(1.5);
    circle(0, 0, this.r * 2);
    
    // 畫一條白色的弧線反光，取代原本的小圓點
    noFill();
    stroke(255, 220);
    strokeWeight(this.r * 0.3); // 反光線的粗細根據泡泡大小調整
    strokeCap(ROUND); // 讓線條兩端呈現圓潤感
    arc(0, 0, this.r * 1.4, this.r * 1.4, PI + 0.2, PI + HALF_PI - 0.2); // 在左上角畫一小段弧線
    pop();
  }
}
