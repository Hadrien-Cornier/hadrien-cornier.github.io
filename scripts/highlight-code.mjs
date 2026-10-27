/** Color Python pseudocode at build time, so code blocks need no runtime script or CDN.
 *
 * An article opts in with `code_highlight: true` in its frontmatter. Each token becomes a
 * `<span class="tok-…">`: keyword, function, comment, string, number or constant. The article's
 * stylesheet chooses the colors for the dark and the light theme.
 */
const KEYWORDS = new Set(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
const CONSTANTS = new Set(['True', 'False', 'None']);
const TOKEN = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_]\w*)/g;

const escape = (text) => text.replace(/[&<>"']/g, (c) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const span = (kind, text) => `<span class="tok-${kind}">${escape(text)}</span>`;

export function highlightPython(code) {
  let html = '', last = 0, previousWord = '';
  for (const match of code.matchAll(TOKEN)) {
    const [text, comment, string, number, word] = match;
    html += escape(code.slice(last, match.index));
    last = match.index + text.length;
    if (comment) html += span('comment', comment);
    else if (string) html += span('string', string);
    else if (number) html += span('number', number);
    else if (KEYWORDS.has(word)) html += span('keyword', word);
    else if (CONSTANTS.has(word)) html += span('constant', word);
    // A name is a function where it is called or defined; attribute calls such as buffer.add color only the method.
    else if (previousWord === 'def' || /^\s*\(/.test(code.slice(last))) html += span('function', word);
    else html += escape(word);
    previousWord = word || '';
  }
  return html + escape(code.slice(last));
}
