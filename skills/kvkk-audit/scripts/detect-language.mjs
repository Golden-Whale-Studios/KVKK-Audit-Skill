#!/usr/bin/env node
// Usage: node detect-language.mjs   (prints the report language, e.g. "tr" or "en")
import { resolveLanguage } from './lib/lang.mjs';

const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
process.stdout.write(resolveLanguage({ env: process.env, intlLocale }) + '\n');
