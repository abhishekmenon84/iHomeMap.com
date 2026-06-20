function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const c=canvas;
  const ctx=c.getContext('2d');
  let w,h,t=0;
  function resize(){ w=c.width=c.offsetWidth; h=c.height=c.offsetHeight; }
  resize(); window.addEventListener('resize',resize);

  function draw(){
    ctx.clearRect(0,0,w,h);
    // Grid dots
    ctx.fillStyle='rgba(0,73,233,0.4)';
    const sp=48;
    for(let x=sp;x<w;x+=sp) for(let y=sp;y<h;y+=sp){
      const d=Math.hypot(x-w*0.5,y-h*0.5);
      const pulse=0.3+0.7*Math.sin(t*0.04-d*0.012);
      ctx.globalAlpha=pulse*0.5;
      ctx.beginPath(); ctx.arc(x,y,1.2,0,Math.PI*2); ctx.fill();
    }
    // Scan rings
    for(let i=0;i<3;i++){
      const r=((t*0.8+i*120)%360);
      ctx.globalAlpha=(1-r/360)*0.25;
      ctx.strokeStyle='#0049e9';
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(w*0.72,h*0.5,r,0,Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha=1;
    t++; requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('DOMContentLoaded', initHeroCanvas);
