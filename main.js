var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ClientExportPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var ClientExportPlugin = class extends import_obsidian.Plugin {
  constructor(app, manifest) {
    super(app, manifest);
  }
  async onload() {
    console.log("[Client Export] Plugin loading\u2026");
    this.addCommand({
      id: "export-active-note-to-client-html",
      name: "Export active note to Client HTML",
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && activeFile.extension === "md") {
          if (!checking) this.handleExport([activeFile]);
          return true;
        }
        return false;
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        const targets = this.collectMarkdownFiles(file);
        if (targets.length === 0) return;
        menu.addItem(
          (item) => item.setTitle("Export to Client HTML").setIcon("file-output").setSection("action").onClick(() => this.handleExport(targets))
        );
      })
    );
    this.registerEvent(
      this.app.workspace.on(
        "files-menu",
        (menu, files) => {
          const targets = files.flatMap((f) => this.collectMarkdownFiles(f));
          if (targets.length === 0) return;
          menu.addItem(
            (item) => item.setTitle(`Export ${targets.length} note(s) to Client HTML`).setIcon("file-output").setSection("action").onClick(() => this.handleExport(targets))
          );
        }
      )
    );
    console.log("[Client Export] Plugin loaded \u2713");
  }
  async onunload() {
    console.log("[Client Export] Plugin unloaded.");
  }
  // ── Helpers ─────────────────────────────────────────────────────────────────
  /** Recursively gather .md files from a file or folder target. */
  collectMarkdownFiles(target) {
    if (target instanceof import_obsidian.TFile)
      return target.extension === "md" ? [target] : [];
    if (target instanceof import_obsidian.TFolder) {
      const out = [];
      for (const child of target.children)
        out.push(...this.collectMarkdownFiles(child));
      return out;
    }
    return [];
  }
  /**
   * Open the Export Modal so the user can review / reorder files,
   * set options, and trigger the actual export.
   */
  async handleExport(files) {
    if (files.length === 0) {
      new import_obsidian.Notice("\u26A0\uFE0F No Markdown files selected for export.");
      return;
    }
    new ExportModal(this.app, files).open();
  }
};
var ExportModal = class extends import_obsidian.Modal {
  constructor(app, files) {
    super(app);
    this.files = files;
    this.selected = new Set(files.map((f) => f.path));
    this.order = files.map((f) => f.path);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ce-modal");
    const header = contentEl.createDiv("ce-header");
    header.createEl("h2", { text: "Export to Client HTML" });
    header.createEl("p", {
      cls: "ce-subtitle",
      text: "Review and reorder your notes, set options, then export."
    });
    contentEl.createEl("p", { cls: "ce-section-label", text: "Notes to export" });
    const fileListEl = contentEl.createEl("ul", { cls: "ce-file-list" });
    this.renderFileList(fileListEl);
    contentEl.createEl("p", { cls: "ce-section-label", text: "Document options" });
    const optionsGrid = contentEl.createDiv("ce-options-grid");
    const titleRow = optionsGrid.createDiv("ce-option-row");
    titleRow.createEl("label", { text: "Document title", attr: { for: "ce-title" } });
    const titleInput = titleRow.createEl("input", {
      type: "text",
      attr: {
        id: "ce-title",
        placeholder: "My Client Proposal",
        value: this.files.length === 1 ? this.files[0].basename : "Client Export"
      }
    });
    const fnRow = optionsGrid.createDiv("ce-option-row");
    fnRow.createEl("label", { text: "Output filename", attr: { for: "ce-filename" } });
    const filenameInput = fnRow.createEl("input", {
      type: "text",
      attr: {
        id: "ce-filename",
        placeholder: "client-export",
        value: this.files.length === 1 ? this.files[0].basename.replace(/\s+/g, "-").toLowerCase() : "client-export"
      }
    });
    const themeRow = optionsGrid.createDiv("ce-option-row");
    themeRow.createEl("label", { text: "Theme", attr: { for: "ce-theme" } });
    const themeSelect = themeRow.createEl("select", { attr: { id: "ce-theme" } });
    [
      { value: "light", label: "\u2600\uFE0F  Light" },
      { value: "dark", label: "\u{1F319}  Dark" },
      { value: "auto", label: "\u{1F5A5}  System (auto)" }
    ].forEach(({ value, label }) => {
      const opt = themeSelect.createEl("option", { text: label });
      opt.value = value;
    });
    const togglesRow = contentEl.createDiv("ce-toggles");
    const navToggle = this.createToggle(
      togglesRow,
      "ce-nav",
      "Include sidebar navigation",
      true
    );
    const tocToggle = this.createToggle(
      togglesRow,
      "ce-toc",
      "Include in-page table of contents",
      true
    );
    const actions = contentEl.createDiv("ce-actions");
    const cancelBtn = actions.createEl("button", {
      cls: "ce-btn ce-btn-secondary",
      text: "Cancel"
    });
    cancelBtn.addEventListener("click", () => this.close());
    const exportBtn = actions.createEl("button", {
      cls: "ce-btn ce-btn-primary",
      text: "\u2B07  Export HTML"
    });
    exportBtn.addEventListener("click", async () => {
      const selectedFiles = this.order.filter((p) => this.selected.has(p)).map((p) => this.files.find((f) => f.path === p)).filter(Boolean);
      if (selectedFiles.length === 0) {
        new import_obsidian.Notice("\u26A0\uFE0F Select at least one note to export.");
        return;
      }
      const options = {
        title: titleInput.value.trim() || "Client Export",
        filename: filenameInput.value.trim() || "client-export",
        theme: themeSelect.value,
        includeNav: navToggle.checked,
        includeToc: tocToggle.checked
      };
      exportBtn.textContent = "\u23F3 Generating\u2026";
      exportBtn.setAttribute("disabled", "true");
      try {
        await runExport(this.app, selectedFiles, options);
        new import_obsidian.Notice(`\u2705 Exported "${options.filename}.html" to your vault folder!`, 6e3);
        this.close();
      } catch (err) {
        console.error("[Client Export]", err);
        new import_obsidian.Notice(`\u274C Export failed: ${err.message}`);
        exportBtn.textContent = "\u2B07  Export HTML";
        exportBtn.removeAttribute("disabled");
      }
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  // ── Internal render helpers ──────────────────────────────────────────────────
  renderFileList(listEl) {
    listEl.empty();
    this.order.forEach((path, idx) => {
      const file = this.files.find((f) => f.path === path);
      if (!file) return;
      const li = listEl.createEl("li", { cls: "ce-file-item" });
      li.setAttribute("draggable", "true");
      li.dataset.path = path;
      const cb = li.createEl("input", { type: "checkbox" });
      cb.checked = this.selected.has(path);
      cb.addEventListener("change", () => {
        if (cb.checked) this.selected.add(path);
        else this.selected.delete(path);
      });
      li.createEl("span", { cls: "ce-drag-handle", text: "\u283F" });
      li.createEl("span", { cls: "ce-file-icon", text: "\u{1F4C4}" });
      li.createEl("span", { cls: "ce-file-name", text: file.basename });
      if (file.parent && file.parent.path !== "/") {
        li.createEl("span", {
          cls: "ce-file-folder",
          text: file.parent.path
        });
      }
      const arrows = li.createDiv("ce-arrows");
      const upBtn = arrows.createEl("button", { text: "\u2191", attr: { title: "Move up" } });
      const dnBtn = arrows.createEl("button", { text: "\u2193", attr: { title: "Move down" } });
      upBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (idx > 0) {
          [this.order[idx - 1], this.order[idx]] = [this.order[idx], this.order[idx - 1]];
          this.renderFileList(listEl);
        }
      });
      dnBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (idx < this.order.length - 1) {
          [this.order[idx], this.order[idx + 1]] = [this.order[idx + 1], this.order[idx]];
          this.renderFileList(listEl);
        }
      });
      this.attachDragHandlers(li, path, listEl);
    });
  }
  attachDragHandlers(li, path, listEl) {
    li.addEventListener("dragstart", (e) => {
      var _a;
      (_a = e.dataTransfer) == null ? void 0 : _a.setData("text/plain", path);
      li.addClass("ce-dragging");
    });
    li.addEventListener("dragend", () => li.removeClass("ce-dragging"));
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      li.addClass("ce-drag-over");
    });
    li.addEventListener("dragleave", () => li.removeClass("ce-drag-over"));
    li.addEventListener("drop", (e) => {
      var _a;
      e.preventDefault();
      li.removeClass("ce-drag-over");
      const fromPath = (_a = e.dataTransfer) == null ? void 0 : _a.getData("text/plain");
      if (!fromPath || fromPath === path) return;
      const fromIdx = this.order.indexOf(fromPath);
      const toIdx = this.order.indexOf(path);
      if (fromIdx === -1 || toIdx === -1) return;
      this.order.splice(fromIdx, 1);
      this.order.splice(toIdx, 0, fromPath);
      this.renderFileList(listEl);
    });
  }
  createToggle(parent, id, label, defaultOn) {
    const row = parent.createDiv("ce-toggle-row");
    const cb = row.createEl("input", {
      type: "checkbox",
      attr: { id }
    });
    cb.checked = defaultOn;
    row.createEl("label", { text: label, attr: { for: id } });
    return cb;
  }
};
async function runExport(app, files, options) {
  const sections = [];
  for (const file of files) {
    const raw = await app.vault.read(file);
    const embeddedMd = await ImageEmbedder.embedAll(app, file, raw);
    const bodyHtml = MarkdownRenderer.render(embeddedMd);
    const id = slugify(file.basename);
    sections.push({ title: file.basename, id, html: bodyHtml });
  }
  const htmlDocument = HtmlBuilder.build(sections, options);
  await Downloader.save(app, files[0], options.filename, htmlDocument);
}
var MarkdownRenderer = class _MarkdownRenderer {
  static render(markdown) {
    let md = markdown;
    md = md.replace(/^---[\s\S]*?---\n?/, "");
    const codeBlocks = [];
    md = md.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      const trimmed = code.trimEnd();
      const langLower = (lang || "").toLowerCase();
      const highlighted = langLower ? SyntaxHighlighter.highlight(trimmed, langLower) : escapeHtml(trimmed);
      const langLabel = langLower ? `<span class="ce-code-lang">${escapeHtml(langLower)}</span>` : "";
      const langAttr = langLower ? ` class="language-${escapeHtml(langLower)}"` : "";
      codeBlocks.push(
        `<div class="ce-code-wrap">${langLabel}<pre class="ce-code-block"><code${langAttr}>${highlighted}</code></pre></div>`
      );
      return `\0CODE${idx}\0`;
    });
    const inlineCodes = [];
    md = md.replace(/`([^`]+)`/g, (_, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(`<code class="ce-inline-code">${escapeHtml(code)}</code>`);
      return `\0ICODE${idx}\0`;
    });
    md = md.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, target, alias) => alias || target
    );
    const lines = md.split("\n");
    const output = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
        output.push("<hr>");
        i++;
        continue;
      }
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = inlineRender(headingMatch[2]);
        const id = slugify(headingMatch[2]);
        output.push(`<h${level} id="${id}">${text}</h${level}>`);
        i++;
        continue;
      }
      if (line.startsWith(">")) {
        const bqLines = [];
        while (i < lines.length && lines[i].startsWith(">")) {
          bqLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        output.push(`<blockquote>${_MarkdownRenderer.render(bqLines.join("\n"))}</blockquote>`);
        continue;
      }
      if (line.startsWith("\0CODE")) {
        output.push(line);
        i++;
        continue;
      }
      if (i + 1 < lines.length && /^\|?[\s-|:]+\|[\s-|:]*$/.test(lines[i + 1])) {
        const tableResult = parseTable(lines, i);
        if (tableResult) {
          output.push(tableResult.html);
          i = tableResult.nextLine;
          continue;
        }
      }
      if (/^(\s*[-*+]\s)/.test(line)) {
        const { html, nextLine } = parseList(lines, i, false);
        output.push(html);
        i = nextLine;
        continue;
      }
      if (/^(\s*\d+\.\s)/.test(line)) {
        const { html, nextLine } = parseList(lines, i, true);
        output.push(html);
        i = nextLine;
        continue;
      }
      if (line.trim() === "") {
        i++;
        continue;
      }
      const paraLines = [];
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith(">") && !/^(\s*[-*+]\s)/.test(lines[i]) && !/^(\s*\d+\.\s)/.test(lines[i]) && !/^(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        output.push(`<p>${inlineRender(paraLines.join(" "))}</p>`);
      }
    }
    let result = output.join("\n");
    codeBlocks.forEach((block, idx) => {
      result = result.replace(`\0CODE${idx}\0`, block);
    });
    inlineCodes.forEach((block, idx) => {
      result = result.replace(`\0ICODE${idx}\0`, block);
    });
    return result;
  }
};
function inlineRender(text) {
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, src) => `<img src="${src}" alt="${escapeHtml(alt)}" class="ce-img">`
  );
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, href) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
  );
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/_(.+?)_/g, "<em>$1</em>");
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
  text = text.replace(/==(.+?)==/g, "<mark>$1</mark>");
  return text;
}
function parseTable(lines, startIdx) {
  const headerLine = lines[startIdx];
  const separatorLine = lines[startIdx + 1];
  if (!separatorLine || !/^\|?[\s\-|:]+\|[\s\-|:]*$/.test(separatorLine))
    return null;
  const parseRow = (row) => row.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const headers = parseRow(headerLine);
  const alignments = parseRow(separatorLine).map((c) => {
    if (/^:-+:$/.test(c.trim())) return "center";
    if (/^-+:$/.test(c.trim())) return "right";
    return "left";
  });
  let i = startIdx + 2;
  const rows = [];
  while (i < lines.length && lines[i].includes("|")) {
    rows.push(parseRow(lines[i]));
    i++;
  }
  const thCells = headers.map(
    (h, ci) => `<th style="text-align:${alignments[ci] || "left"}">${inlineRender(h)}</th>`
  ).join("");
  const bodyRows = rows.map((row) => {
    const tds = row.map(
      (cell, ci) => `<td style="text-align:${alignments[ci] || "left"}">${inlineRender(cell)}</td>`
    ).join("");
    return `<tr>${tds}</tr>`;
  }).join("\n");
  const html = `<table class="ce-table"><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  return { html, nextLine: i };
}
function parseList(lines, startIdx, ordered) {
  const tag = ordered ? "ol" : "ul";
  const pattern = ordered ? /^(\s*)\d+\.\s+(.*)$/ : /^(\s*)[-*+]\s+(.*)$/;
  const items = [];
  let i = startIdx;
  while (i < lines.length) {
    const match = lines[i].match(pattern);
    if (!match) break;
    let content = match[2];
    const taskMatch = content.match(/^\[(x| )\]\s+(.*)$/i);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === "x";
      content = `<label class="ce-task"><input type="checkbox" ${checked ? "checked" : ""} disabled> ${inlineRender(taskMatch[2])}</label>`;
    } else {
      content = inlineRender(content);
    }
    items.push(`<li>${content}</li>`);
    i++;
  }
  return { html: `<${tag}>${items.join("")}</${tag}>`, nextLine: i };
}
var HtmlBuilder = class {
  static build(sections, options) {
    const { title, theme, includeNav, includeToc } = options;
    const navHtml = includeNav ? `<nav class="ce-sidebar">
          <div class="ce-sidebar-title">${escapeHtml(title)}</div>
          <ul>
            ${sections.map(
      (s) => `<li><a href="#${s.id}">${escapeHtml(s.title)}</a></li>`
    ).join("\n            ")}
          </ul>
        </nav>` : "";
    function buildToc(html) {
      const headings = [];
      const re = /<h([2-4])\s+id="([^"]+)">([^<]+)<\/h\1>/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        headings.push({ level: parseInt(m[1]), id: m[2], text: m[3] });
      }
      if (headings.length < 2) return "";
      const items = headings.map(
        (h) => `<li class="ce-toc-h${h.level}"><a href="#${h.id}">${escapeHtml(
          h.text
        )}</a></li>`
      ).join("\n");
      return `<nav class="ce-toc"><p class="ce-toc-label">Contents</p><ul>${items}</ul></nav>`;
    }
    const articlesHtml = sections.map((s) => {
      const toc = includeToc ? buildToc(s.html) : "";
      return `<article id="${s.id}" class="ce-section">
          <h1 class="ce-note-title">${escapeHtml(s.title)}</h1>
          ${toc}
          <div class="ce-note-body">${s.html}</div>
        </article>`;
    }).join("\n\n");
    const colorSchemeMeta = theme === "auto" ? `<meta name="color-scheme" content="light dark">` : `<meta name="color-scheme" content="${theme}">`;
    const bodyDataTheme = theme === "auto" ? "" : `data-theme="${theme}"`;
    return `<!DOCTYPE html>
<html lang="en" ${bodyDataTheme}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${colorSchemeMeta}
  <title>${escapeHtml(title)}</title>
  <style>
${DOCUMENT_CSS}
  </style>
</head>
<body>
  <div class="ce-layout${includeNav ? " has-sidebar" : ""}">
    ${navHtml}
    <main class="ce-main">
      <header class="ce-doc-header">
        <h1 class="ce-doc-title">${escapeHtml(title)}</h1>
        <p class="ce-doc-meta">Generated ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })}</p>
      </header>
      <div class="ce-content">
        ${articlesHtml}
      </div>
      <footer class="ce-footer">
        <p>Exported with <strong>Obsidian Client HTML Export</strong></p>
      </footer>
    </main>
  </div>
</body>
</html>`;
  }
};
var Downloader = class {
  /**
   * Writes the HTML file to disk using Electron's Node.js `fs` module.
   * The file is placed in the same vault folder as the first selected note.
   * Falls back to a Blob-URL download if `require` is unavailable
   * (shouldn't happen in Obsidian desktop, but keeps code defensive).
   */
  static async save(app, referenceFile, filename, html) {
    const safeFilename = filename.replace(/[^a-z0-9_\-]/gi, "-") + ".html";
    try {
      const nodeRequire = window.require;
      if (nodeRequire) {
        const fs = nodeRequire("fs");
        const path = nodeRequire("path");
        const vaultPath = app.vault.adapter.getBasePath ? app.vault.adapter.getBasePath() : app.vault.adapter.basePath;
        const noteDir = referenceFile.parent ? path.join(vaultPath, referenceFile.parent.path) : vaultPath;
        const outputPath = path.join(noteDir, safeFilename);
        fs.writeFileSync(outputPath, html, "utf-8");
        console.log(`[Client Export] Saved \u2192 ${outputPath}`);
        return;
      }
    } catch (e) {
      console.warn("[Client Export] Node fs unavailable, falling back to Blob download.", e);
    }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}
var DOCUMENT_CSS = `
/* \u2500\u2500 Reset & base \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font-body:    "Georgia", "Times New Roman", serif;
  --font-ui:      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono:    "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;

  /* Light palette */
  --bg:           #f9f7f4;
  --bg-sidebar:   #f0ede8;
  --bg-code:      #f0f0f0;
  --bg-accent:    #4a6fa5;
  --text:         #1a1a1a;
  --text-muted:   #6b6b6b;
  --text-sidebar: #2c2c2c;
  --border:       #ddd;
  --link:         #2563eb;
  --link-hover:   #1d4ed8;
  --mark:         #fff176;
  --sidebar-w:    240px;
  --content-max:  780px;
  --radius:       6px;
}

/* Dark palette via data-theme or media query */
[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:           #1e1e2e;
    --bg-sidebar:   #181825;
    --bg-code:      #2a2a3d;
    --bg-accent:    #7c9fd4;
    --text:         #cdd6f4;
    --text-muted:   #888aaf;
    --text-sidebar: #cdd6f4;
    --border:       #3a3a55;
    --link:         #89b4fa;
    --link-hover:   #b4d0ff;
    --mark:         #4a4000;
  }
}

[data-theme="dark"] {
  --bg:           #1e1e2e;
  --bg-sidebar:   #181825;
  --bg-code:      #2a2a3d;
  --bg-accent:    #7c9fd4;
  --text:         #cdd6f4;
  --text-muted:   #888aaf;
  --text-sidebar: #cdd6f4;
  --border:       #3a3a55;
  --link:         #89b4fa;
  --link-hover:   #b4d0ff;
  --mark:         #4a4000;
}

html { font-size: 17px; scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
}

/* \u2500\u2500 Layout \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-layout {
  display: flex;
  min-height: 100vh;
}

/* \u2500\u2500 Sidebar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 32px 20px;
  font-family: var(--font-ui);
}

.ce-sidebar-title {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.ce-sidebar ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ce-sidebar ul li a {
  display: block;
  padding: 6px 10px;
  border-radius: var(--radius);
  color: var(--text-sidebar);
  text-decoration: none;
  font-size: 0.88rem;
  transition: background 0.15s, color 0.15s;
}

.ce-sidebar ul li a:hover {
  background: var(--bg-accent);
  color: #fff;
}

/* \u2500\u2500 Main content \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* \u2500\u2500 Document header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-doc-header {
  padding: 56px 64px 32px;
  border-bottom: 1px solid var(--border);
  max-width: calc(var(--content-max) + 128px);
}

.ce-doc-title {
  font-family: var(--font-ui);
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 8px;
  color: var(--text);
}

.ce-doc-meta {
  font-family: var(--font-ui);
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* \u2500\u2500 Content area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-content {
  flex: 1;
  padding: 48px 64px;
  max-width: calc(var(--content-max) + 128px);
  width: 100%;
}

/* \u2500\u2500 Section / article \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-section {
  margin-bottom: 72px;
  padding-bottom: 72px;
  border-bottom: 1px solid var(--border);
}
.ce-section:last-child { border-bottom: none; }

.ce-note-title {
  font-family: var(--font-ui);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 24px;
  color: var(--text);
}

/* \u2500\u2500 In-page TOC \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-toc {
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
  margin-bottom: 32px;
  font-family: var(--font-ui);
  display: inline-block;
  min-width: 220px;
}

.ce-toc-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.ce-toc ul { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.ce-toc ul a { color: var(--link); text-decoration: none; font-size: 0.88rem; }
.ce-toc ul a:hover { text-decoration: underline; }
.ce-toc-h3 { padding-left: 14px; }
.ce-toc-h4 { padding-left: 28px; }

/* \u2500\u2500 Note body typography \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-note-body h1,
.ce-note-body h2,
.ce-note-body h3,
.ce-note-body h4,
.ce-note-body h5,
.ce-note-body h6 {
  font-family: var(--font-ui);
  font-weight: 700;
  line-height: 1.25;
  margin: 2em 0 0.5em;
  color: var(--text);
}
.ce-note-body h1 { font-size: 1.6rem; }
.ce-note-body h2 { font-size: 1.35rem; }
.ce-note-body h3 { font-size: 1.1rem; }
.ce-note-body h4 { font-size: 1rem; }

.ce-note-body p { margin-bottom: 1.1em; max-width: var(--content-max); }

.ce-note-body a {
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ce-note-body a:hover { color: var(--link-hover); }

.ce-note-body strong { font-weight: 700; }
.ce-note-body em     { font-style: italic; }
.ce-note-body del    { text-decoration: line-through; color: var(--text-muted); }
.ce-note-body mark   { background: var(--mark); border-radius: 2px; padding: 0 2px; }

.ce-note-body ul,
.ce-note-body ol {
  padding-left: 1.6em;
  margin-bottom: 1.1em;
}
.ce-note-body li { margin-bottom: 0.25em; }

/* Task list */
.ce-task { display: flex; align-items: flex-start; gap: 8px; cursor: default; }
.ce-task input[type="checkbox"] { margin-top: 4px; accent-color: var(--bg-accent); flex-shrink: 0; }

.ce-note-body blockquote {
  border-left: 4px solid var(--bg-accent);
  margin: 0 0 1.1em;
  padding: 8px 20px;
  color: var(--text-muted);
  font-style: italic;
  background: var(--bg-sidebar);
  border-radius: 0 var(--radius) var(--radius) 0;
}

.ce-note-body hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2em 0;
}

/* \u2500\u2500 Code \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-inline-code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--bg-code);
  border-radius: 3px;
  padding: 1px 5px;
  color: var(--text);
}

.ce-code-block {
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  overflow-x: auto;
  margin-bottom: 1.5em;
  line-height: 1.55;
}

.ce-code-block code {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

/* \u2500\u2500 Tables \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5em;
  font-size: 0.92rem;
  font-family: var(--font-ui);
}

.ce-table th,
.ce-table td {
  border: 1px solid var(--border);
  padding: 8px 14px;
  text-align: left;
}

.ce-table thead tr {
  background: var(--bg-sidebar);
  font-weight: 700;
}

.ce-table tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--bg-sidebar) 50%, var(--bg));
}

/* \u2500\u2500 Images \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
  display: block;
  margin: 1.5em auto;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

/* \u2500\u2500 Footer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-footer {
  padding: 24px 64px;
  border-top: 1px solid var(--border);
  font-family: var(--font-ui);
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* \u2500\u2500 Print styles \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media print {
  .ce-sidebar { display: none; }
  .ce-layout  { display: block; }
  .ce-main    { max-width: 100%; }
  .ce-content { padding: 0; }
  .ce-code-block { page-break-inside: avoid; }
  .ce-section { page-break-after: always; }
}

/* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (max-width: 768px) {
  .ce-sidebar     { display: none; }
  .ce-doc-header  { padding: 32px 24px 20px; }
  .ce-content     { padding: 32px 24px; }
  .ce-footer      { padding: 20px 24px; }
  .ce-doc-title   { font-size: 1.75rem; }
}

/* \u2500\u2500 Syntax highlighting \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ce-code-wrap {
  position: relative;
  margin-bottom: 1.5em;
}

.ce-code-lang {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
  padding: 3px 10px;
}

.ce-code-wrap .ce-code-block {
  margin-bottom: 0;
  border-radius: 0 var(--radius) var(--radius) var(--radius);
}

/* token colours \u2013 light */
.sh-keyword  { color: #7c3aed; font-weight: 600; }
.sh-string   { color: #059669; }
.sh-comment  { color: #9ca3af; font-style: italic; }
.sh-number   { color: #d97706; }
.sh-operator { color: #db2777; }
.sh-function { color: #2563eb; }
.sh-type     { color: #0891b2; font-weight: 600; }
.sh-constant { color: #b45309; }
.sh-tag      { color: #7c3aed; }
.sh-attr     { color: #0891b2; }
.sh-value    { color: #059669; }
.sh-punct    { color: #6b7280; }

/* token colours \u2013 dark override */
[data-theme="dark"] .sh-keyword,
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .sh-keyword  { color: #c084fc; } }
[data-theme="dark"] .sh-keyword  { color: #c084fc; }
[data-theme="dark"] .sh-string   { color: #34d399; }
[data-theme="dark"] .sh-comment  { color: #6b7280; }
[data-theme="dark"] .sh-number   { color: #fbbf24; }
[data-theme="dark"] .sh-operator { color: #f472b6; }
[data-theme="dark"] .sh-function { color: #60a5fa; }
[data-theme="dark"] .sh-type     { color: #22d3ee; }
[data-theme="dark"] .sh-constant { color: #fbbf24; }
[data-theme="dark"] .sh-tag      { color: #c084fc; }
[data-theme="dark"] .sh-attr     { color: #22d3ee; }
[data-theme="dark"] .sh-value    { color: #34d399; }
[data-theme="dark"] .sh-punct    { color: #9ca3af; }
`;
var _SyntaxHighlighter = class _SyntaxHighlighter {
  // ── Public API ─────────────────────────────────────────────────────────────
  /**
   * Tokenise `code` according to the rules for `lang` and return an HTML
   * string with <span class="sh-*"> wrappers.  Falls back to escapeHtml()
   * when the language is unknown.
   */
  static highlight(code, lang) {
    var _a;
    const resolved = (_a = _SyntaxHighlighter.aliases[lang]) != null ? _a : lang;
    const ruleset = _SyntaxHighlighter.rules[resolved];
    if (!ruleset) return escapeHtml(code);
    let pos = 0;
    let output = "";
    outer: while (pos < code.length) {
      for (const rule of ruleset) {
        const slice = code.slice(pos);
        const m = slice.match(rule.pattern);
        if (m) {
          output += `<span class="sh-${rule.type}">${escapeHtml(m[0])}</span>`;
          pos += m[0].length;
          continue outer;
        }
      }
      output += escapeHtml(code[pos]);
      pos++;
    }
    return output;
  }
};
// ── Language rule tables ───────────────────────────────────────────────────
_SyntaxHighlighter.JS_KEYWORDS = /^(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|throw|try|typeof|var|void|while|with|yield|async|await)\b/;
_SyntaxHighlighter.TS_EXTRA_KEYWORDS = /^(type|interface|enum|namespace|declare|abstract|implements|readonly|keyof|infer|never|unknown|any|as|satisfies)\b/;
_SyntaxHighlighter.JS_TYPES = /^(Array|Boolean|Date|Error|Function|Map|Number|Object|Promise|Proxy|RegExp|Set|String|Symbol|WeakMap|WeakSet|console|document|window|globalThis|undefined|null|true|false|NaN|Infinity)\b/;
_SyntaxHighlighter.PY_KEYWORDS = /^(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/;
_SyntaxHighlighter.SQL_KEYWORDS = /^(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|IN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|CHECK|VIEW|WITH|DISTINCT|ALL|UNION|EXCEPT|INTERSECT|CASE|WHEN|THEN|ELSE|END|EXISTS|BETWEEN)\b/i;
_SyntaxHighlighter.RUST_KEYWORDS = /^(as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while)\b/;
_SyntaxHighlighter.GO_KEYWORDS = /^(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|true|false|nil|iota)\b/;
_SyntaxHighlighter.rules = {
  // ── JavaScript ─────────────────────────────────────────────────────────
  javascript: [
    { type: "comment", pattern: /^\/\/[^\n]*/ },
    { type: "comment", pattern: /^\/\*[\s\S]*?\*\// },
    { type: "string", pattern: /^`[\s\S]*?`/ },
    { type: "string", pattern: /^"(?:\\.|[^"\\])*"/ },
    { type: "string", pattern: /^'(?:\\.|[^'\\])*'/ },
    { type: "keyword", pattern: _SyntaxHighlighter.JS_KEYWORDS },
    { type: "type", pattern: _SyntaxHighlighter.JS_TYPES },
    { type: "function", pattern: /^[a-zA-Z_$][\w$]*(?=\s*\()/ },
    { type: "number", pattern: /^0x[\da-fA-F]+|^0b[01]+|^0o[0-7]+|^\d+\.?\d*([eE][+-]?\d+)?n?/ },
    { type: "operator", pattern: /^(===|!==|=>|\.\.\.|\?\?|&&|\|\||[+\-*/%&|^~<>!]=?|[=?:])/ },
    { type: "punct", pattern: /^[{}[\]();,.]/ }
  ],
  // ── TypeScript (extends JS rules) ──────────────────────────────────────
  typescript: [
    { type: "comment", pattern: /^\/\/[^\n]*/ },
    { type: "comment", pattern: /^\/\*[\s\S]*?\*\// },
    { type: "string", pattern: /^`[\s\S]*?`/ },
    { type: "string", pattern: /^"(?:\\.|[^"\\])*"/ },
    { type: "string", pattern: /^'(?:\\.|[^'\\])*'/ },
    { type: "type", pattern: _SyntaxHighlighter.TS_EXTRA_KEYWORDS },
    { type: "keyword", pattern: _SyntaxHighlighter.JS_KEYWORDS },
    { type: "type", pattern: _SyntaxHighlighter.JS_TYPES },
    { type: "function", pattern: /^[a-zA-Z_$][\w$]*(?=\s*\()/ },
    { type: "number", pattern: /^0x[\da-fA-F]+|^\d+\.?\d*([eE][+-]?\d+)?n?/ },
    { type: "operator", pattern: /^(===|!==|=>|\.\.\.|\?\?|&&|\|\||[+\-*/%&|^~<>!]=?|[=?:])/ },
    { type: "punct", pattern: /^[{}[\]();,.]/ }
  ],
  // ── Python ─────────────────────────────────────────────────────────────
  python: [
    { type: "comment", pattern: /^#[^\n]*/ },
    { type: "string", pattern: /^"""[\s\S]*?"""/ },
    { type: "string", pattern: /^'''[\s\S]*?'''/ },
    { type: "string", pattern: /^f?"(?:\\.|[^"\\])*"/ },
    { type: "string", pattern: /^f?'(?:\\.|[^'\\])*'/ },
    { type: "keyword", pattern: _SyntaxHighlighter.PY_KEYWORDS },
    { type: "type", pattern: /^(int|float|str|bool|list|dict|tuple|set|bytes|type|object|Exception)\b/ },
    { type: "function", pattern: /^[a-zA-Z_]\w*(?=\s*\()/ },
    { type: "number", pattern: /^0x[\da-fA-F]+|^\d+\.?\d*([eE][+-]?\d+)?j?/ },
    { type: "operator", pattern: /^(!=|==|<=|>=|[+\-*/%&|^~<>@]=?|={1,3}|\*{1,2}|\/{1,2}|:)/ },
    { type: "punct", pattern: /^[{}[\]();,.]/ }
  ],
  // ── CSS ────────────────────────────────────────────────────────────────
  css: [
    { type: "comment", pattern: /^\/\*[\s\S]*?\*\// },
    { type: "string", pattern: /^"(?:\\.|[^"\\])*"/ },
    { type: "string", pattern: /^'(?:\\.|[^'\\])*'/ },
    { type: "value", pattern: /^#[\da-fA-F]{3,8}\b/ },
    { type: "value", pattern: /^-?[\d.]+(%|px|em|rem|vw|vh|vmin|vmax|s|ms|deg|fr|ch|ex)\b/ },
    { type: "keyword", pattern: /^@[\w-]+/ },
    { type: "attr", pattern: /^[\w-]+(?=\s*:)/ },
    { type: "function", pattern: /^[\w-]+(?=\s*\()/ },
    { type: "number", pattern: /^-?[\d.]+/ },
    { type: "punct", pattern: /^[{}();:,]/ }
  ],
  // ── HTML ───────────────────────────────────────────────────────────────
  html: [
    { type: "comment", pattern: /^<!--[\s\S]*?-->/ },
    { type: "string", pattern: /^"[^"]*"/ },
    { type: "string", pattern: /^'[^']*'/ },
    { type: "tag", pattern: /^<\/?[a-zA-Z][a-zA-Z0-9\-]*/ },
    { type: "attr", pattern: /^[a-zA-Z][a-zA-Z0-9\-:]*(?=\s*=)/ },
    { type: "punct", pattern: /^[<>/=]/ }
  ],
  // ── JSON ───────────────────────────────────────────────────────────────
  json: [
    { type: "string", pattern: /^"(?:\\.|[^"\\])*"/ },
    { type: "keyword", pattern: /^(true|false|null)\b/ },
    { type: "number", pattern: /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
    { type: "punct", pattern: /^[{}[\]:,]/ }
  ],
  // ── Bash / Shell ───────────────────────────────────────────────────────
  bash: [
    { type: "comment", pattern: /^#[^\n]*/ },
    { type: "string", pattern: /^"(?:\\.|[^"\\])*"/ },
    { type: "string", pattern: /^'[^']*'/ },
    { type: "keyword", pattern: /^(if|then|else|elif|fi|for|while|until|do|done|case|esac|function|return|in|local|export|source|echo|exit|shift|set|unset|trap|readonly|declare)\b/ },
    { type: "constant", pattern: /^\$[\w{][^}]*}?/ },
    { type: "number", pattern: /^\d+/ },
    { type: "operator", pattern: /^(&&|\|\||[|&;<>])/ },
    { type: "punct", pattern: /^[()[\]{};,]/ }
  ],
  // ── SQL ────────────────────────────────────────────────────────────────
  sql: [
    { type: "comment", pattern: /^--[^\n]*/ },
    { type: "comment", pattern: /^\/\*[\s\S]*?\*\// },
    { type: "string", pattern: /^'(?:''|[^'])*'/ },
    { type: "keyword", pattern: _SyntaxHighlighter.SQL_KEYWORDS },
    { type: "number", pattern: /^-?\d+\.?\d*/ },
    { type: "function", pattern: /^[a-zA-Z_]\w*(?=\s*\()/ },
    { type: "punct", pattern: /^[(),;*=<>!]/ }
  ],
  // ── Rust ───────────────────────────────────────────────────────────────
  rust: [
    { type: "comment", pattern: /^\/\/[^\n]*/ },
    { type: "comment", pattern: /^\/\*[\s\S]*?\*\// },
    { type: "string", pattern: /^r#*"[\s\S]*?"#*/ },
    { type: "string", pattern: /^"(?:\\.|[^"\\])*"/ },
    { type: "string", pattern: /^'(?:\\.|[^'\\])'/ },
    { type: "keyword", pattern: _SyntaxHighlighter.RUST_KEYWORDS },
    { type: "type", pattern: /^[A-Z][a-zA-Z0-9_]*\b/ },
    { type: "constant", pattern: /^[A-Z_]{2,}\b/ },
    { type: "function", pattern: /^[a-z_]\w*(?=\s*\()/ },
    { type: "number", pattern: /^0x[\da-fA-F_]+|^0b[01_]+|^0o[0-7_]+|^\d[\d_]*\.?[\d_]*([eE][+-]?[\d_]+)?(?:u8|i8|u16|i16|u32|i32|u64|i64|u128|i128|usize|isize|f32|f64)?/ },
    { type: "operator", pattern: /^(=>|->|::|\.\.=?|&&|\|\||[+\-*/%&|^~<>!]=?|[=?:@])/ },
    { type: "punct", pattern: /^[{}[\]();,.]/ }
  ],
  // ── Go ─────────────────────────────────────────────────────────────────
  go: [
    { type: "comment", pattern: /^\/\/[^\n]*/ },
    { type: "comment", pattern: /^\/\*[\s\S]*?\*\// },
    { type: "string", pattern: /^`[^`]*`/ },
    { type: "string", pattern: /^"(?:\\.|[^"\\])*"/ },
    { type: "string", pattern: /^'(?:\\.|[^'\\])*'/ },
    { type: "keyword", pattern: _SyntaxHighlighter.GO_KEYWORDS },
    { type: "type", pattern: /^(bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/ },
    { type: "function", pattern: /^[a-zA-Z_]\w*(?=\s*\()/ },
    { type: "number", pattern: /^0x[\da-fA-F]+|^\d+\.?\d*([eE][+-]?\d+)?i?/ },
    { type: "operator", pattern: /^(:=|<-|\.\.\.|\+\+|--|&&|\|\||[+\-*/%&|^~<>!]=?|[=:])/ },
    { type: "punct", pattern: /^[{}[\]();,.]/ }
  ]
};
// Aliases
_SyntaxHighlighter.aliases = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  rs: "rust",
  golang: "go"
};
var SyntaxHighlighter = _SyntaxHighlighter;
var _ImageEmbedder = class _ImageEmbedder {
  /**
   * Processes all image references in `markdown` and returns a new string
   * with vault images replaced by data-URIs.
   */
  static async embedAll(app, sourceFile, markdown) {
    var _a, _b;
    const jobs = [];
    const wikiRe = /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
    let m;
    while ((m = wikiRe.exec(markdown)) !== null) {
      jobs.push({ full: m[0], path: m[1].trim(), alt: (_b = (_a = m[2]) == null ? void 0 : _a.trim()) != null ? _b : m[1].trim(), isWiki: true });
    }
    const mdImgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((m = mdImgRe.exec(markdown)) !== null) {
      const src = m[2].trim();
      if (/^https?:\/\//i.test(src)) continue;
      jobs.push({ full: m[0], path: src, alt: m[1].trim(), isWiki: false });
    }
    const cache = /* @__PURE__ */ new Map();
    for (const job of jobs) {
      if (cache.has(job.path)) continue;
      cache.set(job.path, await _ImageEmbedder.toDataUri(app, sourceFile, job.path));
    }
    let result = markdown;
    for (const job of jobs) {
      const dataUri = cache.get(job.path);
      if (!dataUri) continue;
      const replacement = `![${job.alt}](${dataUri})`;
      result = result.split(job.full).join(replacement);
    }
    return result;
  }
  // ── Private helpers ────────────────────────────────────────────────────────
  /**
   * Resolve a path to a TFile in the vault, read its binary content,
   * and return a base64 data-URI string.  Returns null if not resolvable.
   */
  static async toDataUri(app, sourceFile, imgPath) {
    var _a, _b, _c, _d;
    try {
      const ext = (_b = (_a = imgPath.split(".").pop()) == null ? void 0 : _a.toLowerCase()) != null ? _b : "";
      if (!_ImageEmbedder.IMAGE_EXTS.has(ext)) return null;
      const file = (_c = app.metadataCache.getFirstLinkpathDest(imgPath, sourceFile.path)) != null ? _c : app.vault.getAbstractFileByPath(imgPath);
      if (!(file instanceof import_obsidian.TFile)) return null;
      const buffer = await app.vault.readBinary(file);
      const mime = (_d = _ImageEmbedder.MIME[ext]) != null ? _d : "application/octet-stream";
      const base64 = _ImageEmbedder.arrayBufferToBase64(buffer);
      return `data:${mime};base64,${base64}`;
    } catch (e) {
      return null;
    }
  }
  /** Convert an ArrayBuffer to a base64 string without using atob/btoa on
   *  huge buffers (which can stack-overflow).  Uses a chunked approach. */
  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const CHUNK = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }
};
_ImageEmbedder.IMAGE_EXTS = /* @__PURE__ */ new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "bmp",
  "ico",
  "tiff"
]);
_ImageEmbedder.MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff"
};
var ImageEmbedder = _ImageEmbedder;
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBPYnNpZGlhbiBDbGllbnQgSFRNTCBFeHBvcnQgUGx1Z2luIFx1MjAxNCBtYWluLnRzXG4gKiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAqIEV4cG9ydHMgb25lIG9yIG1vcmUgTWFya2Rvd24gbm90ZXMgaW50byBhIHNpbmdsZSwgc2VsZi1jb250YWluZWQsXG4gKiBiZWF1dGlmdWxseSBzdHlsZWQgSFRNTCBkb2N1bWVudCBcdTIwMTQgbm8gT2JzaWRpYW4gUHVibGlzaCByZXF1aXJlZC5cbiAqXG4gKiBBcmNoaXRlY3R1cmVcbiAqIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICogIFx1MDBBNzEgIENsaWVudEV4cG9ydFBsdWdpbiAgIFx1MjAxMyBQbHVnaW4gbGlmZWN5Y2xlICsgY29udGV4dC1tZW51IC8gY29tbWFuZCB3aXJpbmdcbiAqICBcdTAwQTcyICBFeHBvcnRNb2RhbCAgICAgICAgICBcdTIwMTMgT2JzaWRpYW4gTW9kYWw6IGZpbGUgcGlja2VyLCBvcHRpb25zLCBleHBvcnQgdHJpZ2dlclxuICogIFx1MDBBNzMgIHJ1bkV4cG9ydCgpICAgICAgICAgIFx1MjAxMyBPcmNoZXN0cmF0b3I6IHJlYWQgXHUyMTkyIGVtYmVkIGltYWdlcyBcdTIxOTIgcmVuZGVyIFx1MjE5MiBidWlsZCBcdTIxOTIgc2F2ZVxuICogIFx1MDBBNzQgIE1hcmtkb3duUmVuZGVyZXIgICAgIFx1MjAxMyBQdXJlIE1hcmtkb3duIFx1MjE5MiBIVE1MIChubyBleHRlcm5hbCBydW50aW1lIGRlcHMpXG4gKiAgXHUwMEE3NSAgSHRtbEJ1aWxkZXIgICAgICAgICAgXHUyMDEzIEFzc2VtYmxlcyB0aGUgZmluYWwgc2VsZi1jb250YWluZWQgSFRNTCBkb2N1bWVudFxuICogIFx1MDBBNzYgIERvd25sb2FkZXIgICAgICAgICAgIFx1MjAxMyBXcml0ZXMgdG8gZGlzayB2aWEgRWxlY3Ryb24vTm9kZSBmczsgQmxvYi1VUkwgZmFsbGJhY2tcbiAqICBcdTAwQTc3ICBVdGlsaXRpZXMgICAgICAgICAgICBcdTIwMTMgZXNjYXBlSHRtbCwgc2x1Z2lmeVxuICogIFx1MDBBNzggIERPQ1VNRU5UX0NTUyAgICAgICAgIFx1MjAxMyBTZWxmLWNvbnRhaW5lZCBDU1MgaW5saW5lZCBpbnRvIHRoZSBleHBvcnRlZCBmaWxlXG4gKiAgXHUwMEE3OSAgU3ludGF4SGlnaGxpZ2h0ZXIgICAgXHUyMDEzIFplcm8tZGVwIHRva2VuLWJhc2VkIGhpZ2hsaWdodGVyIGZvciAxMCBsYW5ndWFnZXNcbiAqICBcdTAwQTcxMCBJbWFnZUVtYmVkZGVyICAgICAgICBcdTIwMTMgUmVhZHMgdmF1bHQgaW1hZ2VzIGFuZCBpbmxpbmVzIHRoZW0gYXMgYmFzZTY0IGRhdGEtVVJJc1xuICovXG5cbmltcG9ydCB7XG4gIEFwcCxcbiAgTWVudSxcbiAgTWVudUl0ZW0sXG4gIE1vZGFsLFxuICBOb3RpY2UsXG4gIFBsdWdpbixcbiAgUGx1Z2luTWFuaWZlc3QsXG4gIFRBYnN0cmFjdEZpbGUsXG4gIFRGaWxlLFxuICBURm9sZGVyLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcblxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG4vLyBcdTAwQTcgMSAgUExVR0lOIEVOVFJZLVBPSU5UXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpZW50RXhwb3J0UGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG1hbmlmZXN0OiBQbHVnaW5NYW5pZmVzdCkge1xuICAgIHN1cGVyKGFwcCwgbWFuaWZlc3QpO1xuICB9XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKFwiW0NsaWVudCBFeHBvcnRdIFBsdWdpbiBsb2FkaW5nXHUyMDI2XCIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENvbW1hbmQgUGFsZXR0ZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiZXhwb3J0LWFjdGl2ZS1ub3RlLXRvLWNsaWVudC1odG1sXCIsXG4gICAgICBuYW1lOiBcIkV4cG9ydCBhY3RpdmUgbm90ZSB0byBDbGllbnQgSFRNTFwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBpZiAoYWN0aXZlRmlsZSAmJiBhY3RpdmVGaWxlLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgICAgaWYgKCFjaGVja2luZykgdGhpcy5oYW5kbGVFeHBvcnQoW2FjdGl2ZUZpbGVdKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFNpbmdsZS1maWxlIC8gZm9sZGVyIGNvbnRleHQgbWVudSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW1lbnVcIiwgKG1lbnU6IE1lbnUsIGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHRoaXMuY29sbGVjdE1hcmtkb3duRmlsZXMoZmlsZSk7XG4gICAgICAgIGlmICh0YXJnZXRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+XG4gICAgICAgICAgaXRlbVxuICAgICAgICAgICAgLnNldFRpdGxlKFwiRXhwb3J0IHRvIENsaWVudCBIVE1MXCIpXG4gICAgICAgICAgICAuc2V0SWNvbihcImZpbGUtb3V0cHV0XCIpXG4gICAgICAgICAgICAuc2V0U2VjdGlvbihcImFjdGlvblwiKVxuICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdGhpcy5oYW5kbGVFeHBvcnQodGFyZ2V0cykpXG4gICAgICAgICk7XG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTXVsdGktZmlsZSBjb250ZXh0IG1lbnUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFxuICAgICAgICBcImZpbGVzLW1lbnVcIixcbiAgICAgICAgKG1lbnU6IE1lbnUsIGZpbGVzOiBUQWJzdHJhY3RGaWxlW10pID0+IHtcbiAgICAgICAgICBjb25zdCB0YXJnZXRzID0gZmlsZXMuZmxhdE1hcCgoZikgPT4gdGhpcy5jb2xsZWN0TWFya2Rvd25GaWxlcyhmKSk7XG4gICAgICAgICAgaWYgKHRhcmdldHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PlxuICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgICAuc2V0VGl0bGUoYEV4cG9ydCAke3RhcmdldHMubGVuZ3RofSBub3RlKHMpIHRvIENsaWVudCBIVE1MYClcbiAgICAgICAgICAgICAgLnNldEljb24oXCJmaWxlLW91dHB1dFwiKVxuICAgICAgICAgICAgICAuc2V0U2VjdGlvbihcImFjdGlvblwiKVxuICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB0aGlzLmhhbmRsZUV4cG9ydCh0YXJnZXRzKSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICApXG4gICAgKTtcblxuICAgIGNvbnNvbGUubG9nKFwiW0NsaWVudCBFeHBvcnRdIFBsdWdpbiBsb2FkZWQgXHUyNzEzXCIpO1xuICB9XG5cbiAgYXN5bmMgb251bmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coXCJbQ2xpZW50IEV4cG9ydF0gUGx1Z2luIHVubG9hZGVkLlwiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKiBSZWN1cnNpdmVseSBnYXRoZXIgLm1kIGZpbGVzIGZyb20gYSBmaWxlIG9yIGZvbGRlciB0YXJnZXQuICovXG4gIHByaXZhdGUgY29sbGVjdE1hcmtkb3duRmlsZXModGFyZ2V0OiBUQWJzdHJhY3RGaWxlKTogVEZpbGVbXSB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRGaWxlKVxuICAgICAgcmV0dXJuIHRhcmdldC5leHRlbnNpb24gPT09IFwibWRcIiA/IFt0YXJnZXRdIDogW107XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgIGNvbnN0IG91dDogVEZpbGVbXSA9IFtdO1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiB0YXJnZXQuY2hpbGRyZW4pXG4gICAgICAgIG91dC5wdXNoKC4uLnRoaXMuY29sbGVjdE1hcmtkb3duRmlsZXMoY2hpbGQpKTtcbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIHRoZSBFeHBvcnQgTW9kYWwgc28gdGhlIHVzZXIgY2FuIHJldmlldyAvIHJlb3JkZXIgZmlsZXMsXG4gICAqIHNldCBvcHRpb25zLCBhbmQgdHJpZ2dlciB0aGUgYWN0dWFsIGV4cG9ydC5cbiAgICovXG4gIGFzeW5jIGhhbmRsZUV4cG9ydChmaWxlczogVEZpbGVbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChmaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTI2QTBcdUZFMEYgTm8gTWFya2Rvd24gZmlsZXMgc2VsZWN0ZWQgZm9yIGV4cG9ydC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG5ldyBFeHBvcnRNb2RhbCh0aGlzLmFwcCwgZmlsZXMpLm9wZW4oKTtcbiAgfVxufVxuXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcbi8vIFx1MDBBNyAyICBFWFBPUlQgTU9EQUxcbi8vIFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFxuXG4vKiogT3B0aW9ucyB0aGUgdXNlciBjYW4gY29uZmlndXJlIGJlZm9yZSBleHBvcnRpbmcuICovXG5pbnRlcmZhY2UgRXhwb3J0T3B0aW9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7ICAgICAgICAgICAvLyBEb2N1bWVudCA8dGl0bGU+IGFuZCB2aXNpYmxlIEgxXG4gIGluY2x1ZGVOYXY6IGJvb2xlYW47ICAgICAvLyBTaWRlYmFyIFRPQyAvIG5hdiBsaW5rc1xuICBpbmNsdWRlVG9jOiBib29sZWFuOyAgICAgLy8gUGVyLXNlY3Rpb24gaW4tcGFnZSBUT0NcbiAgdGhlbWU6IFwibGlnaHRcIiB8IFwiZGFya1wiIHwgXCJhdXRvXCI7XG4gIGZpbGVuYW1lOiBzdHJpbmc7ICAgICAgICAvLyBPdXRwdXQgZmlsZW5hbWUgKHdpdGhvdXQgLmh0bWwpXG59XG5cbmNsYXNzIEV4cG9ydE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IGZpbGVzOiBURmlsZVtdO1xuICAvKiogVHJhY2tzIHdoaWNoIGZpbGVzIGFyZSBjaGVja2VkIGluIHRoZSBwaWNrZXIgbGlzdC4gKi9cbiAgcHJpdmF0ZSBzZWxlY3RlZDogU2V0PHN0cmluZz47XG4gIC8qKiBEcmFnLWFuZC1kcm9wIG9yZGVyIChwYXRocykuICovXG4gIHByaXZhdGUgb3JkZXI6IHN0cmluZ1tdO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBmaWxlczogVEZpbGVbXSkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5maWxlcyA9IGZpbGVzO1xuICAgIHRoaXMuc2VsZWN0ZWQgPSBuZXcgU2V0KGZpbGVzLm1hcCgoZikgPT4gZi5wYXRoKSk7XG4gICAgdGhpcy5vcmRlciA9IGZpbGVzLm1hcCgoZikgPT4gZi5wYXRoKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJjZS1tb2RhbFwiKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlLWhlYWRlclwiKTtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiRXhwb3J0IHRvIENsaWVudCBIVE1MXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwiY2Utc3VidGl0bGVcIixcbiAgICAgIHRleHQ6IFwiUmV2aWV3IGFuZCByZW9yZGVyIHlvdXIgbm90ZXMsIHNldCBvcHRpb25zLCB0aGVuIGV4cG9ydC5cIixcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGaWxlIGxpc3QgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJjZS1zZWN0aW9uLWxhYmVsXCIsIHRleHQ6IFwiTm90ZXMgdG8gZXhwb3J0XCIgfSk7XG4gICAgY29uc3QgZmlsZUxpc3RFbCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcInVsXCIsIHsgY2xzOiBcImNlLWZpbGUtbGlzdFwiIH0pO1xuICAgIHRoaXMucmVuZGVyRmlsZUxpc3QoZmlsZUxpc3RFbCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgT3B0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgY2xzOiBcImNlLXNlY3Rpb24tbGFiZWxcIiwgdGV4dDogXCJEb2N1bWVudCBvcHRpb25zXCIgfSk7XG4gICAgY29uc3Qgb3B0aW9uc0dyaWQgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2Utb3B0aW9ucy1ncmlkXCIpO1xuXG4gICAgLy8gRG9jdW1lbnQgdGl0bGVcbiAgICBjb25zdCB0aXRsZVJvdyA9IG9wdGlvbnNHcmlkLmNyZWF0ZURpdihcImNlLW9wdGlvbi1yb3dcIik7XG4gICAgdGl0bGVSb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiRG9jdW1lbnQgdGl0bGVcIiwgYXR0cjogeyBmb3I6IFwiY2UtdGl0bGVcIiB9IH0pO1xuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aXRsZVJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgYXR0cjoge1xuICAgICAgICBpZDogXCJjZS10aXRsZVwiLFxuICAgICAgICBwbGFjZWhvbGRlcjogXCJNeSBDbGllbnQgUHJvcG9zYWxcIixcbiAgICAgICAgdmFsdWU6XG4gICAgICAgICAgdGhpcy5maWxlcy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gdGhpcy5maWxlc1swXS5iYXNlbmFtZVxuICAgICAgICAgICAgOiBcIkNsaWVudCBFeHBvcnRcIixcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgZmlsZW5hbWVcbiAgICBjb25zdCBmblJvdyA9IG9wdGlvbnNHcmlkLmNyZWF0ZURpdihcImNlLW9wdGlvbi1yb3dcIik7XG4gICAgZm5Sb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiT3V0cHV0IGZpbGVuYW1lXCIsIGF0dHI6IHsgZm9yOiBcImNlLWZpbGVuYW1lXCIgfSB9KTtcbiAgICBjb25zdCBmaWxlbmFtZUlucHV0ID0gZm5Sb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgaWQ6IFwiY2UtZmlsZW5hbWVcIixcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwiY2xpZW50LWV4cG9ydFwiLFxuICAgICAgICB2YWx1ZTpcbiAgICAgICAgICB0aGlzLmZpbGVzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyB0aGlzLmZpbGVzWzBdLmJhc2VuYW1lLnJlcGxhY2UoL1xccysvZywgXCItXCIpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIDogXCJjbGllbnQtZXhwb3J0XCIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gVGhlbWVcbiAgICBjb25zdCB0aGVtZVJvdyA9IG9wdGlvbnNHcmlkLmNyZWF0ZURpdihcImNlLW9wdGlvbi1yb3dcIik7XG4gICAgdGhlbWVSb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiVGhlbWVcIiwgYXR0cjogeyBmb3I6IFwiY2UtdGhlbWVcIiB9IH0pO1xuICAgIGNvbnN0IHRoZW1lU2VsZWN0ID0gdGhlbWVSb3cuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBhdHRyOiB7IGlkOiBcImNlLXRoZW1lXCIgfSB9KTtcbiAgICAoXG4gICAgICBbXG4gICAgICAgIHsgdmFsdWU6IFwibGlnaHRcIiwgbGFiZWw6IFwiXHUyNjAwXHVGRTBGICBMaWdodFwiIH0sXG4gICAgICAgIHsgdmFsdWU6IFwiZGFya1wiLCAgbGFiZWw6IFwiXHVEODNDXHVERjE5ICBEYXJrXCIgfSxcbiAgICAgICAgeyB2YWx1ZTogXCJhdXRvXCIsICBsYWJlbDogXCJcdUQ4M0RcdUREQTUgIFN5c3RlbSAoYXV0bylcIiB9LFxuICAgICAgXSBhcyBjb25zdFxuICAgICkuZm9yRWFjaCgoeyB2YWx1ZSwgbGFiZWwgfSkgPT4ge1xuICAgICAgY29uc3Qgb3B0ID0gdGhlbWVTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCB9KTtcbiAgICAgIG9wdC52YWx1ZSA9IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgLy8gVG9nZ2xlIGNoZWNrYm94ZXNcbiAgICBjb25zdCB0b2dnbGVzUm93ID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlLXRvZ2dsZXNcIik7XG4gICAgY29uc3QgbmF2VG9nZ2xlID0gdGhpcy5jcmVhdGVUb2dnbGUoXG4gICAgICB0b2dnbGVzUm93LFxuICAgICAgXCJjZS1uYXZcIixcbiAgICAgIFwiSW5jbHVkZSBzaWRlYmFyIG5hdmlnYXRpb25cIixcbiAgICAgIHRydWVcbiAgICApO1xuICAgIGNvbnN0IHRvY1RvZ2dsZSA9IHRoaXMuY3JlYXRlVG9nZ2xlKFxuICAgICAgdG9nZ2xlc1JvdyxcbiAgICAgIFwiY2UtdG9jXCIsXG4gICAgICBcIkluY2x1ZGUgaW4tcGFnZSB0YWJsZSBvZiBjb250ZW50c1wiLFxuICAgICAgdHJ1ZVxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQWN0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBhY3Rpb25zID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlLWFjdGlvbnNcIik7XG5cbiAgICBjb25zdCBjYW5jZWxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJjZS1idG4gY2UtYnRuLXNlY29uZGFyeVwiLFxuICAgICAgdGV4dDogXCJDYW5jZWxcIixcbiAgICB9KTtcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICBjb25zdCBleHBvcnRCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJjZS1idG4gY2UtYnRuLXByaW1hcnlcIixcbiAgICAgIHRleHQ6IFwiXHUyQjA3ICBFeHBvcnQgSFRNTFwiLFxuICAgIH0pO1xuICAgIGV4cG9ydEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0ZWRGaWxlcyA9IHRoaXMub3JkZXJcbiAgICAgICAgLmZpbHRlcigocCkgPT4gdGhpcy5zZWxlY3RlZC5oYXMocCkpXG4gICAgICAgIC5tYXAoKHApID0+IHRoaXMuZmlsZXMuZmluZCgoZikgPT4gZi5wYXRoID09PSBwKSEpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIGlmIChzZWxlY3RlZEZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiXHUyNkEwXHVGRTBGIFNlbGVjdCBhdCBsZWFzdCBvbmUgbm90ZSB0byBleHBvcnQuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9wdGlvbnM6IEV4cG9ydE9wdGlvbnMgPSB7XG4gICAgICAgIHRpdGxlOiAodGl0bGVJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZS50cmltKCkgfHwgXCJDbGllbnQgRXhwb3J0XCIsXG4gICAgICAgIGZpbGVuYW1lOiAoZmlsZW5hbWVJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZS50cmltKCkgfHwgXCJjbGllbnQtZXhwb3J0XCIsXG4gICAgICAgIHRoZW1lOiAoKHRoZW1lU2VsZWN0IGFzIEhUTUxTZWxlY3RFbGVtZW50KS52YWx1ZSBhcyBFeHBvcnRPcHRpb25zW1widGhlbWVcIl0pLFxuICAgICAgICBpbmNsdWRlTmF2OiAobmF2VG9nZ2xlIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQsXG4gICAgICAgIGluY2x1ZGVUb2M6ICh0b2NUb2dnbGUgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCxcbiAgICAgIH07XG5cbiAgICAgIGV4cG9ydEJ0bi50ZXh0Q29udGVudCA9IFwiXHUyM0YzIEdlbmVyYXRpbmdcdTIwMjZcIjtcbiAgICAgIGV4cG9ydEJ0bi5zZXRBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiLCBcInRydWVcIik7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bkV4cG9ydCh0aGlzLmFwcCwgc2VsZWN0ZWRGaWxlcywgb3B0aW9ucyk7XG4gICAgICAgIG5ldyBOb3RpY2UoYFx1MjcwNSBFeHBvcnRlZCBcIiR7b3B0aW9ucy5maWxlbmFtZX0uaHRtbFwiIHRvIHlvdXIgdmF1bHQgZm9sZGVyIWAsIDYwMDApO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIltDbGllbnQgRXhwb3J0XVwiLCBlcnIpO1xuICAgICAgICBuZXcgTm90aWNlKGBcdTI3NEMgRXhwb3J0IGZhaWxlZDogJHsoZXJyIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgICAgICBleHBvcnRCdG4udGV4dENvbnRlbnQgPSBcIlx1MkIwNyAgRXhwb3J0IEhUTUxcIjtcbiAgICAgICAgZXhwb3J0QnRuLnJlbW92ZUF0dHJpYnV0ZShcImRpc2FibGVkXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEludGVybmFsIHJlbmRlciBoZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyRmlsZUxpc3QobGlzdEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGxpc3RFbC5lbXB0eSgpO1xuXG4gICAgdGhpcy5vcmRlci5mb3JFYWNoKChwYXRoLCBpZHgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVzLmZpbmQoKGYpID0+IGYucGF0aCA9PT0gcGF0aCk7XG4gICAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgICAgY29uc3QgbGkgPSBsaXN0RWwuY3JlYXRlRWwoXCJsaVwiLCB7IGNsczogXCJjZS1maWxlLWl0ZW1cIiB9KTtcbiAgICAgIGxpLnNldEF0dHJpYnV0ZShcImRyYWdnYWJsZVwiLCBcInRydWVcIik7XG4gICAgICBsaS5kYXRhc2V0LnBhdGggPSBwYXRoO1xuXG4gICAgICAvLyBDaGVja2JveFxuICAgICAgY29uc3QgY2IgPSBsaS5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICBjYi5jaGVja2VkID0gdGhpcy5zZWxlY3RlZC5oYXMocGF0aCk7XG4gICAgICBjYi5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGNiLmNoZWNrZWQpIHRoaXMuc2VsZWN0ZWQuYWRkKHBhdGgpO1xuICAgICAgICBlbHNlIHRoaXMuc2VsZWN0ZWQuZGVsZXRlKHBhdGgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIERyYWcgaGFuZGxlXG4gICAgICBsaS5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwiY2UtZHJhZy1oYW5kbGVcIiwgdGV4dDogXCJcdTI4M0ZcIiB9KTtcblxuICAgICAgLy8gRmlsZSBpY29uICsgbmFtZVxuICAgICAgbGkuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcImNlLWZpbGUtaWNvblwiLCB0ZXh0OiBcIlx1RDgzRFx1RENDNFwiIH0pO1xuICAgICAgbGkuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcImNlLWZpbGUtbmFtZVwiLCB0ZXh0OiBmaWxlLmJhc2VuYW1lIH0pO1xuXG4gICAgICAvLyBGb2xkZXIgcGF0aCAoZGltKVxuICAgICAgaWYgKGZpbGUucGFyZW50ICYmIGZpbGUucGFyZW50LnBhdGggIT09IFwiL1wiKSB7XG4gICAgICAgIGxpLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgICAgY2xzOiBcImNlLWZpbGUtZm9sZGVyXCIsXG4gICAgICAgICAgdGV4dDogZmlsZS5wYXJlbnQucGF0aCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1hbnVhbCB1cC9kb3duIGFycm93cyAoZmFsbGJhY2sgZm9yIGRyYWctYW5kLWRyb3ApXG4gICAgICBjb25zdCBhcnJvd3MgPSBsaS5jcmVhdGVEaXYoXCJjZS1hcnJvd3NcIik7XG4gICAgICBjb25zdCB1cEJ0biA9IGFycm93cy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHUyMTkxXCIsIGF0dHI6IHsgdGl0bGU6IFwiTW92ZSB1cFwiIH0gfSk7XG4gICAgICBjb25zdCBkbkJ0biA9IGFycm93cy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHUyMTkzXCIsIGF0dHI6IHsgdGl0bGU6IFwiTW92ZSBkb3duXCIgfSB9KTtcblxuICAgICAgdXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmIChpZHggPiAwKSB7XG4gICAgICAgICAgW3RoaXMub3JkZXJbaWR4IC0gMV0sIHRoaXMub3JkZXJbaWR4XV0gPSBbdGhpcy5vcmRlcltpZHhdLCB0aGlzLm9yZGVyW2lkeCAtIDFdXTtcbiAgICAgICAgICB0aGlzLnJlbmRlckZpbGVMaXN0KGxpc3RFbCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZG5CdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmIChpZHggPCB0aGlzLm9yZGVyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICBbdGhpcy5vcmRlcltpZHhdLCB0aGlzLm9yZGVyW2lkeCArIDFdXSA9IFt0aGlzLm9yZGVyW2lkeCArIDFdLCB0aGlzLm9yZGVyW2lkeF1dO1xuICAgICAgICAgIHRoaXMucmVuZGVyRmlsZUxpc3QobGlzdEVsKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIE5hdGl2ZSBkcmFnLWFuZC1kcm9wIHJlb3JkZXJpbmdcbiAgICAgIHRoaXMuYXR0YWNoRHJhZ0hhbmRsZXJzKGxpLCBwYXRoLCBsaXN0RWwpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhdHRhY2hEcmFnSGFuZGxlcnMoXG4gICAgbGk6IEhUTUxFbGVtZW50LFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBsaXN0RWw6IEhUTUxFbGVtZW50XG4gICk6IHZvaWQge1xuICAgIGxpLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGUpID0+IHtcbiAgICAgIGUuZGF0YVRyYW5zZmVyPy5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBwYXRoKTtcbiAgICAgIGxpLmFkZENsYXNzKFwiY2UtZHJhZ2dpbmdcIik7XG4gICAgfSk7XG4gICAgbGkuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgKCkgPT4gbGkucmVtb3ZlQ2xhc3MoXCJjZS1kcmFnZ2luZ1wiKSk7XG4gICAgbGkuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBsaS5hZGRDbGFzcyhcImNlLWRyYWctb3ZlclwiKTtcbiAgICB9KTtcbiAgICBsaS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsICgpID0+IGxpLnJlbW92ZUNsYXNzKFwiY2UtZHJhZy1vdmVyXCIpKTtcbiAgICBsaS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbGkucmVtb3ZlQ2xhc3MoXCJjZS1kcmFnLW92ZXJcIik7XG4gICAgICBjb25zdCBmcm9tUGF0aCA9IGUuZGF0YVRyYW5zZmVyPy5nZXREYXRhKFwidGV4dC9wbGFpblwiKTtcbiAgICAgIGlmICghZnJvbVBhdGggfHwgZnJvbVBhdGggPT09IHBhdGgpIHJldHVybjtcbiAgICAgIGNvbnN0IGZyb21JZHggPSB0aGlzLm9yZGVyLmluZGV4T2YoZnJvbVBhdGgpO1xuICAgICAgY29uc3QgdG9JZHggPSB0aGlzLm9yZGVyLmluZGV4T2YocGF0aCk7XG4gICAgICBpZiAoZnJvbUlkeCA9PT0gLTEgfHwgdG9JZHggPT09IC0xKSByZXR1cm47XG4gICAgICB0aGlzLm9yZGVyLnNwbGljZShmcm9tSWR4LCAxKTtcbiAgICAgIHRoaXMub3JkZXIuc3BsaWNlKHRvSWR4LCAwLCBmcm9tUGF0aCk7XG4gICAgICB0aGlzLnJlbmRlckZpbGVMaXN0KGxpc3RFbCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVRvZ2dsZShcbiAgICBwYXJlbnQ6IEhUTUxFbGVtZW50LFxuICAgIGlkOiBzdHJpbmcsXG4gICAgbGFiZWw6IHN0cmluZyxcbiAgICBkZWZhdWx0T246IGJvb2xlYW5cbiAgKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHJvdyA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZS10b2dnbGUtcm93XCIpO1xuICAgIGNvbnN0IGNiID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJjaGVja2JveFwiLFxuICAgICAgYXR0cjogeyBpZCB9LFxuICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgY2IuY2hlY2tlZCA9IGRlZmF1bHRPbjtcbiAgICByb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IGZvcjogaWQgfSB9KTtcbiAgICByZXR1cm4gY2I7XG4gIH1cbn1cblxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG4vLyBcdTAwQTcgMyAgRVhQT1JUIE9SQ0hFU1RSQVRPUlxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG5cbi8qKlxuICogUmVhZHMgZWFjaCBmaWxlLCBlbWJlZHMgaW1hZ2VzIGFzIGJhc2U2NCwgY29udmVydHMgTWFya2Rvd24gXHUyMTkyIEhUTUwgd2l0aFxuICogc3ludGF4IGhpZ2hsaWdodGluZywgYXNzZW1ibGVzIHRoZSBmaW5hbCBkb2N1bWVudCwgYW5kIHdyaXRlcyBpdCB0byBkaXNrLlxuICovXG5hc3luYyBmdW5jdGlvbiBydW5FeHBvcnQoXG4gIGFwcDogQXBwLFxuICBmaWxlczogVEZpbGVbXSxcbiAgb3B0aW9uczogRXhwb3J0T3B0aW9uc1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIDEuIFJlYWQsIGVtYmVkIGltYWdlcywgcmVuZGVyIE1hcmtkb3duIGZvciBlYWNoIGZpbGVcbiAgY29uc3Qgc2VjdGlvbnM6IHsgdGl0bGU6IHN0cmluZzsgaWQ6IHN0cmluZzsgaHRtbDogc3RyaW5nIH1bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IHJhdyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIC8vIFJlc29sdmUgYW5kIGlubGluZSBhbnkgdmF1bHQgaW1hZ2VzIHJlZmVyZW5jZWQgaW4gdGhpcyBub3RlXG4gICAgY29uc3QgZW1iZWRkZWRNZCA9IGF3YWl0IEltYWdlRW1iZWRkZXIuZW1iZWRBbGwoYXBwLCBmaWxlLCByYXcpO1xuICAgIC8vIFJlbmRlciBNYXJrZG93biBcdTIxOTIgSFRNTCAoc3ludGF4IGhpZ2hsaWdodGluZyBhcHBsaWVkIGluc2lkZSB0aGUgcmVuZGVyZXIpXG4gICAgY29uc3QgYm9keUh0bWwgPSBNYXJrZG93blJlbmRlcmVyLnJlbmRlcihlbWJlZGRlZE1kKTtcbiAgICBjb25zdCBpZCA9IHNsdWdpZnkoZmlsZS5iYXNlbmFtZSk7XG4gICAgc2VjdGlvbnMucHVzaCh7IHRpdGxlOiBmaWxlLmJhc2VuYW1lLCBpZCwgaHRtbDogYm9keUh0bWwgfSk7XG4gIH1cblxuICAvLyAyLiBCdWlsZCB0aGUgZnVsbCBIVE1MIGRvY3VtZW50IHN0cmluZ1xuICBjb25zdCBodG1sRG9jdW1lbnQgPSBIdG1sQnVpbGRlci5idWlsZChzZWN0aW9ucywgb3B0aW9ucyk7XG5cbiAgLy8gMy4gU2F2ZSB0byBkaXNrXG4gIGF3YWl0IERvd25sb2FkZXIuc2F2ZShhcHAsIGZpbGVzWzBdLCBvcHRpb25zLmZpbGVuYW1lLCBodG1sRG9jdW1lbnQpO1xufVxuXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcbi8vIFx1MDBBNyA0ICBNQVJLRE9XTiBSRU5ERVJFUlxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG5cbi8qKlxuICogUHVyZSBUeXBlU2NyaXB0IE1hcmtkb3duIFx1MjE5MiBIVE1MIHJlbmRlcmVyLlxuICogTm8gZXh0ZXJuYWwgcnVudGltZSBkZXBlbmRlbmNpZXMgXHUyMDE0IGV2ZXJ5dGhpbmcgT2JzaWRpYW4gc2hpcHMgd2l0aCBpcyBmYWlyIGdhbWUuXG4gKlxuICogU3VwcG9ydGVkIHN5bnRheDpcbiAqICAgSGVhZGluZ3MgKEFUWCAjKSwgYm9sZCwgaXRhbGljLCBib2xkK2l0YWxpYywgaW5saW5lIGNvZGUsIGNvZGUgZmVuY2VzLFxuICogICBibG9ja3F1b3RlcywgdW5vcmRlcmVkIGxpc3RzLCBvcmRlcmVkIGxpc3RzLCB0YXNrIGxpc3RzLCBob3Jpem9udGFsIHJ1bGVzLFxuICogICBpbWFnZXMsIGxpbmtzLCB0YWJsZXMgKEdGTSksIGFuZCBiYXJlIHBhcmFncmFwaHMuXG4gKiAgIE9ic2lkaWFuIFtbd2lraWxpbmtzXV0gXHUyMTkyIHBsYWluIHRleHQgKGdyYWNlZnVsIGRlZ3JhZGF0aW9uKS5cbiAqICAgRnJvbnRtYXR0ZXIgWUFNTCBibG9ja3MgYXJlIHN0cmlwcGVkIGNsZWFubHkuXG4gKi9cbmNsYXNzIE1hcmtkb3duUmVuZGVyZXIge1xuICBzdGF0aWMgcmVuZGVyKG1hcmtkb3duOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCBtZCA9IG1hcmtkb3duO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFN0cmlwIGZyb250bWF0dGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIG1kID0gbWQucmVwbGFjZSgvXi0tLVtcXHNcXFNdKj8tLS1cXG4/LywgXCJcIik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQ29kZSBmZW5jZXMgKHByb3RlY3QgYmVmb3JlIG90aGVyIHRyYW5zZm9ybXMpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNvZGVCbG9ja3M6IHN0cmluZ1tdID0gW107XG4gICAgbWQgPSBtZC5yZXBsYWNlKC9gYGAoXFx3KilcXG4/KFtcXHNcXFNdKj8pYGBgL2csIChfLCBsYW5nLCBjb2RlKSA9PiB7XG4gICAgICBjb25zdCBpZHggPSBjb2RlQmxvY2tzLmxlbmd0aDtcbiAgICAgIGNvbnN0IHRyaW1tZWQgPSBjb2RlLnRyaW1FbmQoKTtcbiAgICAgIGNvbnN0IGxhbmdMb3dlciA9IChsYW5nIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAvLyBBcHBseSBzeW50YXggaGlnaGxpZ2h0aW5nIHdoZW4gYSByZWNvZ25pc2VkIGxhbmd1YWdlIGlzIGRlY2xhcmVkXG4gICAgICBjb25zdCBoaWdobGlnaHRlZCA9IGxhbmdMb3dlclxuICAgICAgICA/IFN5bnRheEhpZ2hsaWdodGVyLmhpZ2hsaWdodCh0cmltbWVkLCBsYW5nTG93ZXIpXG4gICAgICAgIDogZXNjYXBlSHRtbCh0cmltbWVkKTtcbiAgICAgIGNvbnN0IGxhbmdMYWJlbCA9IGxhbmdMb3dlclxuICAgICAgICA/IGA8c3BhbiBjbGFzcz1cImNlLWNvZGUtbGFuZ1wiPiR7ZXNjYXBlSHRtbChsYW5nTG93ZXIpfTwvc3Bhbj5gXG4gICAgICAgIDogXCJcIjtcbiAgICAgIGNvbnN0IGxhbmdBdHRyID0gbGFuZ0xvd2VyID8gYCBjbGFzcz1cImxhbmd1YWdlLSR7ZXNjYXBlSHRtbChsYW5nTG93ZXIpfVwiYCA6IFwiXCI7XG4gICAgICBjb2RlQmxvY2tzLnB1c2goXG4gICAgICAgIGA8ZGl2IGNsYXNzPVwiY2UtY29kZS13cmFwXCI+JHtsYW5nTGFiZWx9PHByZSBjbGFzcz1cImNlLWNvZGUtYmxvY2tcIj48Y29kZSR7bGFuZ0F0dHJ9PiR7aGlnaGxpZ2h0ZWR9PC9jb2RlPjwvcHJlPjwvZGl2PmBcbiAgICAgICk7XG4gICAgICByZXR1cm4gYFxceDAwQ09ERSR7aWR4fVxceDAwYDtcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBJbmxpbmUgY29kZSAocHJvdGVjdCBiZWZvcmUgb3RoZXIgdHJhbnNmb3JtcykgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaW5saW5lQ29kZXM6IHN0cmluZ1tdID0gW107XG4gICAgbWQgPSBtZC5yZXBsYWNlKC9gKFteYF0rKWAvZywgKF8sIGNvZGUpID0+IHtcbiAgICAgIGNvbnN0IGlkeCA9IGlubGluZUNvZGVzLmxlbmd0aDtcbiAgICAgIGlubGluZUNvZGVzLnB1c2goYDxjb2RlIGNsYXNzPVwiY2UtaW5saW5lLWNvZGVcIj4ke2VzY2FwZUh0bWwoY29kZSl9PC9jb2RlPmApO1xuICAgICAgcmV0dXJuIGBcXHgwMElDT0RFJHtpZHh9XFx4MDBgO1xuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFdpa2lsaW5rcyBcdTIxOTIgcGxhaW4gdGV4dCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBtZCA9IG1kLnJlcGxhY2UoL1xcW1xcWyhbXlxcXXxdKykoPzpcXHwoW15cXF1dKykpP1xcXVxcXS9nLCAoXywgdGFyZ2V0LCBhbGlhcykgPT5cbiAgICAgIGFsaWFzIHx8IHRhcmdldFxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgUHJvY2VzcyBsaW5lLWJ5LWxpbmUgYmxvY2tzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpbmVzID0gbWQuc3BsaXQoXCJcXG5cIik7XG4gICAgY29uc3Qgb3V0cHV0OiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBpID0gMDtcblxuICAgIHdoaWxlIChpIDwgbGluZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgIC8vIEhvcml6b250YWwgcnVsZVxuICAgICAgaWYgKC9eKFxcKnszLH18LXszLH18X3szLH0pXFxzKiQvLnRlc3QobGluZSkpIHtcbiAgICAgICAgb3V0cHV0LnB1c2goXCI8aHI+XCIpO1xuICAgICAgICBpKys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBBVFggSGVhZGluZ1xuICAgICAgY29uc3QgaGVhZGluZ01hdGNoID0gbGluZS5tYXRjaCgvXigjezEsNn0pXFxzKyguKykkLyk7XG4gICAgICBpZiAoaGVhZGluZ01hdGNoKSB7XG4gICAgICAgIGNvbnN0IGxldmVsID0gaGVhZGluZ01hdGNoWzFdLmxlbmd0aDtcbiAgICAgICAgY29uc3QgdGV4dCA9IGlubGluZVJlbmRlcihoZWFkaW5nTWF0Y2hbMl0pO1xuICAgICAgICBjb25zdCBpZCA9IHNsdWdpZnkoaGVhZGluZ01hdGNoWzJdKTtcbiAgICAgICAgb3V0cHV0LnB1c2goYDxoJHtsZXZlbH0gaWQ9XCIke2lkfVwiPiR7dGV4dH08L2gke2xldmVsfT5gKTtcbiAgICAgICAgaSsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQmxvY2txdW90ZVxuICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIj5cIikpIHtcbiAgICAgICAgY29uc3QgYnFMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgd2hpbGUgKGkgPCBsaW5lcy5sZW5ndGggJiYgbGluZXNbaV0uc3RhcnRzV2l0aChcIj5cIikpIHtcbiAgICAgICAgICBicUxpbmVzLnB1c2gobGluZXNbaV0ucmVwbGFjZSgvXj5cXHM/LywgXCJcIikpO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXQucHVzaChgPGJsb2NrcXVvdGU+JHtNYXJrZG93blJlbmRlcmVyLnJlbmRlcihicUxpbmVzLmpvaW4oXCJcXG5cIikpfTwvYmxvY2txdW90ZT5gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEZlbmNlZCBjb2RlIHBsYWNlaG9sZGVyXG4gICAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiXFx4MDBDT0RFXCIpKSB7XG4gICAgICAgIG91dHB1dC5wdXNoKGxpbmUpO1xuICAgICAgICBpKys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBHRk0gVGFibGVcbiAgICAgIGlmIChpICsgMSA8IGxpbmVzLmxlbmd0aCAmJiAvXlxcfD9bXFxzLXw6XStcXHxbXFxzLXw6XSokLy50ZXN0KGxpbmVzW2kgKyAxXSkpIHtcbiAgICAgICAgY29uc3QgdGFibGVSZXN1bHQgPSBwYXJzZVRhYmxlKGxpbmVzLCBpKTtcbiAgICAgICAgaWYgKHRhYmxlUmVzdWx0KSB7XG4gICAgICAgICAgb3V0cHV0LnB1c2godGFibGVSZXN1bHQuaHRtbCk7XG4gICAgICAgICAgaSA9IHRhYmxlUmVzdWx0Lm5leHRMaW5lO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFVub3JkZXJlZCBsaXN0XG4gICAgICBpZiAoL14oXFxzKlstKitdXFxzKS8udGVzdChsaW5lKSkge1xuICAgICAgICBjb25zdCB7IGh0bWwsIG5leHRMaW5lIH0gPSBwYXJzZUxpc3QobGluZXMsIGksIGZhbHNlKTtcbiAgICAgICAgb3V0cHV0LnB1c2goaHRtbCk7XG4gICAgICAgIGkgPSBuZXh0TGluZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIE9yZGVyZWQgbGlzdFxuICAgICAgaWYgKC9eKFxccypcXGQrXFwuXFxzKS8udGVzdChsaW5lKSkge1xuICAgICAgICBjb25zdCB7IGh0bWwsIG5leHRMaW5lIH0gPSBwYXJzZUxpc3QobGluZXMsIGksIHRydWUpO1xuICAgICAgICBvdXRwdXQucHVzaChodG1sKTtcbiAgICAgICAgaSA9IG5leHRMaW5lO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQmxhbmsgbGluZVxuICAgICAgaWYgKGxpbmUudHJpbSgpID09PSBcIlwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcmFncmFwaCAoY29sbGVjdCB1bnRpbCBibGFuayBsaW5lIG9yIGJsb2NrIGVsZW1lbnQpXG4gICAgICBjb25zdCBwYXJhTGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgICB3aGlsZSAoXG4gICAgICAgIGkgPCBsaW5lcy5sZW5ndGggJiZcbiAgICAgICAgbGluZXNbaV0udHJpbSgpICE9PSBcIlwiICYmXG4gICAgICAgICFsaW5lc1tpXS5zdGFydHNXaXRoKFwiI1wiKSAmJlxuICAgICAgICAhbGluZXNbaV0uc3RhcnRzV2l0aChcIj5cIikgJiZcbiAgICAgICAgIS9eKFxccypbLSorXVxccykvLnRlc3QobGluZXNbaV0pICYmXG4gICAgICAgICEvXihcXHMqXFxkK1xcLlxccykvLnRlc3QobGluZXNbaV0pICYmXG4gICAgICAgICEvXihcXCp7Myx9fC17Myx9fF97Myx9KVxccyokLy50ZXN0KGxpbmVzW2ldKVxuICAgICAgKSB7XG4gICAgICAgIHBhcmFMaW5lcy5wdXNoKGxpbmVzW2ldKTtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgICAgaWYgKHBhcmFMaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIG91dHB1dC5wdXNoKGA8cD4ke2lubGluZVJlbmRlcihwYXJhTGluZXMuam9pbihcIiBcIikpfTwvcD5gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0ID0gb3V0cHV0LmpvaW4oXCJcXG5cIik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgUmVzdG9yZSBjb2RlIHBsYWNlaG9sZGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb2RlQmxvY2tzLmZvckVhY2goKGJsb2NrLCBpZHgpID0+IHtcbiAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKGBcXHgwMENPREUke2lkeH1cXHgwMGAsIGJsb2NrKTtcbiAgICB9KTtcbiAgICBpbmxpbmVDb2Rlcy5mb3JFYWNoKChibG9jaywgaWR4KSA9PiB7XG4gICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShgXFx4MDBJQ09ERSR7aWR4fVxceDAwYCwgYmxvY2spO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG4vKiogUmVuZGVyIGlubGluZSBNYXJrZG93biAoYm9sZCwgaXRhbGljLCBsaW5rcywgaW1hZ2VzKSB3aXRoaW4gYSBzdHJpbmcuICovXG5mdW5jdGlvbiBpbmxpbmVSZW5kZXIodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gSW1hZ2VzIGJlZm9yZSBsaW5rc1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKFxuICAgIC8hXFxbKFteXFxdXSopXFxdXFwoKFteKV0rKVxcKS9nLFxuICAgIChfLCBhbHQsIHNyYykgPT4gYDxpbWcgc3JjPVwiJHtzcmN9XCIgYWx0PVwiJHtlc2NhcGVIdG1sKGFsdCl9XCIgY2xhc3M9XCJjZS1pbWdcIj5gXG4gICk7XG4gIC8vIExpbmtzXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoXG4gICAgL1xcWyhbXlxcXV0rKVxcXVxcKChbXildKylcXCkvZyxcbiAgICAoXywgbGFiZWwsIGhyZWYpID0+XG4gICAgICBgPGEgaHJlZj1cIiR7aHJlZn1cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+JHtlc2NhcGVIdG1sKGxhYmVsKX08L2E+YFxuICApO1xuICAvLyBCb2xkICsgaXRhbGljXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcKlxcKlxcKiguKz8pXFwqXFwqXFwqL2csIFwiPHN0cm9uZz48ZW0+JDE8L2VtPjwvc3Ryb25nPlwiKTtcbiAgLy8gQm9sZFxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXCpcXCooLis/KVxcKlxcKi9nLCBcIjxzdHJvbmc+JDE8L3N0cm9uZz5cIik7XG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL19fKC4rPylfXy9nLCBcIjxzdHJvbmc+JDE8L3N0cm9uZz5cIik7XG4gIC8vIEl0YWxpY1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXCooLis/KVxcKi9nLCBcIjxlbT4kMTwvZW0+XCIpO1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9fKC4rPylfL2csIFwiPGVtPiQxPC9lbT5cIik7XG4gIC8vIFN0cmlrZXRocm91Z2hcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfn4oLis/KX5+L2csIFwiPGRlbD4kMTwvZGVsPlwiKTtcbiAgLy8gSGlnaGxpZ2h0IChPYnNpZGlhbiA9PXRleHQ9PSlcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvPT0oLis/KT09L2csIFwiPG1hcms+JDE8L21hcms+XCIpO1xuXG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKiogUGFyc2UgYSBHRk0gdGFibGUgc3RhcnRpbmcgYXQgbGluZSBpbmRleCBpLiAqL1xuZnVuY3Rpb24gcGFyc2VUYWJsZShcbiAgbGluZXM6IHN0cmluZ1tdLFxuICBzdGFydElkeDogbnVtYmVyXG4pOiB7IGh0bWw6IHN0cmluZzsgbmV4dExpbmU6IG51bWJlciB9IHwgbnVsbCB7XG4gIGNvbnN0IGhlYWRlckxpbmUgPSBsaW5lc1tzdGFydElkeF07XG4gIGNvbnN0IHNlcGFyYXRvckxpbmUgPSBsaW5lc1tzdGFydElkeCArIDFdO1xuXG4gIGlmICghc2VwYXJhdG9yTGluZSB8fCAhL15cXHw/W1xcc1xcLXw6XStcXHxbXFxzXFwtfDpdKiQvLnRlc3Qoc2VwYXJhdG9yTGluZSkpXG4gICAgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcGFyc2VSb3cgPSAocm93OiBzdHJpbmcpID0+XG4gICAgcm93XG4gICAgICAucmVwbGFjZSgvXlxcfHxcXHwkL2csIFwiXCIpXG4gICAgICAuc3BsaXQoXCJ8XCIpXG4gICAgICAubWFwKChjKSA9PiBjLnRyaW0oKSk7XG5cbiAgY29uc3QgaGVhZGVycyA9IHBhcnNlUm93KGhlYWRlckxpbmUpO1xuICBjb25zdCBhbGlnbm1lbnRzID0gcGFyc2VSb3coc2VwYXJhdG9yTGluZSkubWFwKChjKSA9PiB7XG4gICAgaWYgKC9eOi0rOiQvLnRlc3QoYy50cmltKCkpKSByZXR1cm4gXCJjZW50ZXJcIjtcbiAgICBpZiAoL14tKzokLy50ZXN0KGMudHJpbSgpKSkgcmV0dXJuIFwicmlnaHRcIjtcbiAgICByZXR1cm4gXCJsZWZ0XCI7XG4gIH0pO1xuXG4gIGxldCBpID0gc3RhcnRJZHggKyAyO1xuICBjb25zdCByb3dzOiBzdHJpbmdbXVtdID0gW107XG4gIHdoaWxlIChpIDwgbGluZXMubGVuZ3RoICYmIGxpbmVzW2ldLmluY2x1ZGVzKFwifFwiKSkge1xuICAgIHJvd3MucHVzaChwYXJzZVJvdyhsaW5lc1tpXSkpO1xuICAgIGkrKztcbiAgfVxuXG4gIGNvbnN0IHRoQ2VsbHMgPSBoZWFkZXJzXG4gICAgLm1hcChcbiAgICAgIChoLCBjaSkgPT5cbiAgICAgICAgYDx0aCBzdHlsZT1cInRleHQtYWxpZ246JHthbGlnbm1lbnRzW2NpXSB8fCBcImxlZnRcIn1cIj4ke2lubGluZVJlbmRlcihoKX08L3RoPmBcbiAgICApXG4gICAgLmpvaW4oXCJcIik7XG5cbiAgY29uc3QgYm9keVJvd3MgPSByb3dzXG4gICAgLm1hcCgocm93KSA9PiB7XG4gICAgICBjb25zdCB0ZHMgPSByb3dcbiAgICAgICAgLm1hcChcbiAgICAgICAgICAoY2VsbCwgY2kpID0+XG4gICAgICAgICAgICBgPHRkIHN0eWxlPVwidGV4dC1hbGlnbjoke2FsaWdubWVudHNbY2ldIHx8IFwibGVmdFwifVwiPiR7aW5saW5lUmVuZGVyKGNlbGwpfTwvdGQ+YFxuICAgICAgICApXG4gICAgICAgIC5qb2luKFwiXCIpO1xuICAgICAgcmV0dXJuIGA8dHI+JHt0ZHN9PC90cj5gO1xuICAgIH0pXG4gICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3QgaHRtbCA9IGA8dGFibGUgY2xhc3M9XCJjZS10YWJsZVwiPjx0aGVhZD48dHI+JHt0aENlbGxzfTwvdHI+PC90aGVhZD48dGJvZHk+JHtib2R5Um93c308L3Rib2R5PjwvdGFibGU+YDtcbiAgcmV0dXJuIHsgaHRtbCwgbmV4dExpbmU6IGkgfTtcbn1cblxuLyoqIFBhcnNlIGFuIG9yZGVyZWQgb3IgdW5vcmRlcmVkIGxpc3QgYmxvY2suICovXG5mdW5jdGlvbiBwYXJzZUxpc3QoXG4gIGxpbmVzOiBzdHJpbmdbXSxcbiAgc3RhcnRJZHg6IG51bWJlcixcbiAgb3JkZXJlZDogYm9vbGVhblxuKTogeyBodG1sOiBzdHJpbmc7IG5leHRMaW5lOiBudW1iZXIgfSB7XG4gIGNvbnN0IHRhZyA9IG9yZGVyZWQgPyBcIm9sXCIgOiBcInVsXCI7XG4gIGNvbnN0IHBhdHRlcm4gPSBvcmRlcmVkID8gL14oXFxzKilcXGQrXFwuXFxzKyguKikkLyA6IC9eKFxccyopWy0qK11cXHMrKC4qKSQvO1xuICBjb25zdCBpdGVtczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGkgPSBzdGFydElkeDtcblxuICB3aGlsZSAoaSA8IGxpbmVzLmxlbmd0aCkge1xuICAgIGNvbnN0IG1hdGNoID0gbGluZXNbaV0ubWF0Y2gocGF0dGVybik7XG4gICAgaWYgKCFtYXRjaCkgYnJlYWs7XG5cbiAgICBsZXQgY29udGVudCA9IG1hdGNoWzJdO1xuXG4gICAgLy8gVGFzayBsaXN0IGl0ZW1cbiAgICBjb25zdCB0YXNrTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eXFxbKHh8IClcXF1cXHMrKC4qKSQvaSk7XG4gICAgaWYgKHRhc2tNYXRjaCkge1xuICAgICAgY29uc3QgY2hlY2tlZCA9IHRhc2tNYXRjaFsxXS50b0xvd2VyQ2FzZSgpID09PSBcInhcIjtcbiAgICAgIGNvbnRlbnQgPSBgPGxhYmVsIGNsYXNzPVwiY2UtdGFza1wiPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiAke1xuICAgICAgICBjaGVja2VkID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICB9IGRpc2FibGVkPiAke2lubGluZVJlbmRlcih0YXNrTWF0Y2hbMl0pfTwvbGFiZWw+YDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGVudCA9IGlubGluZVJlbmRlcihjb250ZW50KTtcbiAgICB9XG5cbiAgICBpdGVtcy5wdXNoKGA8bGk+JHtjb250ZW50fTwvbGk+YCk7XG4gICAgaSsrO1xuICB9XG5cbiAgcmV0dXJuIHsgaHRtbDogYDwke3RhZ30+JHtpdGVtcy5qb2luKFwiXCIpfTwvJHt0YWd9PmAsIG5leHRMaW5lOiBpIH07XG59XG5cbi8vIFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFxuLy8gXHUwMEE3IDUgIEhUTUwgQlVJTERFUlxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG5cbmNsYXNzIEh0bWxCdWlsZGVyIHtcbiAgc3RhdGljIGJ1aWxkKFxuICAgIHNlY3Rpb25zOiB7IHRpdGxlOiBzdHJpbmc7IGlkOiBzdHJpbmc7IGh0bWw6IHN0cmluZyB9W10sXG4gICAgb3B0aW9uczogRXhwb3J0T3B0aW9uc1xuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHsgdGl0bGUsIHRoZW1lLCBpbmNsdWRlTmF2LCBpbmNsdWRlVG9jIH0gPSBvcHRpb25zO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFNpZGViYXIgbmF2IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IG5hdkh0bWwgPSBpbmNsdWRlTmF2XG4gICAgICA/IGA8bmF2IGNsYXNzPVwiY2Utc2lkZWJhclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjZS1zaWRlYmFyLXRpdGxlXCI+JHtlc2NhcGVIdG1sKHRpdGxlKX08L2Rpdj5cbiAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAke3NlY3Rpb25zXG4gICAgICAgICAgICAgIC5tYXAoXG4gICAgICAgICAgICAgICAgKHMpID0+XG4gICAgICAgICAgICAgICAgICBgPGxpPjxhIGhyZWY9XCIjJHtzLmlkfVwiPiR7ZXNjYXBlSHRtbChzLnRpdGxlKX08L2E+PC9saT5gXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgLmpvaW4oXCJcXG4gICAgICAgICAgICBcIil9XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9uYXY+YFxuICAgICAgOiBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFBlci1zZWN0aW9uIFRPQyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBmdW5jdGlvbiBidWlsZFRvYyhodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgY29uc3QgaGVhZGluZ3M6IHsgbGV2ZWw6IG51bWJlcjsgaWQ6IHN0cmluZzsgdGV4dDogc3RyaW5nIH1bXSA9IFtdO1xuICAgICAgY29uc3QgcmUgPSAvPGgoWzItNF0pXFxzK2lkPVwiKFteXCJdKylcIj4oW148XSspPFxcL2hcXDE+L2c7XG4gICAgICBsZXQgbTogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgICAgIHdoaWxlICgobSA9IHJlLmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGhlYWRpbmdzLnB1c2goeyBsZXZlbDogcGFyc2VJbnQobVsxXSksIGlkOiBtWzJdLCB0ZXh0OiBtWzNdIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGhlYWRpbmdzLmxlbmd0aCA8IDIpIHJldHVybiBcIlwiO1xuICAgICAgY29uc3QgaXRlbXMgPSBoZWFkaW5nc1xuICAgICAgICAubWFwKFxuICAgICAgICAgIChoKSA9PlxuICAgICAgICAgICAgYDxsaSBjbGFzcz1cImNlLXRvYy1oJHtoLmxldmVsfVwiPjxhIGhyZWY9XCIjJHtoLmlkfVwiPiR7ZXNjYXBlSHRtbChcbiAgICAgICAgICAgICAgaC50ZXh0XG4gICAgICAgICAgICApfTwvYT48L2xpPmBcbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICAgIHJldHVybiBgPG5hdiBjbGFzcz1cImNlLXRvY1wiPjxwIGNsYXNzPVwiY2UtdG9jLWxhYmVsXCI+Q29udGVudHM8L3A+PHVsPiR7aXRlbXN9PC91bD48L25hdj5gO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBBcnRpY2xlIHNlY3Rpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGFydGljbGVzSHRtbCA9IHNlY3Rpb25zXG4gICAgICAubWFwKChzKSA9PiB7XG4gICAgICAgIGNvbnN0IHRvYyA9IGluY2x1ZGVUb2MgPyBidWlsZFRvYyhzLmh0bWwpIDogXCJcIjtcbiAgICAgICAgcmV0dXJuIGA8YXJ0aWNsZSBpZD1cIiR7cy5pZH1cIiBjbGFzcz1cImNlLXNlY3Rpb25cIj5cbiAgICAgICAgICA8aDEgY2xhc3M9XCJjZS1ub3RlLXRpdGxlXCI+JHtlc2NhcGVIdG1sKHMudGl0bGUpfTwvaDE+XG4gICAgICAgICAgJHt0b2N9XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNlLW5vdGUtYm9keVwiPiR7cy5odG1sfTwvZGl2PlxuICAgICAgICA8L2FydGljbGU+YDtcbiAgICAgIH0pXG4gICAgICAuam9pbihcIlxcblxcblwiKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDb2xvciBzY2hlbWUgbWV0YSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBjb2xvclNjaGVtZU1ldGEgPVxuICAgICAgdGhlbWUgPT09IFwiYXV0b1wiXG4gICAgICAgID8gYDxtZXRhIG5hbWU9XCJjb2xvci1zY2hlbWVcIiBjb250ZW50PVwibGlnaHQgZGFya1wiPmBcbiAgICAgICAgOiBgPG1ldGEgbmFtZT1cImNvbG9yLXNjaGVtZVwiIGNvbnRlbnQ9XCIke3RoZW1lfVwiPmA7XG5cbiAgICBjb25zdCBib2R5RGF0YVRoZW1lID1cbiAgICAgIHRoZW1lID09PSBcImF1dG9cIiA/IFwiXCIgOiBgZGF0YS10aGVtZT1cIiR7dGhlbWV9XCJgO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZ1bGwgZG9jdW1lbnQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgcmV0dXJuIGA8IURPQ1RZUEUgaHRtbD5cbjxodG1sIGxhbmc9XCJlblwiICR7Ym9keURhdGFUaGVtZX0+XG48aGVhZD5cbiAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCI+XG4gICR7Y29sb3JTY2hlbWVNZXRhfVxuICA8dGl0bGU+JHtlc2NhcGVIdG1sKHRpdGxlKX08L3RpdGxlPlxuICA8c3R5bGU+XG4ke0RPQ1VNRU5UX0NTU31cbiAgPC9zdHlsZT5cbjwvaGVhZD5cbjxib2R5PlxuICA8ZGl2IGNsYXNzPVwiY2UtbGF5b3V0JHtpbmNsdWRlTmF2ID8gXCIgaGFzLXNpZGViYXJcIiA6IFwiXCJ9XCI+XG4gICAgJHtuYXZIdG1sfVxuICAgIDxtYWluIGNsYXNzPVwiY2UtbWFpblwiPlxuICAgICAgPGhlYWRlciBjbGFzcz1cImNlLWRvYy1oZWFkZXJcIj5cbiAgICAgICAgPGgxIGNsYXNzPVwiY2UtZG9jLXRpdGxlXCI+JHtlc2NhcGVIdG1sKHRpdGxlKX08L2gxPlxuICAgICAgICA8cCBjbGFzcz1cImNlLWRvYy1tZXRhXCI+R2VuZXJhdGVkICR7bmV3IERhdGUoKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICAgICAgeWVhcjogXCJudW1lcmljXCIsXG4gICAgICAgICAgbW9udGg6IFwibG9uZ1wiLFxuICAgICAgICAgIGRheTogXCJudW1lcmljXCIsXG4gICAgICAgIH0pfTwvcD5cbiAgICAgIDwvaGVhZGVyPlxuICAgICAgPGRpdiBjbGFzcz1cImNlLWNvbnRlbnRcIj5cbiAgICAgICAgJHthcnRpY2xlc0h0bWx9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxmb290ZXIgY2xhc3M9XCJjZS1mb290ZXJcIj5cbiAgICAgICAgPHA+RXhwb3J0ZWQgd2l0aCA8c3Ryb25nPk9ic2lkaWFuIENsaWVudCBIVE1MIEV4cG9ydDwvc3Ryb25nPjwvcD5cbiAgICAgIDwvZm9vdGVyPlxuICAgIDwvbWFpbj5cbiAgPC9kaXY+XG48L2JvZHk+XG48L2h0bWw+YDtcbiAgfVxufVxuXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcbi8vIFx1MDBBNyA2ICBET1dOTE9BREVSXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcblxuY2xhc3MgRG93bmxvYWRlciB7XG4gIC8qKlxuICAgKiBXcml0ZXMgdGhlIEhUTUwgZmlsZSB0byBkaXNrIHVzaW5nIEVsZWN0cm9uJ3MgTm9kZS5qcyBgZnNgIG1vZHVsZS5cbiAgICogVGhlIGZpbGUgaXMgcGxhY2VkIGluIHRoZSBzYW1lIHZhdWx0IGZvbGRlciBhcyB0aGUgZmlyc3Qgc2VsZWN0ZWQgbm90ZS5cbiAgICogRmFsbHMgYmFjayB0byBhIEJsb2ItVVJMIGRvd25sb2FkIGlmIGByZXF1aXJlYCBpcyB1bmF2YWlsYWJsZVxuICAgKiAoc2hvdWxkbid0IGhhcHBlbiBpbiBPYnNpZGlhbiBkZXNrdG9wLCBidXQga2VlcHMgY29kZSBkZWZlbnNpdmUpLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHNhdmUoXG4gICAgYXBwOiBBcHAsXG4gICAgcmVmZXJlbmNlRmlsZTogVEZpbGUsXG4gICAgZmlsZW5hbWU6IHN0cmluZyxcbiAgICBodG1sOiBzdHJpbmdcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2FmZUZpbGVuYW1lID0gZmlsZW5hbWUucmVwbGFjZSgvW15hLXowLTlfXFwtXS9naSwgXCItXCIpICsgXCIuaHRtbFwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFx1MjUwMFx1MjUwMCBFbGVjdHJvbiAvIE5vZGUgcGF0aCAoZGVza3RvcCkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgICAvLyBgcmVxdWlyZWAgaXMgYXZhaWxhYmxlIGluIE9ic2lkaWFuJ3MgRWxlY3Ryb24gcmVuZGVyZXIgcHJvY2Vzcy5cbiAgICAgIC8vIFdlIGFjY2VzcyBpdCB2aWEgdGhlIGdsb2JhbCB0byBhdm9pZCBidW5kbGVyIGlzc3Vlcy5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICBjb25zdCBub2RlUmVxdWlyZTogTm9kZVJlcXVpcmUgPSAod2luZG93IGFzIGFueSkucmVxdWlyZTtcbiAgICAgIGlmIChub2RlUmVxdWlyZSkge1xuICAgICAgICBjb25zdCBmcyAgID0gbm9kZVJlcXVpcmUoXCJmc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwiZnNcIik7XG4gICAgICAgIGNvbnN0IHBhdGggPSBub2RlUmVxdWlyZShcInBhdGhcIikgYXMgdHlwZW9mIGltcG9ydChcInBhdGhcIik7XG5cbiAgICAgICAgLy8gUmVzb2x2ZSB0aGUgdmF1bHQgcm9vdCBvbiBkaXNrXG4gICAgICAgIGNvbnN0IHZhdWx0UGF0aCA9IChhcHAudmF1bHQuYWRhcHRlciBhcyBhbnkpLmdldEJhc2VQYXRoXG4gICAgICAgICAgPyAoYXBwLnZhdWx0LmFkYXB0ZXIgYXMgYW55KS5nZXRCYXNlUGF0aCgpXG4gICAgICAgICAgOiAoYXBwLnZhdWx0LmFkYXB0ZXIgYXMgYW55KS5iYXNlUGF0aDtcblxuICAgICAgICAvLyBEaXJlY3Rvcnkgb2YgdGhlIHJlZmVyZW5jZSBub3RlXG4gICAgICAgIGNvbnN0IG5vdGVEaXIgPSByZWZlcmVuY2VGaWxlLnBhcmVudFxuICAgICAgICAgID8gcGF0aC5qb2luKHZhdWx0UGF0aCwgcmVmZXJlbmNlRmlsZS5wYXJlbnQucGF0aClcbiAgICAgICAgICA6IHZhdWx0UGF0aDtcblxuICAgICAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKG5vdGVEaXIsIHNhZmVGaWxlbmFtZSk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMob3V0cHV0UGF0aCwgaHRtbCwgXCJ1dGYtOFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coYFtDbGllbnQgRXhwb3J0XSBTYXZlZCBcdTIxOTIgJHtvdXRwdXRQYXRofWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwiW0NsaWVudCBFeHBvcnRdIE5vZGUgZnMgdW5hdmFpbGFibGUsIGZhbGxpbmcgYmFjayB0byBCbG9iIGRvd25sb2FkLlwiLCBlKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQnJvd3NlciBmYWxsYmFjayAoQmxvYiBVUkwgZG93bmxvYWQpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbaHRtbF0sIHsgdHlwZTogXCJ0ZXh0L2h0bWw7Y2hhcnNldD11dGYtOFwiIH0pO1xuICAgIGNvbnN0IHVybCAgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIGNvbnN0IGEgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICBhLmhyZWYgICAgID0gdXJsO1xuICAgIGEuZG93bmxvYWQgPSBzYWZlRmlsZW5hbWU7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTtcbiAgICBhLmNsaWNrKCk7XG4gICAgYS5yZW1vdmUoKTtcbiAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gIH1cbn1cblxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG4vLyBcdTAwQTcgNyAgVVRJTElUSUVTXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcblxuZnVuY3Rpb24gZXNjYXBlSHRtbChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXG4gICAgLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXG4gICAgLnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpXG4gICAgLnJlcGxhY2UoLycvZywgXCImIzAzOTtcIik7XG59XG5cbmZ1bmN0aW9uIHNsdWdpZnkoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1teXFx3XFxzLV0vZywgXCJcIilcbiAgICAucmVwbGFjZSgvW1xcc19dKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi0rfC0rJC9nLCBcIlwiKTtcbn1cblxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG4vLyBcdTAwQTcgOCAgU0VMRi1DT05UQUlORUQgRE9DVU1FTlQgQ1NTICAoaW5saW5lZCBpbnRvIHRoZSBleHBvcnRlZCBIVE1MIGZpbGUpXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcblxuY29uc3QgRE9DVU1FTlRfQ1NTID0gYFxuLyogXHUyNTAwXHUyNTAwIFJlc2V0ICYgYmFzZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cbiosICo6OmJlZm9yZSwgKjo6YWZ0ZXIgeyBib3gtc2l6aW5nOiBib3JkZXItYm94OyBtYXJnaW46IDA7IHBhZGRpbmc6IDA7IH1cblxuOnJvb3Qge1xuICAtLWZvbnQtYm9keTogICAgXCJHZW9yZ2lhXCIsIFwiVGltZXMgTmV3IFJvbWFuXCIsIHNlcmlmO1xuICAtLWZvbnQtdWk6ICAgICAgLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIFJvYm90bywgc2Fucy1zZXJpZjtcbiAgLS1mb250LW1vbm86ICAgIFwiSmV0QnJhaW5zIE1vbm9cIiwgXCJGaXJhIENvZGVcIiwgXCJDYXNjYWRpYSBDb2RlXCIsIG1vbm9zcGFjZTtcblxuICAvKiBMaWdodCBwYWxldHRlICovXG4gIC0tYmc6ICAgICAgICAgICAjZjlmN2Y0O1xuICAtLWJnLXNpZGViYXI6ICAgI2YwZWRlODtcbiAgLS1iZy1jb2RlOiAgICAgICNmMGYwZjA7XG4gIC0tYmctYWNjZW50OiAgICAjNGE2ZmE1O1xuICAtLXRleHQ6ICAgICAgICAgIzFhMWExYTtcbiAgLS10ZXh0LW11dGVkOiAgICM2YjZiNmI7XG4gIC0tdGV4dC1zaWRlYmFyOiAjMmMyYzJjO1xuICAtLWJvcmRlcjogICAgICAgI2RkZDtcbiAgLS1saW5rOiAgICAgICAgICMyNTYzZWI7XG4gIC0tbGluay1ob3ZlcjogICAjMWQ0ZWQ4O1xuICAtLW1hcms6ICAgICAgICAgI2ZmZjE3NjtcbiAgLS1zaWRlYmFyLXc6ICAgIDI0MHB4O1xuICAtLWNvbnRlbnQtbWF4OiAgNzgwcHg7XG4gIC0tcmFkaXVzOiAgICAgICA2cHg7XG59XG5cbi8qIERhcmsgcGFsZXR0ZSB2aWEgZGF0YS10aGVtZSBvciBtZWRpYSBxdWVyeSAqL1xuW2RhdGEtdGhlbWU9XCJkYXJrXCJdLFxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICA6cm9vdDpub3QoW2RhdGEtdGhlbWU9XCJsaWdodFwiXSkge1xuICAgIC0tYmc6ICAgICAgICAgICAjMWUxZTJlO1xuICAgIC0tYmctc2lkZWJhcjogICAjMTgxODI1O1xuICAgIC0tYmctY29kZTogICAgICAjMmEyYTNkO1xuICAgIC0tYmctYWNjZW50OiAgICAjN2M5ZmQ0O1xuICAgIC0tdGV4dDogICAgICAgICAjY2RkNmY0O1xuICAgIC0tdGV4dC1tdXRlZDogICAjODg4YWFmO1xuICAgIC0tdGV4dC1zaWRlYmFyOiAjY2RkNmY0O1xuICAgIC0tYm9yZGVyOiAgICAgICAjM2EzYTU1O1xuICAgIC0tbGluazogICAgICAgICAjODliNGZhO1xuICAgIC0tbGluay1ob3ZlcjogICAjYjRkMGZmO1xuICAgIC0tbWFyazogICAgICAgICAjNGE0MDAwO1xuICB9XG59XG5cbltkYXRhLXRoZW1lPVwiZGFya1wiXSB7XG4gIC0tYmc6ICAgICAgICAgICAjMWUxZTJlO1xuICAtLWJnLXNpZGViYXI6ICAgIzE4MTgyNTtcbiAgLS1iZy1jb2RlOiAgICAgICMyYTJhM2Q7XG4gIC0tYmctYWNjZW50OiAgICAjN2M5ZmQ0O1xuICAtLXRleHQ6ICAgICAgICAgI2NkZDZmNDtcbiAgLS10ZXh0LW11dGVkOiAgICM4ODhhYWY7XG4gIC0tdGV4dC1zaWRlYmFyOiAjY2RkNmY0O1xuICAtLWJvcmRlcjogICAgICAgIzNhM2E1NTtcbiAgLS1saW5rOiAgICAgICAgICM4OWI0ZmE7XG4gIC0tbGluay1ob3ZlcjogICAjYjRkMGZmO1xuICAtLW1hcms6ICAgICAgICAgIzRhNDAwMDtcbn1cblxuaHRtbCB7IGZvbnQtc2l6ZTogMTdweDsgc2Nyb2xsLWJlaGF2aW9yOiBzbW9vdGg7IH1cblxuYm9keSB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJnKTtcbiAgY29sb3I6IHZhcigtLXRleHQpO1xuICBmb250LWZhbWlseTogdmFyKC0tZm9udC1ib2R5KTtcbiAgbGluZS1oZWlnaHQ6IDEuNzU7XG4gIC13ZWJraXQtZm9udC1zbW9vdGhpbmc6IGFudGlhbGlhc2VkO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgTGF5b3V0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuLmNlLWxheW91dCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIG1pbi1oZWlnaHQ6IDEwMHZoO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgU2lkZWJhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cbi5jZS1zaWRlYmFyIHtcbiAgd2lkdGg6IHZhcigtLXNpZGViYXItdyk7XG4gIGZsZXgtc2hyaW5rOiAwO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iZy1zaWRlYmFyKTtcbiAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgdmFyKC0tYm9yZGVyKTtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICBoZWlnaHQ6IDEwMHZoO1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBwYWRkaW5nOiAzMnB4IDIwcHg7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LXVpKTtcbn1cblxuLmNlLXNpZGViYXItdGl0bGUge1xuICBmb250LXNpemU6IDAuNzhyZW07XG4gIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gIGxldHRlci1zcGFjaW5nOiAwLjA4ZW07XG4gIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgbWFyZ2luLWJvdHRvbTogMTZweDtcbn1cblxuLmNlLXNpZGViYXIgdWwge1xuICBsaXN0LXN0eWxlOiBub25lO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDRweDtcbn1cblxuLmNlLXNpZGViYXIgdWwgbGkgYSB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBwYWRkaW5nOiA2cHggMTBweDtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0tcmFkaXVzKTtcbiAgY29sb3I6IHZhcigtLXRleHQtc2lkZWJhcik7XG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgZm9udC1zaXplOiAwLjg4cmVtO1xuICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBjb2xvciAwLjE1cztcbn1cblxuLmNlLXNpZGViYXIgdWwgbGkgYTpob3ZlciB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJnLWFjY2VudCk7XG4gIGNvbG9yOiAjZmZmO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgTWFpbiBjb250ZW50IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuLmNlLW1haW4ge1xuICBmbGV4OiAxO1xuICBtaW4td2lkdGg6IDA7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBEb2N1bWVudCBoZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXG4uY2UtZG9jLWhlYWRlciB7XG4gIHBhZGRpbmc6IDU2cHggNjRweCAzMnB4O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYm9yZGVyKTtcbiAgbWF4LXdpZHRoOiBjYWxjKHZhcigtLWNvbnRlbnQtbWF4KSArIDEyOHB4KTtcbn1cblxuLmNlLWRvYy10aXRsZSB7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LXVpKTtcbiAgZm9udC1zaXplOiAyLjRyZW07XG4gIGZvbnQtd2VpZ2h0OiA4MDA7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wMmVtO1xuICBsaW5lLWhlaWdodDogMS4xNTtcbiAgbWFyZ2luLWJvdHRvbTogOHB4O1xuICBjb2xvcjogdmFyKC0tdGV4dCk7XG59XG5cbi5jZS1kb2MtbWV0YSB7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LXVpKTtcbiAgZm9udC1zaXplOiAwLjg1cmVtO1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBDb250ZW50IGFyZWEgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXG4uY2UtY29udGVudCB7XG4gIGZsZXg6IDE7XG4gIHBhZGRpbmc6IDQ4cHggNjRweDtcbiAgbWF4LXdpZHRoOiBjYWxjKHZhcigtLWNvbnRlbnQtbWF4KSArIDEyOHB4KTtcbiAgd2lkdGg6IDEwMCU7XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBTZWN0aW9uIC8gYXJ0aWNsZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cbi5jZS1zZWN0aW9uIHtcbiAgbWFyZ2luLWJvdHRvbTogNzJweDtcbiAgcGFkZGluZy1ib3R0b206IDcycHg7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1ib3JkZXIpO1xufVxuLmNlLXNlY3Rpb246bGFzdC1jaGlsZCB7IGJvcmRlci1ib3R0b206IG5vbmU7IH1cblxuLmNlLW5vdGUtdGl0bGUge1xuICBmb250LWZhbWlseTogdmFyKC0tZm9udC11aSk7XG4gIGZvbnQtc2l6ZTogMS43NXJlbTtcbiAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjAxZW07XG4gIG1hcmdpbi1ib3R0b206IDI0cHg7XG4gIGNvbG9yOiB2YXIoLS10ZXh0KTtcbn1cblxuLyogXHUyNTAwXHUyNTAwIEluLXBhZ2UgVE9DIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuLmNlLXRvYyB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJnLXNpZGViYXIpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS1yYWRpdXMpO1xuICBwYWRkaW5nOiAxNnB4IDIwcHg7XG4gIG1hcmdpbi1ib3R0b206IDMycHg7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LXVpKTtcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICBtaW4td2lkdGg6IDIyMHB4O1xufVxuXG4uY2UtdG9jLWxhYmVsIHtcbiAgZm9udC1zaXplOiAwLjc1cmVtO1xuICBmb250LXdlaWdodDogNzAwO1xuICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICBsZXR0ZXItc3BhY2luZzogMC4wOGVtO1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIG1hcmdpbi1ib3R0b206IDhweDtcbn1cblxuLmNlLXRvYyB1bCB7IGxpc3Qtc3R5bGU6IG5vbmU7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogNHB4OyB9XG4uY2UtdG9jIHVsIGEgeyBjb2xvcjogdmFyKC0tbGluayk7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgZm9udC1zaXplOiAwLjg4cmVtOyB9XG4uY2UtdG9jIHVsIGE6aG92ZXIgeyB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTsgfVxuLmNlLXRvYy1oMyB7IHBhZGRpbmctbGVmdDogMTRweDsgfVxuLmNlLXRvYy1oNCB7IHBhZGRpbmctbGVmdDogMjhweDsgfVxuXG4vKiBcdTI1MDBcdTI1MDAgTm90ZSBib2R5IHR5cG9ncmFwaHkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXG4uY2Utbm90ZS1ib2R5IGgxLFxuLmNlLW5vdGUtYm9keSBoMixcbi5jZS1ub3RlLWJvZHkgaDMsXG4uY2Utbm90ZS1ib2R5IGg0LFxuLmNlLW5vdGUtYm9keSBoNSxcbi5jZS1ub3RlLWJvZHkgaDYge1xuICBmb250LWZhbWlseTogdmFyKC0tZm9udC11aSk7XG4gIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIGxpbmUtaGVpZ2h0OiAxLjI1O1xuICBtYXJnaW46IDJlbSAwIDAuNWVtO1xuICBjb2xvcjogdmFyKC0tdGV4dCk7XG59XG4uY2Utbm90ZS1ib2R5IGgxIHsgZm9udC1zaXplOiAxLjZyZW07IH1cbi5jZS1ub3RlLWJvZHkgaDIgeyBmb250LXNpemU6IDEuMzVyZW07IH1cbi5jZS1ub3RlLWJvZHkgaDMgeyBmb250LXNpemU6IDEuMXJlbTsgfVxuLmNlLW5vdGUtYm9keSBoNCB7IGZvbnQtc2l6ZTogMXJlbTsgfVxuXG4uY2Utbm90ZS1ib2R5IHAgeyBtYXJnaW4tYm90dG9tOiAxLjFlbTsgbWF4LXdpZHRoOiB2YXIoLS1jb250ZW50LW1heCk7IH1cblxuLmNlLW5vdGUtYm9keSBhIHtcbiAgY29sb3I6IHZhcigtLWxpbmspO1xuICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgdGV4dC11bmRlcmxpbmUtb2Zmc2V0OiAzcHg7XG59XG4uY2Utbm90ZS1ib2R5IGE6aG92ZXIgeyBjb2xvcjogdmFyKC0tbGluay1ob3Zlcik7IH1cblxuLmNlLW5vdGUtYm9keSBzdHJvbmcgeyBmb250LXdlaWdodDogNzAwOyB9XG4uY2Utbm90ZS1ib2R5IGVtICAgICB7IGZvbnQtc3R5bGU6IGl0YWxpYzsgfVxuLmNlLW5vdGUtYm9keSBkZWwgICAgeyB0ZXh0LWRlY29yYXRpb246IGxpbmUtdGhyb3VnaDsgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpOyB9XG4uY2Utbm90ZS1ib2R5IG1hcmsgICB7IGJhY2tncm91bmQ6IHZhcigtLW1hcmspOyBib3JkZXItcmFkaXVzOiAycHg7IHBhZGRpbmc6IDAgMnB4OyB9XG5cbi5jZS1ub3RlLWJvZHkgdWwsXG4uY2Utbm90ZS1ib2R5IG9sIHtcbiAgcGFkZGluZy1sZWZ0OiAxLjZlbTtcbiAgbWFyZ2luLWJvdHRvbTogMS4xZW07XG59XG4uY2Utbm90ZS1ib2R5IGxpIHsgbWFyZ2luLWJvdHRvbTogMC4yNWVtOyB9XG5cbi8qIFRhc2sgbGlzdCAqL1xuLmNlLXRhc2sgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogZmxleC1zdGFydDsgZ2FwOiA4cHg7IGN1cnNvcjogZGVmYXVsdDsgfVxuLmNlLXRhc2sgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdIHsgbWFyZ2luLXRvcDogNHB4OyBhY2NlbnQtY29sb3I6IHZhcigtLWJnLWFjY2VudCk7IGZsZXgtc2hyaW5rOiAwOyB9XG5cbi5jZS1ub3RlLWJvZHkgYmxvY2txdW90ZSB7XG4gIGJvcmRlci1sZWZ0OiA0cHggc29saWQgdmFyKC0tYmctYWNjZW50KTtcbiAgbWFyZ2luOiAwIDAgMS4xZW07XG4gIHBhZGRpbmc6IDhweCAyMHB4O1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIGZvbnQtc3R5bGU6IGl0YWxpYztcbiAgYmFja2dyb3VuZDogdmFyKC0tYmctc2lkZWJhcik7XG4gIGJvcmRlci1yYWRpdXM6IDAgdmFyKC0tcmFkaXVzKSB2YXIoLS1yYWRpdXMpIDA7XG59XG5cbi5jZS1ub3RlLWJvZHkgaHIge1xuICBib3JkZXI6IG5vbmU7XG4gIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1ib3JkZXIpO1xuICBtYXJnaW46IDJlbSAwO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgQ29kZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgKi9cbi5jZS1pbmxpbmUtY29kZSB7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LW1vbm8pO1xuICBmb250LXNpemU6IDAuODVlbTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmctY29kZSk7XG4gIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgcGFkZGluZzogMXB4IDVweDtcbiAgY29sb3I6IHZhcigtLXRleHQpO1xufVxuXG4uY2UtY29kZS1ibG9jayB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJnLWNvZGUpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS1yYWRpdXMpO1xuICBwYWRkaW5nOiAxOHB4IDIwcHg7XG4gIG92ZXJmbG93LXg6IGF1dG87XG4gIG1hcmdpbi1ib3R0b206IDEuNWVtO1xuICBsaW5lLWhlaWdodDogMS41NTtcbn1cblxuLmNlLWNvZGUtYmxvY2sgY29kZSB7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LW1vbm8pO1xuICBmb250LXNpemU6IDAuODVyZW07XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBUYWJsZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXG4uY2UtdGFibGUge1xuICB3aWR0aDogMTAwJTtcbiAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcbiAgbWFyZ2luLWJvdHRvbTogMS41ZW07XG4gIGZvbnQtc2l6ZTogMC45MnJlbTtcbiAgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtdWkpO1xufVxuXG4uY2UtdGFibGUgdGgsXG4uY2UtdGFibGUgdGQge1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1ib3JkZXIpO1xuICBwYWRkaW5nOiA4cHggMTRweDtcbiAgdGV4dC1hbGlnbjogbGVmdDtcbn1cblxuLmNlLXRhYmxlIHRoZWFkIHRyIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmctc2lkZWJhcik7XG4gIGZvbnQtd2VpZ2h0OiA3MDA7XG59XG5cbi5jZS10YWJsZSB0Ym9keSB0cjpudGgtY2hpbGQoZXZlbikge1xuICBiYWNrZ3JvdW5kOiBjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tYmctc2lkZWJhcikgNTAlLCB2YXIoLS1iZykpO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgSW1hZ2VzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuLmNlLWltZyB7XG4gIG1heC13aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiBhdXRvO1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS1yYWRpdXMpO1xuICBkaXNwbGF5OiBibG9jaztcbiAgbWFyZ2luOiAxLjVlbSBhdXRvO1xuICBib3gtc2hhZG93OiAwIDJweCAxMnB4IHJnYmEoMCwwLDAsMC4wOCk7XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBGb290ZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXG4uY2UtZm9vdGVyIHtcbiAgcGFkZGluZzogMjRweCA2NHB4O1xuICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tYm9yZGVyKTtcbiAgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtdWkpO1xuICBmb250LXNpemU6IDAuOHJlbTtcbiAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgUHJpbnQgc3R5bGVzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuQG1lZGlhIHByaW50IHtcbiAgLmNlLXNpZGViYXIgeyBkaXNwbGF5OiBub25lOyB9XG4gIC5jZS1sYXlvdXQgIHsgZGlzcGxheTogYmxvY2s7IH1cbiAgLmNlLW1haW4gICAgeyBtYXgtd2lkdGg6IDEwMCU7IH1cbiAgLmNlLWNvbnRlbnQgeyBwYWRkaW5nOiAwOyB9XG4gIC5jZS1jb2RlLWJsb2NrIHsgcGFnZS1icmVhay1pbnNpZGU6IGF2b2lkOyB9XG4gIC5jZS1zZWN0aW9uIHsgcGFnZS1icmVhay1hZnRlcjogYWx3YXlzOyB9XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBSZXNwb25zaXZlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCAqL1xuQG1lZGlhIChtYXgtd2lkdGg6IDc2OHB4KSB7XG4gIC5jZS1zaWRlYmFyICAgICB7IGRpc3BsYXk6IG5vbmU7IH1cbiAgLmNlLWRvYy1oZWFkZXIgIHsgcGFkZGluZzogMzJweCAyNHB4IDIwcHg7IH1cbiAgLmNlLWNvbnRlbnQgICAgIHsgcGFkZGluZzogMzJweCAyNHB4OyB9XG4gIC5jZS1mb290ZXIgICAgICB7IHBhZGRpbmc6IDIwcHggMjRweDsgfVxuICAuY2UtZG9jLXRpdGxlICAgeyBmb250LXNpemU6IDEuNzVyZW07IH1cbn1cblxuLyogXHUyNTAwXHUyNTAwIFN5bnRheCBoaWdobGlnaHRpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwICovXG4uY2UtY29kZS13cmFwIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBtYXJnaW4tYm90dG9tOiAxLjVlbTtcbn1cblxuLmNlLWNvZGUtbGFuZyB7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtbW9ubyk7XG4gIGZvbnQtc2l6ZTogMC43cmVtO1xuICBmb250LXdlaWdodDogNzAwO1xuICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICBsZXR0ZXItc3BhY2luZzogMC4wNmVtO1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJnLWNvZGUpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1ib3JkZXIpO1xuICBib3JkZXItYm90dG9tOiBub25lO1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS1yYWRpdXMpIHZhcigtLXJhZGl1cykgMCAwO1xuICBwYWRkaW5nOiAzcHggMTBweDtcbn1cblxuLmNlLWNvZGUtd3JhcCAuY2UtY29kZS1ibG9jayB7XG4gIG1hcmdpbi1ib3R0b206IDA7XG4gIGJvcmRlci1yYWRpdXM6IDAgdmFyKC0tcmFkaXVzKSB2YXIoLS1yYWRpdXMpIHZhcigtLXJhZGl1cyk7XG59XG5cbi8qIHRva2VuIGNvbG91cnMgXHUyMDEzIGxpZ2h0ICovXG4uc2gta2V5d29yZCAgeyBjb2xvcjogIzdjM2FlZDsgZm9udC13ZWlnaHQ6IDYwMDsgfVxuLnNoLXN0cmluZyAgIHsgY29sb3I6ICMwNTk2Njk7IH1cbi5zaC1jb21tZW50ICB7IGNvbG9yOiAjOWNhM2FmOyBmb250LXN0eWxlOiBpdGFsaWM7IH1cbi5zaC1udW1iZXIgICB7IGNvbG9yOiAjZDk3NzA2OyB9XG4uc2gtb3BlcmF0b3IgeyBjb2xvcjogI2RiMjc3NzsgfVxuLnNoLWZ1bmN0aW9uIHsgY29sb3I6ICMyNTYzZWI7IH1cbi5zaC10eXBlICAgICB7IGNvbG9yOiAjMDg5MWIyOyBmb250LXdlaWdodDogNjAwOyB9XG4uc2gtY29uc3RhbnQgeyBjb2xvcjogI2I0NTMwOTsgfVxuLnNoLXRhZyAgICAgIHsgY29sb3I6ICM3YzNhZWQ7IH1cbi5zaC1hdHRyICAgICB7IGNvbG9yOiAjMDg5MWIyOyB9XG4uc2gtdmFsdWUgICAgeyBjb2xvcjogIzA1OTY2OTsgfVxuLnNoLXB1bmN0ICAgIHsgY29sb3I6ICM2YjcyODA7IH1cblxuLyogdG9rZW4gY29sb3VycyBcdTIwMTMgZGFyayBvdmVycmlkZSAqL1xuW2RhdGEtdGhlbWU9XCJkYXJrXCJdIC5zaC1rZXl3b3JkLFxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykgeyA6cm9vdDpub3QoW2RhdGEtdGhlbWU9XCJsaWdodFwiXSkgLnNoLWtleXdvcmQgIHsgY29sb3I6ICNjMDg0ZmM7IH0gfVxuW2RhdGEtdGhlbWU9XCJkYXJrXCJdIC5zaC1rZXl3b3JkICB7IGNvbG9yOiAjYzA4NGZjOyB9XG5bZGF0YS10aGVtZT1cImRhcmtcIl0gLnNoLXN0cmluZyAgIHsgY29sb3I6ICMzNGQzOTk7IH1cbltkYXRhLXRoZW1lPVwiZGFya1wiXSAuc2gtY29tbWVudCAgeyBjb2xvcjogIzZiNzI4MDsgfVxuW2RhdGEtdGhlbWU9XCJkYXJrXCJdIC5zaC1udW1iZXIgICB7IGNvbG9yOiAjZmJiZjI0OyB9XG5bZGF0YS10aGVtZT1cImRhcmtcIl0gLnNoLW9wZXJhdG9yIHsgY29sb3I6ICNmNDcyYjY7IH1cbltkYXRhLXRoZW1lPVwiZGFya1wiXSAuc2gtZnVuY3Rpb24geyBjb2xvcjogIzYwYTVmYTsgfVxuW2RhdGEtdGhlbWU9XCJkYXJrXCJdIC5zaC10eXBlICAgICB7IGNvbG9yOiAjMjJkM2VlOyB9XG5bZGF0YS10aGVtZT1cImRhcmtcIl0gLnNoLWNvbnN0YW50IHsgY29sb3I6ICNmYmJmMjQ7IH1cbltkYXRhLXRoZW1lPVwiZGFya1wiXSAuc2gtdGFnICAgICAgeyBjb2xvcjogI2MwODRmYzsgfVxuW2RhdGEtdGhlbWU9XCJkYXJrXCJdIC5zaC1hdHRyICAgICB7IGNvbG9yOiAjMjJkM2VlOyB9XG5bZGF0YS10aGVtZT1cImRhcmtcIl0gLnNoLXZhbHVlICAgIHsgY29sb3I6ICMzNGQzOTk7IH1cbltkYXRhLXRoZW1lPVwiZGFya1wiXSAuc2gtcHVuY3QgICAgeyBjb2xvcjogIzljYTNhZjsgfVxuYDtcblxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG4vLyBcdTAwQTcgOSAgU1lOVEFYIEhJR0hMSUdIVEVSXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcblxuLyoqXG4gKiBaZXJvLWRlcGVuZGVuY3kgdG9rZW4tYmFzZWQgc3ludGF4IGhpZ2hsaWdodGVyLlxuICpcbiAqIFN0cmF0ZWd5OiBlYWNoIGxhbmd1YWdlIGRlZmluZXMgYW4gb3JkZXJlZCBsaXN0IG9mIFRva2VuUnVsZSBvYmplY3RzLlxuICogUnVsZXMgYXJlIHRyaWVkIGluIG9yZGVyOyB0aGUgZmlyc3QgbWF0Y2ggd2lucy4gVGhlIHNvdXJjZSBzdHJpbmcgaXMgd2Fsa2VkXG4gKiBjaGFyYWN0ZXItYnktY2hhcmFjdGVyIHVzaW5nIGEgY3Vyc29yLCBlbWl0dGluZyA8c3BhbiBjbGFzcz1cInNoLSpcIj4gdGFncy5cbiAqXG4gKiBTdXBwb3J0ZWQgbGFuZ3VhZ2VzOiBqYXZhc2NyaXB0LCB0eXBlc2NyaXB0LCBweXRob24sIGNzcywgaHRtbCwganNvbixcbiAqICAgICAgICAgICAgICAgICAgICAgICBiYXNoL3NoZWxsLCBzcWwsIHJ1c3QsIGdvXG4gKi9cblxudHlwZSBUb2tlblR5cGUgPVxuICB8IFwia2V5d29yZFwiIHwgXCJzdHJpbmdcIiB8IFwiY29tbWVudFwiIHwgXCJudW1iZXJcIiB8IFwib3BlcmF0b3JcIlxuICB8IFwiZnVuY3Rpb25cIiB8IFwidHlwZVwiIHwgXCJjb25zdGFudFwiIHwgXCJ0YWdcIiB8IFwiYXR0clwiIHwgXCJ2YWx1ZVwiIHwgXCJwdW5jdFwiO1xuXG5pbnRlcmZhY2UgVG9rZW5SdWxlIHtcbiAgdHlwZTogVG9rZW5UeXBlO1xuICBwYXR0ZXJuOiBSZWdFeHA7ICAvLyBtdXN0IHN0YXJ0IHdpdGggXiBhbmQgaGF2ZSBubyBnbG9iYWwgZmxhZ1xufVxuXG5jbGFzcyBTeW50YXhIaWdobGlnaHRlciB7XG4gIC8vIFx1MjUwMFx1MjUwMCBMYW5ndWFnZSBydWxlIHRhYmxlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBKU19LRVlXT1JEUyA9XG4gICAgL14oYnJlYWt8Y2FzZXxjYXRjaHxjbGFzc3xjb25zdHxjb250aW51ZXxkZWJ1Z2dlcnxkZWZhdWx0fGRlbGV0ZXxkb3xlbHNlfGV4cG9ydHxleHRlbmRzfGZpbmFsbHl8Zm9yfGZyb218ZnVuY3Rpb258aWZ8aW1wb3J0fGlufGluc3RhbmNlb2Z8bGV0fG5ld3xvZnxyZXR1cm58c3RhdGljfHN1cGVyfHN3aXRjaHx0aHJvd3x0cnl8dHlwZW9mfHZhcnx2b2lkfHdoaWxlfHdpdGh8eWllbGR8YXN5bmN8YXdhaXQpXFxiLztcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBUU19FWFRSQV9LRVlXT1JEUyA9XG4gICAgL14odHlwZXxpbnRlcmZhY2V8ZW51bXxuYW1lc3BhY2V8ZGVjbGFyZXxhYnN0cmFjdHxpbXBsZW1lbnRzfHJlYWRvbmx5fGtleW9mfGluZmVyfG5ldmVyfHVua25vd258YW55fGFzfHNhdGlzZmllcylcXGIvO1xuXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IEpTX1RZUEVTID1cbiAgICAvXihBcnJheXxCb29sZWFufERhdGV8RXJyb3J8RnVuY3Rpb258TWFwfE51bWJlcnxPYmplY3R8UHJvbWlzZXxQcm94eXxSZWdFeHB8U2V0fFN0cmluZ3xTeW1ib2x8V2Vha01hcHxXZWFrU2V0fGNvbnNvbGV8ZG9jdW1lbnR8d2luZG93fGdsb2JhbFRoaXN8dW5kZWZpbmVkfG51bGx8dHJ1ZXxmYWxzZXxOYU58SW5maW5pdHkpXFxiLztcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBQWV9LRVlXT1JEUyA9XG4gICAgL14oYW5kfGFzfGFzc2VydHxhc3luY3xhd2FpdHxicmVha3xjbGFzc3xjb250aW51ZXxkZWZ8ZGVsfGVsaWZ8ZWxzZXxleGNlcHR8RmFsc2V8ZmluYWxseXxmb3J8ZnJvbXxnbG9iYWx8aWZ8aW1wb3J0fGlufGlzfGxhbWJkYXxOb25lfG5vbmxvY2FsfG5vdHxvcnxwYXNzfHJhaXNlfHJldHVybnxUcnVlfHRyeXx3aGlsZXx3aXRofHlpZWxkKVxcYi87XG5cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgU1FMX0tFWVdPUkRTID1cbiAgICAvXihTRUxFQ1R8RlJPTXxXSEVSRXxKT0lOfExFRlR8UklHSFR8SU5ORVJ8T1VURVJ8T058QVN8QU5EfE9SfE5PVHxJTnxJU3xOVUxMfE9SREVSfEJZfEdST1VQfEhBVklOR3xMSU1JVHxPRkZTRVR8SU5TRVJUfElOVE98VkFMVUVTfFVQREFURXxTRVR8REVMRVRFfENSRUFURXxUQUJMRXxJTkRFWHxEUk9QfEFMVEVSfEFERHxDT0xVTU58UFJJTUFSWXxLRVl8Rk9SRUlHTnxSRUZFUkVOQ0VTfFVOSVFVRXxERUZBVUxUfENIRUNLfFZJRVd8V0lUSHxESVNUSU5DVHxBTEx8VU5JT058RVhDRVBUfElOVEVSU0VDVHxDQVNFfFdIRU58VEhFTnxFTFNFfEVORHxFWElTVFN8QkVUV0VFTilcXGIvaTtcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBSVVNUX0tFWVdPUkRTID1cbiAgICAvXihhc3xhc3luY3xhd2FpdHxicmVha3xjb25zdHxjb250aW51ZXxjcmF0ZXxkeW58ZWxzZXxlbnVtfGV4dGVybnxmYWxzZXxmbnxmb3J8aWZ8aW1wbHxpbnxsZXR8bG9vcHxtYXRjaHxtb2R8bW92ZXxtdXR8cHVifHJlZnxyZXR1cm58c2VsZnxTZWxmfHN0YXRpY3xzdHJ1Y3R8c3VwZXJ8dHJhaXR8dHJ1ZXx0eXBlfHVuc2FmZXx1c2V8d2hlcmV8d2hpbGUpXFxiLztcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBHT19LRVlXT1JEUyA9XG4gICAgL14oYnJlYWt8Y2FzZXxjaGFufGNvbnN0fGNvbnRpbnVlfGRlZmF1bHR8ZGVmZXJ8ZWxzZXxmYWxsdGhyb3VnaHxmb3J8ZnVuY3xnb3xnb3RvfGlmfGltcG9ydHxpbnRlcmZhY2V8bWFwfHBhY2thZ2V8cmFuZ2V8cmV0dXJufHNlbGVjdHxzdHJ1Y3R8c3dpdGNofHR5cGV8dmFyfHRydWV8ZmFsc2V8bmlsfGlvdGEpXFxiLztcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBydWxlczogUmVjb3JkPHN0cmluZywgVG9rZW5SdWxlW10+ID0ge1xuICAgIC8vIFx1MjUwMFx1MjUwMCBKYXZhU2NyaXB0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGphdmFzY3JpcHQ6IFtcbiAgICAgIHsgdHlwZTogXCJjb21tZW50XCIsICBwYXR0ZXJuOiAvXlxcL1xcL1teXFxuXSovIH0sXG4gICAgICB7IHR5cGU6IFwiY29tbWVudFwiLCAgcGF0dGVybjogL15cXC9cXCpbXFxzXFxTXSo/XFwqXFwvLyB9LFxuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eYFtcXHNcXFNdKj9gLyB9LFxuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eXCIoPzpcXFxcLnxbXlwiXFxcXF0pKlwiLyB9LFxuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eJyg/OlxcXFwufFteJ1xcXFxdKSonLyB9LFxuICAgICAgeyB0eXBlOiBcImtleXdvcmRcIiwgIHBhdHRlcm46IFN5bnRheEhpZ2hsaWdodGVyLkpTX0tFWVdPUkRTIH0sXG4gICAgICB7IHR5cGU6IFwidHlwZVwiLCAgICAgcGF0dGVybjogU3ludGF4SGlnaGxpZ2h0ZXIuSlNfVFlQRVMgfSxcbiAgICAgIHsgdHlwZTogXCJmdW5jdGlvblwiLCBwYXR0ZXJuOiAvXlthLXpBLVpfJF1bXFx3JF0qKD89XFxzKlxcKCkvIH0sXG4gICAgICB7IHR5cGU6IFwibnVtYmVyXCIsICAgcGF0dGVybjogL14weFtcXGRhLWZBLUZdK3xeMGJbMDFdK3xeMG9bMC03XSt8XlxcZCtcXC4/XFxkKihbZUVdWystXT9cXGQrKT9uPy8gfSxcbiAgICAgIHsgdHlwZTogXCJvcGVyYXRvclwiLCBwYXR0ZXJuOiAvXig9PT18IT09fD0+fFxcLlxcLlxcLnxcXD9cXD98JiZ8XFx8XFx8fFsrXFwtKi8lJnxefjw+IV09P3xbPT86XSkvIH0sXG4gICAgICB7IHR5cGU6IFwicHVuY3RcIiwgICAgcGF0dGVybjogL15be31bXFxdKCk7LC5dLyB9LFxuICAgIF0sXG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgVHlwZVNjcmlwdCAoZXh0ZW5kcyBKUyBydWxlcykgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgdHlwZXNjcmlwdDogW1xuICAgICAgeyB0eXBlOiBcImNvbW1lbnRcIiwgIHBhdHRlcm46IC9eXFwvXFwvW15cXG5dKi8gfSxcbiAgICAgIHsgdHlwZTogXCJjb21tZW50XCIsICBwYXR0ZXJuOiAvXlxcL1xcKltcXHNcXFNdKj9cXCpcXC8vIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL15gW1xcc1xcU10qP2AvIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL15cIig/OlxcXFwufFteXCJcXFxcXSkqXCIvIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL14nKD86XFxcXC58W14nXFxcXF0pKicvIH0sXG4gICAgICB7IHR5cGU6IFwidHlwZVwiLCAgICAgcGF0dGVybjogU3ludGF4SGlnaGxpZ2h0ZXIuVFNfRVhUUkFfS0VZV09SRFMgfSxcbiAgICAgIHsgdHlwZTogXCJrZXl3b3JkXCIsICBwYXR0ZXJuOiBTeW50YXhIaWdobGlnaHRlci5KU19LRVlXT1JEUyB9LFxuICAgICAgeyB0eXBlOiBcInR5cGVcIiwgICAgIHBhdHRlcm46IFN5bnRheEhpZ2hsaWdodGVyLkpTX1RZUEVTIH0sXG4gICAgICB7IHR5cGU6IFwiZnVuY3Rpb25cIiwgcGF0dGVybjogL15bYS16QS1aXyRdW1xcdyRdKig/PVxccypcXCgpLyB9LFxuICAgICAgeyB0eXBlOiBcIm51bWJlclwiLCAgIHBhdHRlcm46IC9eMHhbXFxkYS1mQS1GXSt8XlxcZCtcXC4/XFxkKihbZUVdWystXT9cXGQrKT9uPy8gfSxcbiAgICAgIHsgdHlwZTogXCJvcGVyYXRvclwiLCBwYXR0ZXJuOiAvXig9PT18IT09fD0+fFxcLlxcLlxcLnxcXD9cXD98JiZ8XFx8XFx8fFsrXFwtKi8lJnxefjw+IV09P3xbPT86XSkvIH0sXG4gICAgICB7IHR5cGU6IFwicHVuY3RcIiwgICAgcGF0dGVybjogL15be31bXFxdKCk7LC5dLyB9LFxuICAgIF0sXG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgUHl0aG9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIHB5dGhvbjogW1xuICAgICAgeyB0eXBlOiBcImNvbW1lbnRcIiwgIHBhdHRlcm46IC9eI1teXFxuXSovIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL15cIlwiXCJbXFxzXFxTXSo/XCJcIlwiLyB9LFxuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eJycnW1xcc1xcU10qPycnJy8gfSxcbiAgICAgIHsgdHlwZTogXCJzdHJpbmdcIiwgICBwYXR0ZXJuOiAvXmY/XCIoPzpcXFxcLnxbXlwiXFxcXF0pKlwiLyB9LFxuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eZj8nKD86XFxcXC58W14nXFxcXF0pKicvIH0sXG4gICAgICB7IHR5cGU6IFwia2V5d29yZFwiLCAgcGF0dGVybjogU3ludGF4SGlnaGxpZ2h0ZXIuUFlfS0VZV09SRFMgfSxcbiAgICAgIHsgdHlwZTogXCJ0eXBlXCIsICAgICBwYXR0ZXJuOiAvXihpbnR8ZmxvYXR8c3RyfGJvb2x8bGlzdHxkaWN0fHR1cGxlfHNldHxieXRlc3x0eXBlfG9iamVjdHxFeGNlcHRpb24pXFxiLyB9LFxuICAgICAgeyB0eXBlOiBcImZ1bmN0aW9uXCIsIHBhdHRlcm46IC9eW2EtekEtWl9dXFx3Kig/PVxccypcXCgpLyB9LFxuICAgICAgeyB0eXBlOiBcIm51bWJlclwiLCAgIHBhdHRlcm46IC9eMHhbXFxkYS1mQS1GXSt8XlxcZCtcXC4/XFxkKihbZUVdWystXT9cXGQrKT9qPy8gfSxcbiAgICAgIHsgdHlwZTogXCJvcGVyYXRvclwiLCBwYXR0ZXJuOiAvXighPXw9PXw8PXw+PXxbK1xcLSovJSZ8Xn48PkBdPT98PXsxLDN9fFxcKnsxLDJ9fFxcL3sxLDJ9fDopLyB9LFxuICAgICAgeyB0eXBlOiBcInB1bmN0XCIsICAgIHBhdHRlcm46IC9eW3t9W1xcXSgpOywuXS8gfSxcbiAgICBdLFxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENTUyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjc3M6IFtcbiAgICAgIHsgdHlwZTogXCJjb21tZW50XCIsICBwYXR0ZXJuOiAvXlxcL1xcKltcXHNcXFNdKj9cXCpcXC8vIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL15cIig/OlxcXFwufFteXCJcXFxcXSkqXCIvIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL14nKD86XFxcXC58W14nXFxcXF0pKicvIH0sXG4gICAgICB7IHR5cGU6IFwidmFsdWVcIiwgICAgcGF0dGVybjogL14jW1xcZGEtZkEtRl17Myw4fVxcYi8gfSxcbiAgICAgIHsgdHlwZTogXCJ2YWx1ZVwiLCAgICBwYXR0ZXJuOiAvXi0/W1xcZC5dKyglfHB4fGVtfHJlbXx2d3x2aHx2bWlufHZtYXh8c3xtc3xkZWd8ZnJ8Y2h8ZXgpXFxiLyB9LFxuICAgICAgeyB0eXBlOiBcImtleXdvcmRcIiwgIHBhdHRlcm46IC9eQFtcXHctXSsvIH0sXG4gICAgICB7IHR5cGU6IFwiYXR0clwiLCAgICAgcGF0dGVybjogL15bXFx3LV0rKD89XFxzKjopLyB9LFxuICAgICAgeyB0eXBlOiBcImZ1bmN0aW9uXCIsIHBhdHRlcm46IC9eW1xcdy1dKyg/PVxccypcXCgpLyB9LFxuICAgICAgeyB0eXBlOiBcIm51bWJlclwiLCAgIHBhdHRlcm46IC9eLT9bXFxkLl0rLyB9LFxuICAgICAgeyB0eXBlOiBcInB1bmN0XCIsICAgIHBhdHRlcm46IC9eW3t9KCk7OixdLyB9LFxuICAgIF0sXG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSFRNTCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBodG1sOiBbXG4gICAgICB7IHR5cGU6IFwiY29tbWVudFwiLCAgcGF0dGVybjogL148IS0tW1xcc1xcU10qPy0tPi8gfSxcbiAgICAgIHsgdHlwZTogXCJzdHJpbmdcIiwgICBwYXR0ZXJuOiAvXlwiW15cIl0qXCIvIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL14nW14nXSonLyB9LFxuICAgICAgeyB0eXBlOiBcInRhZ1wiLCAgICAgIHBhdHRlcm46IC9ePFxcLz9bYS16QS1aXVthLXpBLVowLTlcXC1dKi8gfSxcbiAgICAgIHsgdHlwZTogXCJhdHRyXCIsICAgICBwYXR0ZXJuOiAvXlthLXpBLVpdW2EtekEtWjAtOVxcLTpdKig/PVxccyo9KS8gfSxcbiAgICAgIHsgdHlwZTogXCJwdW5jdFwiLCAgICBwYXR0ZXJuOiAvXls8Pi89XS8gfSxcbiAgICBdLFxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEpTT04gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAganNvbjogW1xuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eXCIoPzpcXFxcLnxbXlwiXFxcXF0pKlwiLyB9LFxuICAgICAgeyB0eXBlOiBcImtleXdvcmRcIiwgIHBhdHRlcm46IC9eKHRydWV8ZmFsc2V8bnVsbClcXGIvIH0sXG4gICAgICB7IHR5cGU6IFwibnVtYmVyXCIsICAgcGF0dGVybjogL14tPyg/OjB8WzEtOV1cXGQqKSg/OlxcLlxcZCspPyg/OltlRV1bKy1dP1xcZCspPy8gfSxcbiAgICAgIHsgdHlwZTogXCJwdW5jdFwiLCAgICBwYXR0ZXJuOiAvXlt7fVtcXF06LF0vIH0sXG4gICAgXSxcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCYXNoIC8gU2hlbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgYmFzaDogW1xuICAgICAgeyB0eXBlOiBcImNvbW1lbnRcIiwgIHBhdHRlcm46IC9eI1teXFxuXSovIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL15cIig/OlxcXFwufFteXCJcXFxcXSkqXCIvIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL14nW14nXSonLyB9LFxuICAgICAgeyB0eXBlOiBcImtleXdvcmRcIiwgIHBhdHRlcm46IC9eKGlmfHRoZW58ZWxzZXxlbGlmfGZpfGZvcnx3aGlsZXx1bnRpbHxkb3xkb25lfGNhc2V8ZXNhY3xmdW5jdGlvbnxyZXR1cm58aW58bG9jYWx8ZXhwb3J0fHNvdXJjZXxlY2hvfGV4aXR8c2hpZnR8c2V0fHVuc2V0fHRyYXB8cmVhZG9ubHl8ZGVjbGFyZSlcXGIvIH0sXG4gICAgICB7IHR5cGU6IFwiY29uc3RhbnRcIiwgcGF0dGVybjogL15cXCRbXFx3e11bXn1dKn0/LyB9LFxuICAgICAgeyB0eXBlOiBcIm51bWJlclwiLCAgIHBhdHRlcm46IC9eXFxkKy8gfSxcbiAgICAgIHsgdHlwZTogXCJvcGVyYXRvclwiLCBwYXR0ZXJuOiAvXigmJnxcXHxcXHx8W3wmOzw+XSkvIH0sXG4gICAgICB7IHR5cGU6IFwicHVuY3RcIiwgICAgcGF0dGVybjogL15bKClbXFxde307LF0vIH0sXG4gICAgXSxcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTUUwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgc3FsOiBbXG4gICAgICB7IHR5cGU6IFwiY29tbWVudFwiLCAgcGF0dGVybjogL14tLVteXFxuXSovIH0sXG4gICAgICB7IHR5cGU6IFwiY29tbWVudFwiLCAgcGF0dGVybjogL15cXC9cXCpbXFxzXFxTXSo/XFwqXFwvLyB9LFxuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eJyg/OicnfFteJ10pKicvIH0sXG4gICAgICB7IHR5cGU6IFwia2V5d29yZFwiLCAgcGF0dGVybjogU3ludGF4SGlnaGxpZ2h0ZXIuU1FMX0tFWVdPUkRTIH0sXG4gICAgICB7IHR5cGU6IFwibnVtYmVyXCIsICAgcGF0dGVybjogL14tP1xcZCtcXC4/XFxkKi8gfSxcbiAgICAgIHsgdHlwZTogXCJmdW5jdGlvblwiLCBwYXR0ZXJuOiAvXlthLXpBLVpfXVxcdyooPz1cXHMqXFwoKS8gfSxcbiAgICAgIHsgdHlwZTogXCJwdW5jdFwiLCAgICBwYXR0ZXJuOiAvXlsoKSw7Kj08PiFdLyB9LFxuICAgIF0sXG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgUnVzdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBydXN0OiBbXG4gICAgICB7IHR5cGU6IFwiY29tbWVudFwiLCAgcGF0dGVybjogL15cXC9cXC9bXlxcbl0qLyB9LFxuICAgICAgeyB0eXBlOiBcImNvbW1lbnRcIiwgIHBhdHRlcm46IC9eXFwvXFwqW1xcc1xcU10qP1xcKlxcLy8gfSxcbiAgICAgIHsgdHlwZTogXCJzdHJpbmdcIiwgICBwYXR0ZXJuOiAvXnIjKlwiW1xcc1xcU10qP1wiIyovIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL15cIig/OlxcXFwufFteXCJcXFxcXSkqXCIvIH0sXG4gICAgICB7IHR5cGU6IFwic3RyaW5nXCIsICAgcGF0dGVybjogL14nKD86XFxcXC58W14nXFxcXF0pJy8gfSxcbiAgICAgIHsgdHlwZTogXCJrZXl3b3JkXCIsICBwYXR0ZXJuOiBTeW50YXhIaWdobGlnaHRlci5SVVNUX0tFWVdPUkRTIH0sXG4gICAgICB7IHR5cGU6IFwidHlwZVwiLCAgICAgcGF0dGVybjogL15bQS1aXVthLXpBLVowLTlfXSpcXGIvIH0sXG4gICAgICB7IHR5cGU6IFwiY29uc3RhbnRcIiwgcGF0dGVybjogL15bQS1aX117Mix9XFxiLyB9LFxuICAgICAgeyB0eXBlOiBcImZ1bmN0aW9uXCIsIHBhdHRlcm46IC9eW2Etel9dXFx3Kig/PVxccypcXCgpLyB9LFxuICAgICAgeyB0eXBlOiBcIm51bWJlclwiLCAgIHBhdHRlcm46IC9eMHhbXFxkYS1mQS1GX10rfF4wYlswMV9dK3xeMG9bMC03X10rfF5cXGRbXFxkX10qXFwuP1tcXGRfXSooW2VFXVsrLV0/W1xcZF9dKyk/KD86dTh8aTh8dTE2fGkxNnx1MzJ8aTMyfHU2NHxpNjR8dTEyOHxpMTI4fHVzaXplfGlzaXplfGYzMnxmNjQpPy8gfSxcbiAgICAgIHsgdHlwZTogXCJvcGVyYXRvclwiLCBwYXR0ZXJuOiAvXig9PnwtPnw6OnxcXC5cXC49P3wmJnxcXHxcXHx8WytcXC0qLyUmfF5+PD4hXT0/fFs9PzpAXSkvIH0sXG4gICAgICB7IHR5cGU6IFwicHVuY3RcIiwgICAgcGF0dGVybjogL15be31bXFxdKCk7LC5dLyB9LFxuICAgIF0sXG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgR28gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgZ286IFtcbiAgICAgIHsgdHlwZTogXCJjb21tZW50XCIsICBwYXR0ZXJuOiAvXlxcL1xcL1teXFxuXSovIH0sXG4gICAgICB7IHR5cGU6IFwiY29tbWVudFwiLCAgcGF0dGVybjogL15cXC9cXCpbXFxzXFxTXSo/XFwqXFwvLyB9LFxuICAgICAgeyB0eXBlOiBcInN0cmluZ1wiLCAgIHBhdHRlcm46IC9eYFteYF0qYC8gfSxcbiAgICAgIHsgdHlwZTogXCJzdHJpbmdcIiwgICBwYXR0ZXJuOiAvXlwiKD86XFxcXC58W15cIlxcXFxdKSpcIi8gfSxcbiAgICAgIHsgdHlwZTogXCJzdHJpbmdcIiwgICBwYXR0ZXJuOiAvXicoPzpcXFxcLnxbXidcXFxcXSkqJy8gfSxcbiAgICAgIHsgdHlwZTogXCJrZXl3b3JkXCIsICBwYXR0ZXJuOiBTeW50YXhIaWdobGlnaHRlci5HT19LRVlXT1JEUyB9LFxuICAgICAgeyB0eXBlOiBcInR5cGVcIiwgICAgIHBhdHRlcm46IC9eKGJvb2x8Ynl0ZXxjb21wbGV4NjR8Y29tcGxleDEyOHxlcnJvcnxmbG9hdDMyfGZsb2F0NjR8aW50fGludDh8aW50MTZ8aW50MzJ8aW50NjR8cnVuZXxzdHJpbmd8dWludHx1aW50OHx1aW50MTZ8dWludDMyfHVpbnQ2NHx1aW50cHRyKVxcYi8gfSxcbiAgICAgIHsgdHlwZTogXCJmdW5jdGlvblwiLCBwYXR0ZXJuOiAvXlthLXpBLVpfXVxcdyooPz1cXHMqXFwoKS8gfSxcbiAgICAgIHsgdHlwZTogXCJudW1iZXJcIiwgICBwYXR0ZXJuOiAvXjB4W1xcZGEtZkEtRl0rfF5cXGQrXFwuP1xcZCooW2VFXVsrLV0/XFxkKyk/aT8vIH0sXG4gICAgICB7IHR5cGU6IFwib3BlcmF0b3JcIiwgcGF0dGVybjogL14oOj18PC18XFwuXFwuXFwufFxcK1xcK3wtLXwmJnxcXHxcXHx8WytcXC0qLyUmfF5+PD4hXT0/fFs9Ol0pLyB9LFxuICAgICAgeyB0eXBlOiBcInB1bmN0XCIsICAgIHBhdHRlcm46IC9eW3t9W1xcXSgpOywuXS8gfSxcbiAgICBdLFxuICB9O1xuXG4gIC8vIEFsaWFzZXNcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgYWxpYXNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICBqczogXCJqYXZhc2NyaXB0XCIsIHRzOiBcInR5cGVzY3JpcHRcIiwgcHk6IFwicHl0aG9uXCIsXG4gICAgc2g6IFwiYmFzaFwiLCBzaGVsbDogXCJiYXNoXCIsIHpzaDogXCJiYXNoXCIsXG4gICAgcnM6IFwicnVzdFwiLCBnb2xhbmc6IFwiZ29cIixcbiAgfTtcblxuICAvLyBcdTI1MDBcdTI1MDAgUHVibGljIEFQSSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICAvKipcbiAgICogVG9rZW5pc2UgYGNvZGVgIGFjY29yZGluZyB0byB0aGUgcnVsZXMgZm9yIGBsYW5nYCBhbmQgcmV0dXJuIGFuIEhUTUxcbiAgICogc3RyaW5nIHdpdGggPHNwYW4gY2xhc3M9XCJzaC0qXCI+IHdyYXBwZXJzLiAgRmFsbHMgYmFjayB0byBlc2NhcGVIdG1sKClcbiAgICogd2hlbiB0aGUgbGFuZ3VhZ2UgaXMgdW5rbm93bi5cbiAgICovXG4gIHN0YXRpYyBoaWdobGlnaHQoY29kZTogc3RyaW5nLCBsYW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHJlc29sdmVkID0gU3ludGF4SGlnaGxpZ2h0ZXIuYWxpYXNlc1tsYW5nXSA/PyBsYW5nO1xuICAgIGNvbnN0IHJ1bGVzZXQgID0gU3ludGF4SGlnaGxpZ2h0ZXIucnVsZXNbcmVzb2x2ZWRdO1xuICAgIGlmICghcnVsZXNldCkgcmV0dXJuIGVzY2FwZUh0bWwoY29kZSk7XG5cbiAgICBsZXQgcG9zICAgID0gMDtcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcblxuICAgIG91dGVyOiB3aGlsZSAocG9zIDwgY29kZS5sZW5ndGgpIHtcbiAgICAgIGZvciAoY29uc3QgcnVsZSBvZiBydWxlc2V0KSB7XG4gICAgICAgIGNvbnN0IHNsaWNlID0gY29kZS5zbGljZShwb3MpO1xuICAgICAgICBjb25zdCBtID0gc2xpY2UubWF0Y2gocnVsZS5wYXR0ZXJuKTtcbiAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICBvdXRwdXQgKz0gYDxzcGFuIGNsYXNzPVwic2gtJHtydWxlLnR5cGV9XCI+JHtlc2NhcGVIdG1sKG1bMF0pfTwvc3Bhbj5gO1xuICAgICAgICAgIHBvcyArPSBtWzBdLmxlbmd0aDtcbiAgICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gTm8gcnVsZSBtYXRjaGVkIFx1MjAxNCBlbWl0IHRoZSByYXcgY2hhcmFjdGVyIHNhZmVseVxuICAgICAgb3V0cHV0ICs9IGVzY2FwZUh0bWwoY29kZVtwb3NdKTtcbiAgICAgIHBvcysrO1xuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbn1cblxuLy8gXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXG4vLyBcdTAwQTcgMTAgIElNQUdFIEVNQkVEREVSXG4vLyBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcdTI1NTBcblxuLyoqXG4gKiBSZXdyaXRlcyBpbWFnZSByZWZlcmVuY2VzIGluc2lkZSBhIE1hcmtkb3duIHN0cmluZyBzbyB0aGF0IGV2ZXJ5IGltYWdlXG4gKiB0aGUgdmF1bHQgY2FuIHJlc29sdmUgaXMgcmVwbGFjZWQgd2l0aCBhIGJhc2U2NCBkYXRhLVVSSS4gIFRoaXMgbWFrZXNcbiAqIHRoZSBleHBvcnRlZCBIVE1MIGNvbXBsZXRlbHkgc2VsZi1jb250YWluZWQgXHUyMDE0IG5vIGV4dGVybmFsIGZpbGVzIG5lZWRlZC5cbiAqXG4gKiBIYW5kbGVzIGJvdGg6XG4gKiAgIFx1MjAyMiBTdGFuZGFyZCBNYXJrZG93bjogICFbYWx0XShwYXRoL3RvL2ltYWdlLnBuZylcbiAqICAgXHUyMDIyIE9ic2lkaWFuIHdpa2lsaW5rczogIVtbaW1hZ2UucG5nXV0gIGFuZCAgIVtbaW1hZ2UucG5nfGFsdCB0ZXh0XV1cbiAqXG4gKiBJbWFnZXMgdGhhdCBjYW5ub3QgYmUgcmVzb2x2ZWQgKGV4dGVybmFsIGh0dHA6Ly8gVVJMcywgbWlzc2luZyBmaWxlcylcbiAqIGFyZSBsZWZ0IHVudG91Y2hlZCBzbyB0aGUgYnJvd3NlciBjYW4gaGFuZGxlIHRoZW0gbm9ybWFsbHkuXG4gKi9cbmNsYXNzIEltYWdlRW1iZWRkZXIge1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBJTUFHRV9FWFRTID0gbmV3IFNldChbXG4gICAgXCJwbmdcIiwgXCJqcGdcIiwgXCJqcGVnXCIsIFwiZ2lmXCIsIFwic3ZnXCIsIFwid2VicFwiLCBcImJtcFwiLCBcImljb1wiLCBcInRpZmZcIixcbiAgXSk7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgTUlNRTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICBwbmc6ICBcImltYWdlL3BuZ1wiLFxuICAgIGpwZzogIFwiaW1hZ2UvanBlZ1wiLFxuICAgIGpwZWc6IFwiaW1hZ2UvanBlZ1wiLFxuICAgIGdpZjogIFwiaW1hZ2UvZ2lmXCIsXG4gICAgc3ZnOiAgXCJpbWFnZS9zdmcreG1sXCIsXG4gICAgd2VicDogXCJpbWFnZS93ZWJwXCIsXG4gICAgYm1wOiAgXCJpbWFnZS9ibXBcIixcbiAgICBpY286ICBcImltYWdlL3gtaWNvblwiLFxuICAgIHRpZmY6IFwiaW1hZ2UvdGlmZlwiLFxuICB9O1xuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYWxsIGltYWdlIHJlZmVyZW5jZXMgaW4gYG1hcmtkb3duYCBhbmQgcmV0dXJucyBhIG5ldyBzdHJpbmdcbiAgICogd2l0aCB2YXVsdCBpbWFnZXMgcmVwbGFjZWQgYnkgZGF0YS1VUklzLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGVtYmVkQWxsKGFwcDogQXBwLCBzb3VyY2VGaWxlOiBURmlsZSwgbWFya2Rvd246IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgLy8gQ29sbGVjdCBldmVyeSBpbWFnZSByZWZlcmVuY2UgKHdlJ2xsIHByb2Nlc3MgdGhlbSBzZXJpYWxseSB0byBhdm9pZFxuICAgIC8vIGZsb29kaW5nIHRoZSB2YXVsdCBhZGFwdGVyIHdpdGggY29uY3VycmVudCByZWFkcyBvbiBsYXJnZSB2YXVsdHMpLlxuICAgIGNvbnN0IGpvYnM6IEFycmF5PHsgZnVsbDogc3RyaW5nOyBwYXRoOiBzdHJpbmc7IGFsdDogc3RyaW5nOyBpc1dpa2k6IGJvb2xlYW4gfT4gPSBbXTtcblxuICAgIC8vICFbW2ltYWdlLnBuZ11dIGFuZCAhW1tpbWFnZS5wbmd8YWx0XV1cbiAgICBjb25zdCB3aWtpUmUgPSAvIVxcW1xcWyhbXlxcXXxdKz8pKD86XFx8KFteXFxdXSopKT9cXF1cXF0vZztcbiAgICBsZXQgbTogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgICB3aGlsZSAoKG0gPSB3aWtpUmUuZXhlYyhtYXJrZG93bikpICE9PSBudWxsKSB7XG4gICAgICBqb2JzLnB1c2goeyBmdWxsOiBtWzBdLCBwYXRoOiBtWzFdLnRyaW0oKSwgYWx0OiBtWzJdPy50cmltKCkgPz8gbVsxXS50cmltKCksIGlzV2lraTogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICAvLyAhW2FsdF0ocGF0aCkgIFx1MjAxNCBza2lwIGh0dHAocykgVVJMc1xuICAgIGNvbnN0IG1kSW1nUmUgPSAvIVxcWyhbXlxcXV0qKVxcXVxcKChbXildKylcXCkvZztcbiAgICB3aGlsZSAoKG0gPSBtZEltZ1JlLmV4ZWMobWFya2Rvd24pKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc3JjID0gbVsyXS50cmltKCk7XG4gICAgICBpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdChzcmMpKSBjb250aW51ZTtcbiAgICAgIGpvYnMucHVzaCh7IGZ1bGw6IG1bMF0sIHBhdGg6IHNyYywgYWx0OiBtWzFdLnRyaW0oKSwgaXNXaWtpOiBmYWxzZSB9KTtcbiAgICB9XG5cbiAgICAvLyBEZWR1cGxpY2F0ZSBieSBwYXRoIHNvIGVhY2ggaW1hZ2UgaXMgb25seSByZWFkIG9uY2VcbiAgICBjb25zdCBjYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmcgfCBudWxsPigpO1xuXG4gICAgZm9yIChjb25zdCBqb2Igb2Ygam9icykge1xuICAgICAgaWYgKGNhY2hlLmhhcyhqb2IucGF0aCkpIGNvbnRpbnVlO1xuICAgICAgY2FjaGUuc2V0KGpvYi5wYXRoLCBhd2FpdCBJbWFnZUVtYmVkZGVyLnRvRGF0YVVyaShhcHAsIHNvdXJjZUZpbGUsIGpvYi5wYXRoKSk7XG4gICAgfVxuXG4gICAgLy8gUmVwbGFjZSBhbGwgb2NjdXJyZW5jZXNcbiAgICBsZXQgcmVzdWx0ID0gbWFya2Rvd247XG4gICAgZm9yIChjb25zdCBqb2Igb2Ygam9icykge1xuICAgICAgY29uc3QgZGF0YVVyaSA9IGNhY2hlLmdldChqb2IucGF0aCk7XG4gICAgICBpZiAoIWRhdGFVcmkpIGNvbnRpbnVlOyAvLyBjb3VsZCBub3QgcmVzb2x2ZSBcdTIwMTQgbGVhdmUgYXMtaXNcbiAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gYCFbJHtqb2IuYWx0fV0oJHtkYXRhVXJpfSlgO1xuICAgICAgLy8gRXNjYXBlIHRoZSBvcmlnaW5hbCBtYXRjaCBmb3IgdXNlIGluIGEgUmVnRXhwXG4gICAgICByZXN1bHQgPSByZXN1bHQuc3BsaXQoam9iLmZ1bGwpLmpvaW4ocmVwbGFjZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUHJpdmF0ZSBoZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIC8qKlxuICAgKiBSZXNvbHZlIGEgcGF0aCB0byBhIFRGaWxlIGluIHRoZSB2YXVsdCwgcmVhZCBpdHMgYmluYXJ5IGNvbnRlbnQsXG4gICAqIGFuZCByZXR1cm4gYSBiYXNlNjQgZGF0YS1VUkkgc3RyaW5nLiAgUmV0dXJucyBudWxsIGlmIG5vdCByZXNvbHZhYmxlLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgdG9EYXRhVXJpKFxuICAgIGFwcDogQXBwLFxuICAgIHNvdXJjZUZpbGU6IFRGaWxlLFxuICAgIGltZ1BhdGg6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZXh0ID0gaW1nUGF0aC5zcGxpdChcIi5cIikucG9wKCk/LnRvTG93ZXJDYXNlKCkgPz8gXCJcIjtcbiAgICAgIGlmICghSW1hZ2VFbWJlZGRlci5JTUFHRV9FWFRTLmhhcyhleHQpKSByZXR1cm4gbnVsbDtcblxuICAgICAgLy8gVHJ5IHJlc29sdmluZyByZWxhdGl2ZSB0byB0aGUgc291cmNlIG5vdGUsIHRoZW4gdmF1bHQtd2lkZVxuICAgICAgY29uc3QgZmlsZSA9XG4gICAgICAgIGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGltZ1BhdGgsIHNvdXJjZUZpbGUucGF0aCkgPz9cbiAgICAgICAgYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChpbWdQYXRoKTtcblxuICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIG51bGw7XG5cbiAgICAgIGNvbnN0IGJ1ZmZlciAgID0gYXdhaXQgYXBwLnZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG4gICAgICBjb25zdCBtaW1lICAgICA9IEltYWdlRW1iZWRkZXIuTUlNRVtleHRdID8/IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG4gICAgICBjb25zdCBiYXNlNjQgICA9IEltYWdlRW1iZWRkZXIuYXJyYXlCdWZmZXJUb0Jhc2U2NChidWZmZXIpO1xuICAgICAgcmV0dXJuIGBkYXRhOiR7bWltZX07YmFzZTY0LCR7YmFzZTY0fWA7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKiogQ29udmVydCBhbiBBcnJheUJ1ZmZlciB0byBhIGJhc2U2NCBzdHJpbmcgd2l0aG91dCB1c2luZyBhdG9iL2J0b2Egb25cbiAgICogIGh1Z2UgYnVmZmVycyAod2hpY2ggY2FuIHN0YWNrLW92ZXJmbG93KS4gIFVzZXMgYSBjaHVua2VkIGFwcHJvYWNoLiAqL1xuICBwcml2YXRlIHN0YXRpYyBhcnJheUJ1ZmZlclRvQmFzZTY0KGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ5dGVzICAgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGNvbnN0IENIVU5LICAgPSA4MTkyO1xuICAgIGxldCBiaW5hcnkgICAgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IENIVU5LKSB7XG4gICAgICBiaW5hcnkgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSguLi5ieXRlcy5zdWJhcnJheShpLCBpICsgQ0hVTkspKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ0b2EoYmluYXJ5KTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFvQkEsc0JBV087QUFNUCxJQUFxQixxQkFBckIsY0FBZ0QsdUJBQU87QUFBQSxFQUNyRCxZQUFZLEtBQVUsVUFBMEI7QUFDOUMsVUFBTSxLQUFLLFFBQVE7QUFBQSxFQUNyQjtBQUFBLEVBRUEsTUFBTSxTQUF3QjtBQUM1QixZQUFRLElBQUksc0NBQWlDO0FBRzdDLFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sZUFBZSxDQUFDLGFBQXNCO0FBQ3BDLGNBQU0sYUFBYSxLQUFLLElBQUksVUFBVSxjQUFjO0FBQ3BELFlBQUksY0FBYyxXQUFXLGNBQWMsTUFBTTtBQUMvQyxjQUFJLENBQUMsU0FBVSxNQUFLLGFBQWEsQ0FBQyxVQUFVLENBQUM7QUFDN0MsaUJBQU87QUFBQSxRQUNUO0FBQ0EsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGLENBQUM7QUFHRCxTQUFLO0FBQUEsTUFDSCxLQUFLLElBQUksVUFBVSxHQUFHLGFBQWEsQ0FBQyxNQUFZLFNBQXdCO0FBQ3RFLGNBQU0sVUFBVSxLQUFLLHFCQUFxQixJQUFJO0FBQzlDLFlB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QUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLFFBQVEsRUFDdEIsUUFBUSxNQUFNLFFBQVE7QUFDM0I7QUFFQSxTQUFTLFFBQVEsS0FBcUI7QUFDcEMsU0FBTyxJQUNKLFlBQVksRUFDWixLQUFLLEVBQ0wsUUFBUSxhQUFhLEVBQUUsRUFDdkIsUUFBUSxXQUFXLEdBQUcsRUFDdEIsUUFBUSxZQUFZLEVBQUU7QUFDM0I7QUFNQSxJQUFNLGVBQWU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFB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
