const TOTAL_QUESTIONS = 15;
const TIME_ATTACK_SECONDS = 60;

/* GIFの再生時間に合わせて変更 */
const INTRO_DURATION_MS = 3000;

const difficultyScreen = document.getElementById("difficultyScreen");
const introScreen = document.getElementById("introScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const introGif = document.getElementById("introGif");
const modeLabel = document.getElementById("modeLabel");
const progressText = document.getElementById("progressText");
const timerText = document.getElementById("timerText");

const mediaBox = document.getElementById("mediaBox");
const questionText = document.getElementById("questionText");
const choices = document.getElementById("choices");

const resultScore = document.getElementById("resultScore");
const resultRate = document.getElementById("resultRate");
const backBtn = document.getElementById("backBtn");

/*
  media は省略OK。
  画像でもGIFでもOK。
  例:
  media: "images/sample.jpg"
  media: "images/sample.gif"
*/

const quizData = {
  easy: [
    {
      question: "日本では2005年頃から出回っていたとされ、日本発祥説が有力視されている、白い顔に不気味な笑みを浮かべた姿が特徴的な「検索してはいけない言葉」は何でしょう？",
      media: "images/IMG_7026.GIF",
      choices: ["白いヒトガタ", "ジェフザキラー", "白粉", "朱雀丸"],
      answer: 1
    },
    {
      question: "画像なしの問題も表示できます。",
      choices: ["正解", "不正解", "不正解", "不正解"],
      answer: 0
    }
  ],

  normal: [
    {
      question: "かつて「グロかな？水死体  ○○県での出来事」というタイトルでヒットした、川に水死体が浮かんでいる動画",
      media: "images/IMG_7108.jpg",
      choices: ["山形県での出来事", "山梨県での出来事", "山口県での出来事", "岡山県での出来事"],
      answer: 2
    }
  ],

  hard: [
    {
      question: "これは上級のサンプル問題です。",
      choices: ["A", "B", "C", "D"],
      answer: 3
    }
  ],

  time: [
    {
      question: "日本では2005年頃から出回っていたとされ、日本発祥説が有力視されている、白い顔に不気味な笑みを浮かべた姿が特徴的な「検索してはいけない言葉」は何でしょう？",
      media: "images/IMG_7026.GIF",
      choices: ["白いヒトガタ", "ジェフザキラー", "白粉", "朱雀丸"],
      answer: 1
    },
    {
      question: "かつて「グロかな？水死体  ○○県での出来事」というタイトルでヒットした、川に水死体が浮かんでいる動画",
      media: "images/IMG_7108.jpg",
      choices: ["山形県での出来事", "山梨県での出来事", "山口県での出来事", "岡山県での出来事"],
      answer: 2
    }
  ]
};

let currentMode = "";
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let answeredCount = 0;

let timeLeft = TIME_ATTACK_SECONDS;
let timerId = null;

document.querySelectorAll(".difficulty-buttons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    startIntro(btn.dataset.mode);
  });
});

backBtn.addEventListener("click", () => {
  stopTimer();

  document.getElementById("siteHeader").style.display = "flex";

  showScreen(difficultyScreen);
});

function showScreen(screen) {
  document.querySelectorAll(".quiz-screen").forEach((s) => {
    s.classList.remove("active");
  });

  screen.classList.add("active");
}

function startIntro(mode) {
  currentMode = mode;

  document.getElementById("siteHeader").style.display = "none";
  document.getElementById("sideMenu").classList.remove("open");

  showScreen(introScreen);

  // GIFを最初から再読み込み
  introGif.src = "";
  
  setTimeout(() => {
    introGif.src = "images/IMG_7086.GIF";
  }, 10);

  // GIF終了後にクイズ開始
  setTimeout(() => {
    startQuiz(mode);
  }, 4000);
}

  



function startQuiz(mode) {
  questions = shuffleArray([...quizData[mode]]);

  currentIndex = 0;
  correctCount = 0;
  answeredCount = 0;
  timeLeft = TIME_ATTACK_SECONDS;

  modeLabel.textContent = getModeName(mode);
  timerText.textContent = "";

  showScreen(quizScreen);

  if (mode === "time") {
    startTimer();
  }

  showQuestion();
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    showResult();
    return;
  }

  if (currentMode !== "time" && currentIndex >= TOTAL_QUESTIONS) {
    showResult();
    return;
  }

  const q = questions[currentIndex];

  if (currentMode === "time") {
    progressText.textContent = `${answeredCount}問回答`;
  } else {
    progressText.textContent = `${currentIndex + 1} / ${TOTAL_QUESTIONS}`;
  }

  questionText.textContent = q.question;
  choices.innerHTML = "";
  mediaBox.innerHTML = "";

  if (q.media) {
    const img = document.createElement("img");
    img.src = q.media;
    img.alt = "問題画像";
    mediaBox.appendChild(img);
  }

  q.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice;

    btn.addEventListener("click", () => {
      selectAnswer(index);
    });

    choices.appendChild(btn);
  });
}

function selectAnswer(selectedIndex) {
  const q = questions[currentIndex];
  const buttons = document.querySelectorAll(".choice-btn");

  answeredCount++;

  if (selectedIndex === q.answer) {
    correctCount++;
  }

  if (currentMode === "time") {
    currentIndex++;
    showQuestion();
    return;
  }

 

  buttons.forEach((btn, index) => {
  btn.classList.add("disabled");

  // 正解だけ緑
  if (index === q.answer) {
    btn.classList.add("correct");
  }

  // それ以外は全部赤
  else {
    btn.classList.add("wrong");
  }
});

  setTimeout(() => {
    currentIndex++;
    showQuestion();
  }, 900);

}


function startTimer() {
  timerText.textContent = `${timeLeft}秒`;

  timerId = setInterval(() => {
    timeLeft--;
    timerText.textContent = `${timeLeft}秒`;

    if (timeLeft <= 0) {
      stopTimer();
      showResult();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function showResult() {
  stopTimer();

  const total = currentMode === "time" ? answeredCount : TOTAL_QUESTIONS;
  const rate = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  resultScore.textContent = `${correctCount} / ${total}`;
  resultRate.textContent = `正答率 ${rate}%`;

  showScreen(resultScreen);
}

function getModeName(mode) {
  if (mode === "easy") return "初級";
  if (mode === "normal") return "中級";
  if (mode === "hard") return "上級";
  if (mode === "time") return "タイムアタック";
  return "";
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}