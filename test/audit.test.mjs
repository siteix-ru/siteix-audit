import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { auditUrl, formatReport } from '../src/audit.mjs';

let server;
let base;

before(async () => {
  server = createServer((req, res) => {
    if (req.url === '/health') {
      res.end('ok');
      return;
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(`<!doctype html>
      <html lang="ru">
        <head>
          <title>Хороший лендинг для проверки аудита</title>
          <meta name="description" content="Описание страницы для проверки базового SEO-аудита." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href="https://example.test/" />
        </head>
        <body>
          <h1>Заголовок страницы</h1>
          <img src="/hero.webp" alt="Фото" />
          <img src="/no-alt.webp" />
          <form><input /></form>
          <a href="/about">О нас</a>
        </body>
      </html>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('audits a page and finds missing alt', async () => {
  const report = await auditUrl(base);
  assert.equal(report.ok, true);
  assert.equal(report.title, 'Хороший лендинг для проверки аудита');
  assert.equal(report.h1s.length, 1);
  assert.equal(report.missingAlt, 1);
  assert.match(formatReport(report), /без alt: 1/);
});

test('reports a non-200 response', async () => {
  const report = await auditUrl(`${base}/health`);
  assert.equal(report.status, 200);
  assert.equal(report.forms, 0);
});
