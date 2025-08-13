import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import axios from "axios";
import * as cheerio from "cheerio";
import xlsx from "xlsx";

const PAGE_URL = "https://brestgortrans.by/raspisanie";
const DATA_DIR = "data";
const META_FILE = path.join(DATA_DIR, "timetable.meta.json");
const OUT_FILE  = path.join(DATA_DIR, "timetable.json");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const abs = (href) => new URL(href, PAGE_URL).href;

const HINTS = {
  route:  [/^марш/i, /^№\b/i, /номер/i, /маршрут/i],
  stop:   [/останов/i, /остановоч/i],
  time:   [/^время/i, /отправл/i, /расписан/i]
};
const MIN_HEADERS_IN_ROW = 2;     // сколько «попаданий» нужно, чтобы считать строку шапкой
const MAX_HEADER_SCAN_ROWS = 15;  // сколько верхних строк сканировать на предмет шапки

function readMeta() {
  if (!fs.existsSync(META_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(META_FILE, "utf8")); } catch { return {}; }
}
function writeMeta(meta) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

function detectTypeFromLabel(label = "", href = "") {
  const s = `${label} ${href}`.toLowerCase();
  if (/[^\w]т[^\w]/i.test(label) || /тролле/i.test(s)) return "trolley";
  if (/экспресс|маршрутн|микроавтобус|м/i.test(s))   return "express"; // «М_город» и т.п.
  return "bus";
}

/** Приводим строку времени к «HH:MM» и делим по любым разделителям */
function normalizeTimes(cell) {
  if (!cell) return [];
  let raw = String(cell)
    .replace(/\u00A0/g, ' ') // nbsp
    .replace(/[–—]/g, '-')   // длинные тире
    .trim();

  // Иногда в файле «08 10 12 14», «08,10;12  14», и т.д.
  let parts = raw.split(/[^0-9:]+/).map(s => s.trim()).filter(Boolean);

  // Привести «810» → 8:10 и т.п.
  parts = parts.map(p => {
    if (/^\d{1,2}:\d{2}$/.test(p)) return p;
    if (/^\d{3}$/.test(p)) return `${p.slice(0,1)}:${p.slice(1)}`;
    if (/^\d{4}$/.test(p)) return `${p.slice(0,2)}:${p.slice(2)}`;
    if (/^\d{1,2}$/.test(p)) return `${p.padStart(2,'0')}:00`;
    return p;
  });

  // финальная фильтрация
  return parts.filter(x => /^\d{1,2}:\d{2}$/.test(x));
}

/** Поиск шапки и индексов колонок по синонимам */
function detectHeaderAndMap(sheet) {
  // Преобразуем лист в массив массивов (AOA), чтобы видеть «сырые» заголовки
  const range = xlsx.utils.decode_range(sheet["!ref"]);
  const rows = [];
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + MAX_HEADER_SCAN_ROWS); r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[xlsx.utils.encode_cell({ r, c })];
      row.push(cell ? String(cell.v).trim() : "");
    }
    rows.push(row);
  }

  // ищем строку, где есть минимум 2 совпадения с любыми хинтами
  let headerRowIndex = -1, header = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const hits = row.filter(v => {
      const s = v.toLowerCase();
      return [...HINTS.route, ...HINTS.stop, ...HINTS.time].some(rx => rx.test(s));
    }).length;
    if (hits >= MIN_HEADERS_IN_ROW) {
      headerRowIndex = i;
      header = row;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // в лог — какие верхние заголовки видим
    console.warn("⚠️  Не найден явный ряд заголовков. Видимые заголовки (top rows):");
    for (const row of rows) console.warn(" •", row.join(" │ "));
    return null;
  }

  // сопоставляем индексы колонок
  const map = { route: -1, stop: -1, time: -1 };
  header.forEach((title, idx) => {
    const s = title.toLowerCase();
    if (map.route === -1 && HINTS.route.some(rx => rx.test(s))) map.route = idx;
    if (map.stop  === -1 && HINTS.stop.some (rx => rx.test(s))) map.stop  = idx;
    if (map.time  === -1 && HINTS.time.some (rx => rx.test(s))) map.time  = idx;
  });

  if (map.route === -1 && map.stop === -1 && map.time === -1) {
    console.warn("⚠️  Шапка найдена, но не удалось промапить ключевые колонки:", header);
    return null;
  }

  return { headerRowIndex, map, header };
}

/** Читаем лист, пытаемся найти шапку и нормализуем строки */
function extractRowsFromSheet(sheet, type, srcUrl, sheetName) {
  const info = detectHeaderAndMap(sheet);
  if (!info) return [];

  const { headerRowIndex, map } = info;
  const range = xlsx.utils.decode_range(sheet["!ref"]);
  const out = [];

  for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
    const get = (c) => {
      const cell = sheet[xlsx.utils.encode_cell({ r, c })];
      return cell ? String(cell.v).trim() : "";
    };
    const route = map.route >= 0 ? get(map.route) : "";
    const stop  = map.stop  >= 0 ? get(map.stop)  : "";
    const times = map.time  >= 0 ? normalizeTimes(get(map.time)) : [];

    if (!route && !stop && times.length === 0) continue; // пустая строка
    out.push({ route, stop, times, type, source: { url: srcUrl, sheet: sheetName } });
  }

  return out;
}

(async function main() {
  console.log("Fetch:", PAGE_URL);
  const html = (await axios.get(PAGE_URL, { timeout: 30000 })).data;
  const $ = cheerio.load(html);

  const links = [];
  $("a[href$='.xls'], a[href$='.xlsx']").each((_, a) => {
    const href = $(a).attr("href");
    const label = $(a).text().trim();
    if (!href) return;
    links.push({ href: abs(href), label });
  });

  if (!links.length) {
    console.error("На странице нет .xls/.xlsx ссылок. Структура изменилась?");
    process.exit(1);
  }

  const meta = readMeta();
  const merged = [];
  let anyChanged = false;

  for (const [i, link] of links.entries()) {
    console.log(`[${i+1}/${links.length}] ${link.label} → ${link.href}`);
    let res;
    try {
      res = await axios.get(link.href, { responseType: "arraybuffer", timeout: 60000, maxRedirects: 5 });
    } catch (e) {
      console.warn("  ⚠️ Скачивание не удалось:", e.message);
      continue;
    }

    const buf  = Buffer.from(res.data);
    const hash = sha256(buf);
    const key  = link.href;
    const prev = meta[key]?.hash;

    if (prev !== hash) {
      anyChanged = true;
      meta[key] = { hash, label: link.label, updatedAt: new Date().toISOString() };
      console.log("  → новый/обновлённый файл");
    } else {
      console.log("  → без изменений (hash совпадает)");
    }

    const wb = xlsx.read(buf, { type: "buffer" });
    const type = detectTypeFromLabel(link.label, link.href);

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows  = extractRowsFromSheet(sheet, type, link.href, sheetName);
      merged.push(...rows);
    }

    await sleep(300);
  }

  if (!merged.length) {
    console.log("Не удалось извлечь ни одной строки — сохраняем meta и выходим.");
    writeMeta(meta);
    process.exit(0);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
  writeMeta(meta);

  console.log(`Готово: ${merged.length} записей в ${OUT_FILE}`);
  if (!anyChanged) console.log("Файлы не менялись — JSON обновлён из актуальных источников.");
})();
