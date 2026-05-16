export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  // 12時間より古い履歴を削除
  await env.DB.prepare(`
    DELETE FROM question_history
    WHERE answered_at < datetime('now', '-12 hours')
  `).run();

  const result = await env.DB.prepare(`
    SELECT
  question_id,
  question_text,
  answer_text,
  is_correct,
  answered_at
    FROM question_history
    WHERE user_id = ?
    ORDER BY answered_at DESC
    LIMIT 100
  `)
    .bind(userId)
    .all();

  return Response.json(result.results);
}