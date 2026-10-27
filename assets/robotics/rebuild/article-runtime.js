import {prepareBoards} from './board-metadata.js';

// Scripts keep their existing order: the canvas starts before widget controllers.
export async function startArticle(scripts = []) {
  prepareBoards();
  for (const src of [...new Set(['/assets/robotics/rl/canvas.js', ...scripts])]) {
    if ([...document.scripts].some(script => new URL(script.src, location.href).pathname === src)) continue;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.body.append(script);
    });
  }
}
