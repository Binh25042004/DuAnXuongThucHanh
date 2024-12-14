const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");

// Tải hình ảnh
const bird = new Image();
const bg = new Image();
const fg = new Image();
const pipeNorth = new Image();
const pipeSouth = new Image();

bird.src = "images/bird.png";
bg.src = "images/bg.png";
fg.src = "images/fg.png";
pipeNorth.src = "images/pipeNorth.png";
pipeSouth.src = "images/pipeSouth.png";


// Biến
let gap = 85;
let constant;

let bX = 10;
let bY = 150;

let gravity = 1.5;
let score = 0;

const fly = new Audio();
const scor = new Audio();

fly.src = "sounds/fly.mp3";
scor.src = "sounds/score.mp3";

document.addEventListener("keydown", (event) => {
    // Ngăn hành vi mặc định khi nhấn Space
    if (event.code === "Space") {
      event.preventDefault();
      moveUp();
    }
  });
  
  function moveUp() {
    bY -= 32;
    fly.play();
  }
  

let pipe = [];
pipe[0] = {
  x: cvs.width,
  y: 0,
};

// Hàm cập nhật điểm lên bảng điểm
function updateScore() {
  document.getElementById("score").innerText = score;
}

// Hàm vẽ game (draw)
function draw() {
  ctx.drawImage(bg, 0, 0);

  for (let i = 0; i < pipe.length; i++) {
    constant = pipeNorth.height + gap;
    ctx.drawImage(pipeNorth, pipe[i].x, pipe[i].y);
    ctx.drawImage(pipeSouth, pipe[i].x, pipe[i].y + constant);

    pipe[i].x--;

    if (pipe[i].x == 125) {
      pipe.push({
        x: cvs.width,
        y: Math.floor(Math.random() * pipeNorth.height) - pipeNorth.height,
      });
    }

    if (
      (bX + bird.width >= pipe[i].x &&
        bX <= pipe[i].x + pipeNorth.width &&
        (bY <= pipe[i].y + pipeNorth.height ||
          bY + bird.height >= pipe[i].y + constant)) ||
      bY + bird.height >= cvs.height - fg.height
    ) {
      location.reload();
    }

    if (pipe[i].x == 5) {
      score++;
      scor.play();
      updateScore();
    }
  }

  ctx.drawImage(fg, 0, cvs.height - fg.height);
  ctx.drawImage(bird, bX, bY);

  bY += gravity;

  ctx.fillStyle = "#000";
  ctx.font = "20px Verdana";
  ctx.fillText("Điểm : " + score, 10, cvs.height - 20);

  requestAnimationFrame(draw);
}
draw();

// Kết nối ví ( Connect Wallet )
document.getElementById("connect-wallet").addEventListener("click", async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      const response = await window.solana.connect();
      document.getElementById("wallet-address").innerText =
        "Wallet: " + response.publicKey.toString();
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  } else {
    alert("Phantom Wallet is not installed!");
  }
});

// Khởi động lại trò chơi
document.getElementById("restart-game").addEventListener("click", () => {
  location.reload();
});


// Hàm mô phỏng để tải lịch sử điểm số (thay thế bằng tích hợp blockchain thực tế)
async function loadScoreHistory(walletAddress) {
  const historyElement = document.getElementById("score-history");
  historyElement.innerHTML = "";
  const mockHistory = [10, 20, 15, 30]; // Thay thế bằng dữ liệu thực
  mockHistory.forEach((score) => {
    const li = document.createElement("li");
    li.textContent = `Score: ${score}`;
    historyElement.appendChild(li);
  });
}

// Ví dụ về lịch sử tải (gọi nó khi ví được kết nối)
loadScoreHistory();
