(() => {
  const market=document.querySelector('.robotics-market');
  if(!market)return;
  const points=[...market.querySelectorAll('.rm-point')];
  const entries=[...market.querySelectorAll('.rm-company')];
  const select=market.querySelector('#market-company');
  const viewport=market.querySelector('.rm-map-viewport');
  const world=market.querySelector('.rm-map-world');
  const reveal=(id,{pan=false,focus=false}={})=>{
    const point=points.find(p=>p.dataset.companyJump===id);
    const entry=document.getElementById(`company-${id}`);
    if(!point||!entry)return;
    entries.forEach(e=>{e.hidden=e!==entry;e.open=e===entry;});
    points.forEach(p=>p.setAttribute('aria-current',p===point?'true':'false'));
    select.value=id;
    if(pan){const x=point.offsetLeft+market.querySelector('.rm-plot').offsetLeft;viewport.scrollTo({left:x-viewport.clientWidth/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
    if(focus)entry.querySelector('summary').focus({preventScroll:true});
  };
  points.forEach(p=>p.addEventListener('click',event=>{
    event.preventDefault();reveal(p.dataset.companyJump,{focus:true});
    history.replaceState(null,'',`#company-${p.dataset.companyJump}`);
    document.getElementById(`company-${p.dataset.companyJump}`).scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }));
  select.addEventListener('change',()=>reveal(select.value,{pan:true}));
  market.querySelector('#market-zoom').addEventListener('click',event=>{
    const large=world.classList.toggle('rm-larger');event.currentTarget.setAttribute('aria-pressed',String(large));reveal(select.value,{pan:true});
  });
  market.querySelector('#market-links').addEventListener('click',event=>{const hide=market.classList.toggle('rm-hide-links');event.currentTarget.setAttribute('aria-pressed',String(!hide));});
  market.querySelector('#market-fit').addEventListener('click',()=>{world.classList.remove('rm-larger');market.querySelector('#market-zoom').setAttribute('aria-pressed','false');viewport.scrollTo({left:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#company-'))reveal(location.hash.slice(9),{pan:true});});
  market.querySelector('.rm-tools').hidden=false;
  market.classList.add('rm-enhanced');
  reveal(location.hash.startsWith('#company-')?location.hash.slice(9):(entries.some(e=>e.id==='company-field-ai')?'field-ai':entries[0].id.slice(8)),{pan:innerWidth<700});
})();
