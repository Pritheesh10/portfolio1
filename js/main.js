/* NAV MENU */
(function(){
  const burgerBtn=document.getElementById('burger-btn');
  const menuPanel=document.getElementById('menu-panel');
  let open=false;
  burgerBtn.addEventListener('click',()=>{
    open=!open;
    burgerBtn.classList.toggle('open',open);
    menuPanel.classList.toggle('open',open);
  });
  menuPanel.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{
    open=false; burgerBtn.classList.remove('open'); menuPanel.classList.remove('open');
  }));
})();

document.getElementById('year').textContent = new Date().getFullYear();

/* SCROLL REVEAL */
(function(){
  const els=document.querySelectorAll('.reveal');
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:0.15});
  els.forEach(el=>io.observe(el));
})();

/* SIGNAL COPY — classic credits crawl (pure CSS animation).
   JS here just pauses it on hover so the text is readable if someone
   wants to actually stop and read a line. */
(function(){
  const crawl = document.getElementById('signal-copy');
  const viewport = document.querySelector('.crawl-viewport');
  if(!crawl || !viewport) return;
  viewport.addEventListener('mouseenter', ()=>{ crawl.style.animationPlayState = 'paused'; });
  viewport.addEventListener('mouseleave', ()=>{ crawl.style.animationPlayState = 'running'; });
})();

/* ============ SPACE CANVAS — starfield + drifting command-line text ====
   Fills the entire #about section (not just the crawl window) with a
   twinkling starfield and slow-drifting terminal/code fragments, like
   debris floating past in space. One continuous canvas behind
   everything in the section, so there's no colour seam anywhere.
========================================================================= */
(function(){
  const canvas = document.getElementById('space-canvas');
  const section = document.getElementById('about');
  if(!canvas || !section) return;
  const ctx = canvas.getContext('2d');

  const codeSnippets = [
    "$ git commit -m 'fix'", "> npm run build", "SELECT * FROM users;",
    "def deploy():", "System.out.println();", "$ docker ps -a",
    "> Compiling...", "const app = express();", "$ git push origin main",
    "200 OK", "await fetch('/api')", "$ ssh prod", "for (let i=0;i<n;i++)",
    "$ npm install", "> Build succeeded ✓", "async function run()",
    "return response.json()", "$ kubectl get pods", "class Server {",
    "0x4F2A1C", "> Deploying to prod...", "try { } catch (e) {}"
  ];

  let stars = [];
  let fragments = [];
  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    const rect = section.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed(){
    const starCount = Math.round((W*H) / 9000);
    stars = Array.from({length: Math.min(starCount, 220)}, ()=>({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*1.4 + 0.3,
      baseAlpha: Math.random()*0.6 + 0.25,
      twinkleSpeed: Math.random()*0.02 + 0.005,
      phase: Math.random()*Math.PI*2
    }));

    const fragCount = window.innerWidth < 768 ? 7 : 13;
    fragments = Array.from({length: fragCount}, ()=> makeFragment(true));
  }

  function makeFragment(randomY){
    return {
      text: codeSnippets[Math.floor(Math.random()*codeSnippets.length)],
      x: Math.random()*W,
      y: randomY ? Math.random()*H : H + 20,
      speed: Math.random()*0.18 + 0.06,
      size: Math.random()*3 + 11,
      alpha: 0,
      maxAlpha: Math.random()*0.28 + 0.14,
      color: Math.random() > 0.5 ? '76,224,255' : '255,63,164',
      fadeState: 'in'
    };
  }

  let t = 0;
  let looping = false;
  let visible = false;

  function draw(){
    ctx.clearRect(0,0,W,H);

    // stars
    stars.forEach(s=>{
      const tw = Math.sin(t*s.twinkleSpeed + s.phase) * 0.35 + 0.65;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(244,241,232,${(s.baseAlpha*tw).toFixed(3)})`;
      ctx.fill();
    });

    // drifting terminal fragments
    ctx.textBaseline = 'middle';
    fragments.forEach(f=>{
      ctx.font = f.size + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(${f.color},${f.alpha.toFixed(3)})`;
      ctx.fillText(f.text, f.x, f.y);

      f.y -= f.speed;

      if(f.fadeState === 'in'){
        f.alpha += 0.003;
        if(f.alpha >= f.maxAlpha){ f.alpha = f.maxAlpha; f.fadeState = 'hold'; }
      } else if(f.fadeState === 'hold' && f.y < H*0.15){
        f.fadeState = 'out';
      } else if(f.fadeState === 'out'){
        f.alpha -= 0.003;
      }

      if(f.y < -20 || f.alpha <= 0){
        Object.assign(f, makeFragment(false));
      }
    });

    t += 1;
    if(visible){
      requestAnimationFrame(draw);
    } else {
      looping = false;
    }
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      visible = e.isIntersecting;
      if(visible && !looping){ looping = true; draw(); }
    });
  }, {threshold:0});
  io.observe(section);

  window.addEventListener('resize', resize);
  resize();
})();

