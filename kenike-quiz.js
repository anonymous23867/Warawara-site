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

const rankingBtn = document.getElementById("rankingBtn");

rankingBtn.addEventListener("click", () => {
  window.location.href = "ranking.html";
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

  if (mode === "time") {
    const targetTotal = 300;

    const easyPool = shuffleArray([...easyQuestions]);
    const normalPool = shuffleArray([...normalQuestions]);
    const hardPool = shuffleArray([...hardQuestions]);

    const targetEasy = Math.floor(targetTotal * 0.3);
    const targetNormal = Math.floor(targetTotal * 0.4);
    const targetHard = Math.floor(targetTotal * 0.3);

    let selectedQuestions = [];

    selectedQuestions.push(...easyPool.slice(0, targetEasy));
    selectedQuestions.push(...normalPool.slice(0, targetNormal));
    selectedQuestions.push(...hardPool.slice(0, targetHard));

    // 重複チェック用
    const usedSet = new Set(selectedQuestions);

    // 足りない分は、まだ選ばれていないeasyで補充
    if (selectedQuestions.length < targetTotal) {
      const remainingEasy = easyPool.filter(q => !usedSet.has(q));

      selectedQuestions.push(
        ...remainingEasy.slice(0, targetTotal - selectedQuestions.length)
      );

      remainingEasy
        .slice(0, targetTotal - selectedQuestions.length)
        .forEach(q => usedSet.add(q));
    }

    // それでも足りない場合は、まだ選ばれていない全問題から補充
    if (selectedQuestions.length < targetTotal) {
      const allPool = shuffleArray([
        ...easyQuestions,
        ...normalQuestions,
        ...hardQuestions
      ]);

      const remainingAll = allPool.filter(q => !usedSet.has(q));

      selectedQuestions.push(
        ...remainingAll.slice(0, targetTotal - selectedQuestions.length)
      );
    }

    questions = shuffleArray(
      selectedQuestions.map(q => ({
        ...q,
        used: false
      }))
    );

  } else {

    questions = shuffleArray(
      quizData[mode].map(q => ({
        ...q,
        used: false
      }))
    );

  }

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

  preloadRandomQuestions(10);
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

  const remainingQuestions = questions.filter(q => !q.used);

  if (remainingQuestions.length === 0) {
    showResult();
    return;
  }

  // 画像なし問題
  const noMediaQuestions = remainingQuestions.filter(q => !q.media);

  // プリロード済みの画像あり問題
  const preloadedMediaQuestions = remainingQuestions.filter(q => {
    return q.media && imageCache.has(q.media);
  });

  let q = null;

  // 5:5で抽選
  const usePreloaded = Math.random() < 0.5;

  if (usePreloaded && preloadedMediaQuestions.length > 0) {
    q = preloadedMediaQuestions[
      Math.floor(Math.random() * preloadedMediaQuestions.length)
    ];
  } else if (!usePreloaded && noMediaQuestions.length > 0) {
    q = noMediaQuestions[
      Math.floor(Math.random() * noMediaQuestions.length)
    ];
  } else if (preloadedMediaQuestions.length > 0) {
    q = preloadedMediaQuestions[
      Math.floor(Math.random() * preloadedMediaQuestions.length)
    ];
  } else if (noMediaQuestions.length > 0) {
    q = noMediaQuestions[
      Math.floor(Math.random() * noMediaQuestions.length)
    ];
  } else {
    // 画像あり問題がまだ読み込み中なら待つ
    setTimeout(showQuestion, 100);
    return;
  }

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

  preloadRandomQuestions(2);
}

async function selectAnswer(selectedIndex, q) {
  const buttons = document.querySelectorAll(".choice-btn");

  answeredCount++;

  const isCorrect = selectedIndex === q.answer;

  if (isCorrect) {
    correctCount++;
  }

  // 履歴保存
  const userData = getUserData();

  fetch("/api/save-history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
   body: JSON.stringify({
  userId: userData.userId,
  questionId: q.id || crypto.randomUUID(),
  questionText: q.question,
  answerText: q.choices[q.answer],
  isCorrect
})
  });

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

    // それ以外は赤
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

  const total = currentMode === "time"
    ? answeredCount
    : TOTAL_QUESTIONS;

  const accuracy = total === 0
    ? 0
    : correctCount / total;

  const rate = Math.round(accuracy * 100);

  // タイムアタックのみランキングボタン表示
  if (currentMode === "time") {

    rankingBtn.style.display = "block";

    const score = Math.floor(
      correctCount * accuracy * accuracy * 100
    );

    resultScore.textContent = `スコア ${score}`;
    resultRate.textContent =
      `${correctCount} / ${total} （正答率 ${rate}%）`;

    saveTimeAttackRanking(
      score,
      correctCount,
      total,
      accuracy
    );

  } else {

    // 通常モードでは非表示
    rankingBtn.style.display = "none";

    resultScore.textContent =
      `${correctCount} / ${total}`;

    resultRate.textContent =
      `正答率 ${rate}%`;
  }

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
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    // 入れ替え
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function generateUserId() {
  return "usr_" + crypto.randomUUID().replace(/-/g, "");
}

function generateRandomName(length = 5) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  let name = "";

  for (let i = 0; i < length; i++) {
    name += chars[Math.floor(Math.random() * chars.length)];
  }

  return name;
}

function getUserData() {
  let userId = localStorage.getItem("quizUserId");
  let playerName = localStorage.getItem("quizPlayerName");

  // ユーザーID生成
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem("quizUserId", userId);
  }

  // 名前生成
  if (!playerName) {
    playerName = generateRandomName(5);
    localStorage.setItem("quizPlayerName", playerName);
  }

  return {
    userId,
    playerName
  };
}

async function saveTimeAttackRanking(
  score,
  correct,
  answered,
  accuracy
) {
  const userData = getUserData();

  const data = {
    userId: userData.userId,
    name: userData.playerName,
    score,
    correct,
    answered,
    accuracy: Math.round(accuracy * 100)
  };

  await fetch("/api/ranking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

function changePlayerName(newName) {
  const trimmed = newName.trim();

  if (!trimmed) return;

  localStorage.setItem(
    "quizPlayerName",
    trimmed.slice(0, 12)
  );
}


