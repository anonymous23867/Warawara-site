export async function onRequestPost(context) {
  const { request, env } = context;

  const data = await request.json();

  const userId = data.userId;
  const name = String(data.name || "").trim();

  if (!userId || !name || name.length > 10) {
    return Response.json(
      { error: "invalid data" },
      { status: 400 }
    );
  }

  await env.DB.prepare(`
    UPDATE rankings
    SET
      name = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `)
    .bind(name, userId)
    .run();

  return Response.json({ ok: true });
}