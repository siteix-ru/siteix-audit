const normalizeSpace = (value = '') => value.replace(/\s+/g, ' ').trim();

const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? normalizeSpace(match[1]) : '';
};

const issue = (level, code, message) => ({ level, code, message });

export async function auditUrl(url, options = {}) {
  const timeout = options.timeout ?? 15000;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'siteix-audit/0.1 (+https://github.com/siteix-ru/siteix-audit)' },
    });
  } finally {
    clearTimeout(timer);
  }

  const html = await response.text();
  const elapsedMs = Date.now() - started;
  const title = normalizeSpace((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  const descriptionTag = (html.match(/<meta[^>]+name=["']description["'][^>]*>/i) || [])[0] || '';
  const description = getAttribute(descriptionTag, 'content');
  const canonicalTag = (html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) || [])[0] || '';
  const canonical = getAttribute(canonicalTag, 'href');
  const robotsTag = (html.match(/<meta[^>]+name=["']robots["'][^>]*>/i) || [])[0] || '';
  const robots = getAttribute(robotsTag, 'content');
  const viewportTag = (html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i) || [])[0] || '';
  const viewport = getAttribute(viewportTag, 'content');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => normalizeSpace(m[1].replace(/<[^>]+>/g, '')));
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const missingAlt = images.filter((tag) => !/\balt\s*=\s*["']/.test(tag)).length;
  const forms = (html.match(/<form\b/gi) || []).length;
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']*)["'][^>]*>/gi)].map((m) => m[1]);
  const issues = [];

  if (!response.ok) issues.push(issue('error', 'http', `HTTP ${response.status} ${response.statusText}`));
  if (response.redirected) issues.push(issue('info', 'redirect', `Редирект на ${response.url}`));
  if (!title) issues.push(issue('error', 'title', 'Нет title'));
  if (title && (title.length < 20 || title.length > 70)) issues.push(issue('warn', 'title-length', `Длина title ${title.length}, ориентир 20–70`));
  if (!description) issues.push(issue('warn', 'description', 'Нет meta description'));
  if (description && description.length > 170) issues.push(issue('warn', 'description-length', `Длина description ${description.length}, ориентир до 170`));
  if (h1s.length === 0) issues.push(issue('warn', 'h1', 'Нет H1'));
  if (h1s.length > 1) issues.push(issue('warn', 'h1-count', `H1 найдено: ${h1s.length}`));
  if (!canonical) issues.push(issue('info', 'canonical', 'Нет canonical'));
  if (!viewport) issues.push(issue('warn', 'viewport', 'Нет viewport'));
  if (missingAlt > 0) issues.push(issue('warn', 'img-alt', `Изображений без alt: ${missingAlt}`));
  if (!/(yandex|google|index)/i.test(robots)) issues.push(issue('info', 'robots', 'robots не задан или закрывает индексацию'));
  if (forms > 0 && links.length === 0) issues.push(issue('info', 'links', 'Есть формы, но нет ссылок'));

  const score = Math.max(0, 100 - issues.reduce((sum, item) => sum + (item.level === 'error' ? 20 : item.level === 'warn' ? 7 : 1), 0));

  return {
    url,
    finalUrl: response.url,
    status: response.status,
    ok: response.ok,
    elapsedMs,
    title,
    description,
    h1s,
    canonical,
    robots,
    viewport,
    images: images.length,
    missingAlt,
    forms,
    links: links.length,
    issues,
    score,
  };
}

export function formatReport(report) {
  const lines = [
    `URL: ${report.finalUrl}`,
    `Статус: ${report.status} · ${report.elapsedMs} мс · оценка ${report.score}/100`,
    `Title: ${report.title || '—'}`,
    `Description: ${report.description || '—'}`,
    `H1: ${report.h1s.join(' | ') || '—'}`,
    `Canonical: ${report.canonical || '—'}`,
    `Robots: ${report.robots || '—'}`,
    `Изображения: ${report.images}; без alt: ${report.missingAlt}; формы: ${report.forms}`,
    '',
    'Замечания:',
    ...(report.issues.length ? report.issues.map((item) => `- [${item.level}] ${item.message}`) : ['- критичных замечаний нет']),
  ];
  return lines.join('\n');
}
