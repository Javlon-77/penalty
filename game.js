(() => {
'use strict';

const MODEL_URL='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb';
const $=id=>document.getElementById(id);
const canvas=$('renderCanvas');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x071017);
scene.fog=new THREE.FogExp2(0x071017,.018);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.05,220);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;

const clock=new THREE.Clock();
const loader=new THREE.GLTFLoader();
const mixers=[];
let player=null,keeper=null,playerMixer=null,keeperMixer=null;
let state='menu',charging=false,power=0,chargeDir=1,aimX=0,aimY=0;
let score=0,shots=0,goals=0,streak=0,paused=false,round=1;
let shot=null,ball,ballShadow,goalMouth,keeperHome=new THREE.Vector3();
let audioCtx=null;

function mat(color,rough=.7,metal=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function box(w,h,d,m){const x=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);x.castShadow=x.receiveShadow=true;return x;}
function cyl(r1,r2,h,m,s=20){const x=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,s),m);x.castShadow=x.receiveShadow=true;return x;}
function addTextLabel(text,pos){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#d7ff42';ctx.font='900 52px Arial';ctx.textAlign='center';ctx.fillText(text,256,78);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.position.copy(pos);s.scale.set(4.6,1.15,1);scene.add(s);return s;}

// Stadium
const stadium=new THREE.Group();scene.add(stadium);
const pitch=box(68,.18,45,mat(0x16753a,.95));pitch.position.set(0,-.1,-13);stadium.add(pitch);
const lineMat=mat(0xf3f6f0,.45);
function line(w,d,x,z){const l=box(w,.025,d,lineMat);l.position.set(x,.015,z);stadium.add(l)}
line(68,.09,0,-35.5);line(68,.09,0,9.5);line(.09,45,-34, -13);line(.09,45,34,-13);
line(16.5,.08,0,9.5);line(16.5,.08,0,-19.5);line(.08,29,-16.5,-5);line(.08,29,16.5,-5);
const spotCircle=new THREE.Mesh(new THREE.RingGeometry(9.1,9.2,96),new THREE.MeshBasicMaterial({color:0xf3f6f0,side:THREE.DoubleSide}));spotCircle.rotation.x=-Math.PI/2;spotCircle.position.set(0,.025,2.9);stadium.add(spotCircle);
// penalty spot
const spot=new THREE.Mesh(new THREE.CircleGeometry(.13,24),new THREE.MeshBasicMaterial({color:0xffffff}));spot.rotation.x=-Math.PI/2;spot.position.set(0,.03,-.1);stadium.add(spot);

// Goal at the far end
const goal=new THREE.Group();goal.position.set(0,0,-29.7);scene.add(goal);goalMouth=goal;
const postMat=mat(0xf4f7f9,.22,.15);
for(const x of [-5.4,5.4]){const p=cyl(.11,.11,3.8,postMat,18);p.position.set(x,1.9,0);goal.add(p)}
const bar=cyl(.11,.11,10.8,postMat,18);bar.rotation.z=Math.PI/2;bar.position.y=3.8;goal.add(bar);
const netMat=new THREE.MeshBasicMaterial({color:0xdbe6e8,transparent:true,opacity:.16,wireframe:true});
const net=new THREE.Mesh(new THREE.BoxGeometry(10.8,3.8,2.3),netMat);net.position.set(0,1.9,1.15);goal.add(net);
const goalFloor=box(10.8,.035,2.4,new THREE.MeshStandardMaterial({color:0x163b29,roughness:1}));goalFloor.position.set(0,.03,.95);goal.add(goalFloor);

// Stadium bowl / seats
const bowlMat=mat(0x17232b,1,0);
for(let row=0;row<7;row++){
  const r=new THREE.Mesh(new THREE.BoxGeometry(80,.5,2.2),bowlMat);r.position.set(0,1+row*.65,-22-row*1.8);r.castShadow=true;stadium.add(r);
  const r2=r.clone();r2.position.z=14+row*1.6;stadium.add(r2);
}
for(let side of [-1,1])for(let row=0;row<6;row++){const r=new THREE.Mesh(new THREE.BoxGeometry(2,.45,55),bowlMat);r.position.set(side*(38+row*1.3),1+row*.6,-13);stadium.add(r)}
// crowd dots
const crowdGroup=new THREE.Group();scene.add(crowdGroup);const crowdColors=[0xd7ff42,0xf4f7f9,0x4f79a7,0xe65a44,0x8b5cf6];
for(let i=0;i<900;i++){const a=Math.random()<.5? (Math.random()<.5?0:Math.PI) : null;let x,z,y;
  if(a!==null){x=(Math.random()-.5)*74;z=a===0?13+Math.random()*11:-38-Math.random()*11;y=2+Math.random()*5}else{x=(Math.random()<.5?-1:1)*(36+Math.random()*10);z=-34+Math.random()*42;y=2+Math.random()*5}
  const s=.045+Math.random()*.07;const q=new THREE.Mesh(new THREE.SphereGeometry(s,5,5),new THREE.MeshBasicMaterial({color:crowdColors[i%crowdColors.length]}));q.position.set(x,y,z);crowdGroup.add(q)
}

// Stadium lights
scene.add(new THREE.HemisphereLight(0xa9c7ff,0x12351f,1.7));
const sun=new THREE.DirectionalLight(0xffffff,3.4);sun.position.set(-18,34,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-45;scene.add(sun);
for(const x of [-25,25]){const l=new THREE.SpotLight(0xffffff,65,90,Math.PI/7,.45,1.2);l.position.set(x,22,-8);l.target.position.set(0,0,-18);scene.add(l,l.target)}

// Ball
const ballMat=mat(0xf4f4ef,.38,.02);ball=new THREE.Mesh(new THREE.SphereGeometry(.34,32,20),ballMat);ball.castShadow=true;ball.position.set(0,.37,-.1);scene.add(ball);
ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.25}));ballShadow.rotation.x=-Math.PI/2;ballShadow.position.set(0,.025,-.1);scene.add(ballShadow);

