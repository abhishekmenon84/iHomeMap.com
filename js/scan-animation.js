function initScanAnimation() {
  const canvas = document.getElementById('scan-canvas');
  if (!canvas) return;
  const section = document.getElementById('scan-section');
  if (!section) return;
  const sticky=document.getElementById('scan-sticky');
  const ctx=canvas.getContext('2d');
  const fill=document.getElementById('scanFill');
  const headline=document.getElementById('scan-headline');
  const subline=document.getElementById('scan-sub');
  const stepLabel=document.getElementById('scanStepLabel');

  let W,H;
  function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
  }
  resize(); window.addEventListener('resize',resize);

  // Floor plan definition (relative to center, scale 1 = full span)
  const SCALE=()=>Math.min(W,H)*0.38;

  // Room layout: array of wall segment pairs [x1,y1,x2,y2] (normalized -1..1)
  const walls=[
    // Outer boundary
    [-1,-1, 1,-1],
    [ 1,-1, 1, 1],
    [ 1, 1,-1, 1],
    [-1, 1,-1,-1],
    // Interior: living room divider (horizontal mid-left)
    [-1, 0, 0.2, 0],
    // Interior: bedroom partition (vertical right side)
    [ 0.2,-1, 0.2, 0],
    // Bathroom partition
    [ 0.2, 0, 0.2, 0.5],
    [ 0.2, 0.5, 1, 0.5],
  ];
  const doors=[
    {x:-0.1,y:0,w:0.25,angle:0,side:1},        // living→hallway
    {x:0.2,y:-0.4,w:0.2,angle:Math.PI/2,side:1}, // bedroom door
    {x:0.6,y:0.5,w:0.18,angle:0,side:-1},        // bathroom door
  ];
  const windows=[
    {x:-1,y:-0.5,len:0.3,axis:'v'},
    {x:1,y:0.3,len:0.25,axis:'v'},
    {x:0,y:-1,len:0.3,axis:'h'},
  ];
  const labels=[
    {x:-0.5,y:-0.4,text:'Living Room',area:'18.2 m²'},
    {x:0.6,y:-0.5,text:'Bedroom',area:'12.4 m²'},
    {x:0.6,y:0.75,text:'Bathroom',area:'5.1 m²'},
    {x:-0.5,y:0.5,text:'Kitchen',area:'9.8 m²'},
  ];
  const dims=[
    {x1:-1,y1:-1.15,x2:1,y2:-1.15,label:'9.4 m'},
    {x1:1.12,y1:-1,x2:1.12,y2:1,label:'8.2 m'},
  ];

  // Blue: primary color
  const BLUE='#0049e9';
  const BLUE2='#3866ff';
  const GRID='rgba(0,73,233,0.15)';
  const WALL='rgba(0,73,233,0.9)';
  const DIM_COL='rgba(0,73,233,0.6)';

  // Draw helpers
  function cx(nx){ return W/2 + nx*SCALE(); }
  function cy(ny){ return H/2 + ny*SCALE(); }

  // Easing
  function ease(t){ return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2; }
  function clamp01(v){ return Math.max(0,Math.min(1,v)); }
  function mapRange(v,a,b){ return clamp01((v-a)/(b-a)); }

  // Steps
  const steps=[
    {range:[0,0.08], label:'Initialising LiDAR sensor…',     head:'Point your iPhone.',       sub:'Walk slowly around the perimeter of the room.'},
    {range:[0.08,0.2],label:'Detecting room boundaries…',    head:'Walls detected.',           sub:'iHomeMap traces every surface in real-time.'},
    {range:[0.2,0.4], label:'Mapping interior walls…',       head:'Interior structure found.', sub:'Partition walls, alcoves, and recesses captured.'},
    {range:[0.4,0.55],label:'Locating doors & windows…',     head:'Openings identified.',      sub:'7 door types detected and classified automatically.'},
    {range:[0.55,0.72],label:'Calculating room dimensions…', head:'Measuring up.',             sub:'Accurate to the centimetre using LiDAR depth data.'},
    {range:[0.72,0.88],label:'Generating floor plan…',       head:'Floor plan ready.',         sub:'Professional 2D layout generated instantly.'},
    {range:[0.88,1.0], label:'Export available.',            head:'Done. Export anytime.',     sub:'Use 1 credit to export a professional PDF.'},
  ];

  function getStep(p){
    for(const s of steps) if(p>=s.range[0]&&p<=s.range[1]) return s;
    return steps[steps.length-1];
  }

  let lastStep=null;

  function drawFrame(p){
    ctx.clearRect(0,0,W,H);
    const S=SCALE();

    // Background
    const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
    bg.addColorStop(0,'#0e1929');
    bg.addColorStop(1,p>0.5?'#070d18':'#0c1526');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Grid dots
    const gridAlpha=Math.min(1,mapRange(p,0,0.08));
    if(gridAlpha>0){
      ctx.fillStyle=`rgba(0,73,233,${0.3*gridAlpha})`;
      const sp=40;
      for(let x=sp;x<W;x+=sp) for(let y=sp;y<H;y+=sp){
        ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill();
      }
    }

    // Scan ring (early phase)
    if(p<0.25){
      const rp=mapRange(p,0,0.25);
      const maxR=S*1.8;
      for(let i=0;i<4;i++){
        const offset=i/4;
        const rr=((rp+offset)%1)*maxR;
        const alpha=(1-((rp+offset)%1))*0.4;
        ctx.strokeStyle=`rgba(0,73,233,${alpha})`;
        ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(W/2,H/2,rr,0,Math.PI*2); ctx.stroke();
      }
      // Center dot
      const dotPulse=0.5+0.5*Math.sin(p*120);
      ctx.fillStyle=`rgba(0,73,233,${0.6+0.4*dotPulse})`;
      ctx.beginPath(); ctx.arc(W/2,H/2,5+dotPulse*3,0,Math.PI*2); ctx.fill();
    }

    // Room fills (fade in after walls)
    const fillAlpha=mapRange(p,0.45,0.7)*0.08;
    if(fillAlpha>0){
      ctx.fillStyle=`rgba(0,73,233,${fillAlpha})`;
      // Living room
      ctx.fillRect(cx(-1),cy(-1),1*S,1*S);
      ctx.fillRect(cx(-1),cy(0),1*S,1*S);
      // Bedroom
      ctx.fillRect(cx(0.2),cy(-1),0.8*S,1*S);
      // Bathroom
      ctx.fillStyle=`rgba(0,73,233,${fillAlpha*0.6})`;
      ctx.fillRect(cx(0.2),cy(0.5),0.8*S,0.5*S);
    }

    // Outer walls
    const outerProg=mapRange(p,0.08,0.22);
    if(outerProg>0){
      ctx.strokeStyle=WALL;
      ctx.lineWidth=3;
      ctx.lineCap='round';
      ctx.setLineDash([]);
      const outerPath=[[cx(-1),cy(-1)],[cx(1),cy(-1)],[cx(1),cy(1)],[cx(-1),cy(1)],[cx(-1),cy(-1)]];
      const totalOuter=outerPath.length-1;
      const drawCount=outerProg*totalOuter;
      ctx.beginPath();
      ctx.moveTo(outerPath[0][0],outerPath[0][1]);
      for(let i=0;i<totalOuter;i++){
        const segProg=clamp01(drawCount-i);
        if(segProg<=0) break;
        const [x1,y1]=outerPath[i]; const [x2,y2]=outerPath[i+1];
        ctx.lineTo(x1+(x2-x1)*segProg,y1+(y2-y1)*segProg);
      }
      ctx.stroke();
    }

    // Interior walls
    const interiorProg=mapRange(p,0.22,0.4);
    if(interiorProg>0){
      ctx.strokeStyle='rgba(0,102,255,0.7)';
      ctx.lineWidth=2;
      const intWalls=walls.slice(4);
      intWalls.forEach((w,i)=>{
        const wp=clamp01(interiorProg*intWalls.length-i);
        if(wp<=0) return;
        ctx.beginPath();
        ctx.moveTo(cx(w[0]),cy(w[1]));
        ctx.lineTo(cx(w[0]+(w[2]-w[0])*wp),cy(w[1]+(w[3]-w[1])*wp));
        ctx.stroke();
      });
    }

    // Windows
    const winProg=mapRange(p,0.4,0.55);
    if(winProg>0){
      windows.forEach((win,i)=>{
        const wp=clamp01(winProg*windows.length-i);
        if(wp<=0) return;
        const alpha=wp*0.9;
        ctx.strokeStyle=`rgba(96,165,250,${alpha})`;
        ctx.lineWidth=3;
        ctx.setLineDash([]);
        if(win.axis==='h'){
          const x1=cx(win.x-win.len/2),x2=cx(win.x+win.len/2),y=cy(win.y);
          ctx.clearRect(x1,y-6,x2-x1,12);
          ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
        } else {
          const y1=cy(win.y-win.len/2),y2=cy(win.y+win.len/2),x=cx(win.x);
          ctx.clearRect(x-6,y1,12,y2-y1);
          ctx.beginPath(); ctx.moveTo(x,y1); ctx.lineTo(x,y2); ctx.stroke();
        }
      });
    }

    // Doors
    const doorProg=mapRange(p,0.4,0.58);
    if(doorProg>0){
      doors.forEach((d,i)=>{
        const dp=clamp01(doorProg*doors.length-i);
        if(dp<=0) return;
        ctx.strokeStyle=`rgba(0,73,233,${dp*0.8})`;
        ctx.lineWidth=2;
        ctx.setLineDash([]);
        const dw=d.w*S;
        const hx=cx(d.x), hy=cy(d.y);
        // Door gap clear
        if(d.axis==='h'||d.angle===0){
          ctx.clearRect(hx-dw/2,hy-8,dw,16);
        }
        // Leaf
        ctx.save();
        ctx.translate(hx,hy);
        ctx.rotate(d.angle);
        ctx.beginPath(); ctx.moveTo(-dw/2,0); ctx.lineTo(-dw/2+dw*dp*d.side*0.0,0);
        // arc
        const sweep=Math.PI/6*dp;
        ctx.beginPath();
        ctx.moveTo(-dw/2,0);
        ctx.lineTo(-dw/2+dw*Math.cos(-Math.PI/2+sweep)*d.side,dw*Math.sin(-Math.PI/2+sweep)*Math.abs(d.side));
        ctx.stroke();
        ctx.setLineDash([3,3]);
        ctx.beginPath();
        ctx.arc(-dw/2,0,dw,Math.PI/2-sweep,Math.PI/2,d.side<0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });
    }

    // Dimension lines
    const dimProg=mapRange(p,0.55,0.72);
    if(dimProg>0){
      ctx.strokeStyle=`rgba(0,73,233,${0.5*dimProg})`;
      ctx.lineWidth=1;
      ctx.setLineDash([4,4]);
      dims.forEach(d=>{
        ctx.beginPath();
        ctx.moveTo(cx(d.x1),cy(d.y1));
        ctx.lineTo(cx(d.x1)+(cx(d.x2)-cx(d.x1))*dimProg,cy(d.y1)+(cy(d.y2)-cy(d.y1))*dimProg);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // Dim labels
      if(dimProg>0.5){
        ctx.fillStyle=`rgba(96,165,250,${(dimProg-0.5)*2})`;
        ctx.font=`600 ${Math.round(S*0.08)}px Jost`;
        ctx.textAlign='center';
        dims.forEach(d=>{
          const mx=(cx(d.x1)+cx(d.x2))/2;
          const my=(cy(d.y1)+cy(d.y2))/2;
          ctx.fillText(d.label,mx,my-8);
        });
      }
    }

    // Room labels
    const labelProg=mapRange(p,0.72,0.88);
    if(labelProg>0){
      labels.forEach((l,i)=>{
        const lp=clamp01(labelProg*labels.length*0.5-i*0.3);
        if(lp<=0) return;
        const lx=cx(l.x), ly=cy(l.y);
        ctx.fillStyle=`rgba(255,255,255,${lp*0.9})`;
        ctx.font=`700 ${Math.round(S*0.085)}px 'Cormorant Garamond'`;
        ctx.textAlign='center';
        ctx.fillText(l.text,lx,ly);
        ctx.fillStyle=`rgba(0,73,233,${lp*0.8})`;
        ctx.font=`400 ${Math.round(S*0.068)}px Jost`;
        ctx.fillText(l.area,lx,ly+S*0.12);
      });
    }

    // North arrow (final stage)
    const northAlpha=mapRange(p,0.88,1.0);
    if(northAlpha>0){
      const nx=W-64,ny=64;
      ctx.save();
      ctx.translate(nx,ny);
      ctx.globalAlpha=northAlpha;
      ctx.strokeStyle='rgba(0,73,233,0.6)';
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(0,73,233,0.8)';
      ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(-5,0); ctx.lineTo(5,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.moveTo(0,16); ctx.lineTo(-5,0); ctx.lineTo(5,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.8)';
      ctx.font='600 10px Jost'; ctx.textAlign='center';
      ctx.fillText('N',0,-24);
      ctx.globalAlpha=1;
      ctx.restore();
    }

    // Step label update
    const s=getStep(p);
    if(s!==lastStep){
      lastStep=s;
      headline.textContent=s.head;
      subline.textContent=s.sub;
      stepLabel.textContent=s.label;
    }
    fill.style.width=(p*100)+'%';
  }

  function onScroll(){
    const rect=section.getBoundingClientRect();
    const sectionH=section.offsetHeight-window.innerHeight;
    const scrolled=-rect.top;
    const progress=Math.max(0,Math.min(1,scrolled/sectionH));
    drawFrame(progress);
  }

  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',()=>{ resize(); onScroll(); });
  drawFrame(0);
}

document.addEventListener('DOMContentLoaded', initScanAnimation);
