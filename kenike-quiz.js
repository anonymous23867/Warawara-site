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
window.quizDataParts = window.quizDataParts || {};
const easyQuestions = window.quizDataParts.easy || [];
const normalQuestions = window.quizDataParts.normal || [];
const hardQuestions = window.quizDataParts.hard || [];

const quizData = {
  easy: easyQuestions,
  normal: normalQuestions,
  hard: hardQuestions,
  time: [
    ...easyQuestions,
    ...normalQuestions,
    ...hardQuestions
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
 questions = shuffleArray(
  quizData[mode].map(q => ({
    ...q,
    used: false
  }))
);

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

  preloadRandomQuestions(20);
　showQuestion();
}

function showQuestion() {
 const maxQuestions = Math.min(TOTAL_QUESTIONS, questions.length);

if (currentMode !== "time" && answeredCount >= maxQuestions) {
  showResult();
  return;
}

if (currentMode === "time" && answeredCount >= questions.length) {
  showResult();
  return;
}

  // 読み込み済み or 画像なし問題だけ抽出
  const remainingQuestions = questions.filter(q => !q.used);

const availableQuestions = remainingQuestions.filter(q => {
  return !q.media || imageCache.has(q.media);
});

// もう出題できる問題自体がない
if (remainingQuestions.length === 0) {
  showResult();
  return;
}

// まだ読み込み待ち
if (availableQuestions.length === 0) {
  setTimeout(showQuestion, 100);
  return;
}

  // ランダム出題
  const q = availableQuestions[
    Math.floor(Math.random() * availableQuestions.length)
  ];

  q.used = true;

  if (currentMode === "time") {
    progressText.textContent = `${answeredCount}問回答`;
  } else {
    progressText.textContent = `${answeredCount + 1} / ${maxQuestions}`;
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
      selectAnswer(index, q);
    });

    choices.appendChild(btn);
  });

  preloadRandomQuestions(10);
}

function selectAnswer(selectedIndex, q) {
  const buttons = document.querySelectorAll(".choice-btn");

  answeredCount++;

  if (selectedIndex === q.answer) {
    correctCount++;
  }

  if (currentMode === "time") {
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

const imageCache = new Set();

function preloadRandomQuestions(count = 15) {
  const candidates = questions
    .filter(q => q.media && !imageCache.has(q.media))
    .sort(() => Math.random() - 0.5);

  candidates.slice(0, count).forEach(q => {
    const img = new Image();

    img.onload = () => {
      imageCache.add(q.media);
    };

    img.onerror = () => {
      imageCache.add(q.media);
    };

    img.src = q.media;
  });
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}