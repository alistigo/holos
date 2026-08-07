import { type CSSProperties, type JSX, useRef } from "react";

function escapeHTML(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── JSON tokenizer ────────────────────────────────────────────────────────────

type JSONTok = "key" | "string" | "number" | "keyword" | "plain";

const JSON_COLORS: Record<JSONTok, string> = {
  key: "#0451a5",
  string: "#1a8500",
  number: "#b5550c",
  keyword: "#7c3aed",
  plain: "#374151",
};

// fallow-ignore-next-line complexity
function jsonToHTML(code: string): string {
  let out = "";
  let i = 0;
  let plain = "";

  const flushPlain = (): void => {
    if (plain) {
      out += escapeHTML(plain);
      plain = "";
    }
  };

  while (i < code.length) {
    const ch = code.charAt(i);
    if (ch === '"') {
      flushPlain();
      let j = i + 1;
      while (j < code.length) {
        if (code.charAt(j) === "\\") j += 2;
        else if (code.charAt(j) === '"') {
          j++;
          break;
        } else j++;
      }
      const text = code.slice(i, j);
      let k = j;
      while (k < code.length && " \n\t\r".includes(code.charAt(k))) k++;
      const type: JSONTok = code.charAt(k) === ":" ? "key" : "string";
      out += `<span style="color:${JSON_COLORS[type]}">${escapeHTML(text)}</span>`;
      i = j;
    } else if (
      (ch === "-" &&
        i + 1 < code.length &&
        code.charAt(i + 1) >= "0" &&
        code.charAt(i + 1) <= "9") ||
      (ch >= "0" && ch <= "9")
    ) {
      flushPlain();
      let j = i;
      if (code.charAt(j) === "-") j++;
      while (
        j < code.length &&
        ((code.charAt(j) >= "0" && code.charAt(j) <= "9") ||
          code.charAt(j) === "." ||
          code.charAt(j) === "e" ||
          code.charAt(j) === "E")
      )
        j++;
      out += `<span style="color:${JSON_COLORS.number}">${escapeHTML(code.slice(i, j))}</span>`;
      i = j;
    } else if (
      code.startsWith("true", i) ||
      code.startsWith("false", i) ||
      code.startsWith("null", i)
    ) {
      flushPlain();
      const kw = code.startsWith("true", i)
        ? "true"
        : code.startsWith("false", i)
          ? "false"
          : "null";
      out += `<span style="color:${JSON_COLORS.keyword}">${kw}</span>`;
      i += kw.length;
    } else {
      plain += ch;
      i++;
    }
  }
  flushPlain();
  return out;
}

// ── JS tokenizer ──────────────────────────────────────────────────────────────

type JSTok = "keyword" | "string" | "number" | "comment" | "plain";

const JS_COLORS: Record<JSTok, string> = {
  keyword: "#c792ea",
  string: "#c3e88d",
  number: "#f78c6c",
  comment: "#637777",
  plain: "#d4d4d4",
};

const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "new",
  "if",
  "else",
  "typeof",
  "instanceof",
  "void",
  "async",
  "await",
  "for",
  "while",
  "try",
  "catch",
  "break",
  "class",
  "import",
  "export",
  "from",
  "of",
  "in",
  "true",
  "false",
  "null",
  "undefined",
  "this",
  "delete",
  "throw",
  "finally",
  "switch",
  "case",
  "default",
]);

