import katex from 'katex';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// Raw article HTML bypasses Markdown math. Render explicit TeX delimiters once
// during integration, keeping equations available without browser scripts.
export function renderArticleMath(html) {
  const entities = {lt: '<', gt: '>', amp: '&', quot: '"', apos: "'"};
  const decode = text => text.replace(/&(lt|gt|amp|quot|apos|#x[\da-f]+|#\d+);/gi, (_, entity) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()];
    return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  });
  return html.split(/(<(?:script|style|pre|code|svg)\b[\s\S]*?<\/(?:script|style|pre|code|svg)>)/gi)
    .map((part, i) => i % 2 ? part : part.split(/(<[^>]*>)/g).map((text, j) => j % 2 ? text :
      text.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g, (_, display, inline) =>
        katex.renderToString(decode(display ?? inline), {
          displayMode: display !== undefined, throwOnError: true, trust: false, output: 'htmlAndMathml',
        }))).join('')).join('');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(renderArticleMath(readFileSync(0, 'utf8')));
