# Siteix Audit

Минимальный CLI-аудит страницы без зависимостей: HTTP-статус, title, description, H1, canonical, robots, viewport, изображения без `alt` и формы.

[Исходники](https://github.com/siteix-ru/siteix-audit)

## Запуск

```bash
node bin/siteix-audit.mjs https://siteix.ru/
node bin/siteix-audit.mjs https://siteix.ru/ --json
```

Или через npm:

```bash
npm install
npx siteix-audit https://siteix.ru/
```

## Что проверяет

- HTTP-статус и редирект;
- наличие и длину `title`;
- `meta description`;
- количество `H1`;
- `canonical`;
- `robots`;
- `viewport`;
- изображения без `alt`;
- наличие форм и ссылок.

Оценка — ориентир, а не замена полноценному SEO-аудиту. Инструмент не проверяет скорость, доступность, безопасность и качество контента.

## Пример

```text
URL: https://siteix.ru/
Статус: 200 · 420 мс · оценка 93/100
Title: Сайт-Доктор — доработка и поддержка сайтов
H1: Починю, ускорю и доделаю ваш сайт
...
```

## Тесты

```bash
npm test
```

## Лицензия

MIT. См. [LICENSE](LICENSE).
