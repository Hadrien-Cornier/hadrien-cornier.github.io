// Same-origin article embed; standalone pages need no parent messaging.
if (window.parent !== window) {
  let lastHeight=0;
  new ResizeObserver(()=>{
    const height=Math.ceil(document.querySelector('main').getBoundingClientRect().height);
    if(height!==lastHeight){lastHeight=height;window.parent.postMessage({kind:'wam-embed-height',height},location.origin);}
  }).observe(document.querySelector('main'));
}
