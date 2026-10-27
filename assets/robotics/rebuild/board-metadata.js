/* Accept equivalent authored board coordinates before the shared canvas starts. */
export function prepareBoards() {
  'use strict';
  document.querySelectorAll('.rc').forEach(function (rc) {
    var stage=rc.querySelector('.rc-stage'), svg=stage && stage.querySelector('svg.rc-svg');
    if (!stage || !svg) return;
    if (!stage.querySelector('.rc-where')) {
      var status=document.createElement('div');status.className='rc-where';status.textContent='Whole canvas';stage.appendChild(status);
    }
    // Accept equivalent board metadata on either the canvas wrapper or SVG.
    var rawWhole=svg.getAttribute('data-whole')||rc.getAttribute('data-whole')||svg.getAttribute('viewBox'), whole;
    try { whole=JSON.parse(rawWhole); } catch (_) { whole=String(rawWhole).trim().split(/[ ,]+/).map(Number); }
    if (!Array.isArray(whole)||whole.length!==4||!whole.every(Number.isFinite)) whole=[0,0,840,600];
    svg.setAttribute('data-whole',whole.join(' '));
    var views;
    try { views=JSON.parse(svg.getAttribute('data-views')||rc.getAttribute('data-views')); } catch (_) { views={}; }
    if (!views||typeof views!=='object') views={};
    function box(panel) {
      var g=[].find.call(svg.querySelectorAll('.rc-panel'),function(g){return g.getAttribute('data-panel')===panel;});
      if (!g) return null;
      var b=g.getBBox(), matrix=svg.getCTM().inverse().multiply(g.getCTM());
      var points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(function(p){return new DOMPoint(p[0],p[1]).matrixTransform(matrix);});
      var xs=points.map(function(p){return p.x;}),ys=points.map(function(p){return p.y;});
      var x=Math.min.apply(null,xs),y=Math.min.apply(null,ys),w=Math.max.apply(null,xs)-x,h=Math.max.apply(null,ys)-y;
      return w>0&&h>0?[x-18,y-18,w+36,h+36]:null;
    }
    rc.querySelectorAll('.rc-mark').forEach(function(mark){
      var key=mark.getAttribute('data-view')||mark.getAttribute('data-panel'), value=views[key];
      if (Array.isArray(value)&&value.length===4&&value.every(Number.isFinite)) return;
      if (value&&Array.isArray(value.box)) views[key]=value.box;
      else views[key]=box(mark.getAttribute('data-panel'))||svg.getAttribute('data-whole').split(' ').map(Number);
    });
    svg.setAttribute('data-views',JSON.stringify(views));
  });
}