/* STAT COUNTERS */
(function(){
  const stats=document.querySelectorAll('.stat .num');
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target;
      const target=parseFloat(el.dataset.count);
      const decimals=parseInt(el.dataset.decimal||'0');
      const valEl=el.querySelector('.val');
      const dur=1400; const start=performance.now();
      function tick(now){
        const p=Math.min(1,(now-start)/dur);
        const eased=1-Math.pow(1-p,3);
        const cur=target*eased;
        valEl.textContent=decimals? cur.toFixed(decimals): Math.round(cur).toLocaleString();
        if(p<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  },{threshold:0.5});
  stats.forEach(s=>io.observe(s));
})();

/* THREE.JS BACKGROUND SIGNAL FIELD */
(function(){
  if(typeof THREE==='undefined') return;
  const canvas=document.getElementById('bg-canvas');
  const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.z=18;
  const COUNT = window.innerWidth < 768 ? 60 : 130;
  const positions=new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){
    positions[i*3]   = (Math.random()-0.5)*36;
    positions[i*3+1] = (Math.random()-0.5)*22;
    positions[i*3+2] = (Math.random()-0.5)*14;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const mat=new THREE.PointsMaterial({color:0x4ce0ff, size:0.06, transparent:true, opacity:0.7});
  const points=new THREE.Points(geo, mat);
  scene.add(points);
  const lineVerts=[];
  for(let i=0;i<COUNT;i++){
    for(let j=i+1;j<COUNT;j++){
      const dx=positions[i*3]-positions[j*3], dy=positions[i*3+1]-positions[j*3+1], dz=positions[i*3+2]-positions[j*3+2];
      const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(d<4.2) lineVerts.push(positions[i*3],positions[i*3+1],positions[i*3+2], positions[j*3],positions[j*3+1],positions[j*3+2]);
    }
  }
  const lineGeo=new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts,3));
  const lineMat=new THREE.LineBasicMaterial({color:0xff3fa4, transparent:true, opacity:0.12});
  const lines=new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);
  let mouseX=0, mouseY=0;
  window.addEventListener('mousemove',(e)=>{
    mouseX=(e.clientX/window.innerWidth-0.5);
    mouseY=(e.clientY/window.innerHeight-0.5);
  });
  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  function animate(t){
    points.rotation.y = t*0.00003; lines.rotation.y = t*0.00003;
    points.rotation.x = mouseY*0.15; lines.rotation.x = mouseY*0.15;
    camera.position.x += (mouseX*2 - camera.position.x)*0.02;
    camera.lookAt(0,0,0);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();

/* ============ HERO CHARACTER — mouse-spotlight reveal ============
   Reveals the "headset + laptop" image through a soft circular mask
   that follows the cursor. Uses CSS custom properties (--mx, --my)
   updated every frame instead of a canvas.toDataURL() approach —
   far cheaper on CPU/GPU. Includes touch support + idle auto-drift
   for mobile, and a resting position on load so the effect isn't
   invisible before any interaction.
==================================================================== */
(function(){
  const container = document.getElementById('hero-character');
  const revealEl = document.getElementById('char-reveal');
  if(!container || !revealEl){
    console.warn('[hero-character] container or reveal element not found in DOM.');
    return;
  }

  const target = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  let hasInteracted = false;
  let isTouch = false;

  function setFromClientPoint(clientX, clientY){
    const rect = container.getBoundingClientRect();
    target.x = clientX - rect.left;
    target.y = clientY - rect.top;
    if(!hasInteracted){
      hasInteracted = true;
      container.classList.add('interacted');
      smooth.x = target.x; smooth.y = target.y;
    }
  }

  container.addEventListener('mousemove', (e)=> setFromClientPoint(e.clientX, e.clientY));
  container.addEventListener('mouseleave', ()=>{
    // push the spotlight off-canvas so the reveal fully hides again
    // and the base (non-headset) face shows once the cursor leaves
    target.x = -9999; target.y = -9999;
  });
  container.addEventListener('touchstart', ()=>{ isTouch = true; }, {passive:true});
  container.addEventListener('touchmove', (e)=>{
    if(e.touches && e.touches[0]) setFromClientPoint(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive:true});

  function setInitialRest(){
    // start fully off-canvas so nothing is revealed before the person
    // interacts — only mousemove/touchmove ever bring the spotlight
    // onto the character
    target.x = smooth.x = -9999;
    target.y = smooth.y = -9999;
  }
  // run once now, and again after full page load in case fonts/images
  // shifted layout and the initial rect was measured at 0x0
  setInitialRest();
  window.addEventListener('load', setInitialRest);

  let idleAngle = 0;
  function loop(){
    smooth.x += (target.x - smooth.x) * 0.12;
    smooth.y += (target.y - smooth.y) * 0.12;

    if(isTouch && !hasInteracted){
      idleAngle += 0.01;
      const rect = container.getBoundingClientRect();
      target.x = rect.width*0.5 + Math.cos(idleAngle)*rect.width*0.18;
      target.y = rect.height*0.3 + Math.sin(idleAngle*0.7)*rect.height*0.1;
    }

    revealEl.style.setProperty('--mx', smooth.x + 'px');
    revealEl.style.setProperty('--my', smooth.y + 'px');
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('resize', ()=>{
    if(!hasInteracted) setInitialRest();
  });
})();

/* SKILLS — computer folders */
(function(){
  const skillsData = {
    frontend: ["React","Next.js","TypeScript","Three.js","Tailwind CSS"],
    backend: ["Node.js","Express","PostgreSQL","Rust"],
    infra: ["Docker","AWS","GitHub Actions","Nginx"],
    languages: ["JavaScript","TypeScript","Python","Go","SQL"]
  };
  const folders = document.querySelectorAll('.folder');
  const fileWindow = document.getElementById('file-window');
  const fileList = document.getElementById('file-list');
  const fileTitle = document.getElementById('file-window-title');
  const closeBtn = document.getElementById('file-window-close');
  if(!folders.length || !fileWindow) return;

  folders.forEach(f=>{
    f.addEventListener('click', ()=>{
      const key = f.dataset.folder;
      const items = skillsData[key] || [];
      fileTitle.textContent = f.querySelector('span').textContent;
      fileList.innerHTML = items.map(i=>`<li>${i}</li>`).join('');
      fileWindow.classList.add('open');
    });
  });
  closeBtn.addEventListener('click', ()=> fileWindow.classList.remove('open'));
})();

/* LIVE STATS — simulated real-time jitter */
(function(){
  const projectsEl = document.getElementById('stat-projects');
  const responseEl = document.getElementById('stat-response-val');
  if(!projectsEl || !responseEl) return;
  let projectCount = 40;
  let responseBase = 118;
  setInterval(()=>{
    const jitter = (Math.random()*10 - 5);
    responseEl.textContent = Math.max(60, Math.round(responseBase + jitter));
  }, 900);
  setInterval(()=>{
    if(Math.random() < 0.15){
      projectCount += 1;
      projectsEl.textContent = projectCount;
      projectsEl.style.textShadow = '0 0 40px rgba(62,232,122,0.8)';
      setTimeout(()=>{ projectsEl.style.textShadow = ''; }, 500);
    }
  }, 4000);
})();

/* EMAILJS CONTACT FORM
   1. Create account at https://www.emailjs.com
   2. Add Email Service -> get SERVICE_ID
   3. Create Template with variables from_name, reply_to, message -> get TEMPLATE_ID
   4. Account > General -> get PUBLIC_KEY
   5. Paste all three below.
*/
(function(){
  const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";
  const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
  const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
  if(window.emailjs && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY"){
    emailjs.init({publicKey: EMAILJS_PUBLIC_KEY});
  }
  const form=document.getElementById('contact-form');
  const statusEl=document.getElementById('cf-status');
  const submitBtn=document.getElementById('cf-submit');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    statusEl.className='form-status';
    if(EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"){
      statusEl.textContent = "Contact form isn't wired up yet — add your EmailJS keys in js/main.js.";
      statusEl.classList.add('err');
      return;
    }
    submitBtn.disabled=true; submitBtn.textContent='Sending…';
    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(function(){
        statusEl.textContent='Message sent — thanks! I\'ll reply soon.';
        statusEl.classList.add('ok');
        form.reset();
      })
      .catch(function(err){
        statusEl.textContent='Something went wrong sending that. Try the direct email link instead.';
        statusEl.classList.add('err');
        console.error('EmailJS error:', err);
      })
      .finally(function(){
        submitBtn.disabled=false; submitBtn.textContent='Send message';
      });
  });
})();
