import {startArticle} from '/assets/robotics/rebuild/article-runtime.js';
import {renderSim} from '/assets/robotics/why-llm-rl-breaks-on-robots/flow-sim.mjs';

await startArticle([]);

// The flow simulator: the static drawing is the default state; the controls redraw it.
document.querySelectorAll('[data-flow-sim]').forEach((fig) => {
  const svg = fig.querySelector('.fsim-plot'), controls = fig.querySelector('.fsim-controls'), readout = fig.querySelector('.fsim-readout');
  const input = (key) => controls.querySelector(`input[data-k="${key}"]`);
  let seed = +fig.dataset.seed || 7;
  function draw() {
    const steps = +input('steps').value, beta = +input('beta').value;
    controls.querySelector('[data-o="steps"]').textContent = String(steps);
    controls.querySelector('[data-o="beta"]').textContent = String(beta);
    const view = renderSim({steps, beta, seed});
    svg.innerHTML = view.svg;
    readout.textContent = view.readout;
  }
  controls.addEventListener('input', draw);
  controls.querySelector('[data-k="noise"]').addEventListener('click', () => { seed += 1; draw(); });
  controls.hidden = false;
});
