// Original architectural scene, rendered locally without external dependencies.
const canvas = document.querySelector('#orb');
const ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('#motion-toggle');
let width=0,height=0,angle=.17,tilt=-.24,phase=0,playing=!reducedMotion.matches;
let dragging=false,lastX=0,lastY=0,previousTime=0,visible=true;
const blocks=[
 {x:-5.1,y:-2.4,z:-.7,w:3.5,h:1.5,d:.7},
 {x:-.7,y:-2.7,z:-1,w:2.1,h:1.4,d:1},
 {x:3,y:-2.5,z:-.4,w:3.2,h:1.5,d:.8,red:true},
 {x:-5,y:0,z:.2,w:1.5,h:1.7,d:1.1},
 {x:-2.7,y:-.1,z:-.8,w:1.5,h:1.5,d:.8},
 {x:2.5,y:.1,z:-.9,w:1.5,h:1.7,d:1.3},
 {x:5.2,y:.2,z:0,w:2.2,h:1.6,d:.8,red:true},
 {x:-4,y:2.6,z:-.7,w:4.8,h:1.3,d:.7},
 {x:.9,y:2.7,z:-.2,w:1.8,h:1.4,d:.8,red:true},
 {x:4.4,y:2.6,z:-1,w:3.1,h:1.3,d:1}
];
function syncMotion(){motionButton.textContent=playing?'\u2161':'\u25b6';motionButton.setAttribute('aria-label',playing?'Pause scene animation':'Play scene animation');motionButton.setAttribute('aria-pressed',String(!playing))}
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;if(ctx){ctx.setTransform(dpr,0,0,dpr,0,0);draw()}}
function project(p){
 const a=angle+Math.sin(phase)*.045,ca=Math.cos(a),sa=Math.sin(a),ct=Math.cos(tilt),st=Math.sin(tilt);
 const x=p[0]*ca+p[2]*sa,z=-p[0]*sa+p[2]*ca,y=p[1]*ct-z*st,depth=p[1]*st+z*ct;
 const perspective=12/(12-depth),scale=Math.max(width/14,height/10);
 return {x:width/2+x*scale*perspective,y:height/2+y*scale*perspective,z:depth};
}
function draw(){
 if(!ctx||!width)return;
 ctx.clearRect(0,0,width,height);
 const faces=[];
 for(const [index,b] of blocks.entries()){
  const cy=b.y+Math.sin(phase+index*.7)*.06;
  const x0=b.x-b.w/2,x1=b.x+b.w/2,y0=cy-b.h/2,y1=cy+b.h/2,z0=b.z-b.d/2,z1=b.z+b.d/2;
  const vertices=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  for(const [indices,shade] of [[[4,5,6,7],1],[[0,1,2,3],.35],[[0,4,7,3],.5],[[1,5,6,2],.7],[[0,1,5,4],.8],[[3,2,6,7],.4]]){
   const world=indices.map(i=>vertices[i]),p=world.map(project);
   faces.push({p,world,shade,red:b.red,z:p.reduce((s,v)=>s+v.z,0)/4});
  }
 }
 faces.sort((a,b)=>a.z-b.z);
 for(const f of faces){
  const {p,world,shade,red}=f;
  ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();
  const gradient=ctx.createLinearGradient(p[0].x,p[0].y,p[2].x,p[2].y);
  gradient.addColorStop(0,red?'#1d1010':'#141414');gradient.addColorStop(1,'#090909');ctx.fillStyle=gradient;ctx.fill();
  ctx.strokeStyle=red?`rgba(173,61,53,${shade*.22})`:`rgba(179,174,169,${shade*.12})`;ctx.lineWidth=.6;ctx.stroke();
  const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  const cols=Math.max(1,Math.floor(length(world[0],world[1])/.105)),rows=Math.max(1,Math.floor(length(world[0],world[3])/.105));
  ctx.fillStyle=red?`rgba(197,76,65,${shade*.56})`:`rgba(185,180,174,${shade*.38})`;
  ctx.beginPath();
  for(let u=1;u<cols;u++)for(let v=1;v<rows;v++){
   const point=world[0].map((val,i)=>val+(world[1][i]-val)*u/cols+(world[3][i]-val)*v/rows),q=project(point);
   ctx.moveTo(q.x+.55,q.y);ctx.arc(q.x,q.y,.55,0,Math.PI*2);
  }
  ctx.fill();
 }
}
function tick(time){if(playing&&!dragging&&visible&&!document.hidden&&time-previousTime>45){phase+=Math.min(time-previousTime,80)*.00016;previousTime=time;draw()}requestAnimationFrame(tick)}
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;angle=Math.max(-.65,Math.min(.65,angle+(e.clientX-lastX)*.002));tilt=Math.max(-.65,Math.min(.3,tilt+(e.clientY-lastY)*.002));lastX=e.clientX;lastY=e.clientY;draw()});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{dragging=false});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')angle-=.04;if(e.key==='ArrowRight')angle+=.04;if(e.key==='ArrowUp')tilt-=.04;if(e.key==='ArrowDown')tilt+=.04;angle=Math.max(-.65,Math.min(.65,angle));tilt=Math.max(-.65,Math.min(.3,tilt));draw()});
motionButton.addEventListener('click',()=>{playing=!playing;syncMotion()});
reducedMotion.addEventListener('change',()=>{playing=!reducedMotion.matches;syncMotion();document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'))});
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting}).observe(canvas);
syncMotion();requestAnimationFrame(tick);