function colorize(root,color){root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(o.material){const clone=o.material.clone();clone.color=new THREE.Color(color);clone.roughness=.72;o.material=clone}}})}
function fitHuman(root,targetH=2.2){const b=new THREE.Box3().setFromObject(root);const h=b.max.y-b.min.y;const s=targetH/h;root.scale.setScalar(s);b.setFromObject(root);root.position.y-=b.min.y;}
function animateModel(root,mixer,clipName){if(!mixer||!root.userData.clips)return;const clip=root.userData.clips.find(c=>clipName&&c.name.toLowerCase().includes(clipName))||root.userData.clips[0];if(clip){const a=mixer.clipAction(clip);a.reset().fadeIn(.25).play()}}

function loadModel(role){return new Promise((resolve,reject)=>loader.load(MODEL_URL,g=>{const root=g.scene;fitHuman(root,role==='keeper'?2.35:2.25);root.position.set(role==='keeper'?0:0,0,role==='keeper'?-27.7:-2.0);if(role==='keeper'){root.rotation.y=Math.PI;colorize(root,0x3b72ff)}else{root.rotation.y=Math.PI;colorize(root,0xf1f1ef)}root.userData.clips=g.animations||[];scene.add(root);const mix=new THREE.AnimationMixer(root);mixers.push(mix);if(g.animations.length)mix.clipAction(g.animations[0]).play();resolve({root,mix})},p=>{if(role==='player'){$('loadBar').style.width=(10+Math.round((p.loaded/(p.total||p.loaded))*50))+'%'}},reject)});}

async function initModels(){try{$('loadText').textContent='Loading animated GLB footballer…';const p=await loadModel('player');player=p.root;playerMixer=p.mix;$('loadBar').style.width='68%';$('loadText').textContent='Loading goalkeeper GLB…';const k=await loadModel('keeper');keeper=k.root;keeperMixer=k.mix;keeperHome.copy(keeper.position);$('loadBar').style.width='100%';$('loadText').textContent='Finalizing stadium lighting…';setTimeout(()=>{$('loading').classList.add('hidden');$('menu').classList.remove('hidden');setCameraMenu()},500)}catch(e){console.error(e);$('loadText').textContent='GLB load failed — check network access.'}}

function setCameraMenu(){camera.position.set(11,7,7);camera.lookAt(0,1,-18)}
function setCameraGameplay(){camera.position.set(0,3.05,4.9);camera.lookAt(0,1.7,-20)}
function showResult(text){const r=$('result');r.textContent=text;r.classList.remove('show');void r.offsetWidth;r.classList.add('show')}
function updateHUD(){$('score').textContent=score;$('streak').textContent=streak;$('roundLabel').textContent='PENALTY '+String(round).padStart(2,'0');$('powerValue').textContent=Math.round(power*100)+'%';$('powerBar').style.width=(power*100)+'%'}
function setAim(clientX,clientY){const r=canvas.getBoundingClientRect();aimX=Math.max(-1,Math.min(1,(clientX-r.left)/r.width*2-1));aimY=Math.max(-.72,Math.min(.72,-((clientY-r.top)/r.height*2-1)));const a=$('.aim');a.style.left=(50+aimX*30)+'%';a.style.top=(50-aimY*24)+'%'}
function $(sel){return document.getElementById(sel)||document.querySelector(sel)}

