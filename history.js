const userId = localStorage.getItem("quizUserId");
const historyList = document.getElementById("historyList");

async function loadHistory() {
  if (!userId) {
    historyList.innerHTML = "<p>履歴がありません。</p>";
    return;
  }

  const res = await fetch(`/api/get-history?userId=${encodeURIComponent(userId)}`);
  const histories = await res.json();

  if (!histories.length) {
    historyList.innerHTML = "<p>まだ履歴がありません。</p>";
    return;
  }

  historyList.innerHTML = histories.map(item => `
    <div class="history-item">
      <div class="history-question">${escapeHtml(item.question_text)}</div>
      <div class="history-result ${item.is_correct ? "correct" : "wrong"}">
        ${item.is_correct ? "正解" : "不正解"}
      </div>
      <div class="history-time">${item.answered_at}</div>
    </div>
  `).join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadHistory();