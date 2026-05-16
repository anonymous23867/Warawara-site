const userId = localStorage.getItem("quizUserId");
const historyList = document.getElementById("historyList");
async function loadHistory() {
  try {
    if (!userId) {
      historyList.innerHTML = "<p>ユーザーIDが見つかりません。</p>";
      return;
    }

    const res = await fetch(`/api/get-history?userId=${encodeURIComponent(userId)}`);

    if (!res.ok) {
      historyList.innerHTML = `<p>履歴取得エラー：${res.status}</p>`;
      return;
    }

    const histories = await res.json();

    if (!Array.isArray(histories) || histories.length === 0) {
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
        <div class="history-answer">
  答え：${escapeHtml(item.answer_text || "不明")}
</div>
      </div>
    `).join("");
     const historyPage = document.getElementById("historyPage");



  } catch (error) {
    historyList.innerHTML = `<p>読み込み失敗：${escapeHtml(error.message)}</p>`;
  }
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