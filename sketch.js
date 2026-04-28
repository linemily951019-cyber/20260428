// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let statusMsg = "模型載入中...";
let isWebGLSupported = true;
let petals = []; // 儲存花瓣物件的陣列

function preload() {
  // 檢查手機或瀏覽器是否支援 WebGL
  let canvas = document.createElement('canvas');
  let gl = null;
  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (e) {}

  if (!gl) {
    isWebGLSupported = false;
    statusMsg = "很抱歉 您的手機不支援WebGL";
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
    fill(255, 0, 0); // 設定文字為紅色
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

        // 在指尖 (4, 8, 12, 16, 20) 產生紫色花瓣
        if (frameCount % 2 === 0) { // 稍微控制花瓣產生的頻率避免效能過載
          let tips = [4, 8, 12, 16, 20];
          for (let tipIdx of tips) {
            let pt = hand.keypoints[tipIdx];
            petals.push(new Petal(pt.x, pt.y));
          }
        }
      }
    }
  }

  // 更新與繪製所有花瓣 (保持在畫布縮放與位移的座標系中)
  for (let i = petals.length - 1; i >= 0; i--) {
    petals[i].update();
    petals[i].draw();
    if (petals[i].life <= 0) {
      petals.splice(i, 1);
    }
  }
  pop();

  // 在畫面上方顯示模型載入成功的訊息
  push();
  fill(0, 150, 0); // 設定文字為綠色
  textSize(24);
  textAlign(CENTER, TOP);
  text(statusMsg, width / 2, 20);
  pop();

  // 在畫布左上方加上指定的文字
  push();
  fill(0); // 黑色文字
  textSize(24);
  textAlign(LEFT, TOP);
  text("414730233林子靖文字", 20, 20);
  pop();
}

// 定義花瓣的類別
class Petal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.5, 0.5);
    this.vy = random(-2, -5); // 初始往上串升
    this.life = 255;
    this.age = 0;
    this.scatterTime = random(30, 60); // 經過多少幀後開始散開
    this.angle = random(TWO_PI);
  }
  update() {
    this.age++;
    if (this.age > this.scatterTime) {
      // 到達適當位置時自動散開：增加混亂的水平及垂直速度
      this.vx += random(-0.8, 0.8);
      this.vy += random(-0.5, 0.5);
    }
    this.x += this.vx;
    this.y += this.vy;
    this.angle += 0.05; // 旋轉效果
    this.life -= 2;     // 隨時間逐漸變透明
  }
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    fill(180, 50, 255, this.life); // 紫色帶透明度
    // 利用貝茲曲線繪製花瓣形狀
    beginShape();
    vertex(0, -10);
    bezierVertex(10, -10, 10, 10, 0, 15);
    bezierVertex(-10, 10, -10, -10, 0, -10);
    endShape(CLOSE);
    pop();
  }
}
