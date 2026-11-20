import { once } from 'node:events';

export async function serve(app, context) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeIdleConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

export async function quote(baseUrl, quantity) {
  const response = await fetch(`${baseUrl}/api/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
    signal: AbortSignal.timeout(5000)
  });
  return { status: response.status, body: await response.json() };
}
