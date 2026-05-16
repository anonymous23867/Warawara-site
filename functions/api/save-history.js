export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

 const { userId, questionId, questionText, answerText, isCorrect } = data;

  if (!userId || !questionId || !questionText) {
    return Response.json({ error: "invalid data" }, { status: 400 });
  }

  await env.DB.prepare(`
    INSERT INTO question_history (
  user_id,
  question_id,
  question_text,
  answer_text,
  is_correct
)
VALUES (?, ?, ?, ?, ?)
  `)
   .bind(
  userId,
  questionId,
  questionText,
  answerText,
  isCorrect ? 1 : 0
)
    .run();

  // 直近100問を超えた古い履歴を削除
  await env.DB.prepare(`
    DELETE FROM question_history
    WHERE user_id = ?
    AND id NOT IN (
      SELECT id FROM question_history
      WHERE user_id = ?
      ORDER BY answered_at DESC
      LIMIT 100
    )
  `)
    .bind(userId, userId)
    .run();

  // 12時間より古い履歴を削除
  await env.DB.prepare(`
    DELETE FROM question_history
    WHERE answered_at < datetime('now', '-12 hours')
  `).run();

  return Response.json({ success: true });
}