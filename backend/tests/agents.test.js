const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../app');

test('GET /api/agents returns list', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const data = await new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: '/api/agents' }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
  server.close();
  assert.equal(data.status, 200);
  const agents = JSON.parse(data.body);
  assert.ok(Array.isArray(agents));
});
