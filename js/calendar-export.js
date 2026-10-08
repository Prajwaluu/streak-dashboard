import { MOODS, outcomeOf } from "./logic.js";

const WIDTH = 1080;
const HEIGHT = 1350;
const SCALE = 2;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MOOD_COLORS = ["#F5C84C", "#7CC4F2", "#B9C0CC", "#B9A6F5", "#F29B9B"];

const PALETTES = {
  white: {
    bg: "#F4F5F1", card: "#FFFFFF", border: "#E1E5DE", ink: "#202821", muted: "#69746C",
    quiet: "#F0F2EE", outline: "#AEB7AE", accent: "#467550", accentSoft: "#E6EEE5",
    full: "#3F7A52", part: "#E8B653", missed: "#D87970", future: "#F7F8F5", futureInk: "#B7BDB7"
  },
  cream: {
    bg: "#F3EBD8", card: "#FCF7E9", border: "#E5D8BB", ink: "#493B29", muted: "#7C6C56",
    quiet: "#F1E8D5", outline: "#B5A88E", accent: "#806247", accentSoft: "#EEE1C9",
    full: "#4E7950", part: "#D9A94B", missed: "#C96F5F", future: "#FBF7EC", futureInk: "#C9BFA9"
  },
  night: {
    bg: "#1D211E", card: "#272C28", border: "#3D453E", ink: "#F2F0E8", muted: "#B0B9AE",
    quiet: "#303631", outline: "#737E74", accent: "#9FC59D", accentSoft: "#344239",
    full: "#4D9564", part: "#E8B653", missed: "#D87970", future: "#2A2F2B", futureInk: "#667067"
  }
};

