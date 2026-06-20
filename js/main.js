document.addEventListener('DOMContentLoaded', () => {

// ══════════════════════════════════════════════
// CUSTOM CURSOR
// ══════════════════════════════════════════════
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let mx=0,my=0,rx=0,ry=0;
if (dot && ring) {
  document.addEventListener('mousemove',e=>{
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  (function animCursor(){
    rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12;
    ring.style.left=(rx-16)+'px'; ring.style.top=(ry-16)+'px';
    requestAnimationFrame(animCursor);
  })();
  document.querySelectorAll('a,button,.f-card,.a-card,.p-card,.rm-item').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('cursor-hover'));
  });
}

// ══════════════════════════════════════════════
// NAV SCROLL PROGRESS
// ══════════════════════════════════════════════
const navBar=document.getElementById('navProgress');
if (navBar) {
  window.addEventListener('scroll',()=>{
    const pct=(scrollY/(document.body.scrollHeight-innerHeight))*100;
    navBar.style.width=pct+'%';
  },{ passive:true });
}

// ══════════════════════════════════════════════
// REVEAL ON SCROLL
// ══════════════════════════════════════════════
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
},{ threshold:0.1 });
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// ══════════════════════════════════════════════
// FAQ ACCORDION
// ══════════════════════════════════════════════
document.querySelectorAll('.faq-q').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const item=btn.closest('.faq-item');
    const isOpen=item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open'));
    if(!isOpen) item.classList.add('open');
  });
});

// ══════════════════════════════════════════════
// MAGNETIC BUTTONS
// ══════════════════════════════════════════════
document.querySelectorAll('.btn-p,.nav-cta,.p-cta.featured').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const r=btn.getBoundingClientRect();
    const dx=e.clientX-(r.left+r.width/2);
    const dy=e.clientY-(r.top+r.height/2);
    btn.style.transform=`translate(${dx*0.2}px,${dy*0.2}px)`;
  });
  btn.addEventListener('mouseleave',()=>{ btn.style.transform=''; });
});

// ══════════════════════════════════════════════
// STAT COUNTERS
// ══════════════════════════════════════════════
document.querySelectorAll('[data-count]').forEach(el=>{
  const target=+el.dataset.count;
  let current=0;
  const step=()=>{ if(current<target){ current++; el.textContent=current+'min'; requestAnimationFrame(step); }};
  setTimeout(step,1200);
});

}); // end DOMContentLoaded
