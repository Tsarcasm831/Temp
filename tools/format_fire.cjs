const fs = require('fs');

function stripHtmlComments(s) {
  return s.replace(/<!--[^]*?-->/g, '').trim();
}

function normalizeTildes(text) {
  // Replace tildes used as separators with comma-space
  return text.replace(/\s*~\s*/g, ', ');
}

function formatLabelValue(item) {
  const idx = item.indexOf(':');
  if (idx === -1) return item.trim();
  const label = item.slice(0, idx).trim();
  let value = item.slice(idx + 1).trim();
  // Drop trailing comma(s)
  value = value.replace(/[，,]+\s*$/u, '').trim();
  // Normalize tildes and excess spaces
  value = normalizeTildes(value).replace(/\s{2,}/g, ' ').trim();
  return `**${label}:** ${value}`;
}

function parseMarkdown(md) {
  const blocks = [];
  const lines = stripHtmlComments(md).split(/\r?\n/);

  let i = 0;
  let listBuffer = null; // { items: [] }
  let paraBuffer = [];

  function flushParagraph() {
    if (paraBuffer.length) {
      const text = paraBuffer.join(' ').replace(/\s{2,}/g, ' ').trim();
      if (text) blocks.push({ type: 'paragraph', text });
      paraBuffer = [];
    }
  }

  function flushList() {
    if (listBuffer && listBuffer.items.length) {
      blocks.push({ type: 'list', items: listBuffer.items });
    }
    listBuffer = null;
  }

  while (i < lines.length) {
    let line = lines[i];

    // Trim right side; preserve leading for list detection
    const rtrimmed = line.replace(/\s+$/g, '');
    line = rtrimmed;

    if (!line.trim()) {
      flushParagraph();
      flushList();
      i++;
      continue;
    }

    // Heading: one or more # followed by space and text
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      blocks.push({ type: 'heading', level, text });
      i++;
      continue;
    }

    // List item: -, *, or • at start followed by space
    const listMatch = line.match(/^\s*([\-*•])\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      if (!listBuffer) listBuffer = { items: [] };
      let itemText = listMatch[2].trim();
      // If the item looks like Label: Value, pretty it up
      if (/^([^:]{1,80}):\s*/.test(itemText)) {
        itemText = formatLabelValue(itemText);
      } else {
        // Normalize tildes in general text
        itemText = normalizeTildes(itemText);
      }
      listBuffer.items.push(itemText);
      i++;
      // Handle possible wrapped list items on following indented lines
      while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
        let cont = lines[i].trim();
        cont = normalizeTildes(cont);
        const last = listBuffer.items.pop();
        listBuffer.items.push((last + ' ' + cont).replace(/\s{2,}/g, ' ').trim());
        i++;
      }
      continue;
    }

    // Otherwise, treat as paragraph content; allow simple wrapping
    paraBuffer.push(line.trim());
    i++;
  }

  // Flush any remaining buffers
  flushParagraph();
  flushList();

  return blocks;
}

function processFile(path) {
  const input = fs.readFileSync(path, 'utf8');
  let data;
  try {
    data = JSON.parse(input);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('Expected top-level array in', path);
    process.exit(1);
  }

  const result = data.map(entry => {
    if (entry && entry.raw && typeof entry.raw.markdown === 'string') {
      const structured = parseMarkdown(entry.raw.markdown);
      // Replace string markdown with structured blocks
      entry = { ...entry, raw: { ...entry.raw, markdown: structured } };
    }
    return entry;
  });

  fs.writeFileSync(path, JSON.stringify(result, null, 2) + '\n', 'utf8');
}

if (require.main === module) {
  const file = process.argv[2] || 'cache/by_group/fire.json';
  processFile(file);
}

