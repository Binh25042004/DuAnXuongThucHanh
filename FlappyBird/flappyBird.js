const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");

// Tải hình ảnh
const bird = new Image();
const bg = new Image();
const fg = new Image();
const pipeNorth = new Image();
const pipeSouth = new Image();

bird.src = "images/pikachu.png";
bg.src = "images/background.png";
fg.src = "images/fg.png";
pipeNorth.src = "images/pipeNorth.png";
pipeSouth.src = "images/pipeSouth.png";

bg.onload = () => {
  bird.onload = () => {
    fg.onload = () => {
      pipeNorth.onload = () => {
        pipeSouth.onload = () => {
          draw(); // Vẽ game khi tất cả hình ảnh đã tải xong
        };
      };
    };
  };
};

// Biến trạng thái game
let gameStarted = false;
let gameOver = false;
let walletAddress = null; // Địa chỉ ví

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
  if (event.code === "Space") {
    event.preventDefault();
    if (!gameStarted) {
      gameStarted = true;
      draw();
    } else {
      moveUp();
    }
  }
});

let pipe = [];
pipe[0] = { x: cvs.width, y: 0 };

function updateScore() {
  document.getElementById("score").innerText = score;
}

function moveUp() {
  bY -= 32;
  fly.play();
}

function resetGame() {
  bX = 10;
  bY = 150;
  score = 0;
  pipe = [{ x: cvs.width, y: 0 }];
  gameOver = false;
  updateScore();
  draw();
}

function endGame() {
  gameOver = true;
  if (walletAddress) {
    saveScore(score).then(() => {
      setTimeout(() => {
        resetGame();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      resetGame();
    }, 1000);
  }
}

function draw() {
  ctx.drawImage(bg, 0, 0);

  for (let i = 0; i < pipe.length; i++) {
    constant = pipeNorth.height + gap;
    ctx.drawImage(pipeNorth, pipe[i].x, pipe[i].y);
    ctx.drawImage(pipeSouth, pipe[i].x, pipe[i].y + constant);

    pipe[i].x--;

    if (pipe[i].x === 125) {
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
      endGame();
      return;
    }

    if (pipe[i].x === 5) {
      score++;
      scor.play();
      updateScore();
    }
  }

  ctx.drawImage(fg, 0, cvs.height - fg.height);
  ctx.drawImage(bird, bX, bY);

  bY += gravity;

  if (gameStarted && !gameOver) {
    requestAnimationFrame(draw);
  }
}

document.getElementById("connect-wallet").addEventListener("click", async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      const response = await window.solana.connect();
      walletAddress = response.publicKey.toString();
      document.getElementById("wallet-address").innerText = "Wallet: " + walletAddress;
      alert("Kết nối ví thành công!");
      loadScoreHistory(walletAddress); // Tải lịch sử điểm ngay sau khi kết nối
    } catch (err) {
      alert("Kết nối ví thất bại");
      console.error("Kết nối ví thất bại", err);
    }
  } else {
    alert("Phantom Wallet chưa được cài đặt!");
  }
});

async function saveScore(score) {
  if (!walletAddress) return;
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress),
        toPubkey: new PublicKey(walletAddress),
        lamports: 0,
      }),
      new MemoInstruction({ data: `Score: ${score}` })
    );

    const { signature } = await window.solana.signAndSendTransaction(transaction);
    await connection.confirmTransaction(signature);
    loadScoreHistory(walletAddress);
  } catch (error) {
    console.error("Lỗi khi lưu điểm:", error);
  }
}

async function loadScoreHistory(walletAddress) {
  if (!walletAddress) return;
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const historyElement = document.getElementById("score-history");
  historyElement.innerHTML = "";

  try {
    const transactions = await connection.getConfirmedSignaturesForAddress2(
      new PublicKey(walletAddress),
      { limit: 10 }
    );

    for (const tx of transactions) {
      const transactionDetails = await connection.getTransaction(tx.signature);
      const memo = transactionDetails?.transaction?.instructions[1]?.data;

      if (memo) {
        const li = document.createElement("li");
        li.textContent = memo;
        historyElement.appendChild(li);
      }
    }
  } catch (error) {
    console.error("Lỗi khi tải lịch sử:", error);
    historyElement.innerHTML = "<li>Không thể tải lịch sử điểm từ blockchain.</li>";
  }
}

document.getElementById("restart-game").addEventListener("click", () => {
  resetGame();
});