// The document remains readable if scripts or observers are unavailable.
if(!reducedMotion.matches&&'IntersectionObserver' in window){
 const revealObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.remove('reveal-pending');revealObserver.unobserve(e.target)}},{threshold:.1});
 document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('reveal-pending');revealObserver.observe(el)});
}
const navLinks=[...document.querySelectorAll('.dock a')];
const navObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){navLinks.forEach(a=>{const active=a.hash==='#'+e.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}}},{rootMargin:'-15% 0px -55% 0px',threshold:0});
for(const id of ['home','work','about'])navObserver.observe(document.getElementById(id));

const dialog = document.querySelector('#demo-dialog');
const content = document.querySelector('#dialog-content');
const title = document.querySelector('#dialog-title');
let demoController = null, lastTrigger = null;
const pause = (ms,signal)=>new Promise(resolve=>{if(signal.aborted){resolve();return}const timer=setTimeout(done,ms);function done(){clearTimeout(timer);signal.removeEventListener('abort',done);resolve()}signal.addEventListener('abort',done,{once:true})});
function openDialog(name,trigger){
  demoController?.abort();demoController=new AbortController();lastTrigger=trigger;title.textContent=name;content.replaceChildren();dialog.showModal();
}
function closeDialog(){demoController?.abort();dialog.close()}
document.querySelector('.close-dialog').addEventListener('click',closeDialog);
dialog.addEventListener('cancel',()=>demoController?.abort());
dialog.addEventListener('close',()=>{if(dialog.open)return;demoController?.abort();lastTrigger?.focus({preventScroll:true})});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()}});
document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{
  const type=button.dataset.demo;
  if(type==='sort')sortDemo(button);if(type==='stack')stackDemo(button);if(type==='color')colorDemo(button);
}));
function sortDemo(trigger){
  openDialog('Order from chaos',trigger);
  content.innerHTML='<p>Bubble sort compares neighboring values and swaps them when they’re out of order. Watch the tallest bars move to the right.</p><div class="demo-stage" aria-label="Sorting visualization"></div><div class="demo-actions"><button class="primary-button" id="sort-start">Start sorting <span>→</span></button><button class="secondary-button" id="shuffle">Shuffle</button></div><p class="demo-status" role="status" aria-live="polite">Ready. Time complexity: O(n²).</p>';
  let values=[],running=false;const stage=content.querySelector('.demo-stage'),status=content.querySelector('.demo-status'),start=content.querySelector('#sort-start'),shuffle=content.querySelector('#shuffle'),signal=demoController.signal;
  function render(active=[]){stage.replaceChildren(...values.map((value,i)=>{const bar=document.createElement('div');bar.className='demo-bar'+(active.includes(i)?' active':'');bar.style.setProperty('--h',value+'%');bar.title=String(value);return bar}))}
  function reset(){values=Array.from({length:14},()=>15+Math.floor(Math.random()*85));render();status.textContent='Ready. Time complexity: O(n²).';start.disabled=false}
  shuffle.addEventListener('click',reset);reset();
  start.addEventListener('click',async()=>{if(running)return;running=true;start.disabled=true;shuffle.disabled=true;let comparisons=0,swaps=0;
    for(let i=0;i<values.length-1;i++){let changed=false;for(let j=0;j<values.length-i-1;j++){if(signal.aborted)return;comparisons++;render([j,j+1]);status.textContent=`Comparisons: ${comparisons} · Swaps: ${swaps}`;await pause(reducedMotion.matches?0:65,signal);if(signal.aborted)return;if(values[j]>values[j+1]){[values[j],values[j+1]]=[values[j+1],values[j]];swaps++;changed=true;render([j,j+1])}}if(!changed)break}
    render();status.textContent=`Sorted! ${comparisons} comparisons · ${swaps} swaps.`;running=false;shuffle.disabled=false;
  });
}
function stackDemo(trigger){
  openDialog('Under the surface',trigger);
  content.innerHTML='<p>A stack follows “last in, first out.” Push adds an item to the top; pop removes the most recently added item; peek reads it.</p><div class="demo-stage stack-stage" aria-label="Stack contents"></div><div class="demo-actions"><input class="demo-input" maxlength="12" aria-label="Value to push" placeholder="Enter a value"><button class="secondary-button" id="push">Push +</button><button class="secondary-button" id="pop">Pop −</button><button class="secondary-button" id="peek">Peek</button></div><p class="demo-status" role="status" aria-live="polite"></p>';
  const values=['Ideas','Learning','Building'],stage=content.querySelector('.demo-stage'),input=content.querySelector('input'),status=content.querySelector('.demo-status');
  function render(){stage.replaceChildren(...values.map((v,i)=>{const item=document.createElement('div');item.className='stack-item';item.textContent=v+(i===values.length-1?' ← top':'');return item}));content.querySelector('#push').disabled=values.length>=6;content.querySelector('#pop').disabled=!values.length;content.querySelector('#peek').disabled=!values.length}
  function push(){if(values.length>=6)return;const value=input.value.trim();if(!value){status.textContent='Enter a value to push onto the stack.';input.focus();return}values.push(value);input.value='';render();status.textContent=`Pushed “${value}”. Stack size: ${values.length}.`;input.focus()}
  content.querySelector('#push').addEventListener('click',push);input.addEventListener('keydown',e=>{if(e.key==='Enter')push()});
  content.querySelector('#pop').addEventListener('click',()=>{const value=values.pop();render();status.textContent=`Popped “${value}”. ${values.length?'Stack size: '+values.length+'.':'The stack is empty.'}`});
  content.querySelector('#peek').addEventListener('click',()=>{status.textContent=`Top item: “${values.at(-1)}”. The stack is unchanged.`});render();status.textContent='3 items. Try adding your own.';
}
function colorDemo(trigger){
  openDialog('In a different light',trigger);
  content.innerHTML='<p>Move through the color spectrum and see how light and shadow give a simple shape its depth.</p><div class="demo-stage color-stage"><div class="color-ball"></div></div><label class="control-label" for="hue">Hue <output id="hue-value">5°</output></label><input class="color-slider" id="hue" type="range" min="0" max="360" value="5"><p class="demo-status" role="status">hsl(5, 55%, 65%)</p>';
  const slider=content.querySelector('input'),ball=content.querySelector('.color-ball'),stage=content.querySelector('.color-stage');
  function update(){const h=slider.value;ball.style.background=`radial-gradient(circle at 30% 25%,hsl(${h},65%,85%),hsl(${h},40%,52%) 50%,hsl(${h},35%,12%) 90%)`;stage.style.background=`radial-gradient(ellipse at center,hsl(${h},25%,17%),#0d0b0a)`;content.querySelector('output').value=h+'°';content.querySelector('.demo-status').textContent=`hsl(${h}, 55%, 65%)`}
  slider.addEventListener('input',update);update();
}
document.querySelector('#contact-button').addEventListener('click',e=>{openDialog('Let’s connect',e.currentTarget);content.innerHTML='<p>Thanks for taking a look at my portfolio. My contact details and social links will be added here soon.</p><p>In the meantime, explore the playground to see the ideas I’m learning about.</p><a class="primary-button" href="#work" id="back-work">Explore the playground <span>↗</span></a>';content.querySelector('#back-work').addEventListener('click',closeDialog)});
