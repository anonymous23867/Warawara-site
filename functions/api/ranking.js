function getWeekStartJST() {
  const now = new Date();

  // JSTに変換
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  // 日曜始まり
  const day = jst.getUTCDay();
  jst.setUTCDate(jst.getUTCDate() - day);
  jst.setUTCHours(0, 0, 0, 0);

  // SQLite用にUTCへ戻す
  const utc = new Date(jst.getTime() - 9 * 60 * 60 * 1000);
  return utc.toISOString().slice(0, 19).replace("T", " ");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const data = await request.json();

  const userId = data.userId;
  const name = data.name;
  const score = Number(data.score);
  const correct = Number(data.correct);
  const answered = Number(data.answered);
  const accuracy = Number(data.accuracy);

  if (!userId || !name || answered <= 0 || !Number.isFinite(score)) {
    return Response.json(
      { error: "invalid data" },
      { status: 400 }
    );
  }

  const weekStart = getWeekStartJST();

  const existing = await env.DB.prepare(`
    SELECT score, updated_at
    FROM rankings
    WHERE user_id = ?
  `).bind(userId).first();

  // 今週の記録があり、今回のスコアがそれ以下なら更新しない
  if (
    existing &&
    existing.updated_at >= weekStart &&
    score <= existing.score
  ) {
    await env.DB.prepare(`
      UPDATE rankings
      SET last_seen_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(userId).run();

    return Response.json({
      ok: true,
      saved: false,
      message: "ランキング更新なし"
    });
  }

  await env.DB.prepare(`
    INSERT INTO rankings (
      user_id,
      name,
      score,
      correct,
      answered,
      accuracy,
      updated_at,
      last_seen_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

    ON CONFLICT(user_id)
    DO UPDATE SET
      name = excluded.name,
      score = excluded.score,
      correct = excluded.correct,
      answered = excluded.answered,
      accuracy = excluded.accuracy,
      updated_at = CURRENT_TIMESTAMP,
      last_seen_at = CURRENT_TIMESTAMP
  `)
    .bind(
      userId,
      name,
      score,
      correct,
      answered,
      accuracy
    )
    .run();

  return Response.json({
    ok: true,
    saved: true,
    message: "ランキング更新"
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  const weekStart = getWeekStartJST();

  await env.DB.prepare(`
    DELETE FROM rankings
    WHERE last_seen_at IS NOT NULL
      AND last_seen_at < datetime('now', '-90 days')
  `).run();

  const result = await env.DB.prepare(`
    SELECT
      user_id,
      name,
      score,
      correct,
      answered,
      accuracy
    FROM rankings
    WHERE is_banned = 0
      AND updated_at >= ?
    ORDER BY score DESC
    LIMIT 100
  `)
  .bind(weekStart)
  .all();

  return Response.json(result.results);
}