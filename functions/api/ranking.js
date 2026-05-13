export async function onRequestPost(context) {
  const { request, env } = context;

  const data = await request.json();

  const userId = data.userId;
  const name = data.name;
  const score = Number(data.score);
  const correct = Number(data.correct);
  const answered = Number(data.answered);
  const accuracy = Number(data.accuracy);

  if (!userId || !name || answered <= 0) {
    return Response.json(
      { error: "invalid data" },
      { status: 400 }
    );
  }

  await env.DB.prepare(`
    INSERT INTO rankings (
      user_id,
      name,
      score,
      correct,
      answered,
      accuracy,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)

    ON CONFLICT(user_id)
    DO UPDATE SET
      name = excluded.name,

      score = CASE
        WHEN excluded.score > rankings.score
        THEN excluded.score
        ELSE rankings.score
      END,

      correct = excluded.correct,
      answered = excluded.answered,
      accuracy = excluded.accuracy,
      updated_at = CURRENT_TIMESTAMP
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

  return Response.json({ ok: true });
}

export async function onRequestGet(context) {
  const { env } = context;

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

    ORDER BY score DESC

    LIMIT 100
  `).all();

  return Response.json(result.results);
}