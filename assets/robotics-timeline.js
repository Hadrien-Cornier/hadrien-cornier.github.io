/* Enhancement only. Stage text, stack rows, and links are already in the page. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  for (const timeline of document.querySelectorAll('[data-robotics-timeline]')) {
    const stages = [...timeline.querySelectorAll('[data-timeline-stage]')];
    const controls = [...timeline.querySelectorAll('[data-timeline-control]')];
    const inspector = timeline.querySelector('.rt-inspector');
    const stack = timeline.querySelector('[data-timeline-current-stack]');
    const title = timeline.querySelector('[data-timeline-current-title]');
    const position = timeline.querySelector('[data-timeline-position]');
    const previous = timeline.querySelector('[data-timeline-previous]');
    const next = timeline.querySelector('[data-timeline-next]');
    const status = timeline.querySelector('[data-timeline-status]');
    const inspectorInner = inspector?.querySelector('.rt-inspector-inner');
    if (!stages.length || stages.length !== controls.length || !inspector || !inspectorInner || !stack || !title || !position || !previous || !next || !status) continue;
    let active = -1;
    let frame = 0;
    let layoutDirty = true;
    let inlineStackNeeded = false;
    let measuredPanelHeight = 0;
    let measuredPanelWidth = 0;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    const fitInspector = () => {
      if (!layoutDirty || inspector.hidden) return;
      layoutDirty = false;
      // Measure the real panel at its pinned width, even after an earlier fallback.
      timeline.classList.remove('rt-inline-stack');
      const panel = inspectorInner.getBoundingClientRect();
      measuredPanelHeight = panel.height;
      measuredPanelWidth = panel.width;
      inlineStackNeeded = inlineStackNeeded || panel.height > window.innerHeight - 60;
      // Showing inline stacks changes earlier card heights. Keep that reading
      // layout until the viewport changes, so stage selection cannot flip it back.
      timeline.classList.toggle('rt-inline-stack', inlineStackNeeded);
    };
    const activate = (index, announce = false) => {
      if (index < 0 || index >= stages.length) return;
      if (index !== active) {
        active = index;
        stages.forEach((stage, current) => stage.classList.toggle('is-active', current === index));
        controls.forEach((control, current) => {
          if (current === index) control.setAttribute('aria-current', 'step');
          else control.removeAttribute('aria-current');
        });
        title.textContent = stages[index].querySelector('h3').textContent;
        stack.replaceChildren(stages[index].querySelector('.rt-stack').cloneNode(true));
        position.textContent = `${index + 1} / ${stages.length}`;
        previous.disabled = index === 0;
        next.disabled = index === stages.length - 1;
        layoutDirty = true;
        fitInspector();
      }
      if (announce) status.textContent = `Stage ${index + 1} of ${stages.length}: ${title.textContent}`;
    };
    const navigate = (index) => {
      if (index < 0 || index >= stages.length) return;
      activate(index, true);
      stages[index].classList.add('has-unfolded');
      const fragment = `#${stages[index].id}`;
      if (location.hash !== fragment) history.pushState(null, '', fragment);
      stages[index].focus({preventScroll:true});
      stages[index].scrollIntoView({block:'start', behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    };
    const update = () => {
      frame = 0;
      const bounds = timeline.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const readingLine = Math.min(240, window.innerHeight * .32);
      const rects = stages.map((stage) => stage.getBoundingClientRect());
      let current = 0;
      rects.forEach((rect, index) => {
        if (rect.top <= readingLine) current = index;
        if (rect.top < window.innerHeight * .86) stages[index].classList.add('has-unfolded');
      });
      activate(current);
      const track = timeline.querySelector('.rt-track').getBoundingClientRect();
      const start = track.top + 17;
      const end = track.bottom;
      timeline.style.setProperty('--rt-progress', String(end === start ? 1 : clamp((readingLine - start) / (end - start))));
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    stages.forEach((stage) => {
      stage.addEventListener('focusin', () => stage.classList.add('has-unfolded'));
    });
    controls.forEach((control, index) => {
      control.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        // Native links remain the static fallback. Explicit scrolling also works
        // when a reader selects the fragment already present in the URL.
        event.preventDefault();
        navigate(index);
      });
      control.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const destinations = {ArrowLeft:index - 1, ArrowUp:index - 1, ArrowRight:index + 1, ArrowDown:index + 1, Home:0, End:controls.length - 1};
        const destination = destinations[event.key];
        if (destination === undefined) return;
        event.preventDefault();
        controls[Math.max(0, Math.min(controls.length - 1, destination))].focus();
      });
    });
    previous.addEventListener('click', () => navigate(active - 1));
    next.addEventListener('click', () => navigate(active + 1));
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', () => {
      if (window.innerWidth !== viewportWidth || window.innerHeight !== viewportHeight) {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;
        inlineStackNeeded = false;
        layoutDirty = true;
        fitInspector();
      }
      schedule();
    });
    window.addEventListener('hashchange', schedule);
    if ('ResizeObserver' in window) {
      new ResizeObserver(schedule).observe(timeline);
      new ResizeObserver(() => {
        if (inlineStackNeeded || inspector.hidden) return;
        const panel = inspectorInner.getBoundingClientRect();
        if (!panel.height || (panel.height === measuredPanelHeight && panel.width === measuredPanelWidth)) return;
        // Fonts and text-only zoom can change panel size without a window resize.
        layoutDirty = true;
        fitInspector();
        schedule();
      }).observe(inspectorInner);
    }
    const initial = stages.findIndex((stage) => `#${stage.id}` === location.hash);
    activate(initial < 0 ? 0 : initial);
    inspector.hidden = false;
    timeline.classList.add('is-enhanced');
    fitInspector();
    update();
  }
})();