function beginCharge(){if(state!=='play'||paused||shot)return;if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();charging=true;chargeDir=1}
function releaseShot(){if(!charging||state!=='play'||shot)return;charging=false;power=Math.max(.18,power);fireBall()}
function fireBall(){shots++;const targetX=aimX*5.0;const targetY=1.05+aimY*2.0;const targetZ=-29.0;const p0=ball.position.clone();const end=new THREE.Vector3(targetX,targetY,targetZ);const distance=p0.distanceTo(end);shot={t:0,dur:Math.max(.72,1.34-distance*.01),start:p0.clone(),end,arc:.8+power*1.7,power};ballShadow.visible=true;player.rotation.y=Math.atan2(targetX-player.position.x,Math.abs(targetZ-player.position.z));animateModel(player,playerMixer,'walk');playKick();updateHUD();}
function playKick(){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(130,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(55,audioCtx.currentTime+.18);g.gain.setValueAtTime(.05,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.22);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.23)}
function playWhistle(){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=1100;g.gain.value=.025;o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.18)}
function evaluateShot(){const s=shot;const missRadius=.58+(1-power)*.8;const keeperSkill=.5+Math.min(.32,round*.035);const keeperReach=1.9+keeperSkill*.7;const kx=keeper.position.x,ky=keeper.position.y+1.1;const saveDist=Math.hypot(s.end.x-kx,s.end.y-ky*.72);const isInside=Math.abs(s.end.x)<5.2&&s.end.y>.2&&s.end.y<3.7;let saved=saveDist<keeperReach&&Math.random()<.82;if(!isInside)saved=false;const goal=!saved&&isInside&&Math.random()>.045;
  if(goal){goals++;streak++;score+=Math.round(100+power*180+Math.max(0,streak-1)*25);showResult(streak>=3?'ON FIRE':'GOAL');keeper.position.x=THREE.MathUtils.lerp(keeper.position.x,s.end.x,.75);animateModel(keeper,keeperMixer,'walk')}
  else{streak=0;showResult(saved?'SAVED':'MISS');if(saved){keeper.position.x=THREE.MathUtils.lerp(keeper.position.x,s.end.x,.75);keeper.position.y=.05}else{keeper.position.x=THREE.MathUtils.clamp(s.end.x,-6.2,6.2)}}
  round++;updateHUD();playWhistle();setTimeout(nextShot,1150)
}
function nextShot(){shot=null;power=0;ball.position.set(0,.37,-.1);ballShadow.position.set(0,.025,-.1);keeper.position.copy(keeperHome);setCameraGameplay();if(round>10){finish();return}updateHUD()}
function finish(){state='end';$('hud').classList.add('hidden');$('end').classList.remove('hidden');$('finalScore').textContent=score;$('finalShots').textContent=shots;$('finalGoals').textContent=goals;$('finalAccuracy').textContent=(shots?Math.round(goals/shots*100):0)+'%';$('endTitle').textContent=goals>=7?'ELITE FINISH':goals>=5?'GREAT SHOOTOUT':'KEEP TRAINING'}
function start(){state='play';paused=false;score=shots=goals=streak=0;round=1;power=0;shot=null;ball.position.set(0,.37,-.1);keeper.position.copy(keeperHome);$('menu').classList.add('hidden');$('end').classList.add('hidden');$('pause').classList.add('hidden');$('hud').classList.remove('hidden');setCameraGameplay();updateHUD()}
function togglePause(force){if(state!=='play')return;paused=force===undefined?!paused:force;$('pause').classList.toggle('hidden',!paused);}

canvas.addEventListener('pointermove',e=>setAim(e.clientX,e.clientY));canvas.addEventListener('pointerdown',e=>{setAim(e.clientX,e.clientY);beginCharge()});window.addEventListener('pointerup',releaseShot);window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();beginCharge()}if(e.code==='Escape')togglePause()});window.addEventListener('keyup',e=>{if(e.code==='Space')releaseShot()});
$('playBtn').onclick=start;$('pauseBtn').onclick=()=>togglePause();$('resumeBtn').onclick=()=>togglePause(false);$('menuBtn').onclick=()=>{paused=false;state='menu';$('pause').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');setCameraMenu()};$('againBtn').onclick=start;$('endMenuBtn').onclick=()=>{state='menu';$('end').classList.add('hidden');$('menu').classList.remove('hidden');setCameraMenu()};

function updateShot(dt){if(!shot)return;shot.t+=dt/shot.dur;const q=Math.min(1,shot.t);const e=q*q*(3-2*q);ball.position.lerpVectors(shot.start,shot.end,e);ball.position.y+=Math.sin(q*Math.PI)*shot.arc;ball.rotation.x-=dt*12;ball.rotation.z+=dt*8;ballShadow.position.x=ball.position.x;ballShadow.position.z=ball.position.z;ballShadow.scale.setScalar(Math.max(.25,1-ball.position.y*.12));keeper.position.y=Math.max(0,Math.sin(Math.min(1,q)*Math.PI)*.28);if(q>=1){evaluateShot()}}
function update(){const dt=Math.min(.033,clock.getDelta());if(!paused){for(const m of mixers)m.update(dt);if(state==='play'){if(charging&&!shot){power+=dt*.72*chargeDir;if(power>=1){power=1;chargeDir=-1}if(power<=0){power=0;chargeDir=1}updateHUD()}updateShot(dt)}else if(state==='menu'){camera.position.x+=Math.sin(performance.now()*.00015)*dt;camera.lookAt(0,1.4,-18)}}renderer.render(scene,camera);requestAnimationFrame(update)}
addTextLabel('PENALTY',new THREE.Vector3(0,.02,1.2));
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
initModels();update();
})();