function dateKey(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function setFont(ctx, size, weight = 400, family = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif") {
  ctx.font = `${weight} ${size}px ${family}`;
}

function mix(a, b, amount) {
  const parse = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const aa = parse(a), bb = parse(b);
  return `#${aa.map((v, i) => Math.round(v + (bb[i] - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex) {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function monthDayCount(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function mondayOffset(year, month) {
  return (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
}

function validRating(day) {
  return Number.isFinite(day?.rating) && day.rating >= 0 && day.rating <= 10;
}

function validMood(day) {
  return Number.isInteger(day?.mood) && day.mood >= 0 && day.mood < MOODS.length;
}

function yearLabel(year, todayKey, currentYear, logged) {
  if (year < currentYear) return `Full year · ${logged} day${logged === 1 ? "" : "s"} with outcomes`;
  if (year > currentYear) return `Begins 1 January ${year}`;
  const [, month, day] = todayKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const formatted = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
  return `Through ${formatted} · ${logged} day${logged === 1 ? "" : "s"} with outcomes`;
}

function drawText(ctx, text, x, y, color, size, weight = 400, align = "left", family) {
  setFont(ctx, size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function drawPill(ctx, x, y, width, height, fill, stroke = null, dash = null) {
  roundedRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2;
    ctx.setLineDash(dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawLegend(ctx, mode, colors, y) {
  const ink = colors.ink, muted = colors.muted;
  drawText(ctx, "DAY KEY", 58, y, muted, 10, 700);
  const baseY = y + 27;
  if (mode === "status") {
    const items = [
      ["Conquered", colors.full], ["Tempered", colors.part], ["Defeated", colors.missed]
    ];
    let x = 58;
    for (const [label, fill] of items) {
      drawPill(ctx, x, baseY - 13, 19, 17, fill);
      drawText(ctx, label, x + 26, baseY, ink, 12, 500);
      x += label === "Conquered" ? 131 : 121;
    }
    drawPill(ctx, x, baseY - 13, 19, 17, colors.card, colors.outline);
    drawText(ctx, "No status", x + 26, baseY, ink, 12, 500);
    x += 117;
    drawPill(ctx, x, baseY - 13, 19, 17, colors.future, colors.futureInk, [3, 2]);
    drawText(ctx, "Future", x + 26, baseY, muted, 12, 500);
  } else if (mode === "rating") {
    drawText(ctx, "0", 58, baseY, muted, 11, 600);
    const start = 82;
    for (let i = 0; i < 6; i++) drawPill(ctx, start + i * 25, baseY - 13, 21, 17, mix(colors.quiet, colors.accent, 0.18 + (i / 5) * 0.82));
    drawText(ctx, "10", start + 6 * 25 + 2, baseY, muted, 11, 600);
    const x = 265;
    drawPill(ctx, x, baseY - 13, 19, 17, colors.card, colors.outline);
    drawText(ctx, "No rating", x + 26, baseY, ink, 12, 500);
    drawPill(ctx, 420, baseY - 13, 19, 17, colors.future, colors.futureInk, [3, 2]);
    drawText(ctx, "Future", 446, baseY, muted, 12, 500);
  } else {
    let x = 58;
    for (let i = 0; i < MOODS.length; i++) {
      drawPill(ctx, x, baseY - 14, 21, 18, MOOD_COLORS[i]);
      drawText(ctx, MOODS[i][0], x + 10.5, baseY, "#272821", 12, 500, "center", "system-ui, -apple-system, 'Segoe UI Emoji', sans-serif");
      drawText(ctx, MOODS[i][1], x + 27, baseY, ink, 11, 500);
      x += [103, 99, 116, 89, 125][i];
    }
    drawPill(ctx, x, baseY - 13, 19, 17, colors.card, colors.outline);
    drawText(ctx, "No mood", x + 25, baseY, ink, 11, 500);
    drawPill(ctx, x + 120, baseY - 13, 19, 17, colors.future, colors.futureInk, [3, 2]);
    drawText(ctx, "Future", x + 145, baseY, muted, 11, 500);
  }
}

/**
 * Render a year of daily entries as a 4:5 social image.
 * The returned canvas is 2160 × 2700 pixels and uses a 1080 × 1350 layout grid.
 */
export function renderYearCalendar(state, { year, today, mode = "status", theme = "white" } = {}) {
  const todayKey = dateKey(today);
  const currentYear = Number(todayKey.slice(0, 4));
  const selectedYear = Number.isInteger(year) && year >= 1 && year <= 9999 ? year : currentYear;
  const selectedMode = ["status", "rating", "mood"].includes(mode) ? mode : "status";
  const colors = PALETTES[theme] || PALETTES.white;
  const safeState = { days: state?.days && typeof state.days === "object" ? state.days : {} };

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = HEIGHT * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable in this browser.");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const yearEnd = `${String(selectedYear).padStart(4, "0")}-12-31`;
  const cutoff = todayKey < yearEnd ? todayKey : yearEnd;
  const totals = { full: 0, partial: 0, missed: 0 };
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= monthDayCount(selectedYear, month); day++) {
      const key = `${String(selectedYear).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (key > cutoff) continue;
      const outcome = outcomeOf(safeState, key);
      if (outcome) totals[outcome]++;
    }
  }
  const logged = totals.full + totals.partial + totals.missed;

  // Editorial header: the export intentionally contains no profile fields.
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(63, 59, 4, 0, Math.PI * 2);
  ctx.fill();
  drawText(ctx, "A PERSONAL YEAR IN REVIEW", 76, 63, colors.muted, 10, 700);
  drawText(ctx, "My year in days.", 58, 130, colors.ink, 49, 400, "left", "Georgia, 'Times New Roman', serif");
  drawText(ctx, String(selectedYear), 1020, 129, colors.accent, 52, 400, "right", "Georgia, 'Times New Roman', serif");
  drawText(ctx, yearLabel(selectedYear, todayKey, currentYear, logged), 60, 169, colors.muted, 14, 500);

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(58, 195);
  ctx.lineTo(1022, 195);
  ctx.stroke();

  drawText(ctx, "OUTCOMES TO DATE", 60, 222, colors.muted, 10, 700);
  const statItems = [
    ["Conquered", totals.full, colors.full],
    ["Tempered", totals.partial, colors.part],
    ["Defeated", totals.missed, colors.missed]
  ];
  let statX = 62;
  for (const [label, value, color] of statItems) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(statX + 5, 252, 5, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, String(value), statX + 19, 258, colors.ink, 18, 700);
    drawText(ctx, label, statX + 52, 257, colors.muted, 12, 500);
    statX += 191;
  }

  const margin = 56;
  const gap = 16;
  const cardWidth = (WIDTH - margin * 2 - gap * 2) / 3;
  const cardHeight = 211;
  const rowGap = 14;
  const startY = 294;
  const cellWidth = 27;
  const cellHeight = 21;
  const innerWidth = cardWidth - 32;
  const columnStep = innerWidth / 7;

  for (let month = 0; month < 12; month++) {
    const col = month % 3;
    const row = Math.floor(month / 3);
    const x = margin + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + rowGap);
    roundedRect(ctx, x, y, cardWidth, cardHeight, 12);
    ctx.fillStyle = colors.card;
    ctx.fill();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    const monthName = MONTHS[month];
    drawText(ctx, monthName, x + 16, y + 27, colors.ink, 15, 600, "left", "Georgia, 'Times New Roman', serif");
    if (selectedYear === currentYear && month === Number(todayKey.slice(5, 7)) - 1) {
      ctx.fillStyle = colors.accent;
      roundedRect(ctx, x + cardWidth - 42, y + 12, 27, 3, 1.5);
      ctx.fill();
    }

    const gridLeft = x + (cardWidth - innerWidth) / 2;
    for (let weekday = 0; weekday < 7; weekday++) {
      drawText(ctx, WEEKDAYS[weekday], gridLeft + columnStep * (weekday + 0.5), y + 48, colors.muted, 9, 600, "center");
    }

    const lead = mondayOffset(selectedYear, month);
    const daysInMonth = monthDayCount(selectedYear, month);
    for (let day = 1; day <= daysInMonth; day++) {
      const index = lead + day - 1;
      const week = Math.floor(index / 7);
      const weekday = index % 7;
      const key = `${String(selectedYear).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isFuture = key > todayKey;
      const entry = !isFuture ? (safeState.days[key] || null) : null;
      const centerX = gridLeft + columnStep * (weekday + 0.5);
      const top = y + 57 + week * 23;
      const left = centerX - cellWidth / 2;
      let fill = colors.card, stroke = null, dash = null, text = colors.ink;

      if (isFuture) {
        fill = colors.future;
        stroke = colors.futureInk;
        dash = [3, 2];
        text = colors.futureInk;
      } else if (selectedMode === "status") {
        const outcome = outcomeOf(safeState, key);
        if (outcome === "full") { fill = colors.full; text = "#FFFFFF"; }
        else if (outcome === "partial") { fill = colors.part; text = "#42341F"; }
        else if (outcome === "missed") { fill = colors.missed; text = "#402623"; }
        else stroke = colors.outline;
      } else if (selectedMode === "rating") {
        if (validRating(entry)) {
          const amount = 0.18 + (entry.rating / 10) * 0.82;
          fill = mix(colors.quiet, colors.accent, amount);
          text = luminance(fill) < 0.36 ? "#FFFFFF" : colors.ink;
        } else stroke = colors.outline;
      } else if (validMood(entry)) {
        fill = MOOD_COLORS[entry.mood];
        text = "#282824";
      } else stroke = colors.outline;

      drawPill(ctx, left, top, cellWidth, cellHeight, fill, stroke, dash);
      drawText(ctx, String(day), centerX, top + 15, text, 11.5, 600, "center");
    }
  }

  const footerY = 1208;
  ctx.strokeStyle = colors.border;
  ctx.beginPath();
  ctx.moveTo(58, footerY);
  ctx.lineTo(1022, footerY);
  ctx.stroke();
  drawLegend(ctx, selectedMode, colors, 1235);
  drawText(ctx, "Future days are shown for context and excluded from totals.", 58, 1310, colors.muted, 10, 400);

  return canvas;
}
