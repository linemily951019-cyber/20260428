// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
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
      }
    }
  }
  pop();
}