// fallow-ignore-next-line complexity
function jsToHTML(code: string): string {
  let out = "";
  let i = 0;
  let plain = "";

  const flushPlain = (): void => {
    if (plain) {
      out += escapeHTML(plain);
      plain = "";
    }
  };

  while (i < code.length) {
    const ch = code.charAt(i);
    const ch2 = code.charAt(i + 1);

    if (ch === "/" && ch2 === "/") {
      flushPlain();
      let j = i;
      while (j < code.length && code.charAt(j) !== "\n") j++;
      out += `<span style="color:${JS_COLORS.comment};font-style:italic">${escapeHTML(code.slice(i, j))}</span>`;
      i = j;
    } else if (ch === "/" && ch2 === "*") {
      flushPlain();
      let j = i + 2;
      while (j < code.length && !(code.charAt(j) === "*" && code.charAt(j + 1) === "/")) j++;
      j += 2;
      out += `<span style="color:${JS_COLORS.comment};font-style:italic">${escapeHTML(code.slice(i, j))}</span>`;
      i = j;
    } else if (ch === '"' || ch === "'") {
      flushPlain();
      let j = i + 1;
      while (j < code.length) {
        if (code.charAt(j) === "\\") j += 2;
        else if (code.charAt(j) === ch || code.charAt(j) === "\n") {
          j++;
          break;
        } else j++;
      }
      out += `<span style="color:${JS_COLORS.string}">${escapeHTML(code.slice(i, j))}</span>`;
      i = j;
    } else if (ch === "`") {
      flushPlain();
      let j = i + 1;
      while (j < code.length) {
        if (code.charAt(j) === "\\") j += 2;
        else if (code.charAt(j) === "`") {
          j++;
          break;
        } else j++;
      }
      out += `<span style="color:${JS_COLORS.string}">${escapeHTML(code.slice(i, j))}</span>`;
      i = j;
    } else if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_" || ch === "$") {
      flushPlain();
      let j = i;
      while (j < code.length) {
        const c = code.charAt(j);
        if (
          (c >= "a" && c <= "z") ||
          (c >= "A" && c <= "Z") ||
          (c >= "0" && c <= "9") ||
          c === "_" ||
          c === "$"
        )
          j++;
        else break;
      }
      const word = code.slice(i, j);
      if (JS_KEYWORDS.has(word)) {
        out += `<span style="color:${JS_COLORS.keyword}">${escapeHTML(word)}</span>`;
      } else {
        out += escapeHTML(word);
      }
      i = j;
    } else if (ch >= "0" && ch <= "9") {
      flushPlain();
      let j = i;
      while (j < code.length) {
        const c = code.charAt(j);
        if (
          (c >= "0" && c <= "9") ||
          c === "." ||
          c === "e" ||
          c === "E" ||
          c === "x" ||
          c === "X" ||
          (c >= "a" && c <= "f") ||
          (c >= "A" && c <= "F")
        )
          j++;
        else break;
      }
      out += `<span style="color:${JS_COLORS.number}">${escapeHTML(code.slice(i, j))}</span>`;
      i = j;
    } else {
      plain += ch;
      i++;
    }
  }
  flushPlain();
  return out;
}

// ── Shared font style ─────────────────────────────────────────────────────────

const MONO: CSSProperties = {
  fontFamily: "'ui-monospace','SFMono-Regular','Menlo','Monaco','Consolas',monospace",
  fontSize: "0.8125rem",
  lineHeight: "1.375rem",
  padding: "0.5rem 0.75rem",
};

// ── JsonEditor ────────────────────────────────────────────────────────────────

interface JsonEditorProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hasError?: boolean;
}

export function JsonEditor({
  value,
  onChange,
  rows = 8,
  hasError = false,
}: JsonEditorProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  function syncScroll(): void {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  const html = jsonToHTML(value) + "\n";
  const heightRem = rows * 1.375 + 1;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-lg border focus-within:ring-2 focus-within:ring-offset-0",
        hasError
          ? "border-red-400 focus-within:ring-red-400"
          : "border-gray-300 focus-within:ring-blue-500 focus-within:border-blue-500",
      ].join(" ")}
      style={{ height: `${heightRem}rem`, backgroundColor: "#f8fafc" }}
    >
      <pre
        ref={preRef}
        aria-hidden="true"
        style={{
          ...MONO,
          position: "absolute",
          inset: 0,
          margin: 0,
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          color: JSON_COLORS.plain,
          pointerEvents: "none",
          backgroundColor: "transparent",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled tokenizer output with HTML escaping
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        style={{
          ...MONO,
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          margin: 0,
          resize: "none",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          background: "transparent",
          color: "transparent",
          caretColor: "#1e293b",
          outline: "none",
          border: "none",
        }}
      />
    </div>
  );
}

// ── HighlightedCode ───────────────────────────────────────────────────────────

interface HighlightedCodeProps {
  code: string;
  language: "json" | "js";
}

export function HighlightedCode({ code, language }: HighlightedCodeProps): JSX.Element {
  const html = language === "json" ? jsonToHTML(code) : jsToHTML(code);
  return (
    <pre
      style={{
        ...MONO,
        margin: 0,
        flex: "1 1 0",
        minHeight: 0,
        overflow: "auto",
        whiteSpace: "pre",
        borderRadius: "0.5rem",
        backgroundColor: "#1e1e2e",
        color: JS_COLORS.plain,
      }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled tokenizer output with HTML escaping
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
