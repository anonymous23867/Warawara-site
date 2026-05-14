export async function onRequestPost(context) {
  const { env } = context;

  const result = await env.DB.prepare(`
    DELETE FROM rankings
    WHERE last_seen_at < datetime('now', '-90 days')
  `).run();

  return Response.json({
    ok: true,
    deleted: result.meta.changes
  });
}