#!/usr/bin/env node
import { auditUrl, formatReport } from '../src/audit.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const url = args.find((arg) => !arg.startsWith('--'));

if (!url) {
  console.error('Использование: siteix-audit <url> [--json]');
  process.exit(2);
}

try {
  const report = await auditUrl(url);
  console.log(json ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.ok ? 0 : 1);
} catch (error) {
  console.error(`Ошибка: ${error.message}`);
  process.exit(2);
}
