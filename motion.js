import * as THREE from './three.module.min.js';
const DURATION=48, $=s=>document.querySelector(s), clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)), mix=(a,b,t)=>a+(b-a)*t, ease=t=>{t=clamp(t);return t*t*(3-2*t)}, phase=(t,a,b)=>clamp((t-a)/(b-a));
const arc=(u,ya,yb,h)=>mix(ya,yb,u)+4*h*u*(1-u);
const routeCards=$('#route-cards'),values=$('.values'),film=$('#film'),stage=$('#stage'),timeline=$('#timeline'),play=$('#play'),header=$('#header'),controls=$('#controls'),blackPanel=$('#black-panel'),marquee=$('#marquee'),track=$('#method-track'),logoEl=$('.logo'),drop=$('#drop'),fill=$('#fill');
const valueItems=[...document.querySelectorAll('.values li')],personaItems=[...document.querySelectorAll('.personas li')],brandItems=[...document.querySelectorAll('.brands span')];
const scenes=Object.fromEntries([...document.querySelectorAll('[data-scene]')].map(el=>[el.dataset.scene,el]));
const chapter=$('#chapter-label'), labels=['01 — CONSTRUIRE','02 — TOUT AU MÊME ENDROIT','03 — LA MÉTHODE','04 — CHAQUE ÉTAPE','05 — SE DISTINGUER','06 — PRENDRE SA PLACE','07 — L’EXPÉRIENCE','08 — ON EN PARLE'];
let W=innerWidth,H=stage.clientHeight,mobile=W<901,t=0,playing=false,lastTime=0,autoT=0,initialized=false,software=false,motionClock=0,motionPaused=false,routeActive=-1,valueActive=-1;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,assembly,human,crane,roadGroup,roadHuman,guideHuman,gridGroup,hero,heroMat,heroDisc,flyHuman,seekers,beacon,proofGroup,proofHero,founderMat,brandPanels,boardGroup,boardFace,path,materialBlack,materialGray,materialWhite,ballRoot,ball,ballShadow;
const boxGeometry=new THREE.BoxGeometry(1,1,1),up=new THREE.Vector3(0,1,0);
const groups=[];
const DROP0=.35,DROP1=1.05,BOUNCE1=1.95,BOUNCE2=2.55,BOUNCE3=2.95,BOUNCE4=3.2,FILL0=24.7,FILL1=25.85;
const ballOrange=new THREE.Color('#ff4328'),crowdColor=new THREE.Color('#352026'),heroWhite=new THREE.Color('#F5F1EA'),tmp=new THREE.Vector3();
function mat(color){return new THREE.MeshStandardMaterial({color,roughness:.34,metalness:.16,flatShading:false});}
function box(parent,size,pos,material){const o=new THREE.Mesh(boxGeometry,material);o.scale.set(...size);o.position.set(...pos);parent.add(o);return o;}
const bodyGeometries=new Map();
function roundedGeometry(type,radius,length,detail){
 const key=[type,radius,length,detail].join(':');if(!bodyGeometries.has(key))bodyGeometries.set(key,type==='sphere'?new THREE.SphereGeometry(1,detail?32:10,detail?24:8):new THREE.CapsuleGeometry(radius,length,detail?10:3,detail?24:9));return bodyGeometries.get(key);
}
function person(material,detail=true){
 const g=new THREE.Group(),parts=[],knees=[],elbows=[];
 function root(x,y,z){const part=new THREE.Group();part.position.set(x,y,z);part.userData.target=part.position.clone();g.add(part);parts.push(part);return part;}
 function ball(parent,scale,pos){const o=new THREE.Mesh(roundedGeometry('sphere',1,0,detail),material);o.scale.set(...scale);o.position.set(...pos);parent.add(o);return o;}
 function limb(parent,radius,length,y){const o=new THREE.Mesh(roundedGeometry('capsule',radius,length,detail),material);o.position.y=y;parent.add(o);return o;}
 for(const side of [-1,1]){const leg=root(side*.205,1.03,0);limb(leg,.145,.30,-.22);const knee=new THREE.Group();knee.position.y=-.46;leg.add(knee);ball(knee,[.135,.135,.135],[0,0,0]);limb(knee,.126,.28,-.22);ball(knee,[.137,.13,.22],[0,-.43,.075]);knees.push(knee);}
 const hips=root(0,1.07,0);ball(hips,[.345,.27,.22],[0,0,0]);
 const torso=root(0,1.62,0);const chest=limb(torso,.30,.40,0);chest.scale.set(1.26,1,.75);
 for(const side of [-1,1]){const arm=root(side*.43,1.96,0);limb(arm,.137,.27,-.235);const elbow=new THREE.Group();elbow.position.y=-.44;arm.add(elbow);ball(elbow,[.13,.13,.13],[0,0,0]);limb(elbow,.12,.29,-.235);ball(elbow,[.125,.15,.13],[0,-.43,0]);elbows.push(elbow);}
 const head=root(0,2.56,0);ball(head,[.325,.335,.325],[0,0,0]);
 g.userData={parts,knees,elbows,torso,hips,head};return g;
}
function posePerson(g,clock,strength=1,wave=0){
 const rig=g.userData,cycle=clock*4.6,swing=Math.sin(cycle),opposite=-swing;
 rig.parts.forEach(part=>{part.visible=true;part.position.copy(part.userData.target);part.rotation.set(0,0,0);});
 rig.knees.forEach(j=>j.rotation.set(0,0,0));rig.elbows.forEach(j=>j.rotation.set(0,0,0));
 rig.parts[0].rotation.x=swing*.35*strength;rig.parts[1].rotation.x=opposite*.35*strength;
 rig.knees[0].rotation.x=(.07+Math.max(0,swing)*.65)*strength;rig.knees[1].rotation.x=(.07+Math.max(0,-swing)*.65)*strength;
 rig.parts[4].rotation.x=opposite*.25*strength;rig.parts[5].rotation.x=swing*.25*strength;
 rig.parts[4].rotation.z=-.10;rig.parts[5].rotation.z=.10;
 rig.elbows[0].rotation.x=-.12-Math.max(0,swing)*.12*strength;rig.elbows[1].rotation.x=-.12-Math.max(0,opposite)*.12*strength;
 rig.torso.rotation.y=Math.sin(cycle)*.055*strength;rig.hips.rotation.y=-Math.sin(cycle)*.035*strength;
 rig.head.rotation.z=Math.sin(cycle*.5)*.025;rig.head.position.y+=Math.abs(Math.sin(cycle))*.025*strength;
 if(wave>0){const w=clamp(wave);rig.parts[5].rotation.z=mix(.10,.72,w);rig.parts[5].rotation.x*=1-w;rig.elbows[1].rotation.z=(.58+Math.sin(clock*2.8)*.10)*w;rig.elbows[1].rotation.x=-.12;}
}
function segment(parent,a,b,width,material){const m=new THREE.Mesh(boxGeometry,material);parent.add(m);updateSegment(m,a,b,width);return m;}
function updateSegment(m,a,b,width){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);m.position.copy(av.add(bv).multiplyScalar(.5));m.scale.set(width,d.length(),width);m.quaternion.setFromUnitVectors(up,d.normalize());}
function softwareRenderer(canvas){
 software=true;const ctx=canvas.getContext('2d');let ratio=1;
 const a=new THREE.Vector3(),matrix=new THREE.Matrix4(),center=new THREE.Vector3();
 return {setPixelRatio(v){ratio=Math.min(v,1.5)},setSize(w,h){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+'px';canvas.style.height=h+'px'},setClearColor(){},render(world,cam){
  world.updateMatrixWorld(true);cam.updateMatrixWorld(true);cam.matrixWorldInverse.copy(cam.matrixWorld).invert();const projection=new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse),objects=[];
  world.traverseVisible(obj=>{if(!obj.isMesh)return;const geometry=obj.geometry,pos=geometry.attributes.position,idx=geometry.index,material=obj.material;if(!pos)return;
   matrix.multiplyMatrices(projection,obj.matrixWorld);const points=[],triangles=[];let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
   for(let k=0;k<pos.count;k++){a.fromBufferAttribute(pos,k).applyMatrix4(matrix);const x=(a.x+1)*W/2,y=(1-a.y)*H/2;points.push([x,y,a.z]);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<0||left>W||bottom<0||top>H)return;
   const count=idx?idx.count:pos.count;for(let k=0;k<count;k+=3){const ia=idx?idx.getX(k):k,ib=idx?idx.getX(k+1):k+1,ic=idx?idx.getX(k+2):k+2,A=points[ia],B=points[ib],C=points[ic];const area=(B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]);if(material.side!==THREE.DoubleSide&&area>=0)continue;triangles.push([A,B,C]);}
   center.setFromMatrixPosition(obj.matrixWorld).applyMatrix4(projection);const color=material.color.clone().convertLinearToSRGB();objects.push({triangles,left,right,top,bottom,z:geometry.type==='PlaneGeometry'?9:center.z,color,flat:material.isMeshBasicMaterial,alpha:material.opacity});
  });
  objects.sort((a,b)=>b.z-a.z);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,W,H);
  for(const obj of objects){ctx.globalAlpha=obj.alpha;ctx.beginPath();for(const [A,B,C] of obj.triangles){ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.lineTo(C[0],C[1]);ctx.closePath();}
   const rgb=k=>`rgb(${Math.min(255,Math.round(obj.color.r*255*k))},${Math.min(255,Math.round(obj.color.g*255*k))},${Math.min(255,Math.round(obj.color.b*255*k))})`;
   if(obj.flat)ctx.fillStyle=rgb(1);else{const width=Math.max(1,obj.right-obj.left),height=Math.max(1,obj.bottom-obj.top),gradient=ctx.createRadialGradient(obj.left+width*.30,obj.top+height*.20,0,obj.left+width*.5,obj.top+height*.45,Math.max(width,height)*.7);gradient.addColorStop(0,rgb(1.65));gradient.addColorStop(.3,rgb(1.10));gradient.addColorStop(1,rgb(.53));ctx.fillStyle=gradient;}ctx.fill();
  }ctx.globalAlpha=1;
 }};
}
function setupWorld(){
 try{const probe=document.createElement('canvas');const supported=probe.getContext('webgl2');if(!supported)throw new Error('Use software renderer');supported.getExtension('WEBGL_lose_context')?.loseContext();renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true,alpha:true,powerPreference:'high-performance'});}catch(error){renderer=softwareRenderer($('#world'));}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(W,H);renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=THREE.SRGBColorSpace;if(!software){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
 scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,120);
 const ambient=new THREE.AmbientLight(0xffffff,1.65);scene.add(ambient);const sun=new THREE.DirectionalLight(0xfff5df,3.4);sun.position.set(-6,12,8);scene.add(sun);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:40});sun.shadow.normalBias=.035;const rim=new THREE.DirectionalLight(0xffffff,1.2);rim.position.set(5,5,-5);scene.add(rim);
 materialBlack=mat('#292727');materialGray=mat('#403a37');materialWhite=mat('#F5F1EA');const blue=mat('#ff4328'),dark=mat('#242424');
 assembly=new THREE.Group();scene.add(assembly);groups.push(assembly);human=person(materialBlack);human.position.x=1.3;assembly.add(human);
 crane=new THREE.Group();assembly.add(crane);
 const steel=mat('#77716a');steel.metalness=.7;steel.roughness=.27;
 box(crane,[1.65,.25,1.5],[-3.5,.14,0],dark);
 for(const z of [-.65,.65]){box(crane,[2,.12,.20],[-3.5,.10,z],steel);for(const x of [-4.25,-2.75])box(crane,[.35,.12,.35],[x,.04,z],dark);}
 for(const x of [-3.76,-3.24])for(const z of [-.26,.26])segment(crane,[x,.27,z],[x,5.25,z],.075,blue);
 for(let i=0;i<8;i++){const y=.3+i*.61;for(const z of [-.26,.26]){segment(crane,[-3.76,y,z],[-3.24,y+.61,z],.045,steel);segment(crane,[-3.76,y+.61,z],[-3.24,y,z],.045,steel);}box(crane,[.62,.065,.62],[-3.5,y,0],blue);}
 box(crane,[.85,.25,.85],[-3.5,5.25,0],blue);
 for(const z of [-.22,.22]){segment(crane,[-4.8,5.4,z],[3.85,5.4,z],.085,blue);segment(crane,[-4.8,5.92,z],[3.85,5.92,z],.075,blue);for(let i=0;i<14;i++){const x=-4.8+i*.615;segment(crane,[x,5.4,z],[x+.615,5.92,z],.04,steel);segment(crane,[x,5.92,z],[x+.615,5.4,z],.04,steel);}}
 box(crane,[1.0,.55,.8],[-4.45,5.12,0],dark);
 box(crane,[.72,.65,.72],[-3.05,4.85,0],blue);box(crane,[.025,.43,.50],[-2.68,4.89,0],mat('#35454a'));
 segment(crane,[-3.5,5.7,0],[-3.5,6.55,0],.08,steel);segment(crane,[-3.5,6.55,0],[2.9,5.92,0],.025,steel);segment(crane,[-3.5,6.55,0],[-4.8,5.92,0],.025,steel);
 crane.userData.trolley=box(crane,[.44,.18,.65],[1.3,5.32,0],dark);
 crane.userData.cable=segment(crane,[1.3,5.25,0],[1.3,3.3,0],.025,steel);
 crane.userData.grip=new THREE.Group();crane.add(crane.userData.grip);
 box(crane.userData.grip,[.68,.15,.45],[0,0,0],blue);
 crane.userData.jaws=[-1,1].map(side=>{const jaw=new THREE.Group();crane.userData.grip.add(jaw);box(jaw,[.065,.30,.30],[0,-.13,0],steel);box(jaw,[.14,.06,.30],[-side*.04,-.27,0],steel);return jaw;});
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(11,7),new THREE.MeshBasicMaterial({color:0xfffefa}));ground.rotation.x=-Math.PI/2;ground.position.y=-.025;ground.receiveShadow=true;assembly.add(ground);
 roadGroup=new THREE.Group();scene.add(roadGroup);groups.push(roadGroup);
 path=new THREE.CatmullRomCurve3([new THREE.Vector3(-10,0,-5),new THREE.Vector3(-4,0,-5),new THREE.Vector3(0,0,-4.7),new THREE.Vector3(1.8,0,-2.5),new THREE.Vector3(1.8,0,4),new THREE.Vector3(1.8,0,11),new THREE.Vector3(1.8,0,20)],false,'centripetal');
 const vertices=[],indices=[];const N=250,width=1.6;
 for(let i=0;i<=N;i++){const q=path.getPoint(i/N),d=path.getTangent(i/N),n=new THREE.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2);vertices.push(q.x+n.x,0,q.z+n.z,q.x-n.x,0,q.z-n.z);if(i<N){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const road=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x111111,side:THREE.DoubleSide}));roadGroup.add(road);
 for(let i=0;i<65;i++){const a=i/65,q=path.getPoint(a),d=path.getTangent(a);const dash=box(roadGroup,[.025,.012,.16],[q.x,.01,q.z],new THREE.MeshBasicMaterial({color:0x565656}));dash.rotation.y=Math.atan2(d.x,d.z);}
 roadHuman=person(materialWhite,false);roadHuman.scale.setScalar(.5);roadGroup.add(roadHuman);
 guideHuman=null;
 gridGroup=new THREE.Group();scene.add(gridGroup);groups.push(gridGroup);gridGroup.userData.people=[];
 heroMat=mat('#352026');
 for(let row=-3;row<=3;row++)for(let col=-2;col<=2;col++){const me=row===0&&col===0;const g=person(me?heroMat:materialGray,me);g.position.set(col*1.8,0,row*2.45);g.scale.setScalar(.9);g.userData.base=g.position.clone();gridGroup.add(g);gridGroup.userData.people.push(g);if(me)hero=g;}
 heroDisc=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({color:0xfffefa,transparent:true,opacity:.92,depthWrite:false}));heroDisc.rotation.x=-Math.PI/2;heroDisc.position.y=.004;gridGroup.add(heroDisc);
 flyHuman=person(materialBlack);scene.add(flyHuman);groups.push(flyHuman);
 seekers=new THREE.Group();scene.add(seekers);groups.push(seekers);
 const seekMat=mat('#4a4440');
 for(let i=0;i<30;i++){const p=person(seekMat,false);const a=i/30*Math.PI*2+(i%3)*.07;p.userData.seek={a,r0:15+(i%4)*1.6,r1:i%2?3.0:4.3,delay:((i*11)%30)/30*1.1};seekers.add(p);}
 beacon=new THREE.Group();scene.add(beacon);groups.push(beacon);
 for(let k=0;k<4;k++){const ring=new THREE.Mesh(new THREE.RingGeometry(.96,1,96),new THREE.MeshBasicMaterial({color:0xff4328,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.01;beacon.add(ring);}
 proofGroup=new THREE.Group();scene.add(proofGroup);groups.push(proofGroup);
 const frameMat=mat('#1b1a19');frameMat.roughness=.6;
 brandPanels=['NIKE','VANS','NBA\nAFRICA'].map((label,i)=>{const g=new THREE.Group();g.userData.x=(i-1)*2.4;g.position.set(g.userData.x,0,-2.6);
  box(g,[.08,.55,.08],[-.55,.27,0],frameMat);box(g,[.08,.55,.08],[.55,.27,0],frameMat);box(g,[1.72,2.32,.1],[0,1.66,-.03],frameMat);
  const tex=textTexture(label);const m=new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:0,color:'#2b2826',roughness:.7,metalness:0});
  const face=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.2),m);face.position.set(0,1.66,.03);g.add(face);g.userData.face=face;proofGroup.add(g);return g;});
 boardGroup=new THREE.Group();boardGroup.position.set(0,0,-.9);proofGroup.add(boardGroup);
 box(boardGroup,[.12,2.5,.12],[-1.3,1.25,0],frameMat);box(boardGroup,[.12,2.5,.12],[1.3,1.25,0],frameMat);box(boardGroup,[4.06,1.5,.1],[0,3.175,-.06],frameMat);
 const logoTex=new THREE.TextureLoader().load('sauti-clair-vide.png');logoTex.colorSpace=THREE.SRGBColorSpace;logoTex.anisotropy=4;
 boardFace=new THREE.Mesh(new THREE.PlaneGeometry(3.9,1.35),new THREE.MeshStandardMaterial({map:logoTex,emissiveMap:logoTex,emissive:0xffffff,emissiveIntensity:0,color:'#2b2826',roughness:.7,metalness:0}));boardFace.position.set(0,3.175,.001);boardGroup.add(boardFace);
 founderMat=mat('#6d6660');proofHero=person(founderMat);proofGroup.add(proofHero);
 ballRoot=new THREE.Group();scene.add(ballRoot);groups.push(ballRoot);
 ball=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.MeshStandardMaterial({color:'#ff4328',roughness:.42,metalness:.05}));ballRoot.add(ball);
 ballShadow=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color:0x1e1e1e,transparent:true,opacity:.18,depthWrite:false}));ballShadow.rotation.x=-Math.PI/2;ballRoot.add(ballShadow);
 scene.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial){o.castShadow=true;o.receiveShadow=true;}});
}
function textTexture(label){const c=document.createElement('canvas');c.width=640;c.height=880;const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const draw=()=>{const x=c.getContext('2d');x.fillStyle='#fffefa';x.fillRect(0,0,640,880);x.fillStyle='#1e1e1e';x.textAlign='center';x.textBaseline='middle';const lines=label.split('\n'),size=lines.length>1?150:190;x.font=`${size}px Anton, Impact, sans-serif`;lines.forEach((l,i)=>x.fillText(l,320,440+(i-(lines.length-1)/2)*size*1.02));x.fillStyle='#1e1e1e';x.fillRect(80,760,480,6);tex.needsUpdate=true;};draw();document.fonts?.load('150px Anton').then(draw);return tex;}
function framing(size,x,y,z,tx,ty,tz){const aspect=W/H;camera.left=-size*aspect/2;camera.right=size*aspect/2;camera.top=size/2;camera.bottom=-size/2;camera.position.set(x,y,z);camera.lookAt(tx,ty,tz);camera.updateProjectionMatrix();}
function materialForPerson(p,m){p.traverse(o=>{if(o.isMesh)o.material=m;});}
function project(x,y,z){tmp.set(x,y,z).project(camera);return {x:(tmp.x+1)/2*W,y:(1-tmp.y)/2*H};}
function pxPerUnit(){return H/(camera.top-camera.bottom);}
function screenToPlaneZ(px,py,z){const ndc=new THREE.Vector3(px/W*2-1,-(py/H)*2+1,-1).unproject(camera),dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);return ndc.addScaledVector(dir,(z-ndc.z)/dir.z);}
function logoDot(){const r=logoEl.getBoundingClientRect(),s=stage.getBoundingClientRect();return {x:r.left-s.left+r.width*336/1300,y:r.top-s.top+r.height*183.5/450,d:r.width*117/1300};}
function placeBall(x,y,z,r,squash=1,shadowY=null,shadowScale=1){ball.visible=true;ball.position.set(x,y,z);ball.scale.set(r*(2-squash),r*squash,r*(2-squash));if(shadowY===null){ballShadow.visible=false;}else{const lift=Math.max(0,y-r-shadowY);ballShadow.visible=true;ballShadow.position.set(x,shadowY+.003,z);const k=1/(1+lift*.35);ballShadow.scale.setScalar(r*1.05*k*shadowScale);ballShadow.material.opacity=.2*k;}}
function hideDOMBalls(){drop.style.opacity='0';fill.style.opacity='0';}
function domCircle(el,cx,cy,d){el.style.width=el.style.height=`${d}px`;el.style.transform=`translate3d(${(cx-d/2).toFixed(1)}px,${(cy-d/2).toFixed(1)}px,0)`;el.style.opacity='1';}
function squashAt(tt,times){let s=1;for(const k of times){const d=Math.abs(tt-k);if(d<.07)s=Math.min(s,1-.24*(1-d/.07));}return s;}
function renderWorld(time){groups.forEach(g=>g.visible=false);const tt=time;ball.visible=false;ballShadow.visible=false;ballRoot.scale.setScalar(1);hideDOMBalls();ball.material.color.copy(ballOrange);
 if(tt<6){
  assembly.visible=true;assembly.scale.setScalar(mobile?.48:1);crane.visible=true;human.scale.setScalar(1);human.position.set(mobile?1:1.3,0,0);human.rotation.set(0,0,0);materialForPerson(human,materialBlack);
  const yaw=.12+Math.sin(tt*.7)*.19,size=mobile?9.9:10.2;
  framing(size,Math.sin(yaw)*16,6.4+Math.sin(tt*.5)*.2,Math.cos(yaw)*16,mobile?-.25:-.4,mobile?1.75:2.45,0);
  posePerson(human,motionClock,0,0);
  const rig=human.userData.parts,step=tt<2.6?0:1,u=phase(tt,step?2.6:0,step?5.2:2.6);
  const anchor=step?2.96:1.43,dropX=human.position.x,pickX=3.35,carryY=4.8;
  let gripX=pickX,gripY=carryY;
  if(u<.22){gripY=mix(5.12,carryY,ease(u/.22));}
  else if(u<.56){gripX=mix(pickX,dropX,ease((u-.22)/.34));}
  else if(u<.88){gripX=dropX;gripY=mix(carryY,anchor,ease((u-.56)/.32));}
  else{const retreat=ease((u-.88)/.12);gripX=mix(dropX,pickX,retreat);gripY=mix(anchor,5.12,retreat);}
  if(tt>=5.2){gripX=pickX;gripY=5.12;}
  rig.forEach((part,i)=>{
   const batch=i<3?0:1;part.visible=batch<step||(batch===step&&u>=.22);
   if(batch===step&&u>=.22&&u<.88){part.position.x+=gripX-dropX;part.position.y+=gripY-anchor;}
  });
  crane.userData.trolley.position.x=gripX;
  crane.userData.grip.position.set(gripX,gripY,0);
  updateSegment(crane.userData.cable,[gripX,5.25,0],[gripX,gripY+.08,0],.025);
  const opening=.30+.15*(1-ease(phase(u,.16,.22))+ease(phase(u,.88,.95)));
  crane.userData.jaws.forEach((jaw,i)=>jaw.position.x=(i?1:-1)*opening);
  if(tt>=DROP0){
   const sc=assembly.scale.x,R=.34,hx=human.position.x,dot=logoDot(),start=screenToPlaneZ(dot.x,dot.y,0).multiplyScalar(1/sc),R0=dot.d/2/pxPerUnit()/sc;
   const J={x:-1.7,y:5.96+R,z:0},G={x:hx+1.05,z:.95},rest=hx+1.5;
   let x,y,z=G.z,r=R,shadowY=0;
   if(tt<DROP1){const v=phase(tt,DROP0,DROP1);x=mix(start.x,J.x,Math.pow(v,1.6));y=mix(start.y,J.y,v*v);z=0;r=mix(R0,R,ease(v/.65));shadowY=null;}
   else if(tt<BOUNCE1){const v=phase(tt,DROP1,BOUNCE1);x=mix(J.x,G.x,v);y=arc(v,J.y,R,1.35);z=G.z*(1-(1-v)*(1-v));}
   else if(tt<BOUNCE2){const v=phase(tt,BOUNCE1,BOUNCE2);x=mix(G.x,hx+1.32,v);y=arc(v,R,R,.85);}
   else if(tt<BOUNCE3){const v=phase(tt,BOUNCE2,BOUNCE3);x=mix(hx+1.32,hx+1.44,v);y=arc(v,R,R,.32);}
   else if(tt<BOUNCE4){const v=phase(tt,BOUNCE3,BOUNCE4);x=mix(hx+1.44,rest,v);y=arc(v,R,R,.1);}
   else{x=rest;y=R;}
   ballRoot.visible=true;ballRoot.scale.setScalar(sc);
   placeBall(x,y,z,r,squashAt(tt,[DROP1,BOUNCE1,BOUNCE2,BOUNCE3]),shadowY);
   const sp=project(x*sc,y*sc,z*sc),rp=r*sc*pxPerUnit(),hb=header.getBoundingClientRect().bottom-stage.getBoundingClientRect().top;
   if(tt<DROP1&&sp.y-rp<hb+4){ball.visible=false;domCircle(drop,sp.x,sp.y+stage.getBoundingClientRect().top,rp*2);}
  }
 } else if(tt<18){
  assembly.visible=true;assembly.scale.setScalar(1);crane.visible=false;assembly.children.forEach(g=>{if(g!==human&&g!==crane)g.visible=false});
  const q=ease(phase(tt,6,8)),size=9;framing(size,0,3.5,16,0,2,0);
  const halfW=size*W/H/2;human.scale.setScalar(mix(1,.39,q));human.position.set(mix(1.3,-halfW*.45,q)+(tt>9?(tt-9)*halfW*.07:0),mix(0,4.15,q),0);human.rotation.set(0,Math.PI/2-.12,0);materialForPerson(human,materialWhite);
  posePerson(human,motionClock,1);human.position.y+=Math.abs(Math.sin(motionClock*5.4))*.017;human.position.x+=Math.sin(motionClock*.32)*.20;
  const s=human.scale.x,R=mix(.34,.42,q),hop=Math.abs(Math.sin(motionClock*2.7))*1.05*q;
  placeBall(human.position.x+mix(1.5,-1.3,q)*s,human.position.y+(R+hop)*s,mix(.95,.3,q)*s,R*s,1-.18*q*Math.max(0,1-hop/.12));
  ballRoot.visible=true;
 } else if(tt<26){
  roadGroup.visible=true;const q=phase(tt,18,26),turn=ease(phase(tt,18,20.5)),follow=mix(-4,9,ease(phase(tt,19,26)));
  framing(mobile?14:15,mix(-5,0,turn),mix(6,24,turn),mix(10,follow+.02,turn),0,0,follow);
  const u=mix(.2,.76,q),r=path.getPoint(u),direction=path.getTangent(u),side=new THREE.Vector3(-direction.z,0,direction.x).normalize(),heading=Math.atan2(direction.x,direction.z);
  roadHuman.position.copy(r).addScaledVector(side,-.3);roadHuman.position.y=.03;roadHuman.rotation.y=heading;posePerson(roadHuman,motionClock,1);
  const g=Math.min(1,u+.004),gr=path.getPoint(g),gd=path.getTangent(g),gs=new THREE.Vector3(-gd.z,0,gd.x).normalize(),R=.22,hop=Math.abs(Math.sin(motionClock*2.5))*.55;
  const bx=gr.x+gs.x*.36,bz=gr.z+gs.z*.36,by=.03+R+hop;
  ballRoot.visible=true;placeBall(bx,by,bz,R,1-.2*Math.max(0,1-hop/.08),.03,1.2);
  if(tt>=FILL0){const f=ease(phase(tt,FILL0,FILL1)),sp=project(bx,by,bz),d0=R*2*pxPerUnit(),cover=Math.hypot(W,H)*1.08;ball.visible=false;ballShadow.visible=false;domCircle(fill,mix(sp.x,W/2,f),mix(sp.y,H/2,f),mix(d0,cover,f*f));fill.style.setProperty('--shade',String(1-f));}
 } else if(tt<33){
  gridGroup.visible=true;materialGray.color.copy(crowdColor);
  framing(mobile?12:10.5,0,5.2,18,0,1.7,0);
  const walk=phase(tt,27.3,29.3),w=ease(walk),lit=ease(phase(tt,27.8,29.4)),disc=ease(phase(tt,28.9,30.1));
  gridGroup.userData.people.forEach((g,i)=>{g.position.copy(g.userData.base);g.rotation.y=0;if(g!==hero){g.visible=!(g.userData.base.x===0&&g.userData.base.z>0);g.position.x*=mobile?1.3:.9;g.position.z-=3;g.position.y=-.35*w;g.scale.setScalar(.62);posePerson(g,motionClock+i*.31,.04,0);}});
  const front=mobile?1.6:1.2;hero.position.set(0,0,mix(-3,front,w));hero.scale.setScalar(mix(.62,mobile?1.0:1.15,w));hero.rotation.y=0;posePerson(hero,motionClock,walk>0&&walk<1?1:.08,0);
  heroMat.color.copy(crowdColor).lerp(heroWhite,lit);
  heroDisc.visible=disc>0;heroDisc.position.set(0,.004,front);heroDisc.scale.setScalar(Math.max(.001,disc*(mobile?1.5:1.75)));
  if(tt>=31.1){
   const sc=hero.scale.x,hy=2.56*sc,hr=.335*sc,R=.42,pop=ease(phase(tt,31.1,31.45)),redden=ease(phase(tt,31.3,32.1)),gx=.95*sc,out=mobile?4:7.5;
   hero.userData.head.visible=false;
   let x=0,y=hy+.28*sc*pop,r=mix(hr,R,ease(phase(tt,31.4,32.1)));
   if(tt>=31.45&&tt<32.1){const v=phase(tt,31.45,32.1);x=mix(0,gx,v);y=arc(v,hy+.28*sc,R,.35*sc);}
   else if(tt>=32.1&&tt<32.5){const v=phase(tt,32.1,32.5);x=mix(gx,gx+.55,v);y=arc(v,R,R,.95*sc);}
   else if(tt>=32.5&&tt<32.78){const v=phase(tt,32.5,32.78);x=mix(gx+.55,gx+.9,v);y=arc(v,R,R,.4*sc);}
   else if(tt>=32.78){const v=phase(tt,32.78,33);x=mix(gx+.9,out,v*v);y=arc(v,R,R,.25*sc);}
   ballRoot.visible=true;ball.material.color.copy(heroWhite).lerp(ballOrange,redden);
   placeBall(x,y,front+.05,r,squashAt(tt,[32.1,32.5,32.78]),tt>=31.45?0:null,1);
  }
 } else if(tt<38){
  flyHuman.visible=true;seekers.visible=true;beacon.visible=true;
  const arrival=ease(phase(tt,33.1,34.4)),zoom=ease(phase(tt,34.5,36)),rise=ease(phase(tt,34.3,35.2)),fx=mobile?.4:mix(3.4,5.6,zoom);
  framing(mix(mobile?10.5:10.6,mobile?19:21,zoom),mix(-1.4,0,arrival),mix(5.5,11,zoom),16,mix(0,mobile?.4:.6,zoom),mix(mobile?1.35:1.95,mobile?-1.4:.4,zoom),0);
  const x=mobile?mix(1.1,fx,arrival):mix(7,fx,arrival),z=mix(mobile?-4:-13,0,arrival),sc=mobile?mix(.45,1,arrival):1.15;
  flyHuman.position.set(x,Math.abs(Math.sin(motionClock*5.4))*.025*(1-arrival),z);flyHuman.scale.setScalar(sc);flyHuman.rotation.set(0,mix(-.65,0,arrival),0);
  posePerson(flyHuman,motionClock,mix(1,.12,arrival),ease(phase(tt,36.6,37.3)));
  const R=.34*sc,hop=Math.abs(Math.sin(motionClock*2.7))*.9*sc*(1-arrival),bob=Math.sin(motionClock*2.2)*.12*sc*rise;
  ballRoot.visible=true;placeBall(mix(x+1.0*sc,x,rise),mix(R+hop,3.55*sc,rise)+bob,mix(z+.55*sc,z+.15,rise),mix(R,R*1.3,rise),1,0,mix(1,2.2,rise));
  const pulse=ease(phase(tt,34.9,35.4));
  beacon.position.set(fx,0,0);beacon.children.forEach((ring,k)=>{const f=(motionClock*.42+k/4)%1;ring.scale.setScalar(.6+f*13*sc);ring.material.opacity=(1-f)*(1-f)*.75*pulse;});
  seekers.children.forEach((p,i)=>{const d=p.userData.seek,u=phase(tt,35.15+d.delay,36.6+d.delay),e=ease(u),r=mix(d.r0,d.r1,e)*sc;p.visible=u>0||tt>35.1;
   p.position.set(fx+Math.cos(d.a)*r,0,Math.sin(d.a)*r*.85);p.rotation.y=Math.atan2(fx-p.position.x,-p.position.z);p.scale.setScalar(.7*sc);posePerson(p,motionClock+i*.37,u>0&&u<1?1:.05,0);p.visible=u>0;});
 } else if(tt<44){
  proofGroup.visible=true;
  if(mobile){framing(13.5,0,5.2,16,0,-1.1,0);proofGroup.position.set(0,0,0);proofGroup.rotation.y=0;proofGroup.scale.setScalar(.7);}
  else{framing(10.6,0,4.8,16,0,1.9,0);proofGroup.position.set(3.9,0,0);proofGroup.rotation.y=-.16;proofGroup.scale.setScalar(1);}
  const recede=ease(phase(tt,41.6,42.4)),boardRise=ease(phase(tt,41.7,42.5)),hits=[38.7,39.7,40.7],signed=ease(phase(tt,43.05,43.4));
  brandPanels.forEach((g,i)=>{const lit=ease(phase(tt,hits[i]+.45,hits[i]+.7))*(1-.62*recede);g.position.set(g.userData.x*mix(1,1.28,recede),0,mix(-2.6,-3.4,recede));if(i===1){g.scale.setScalar(Math.max(.001,1-recede));g.visible=recede<.99;}const m=g.userData.face.material;m.color.set('#2b2826').lerp(heroWhite,lit);m.emissiveIntensity=.85*lit;});
  boardGroup.visible=boardRise>0;boardGroup.scale.set(1,Math.max(.001,boardRise),1);boardFace.material.color.set('#2b2826').lerp(heroWhite,signed);boardFace.material.emissiveIntensity=.9*signed;
  proofHero.position.set(0,0,1.25);proofHero.scale.setScalar(.85);proofHero.rotation.set(0,0,0);posePerson(proofHero,motionClock,.05,0);
  const look=hits.findIndex(h=>tt>=h&&tt<h+1);proofHero.userData.head.rotation.y=look>=0?[-.45,0,.45][look]*.6:0;proofHero.userData.head.rotation.x=look>=0?-.25:0;
  founderMat.color.set('#6d6660').lerp(heroWhite,signed);
  const R=.3,rest={x:1.0,y:R,z:1.45},dotR=117/1300*3.9/2,dotP={x:(336/1300-.5)*3.9,y:3.175+(.5-183.5/450)*1.35,z:-.9+.002+dotR*.6};
  let bx=rest.x,by=rest.y+Math.abs(Math.sin(motionClock*2.4))*.25,bz=rest.z,br=R,shadow=0;
  hits.forEach((h,i)=>{const p=brandPanels[i],tgt={x:p.userData.x,y:1.66,z:-2.6+.03+R};if(tt>=h&&tt<h+1){const up=phase(tt,h,h+.5),down=phase(tt,h+.5,h+1);if(tt<h+.5){bx=mix(rest.x,tgt.x,up);bz=mix(rest.z,tgt.z,up);by=arc(up,rest.y,tgt.y,1.4);}else{bx=mix(tgt.x,rest.x,down);bz=mix(tgt.z,rest.z,down);by=arc(down,tgt.y,rest.y,.9);}}});
  if(tt>=42.5){const j=ease(phase(tt,42.5,43.1));bx=mix(rest.x,dotP.x,j);bz=mix(rest.z,dotP.z,j);by=arc(j,rest.y,dotP.y,1.5);br=mix(R,dotR,ease(phase(tt,42.8,43.1)));shadow=j>.95?null:0;}
  ballRoot.visible=true;ballRoot.position.copy(proofGroup.position);ballRoot.rotation.y=proofGroup.rotation.y;ballRoot.scale.copy(proofGroup.scale);placeBall(bx,by,bz,br,1,shadow,1);
 }
 if(tt<38||tt>=44){ballRoot.position.set(0,0,0);ballRoot.rotation.y=0;}
 if(tt<6){assembly.children.forEach(g=>{if(g!==human&&g!==crane)g.visible=true});}
 renderer.render(scene,camera);
}
function show(name,opacity=1){const el=scenes[name];el.classList.add('active');el.style.opacity=String(opacity);el.inert=false;}
function updateDOM(time){
 const tt=time;Object.values(scenes).forEach(el=>{el.classList.remove('active');el.style.opacity='0';el.inert=true;});
 let index=0;stage.style.background=tt>=26&&tt<33?'#ff4328':(tt>=6&&tt<18)||tt>=38?'#1e1e1e':'#fffefa';blackPanel.style.height='0';marquee.style.opacity='0';
 if(tt<6){show('intro',1-ease(phase(tt,5.3,6)));scenes.intro.querySelector('.intro-caption').style.transform=`translateY(${mix(0,-25,ease(phase(tt,5.3,6)))}px)`;}
 else if(tt<9){index=1;blackPanel.style.height=`${mix(0,68,ease(phase(tt,6,7)))}%`;show('promise',ease(phase(tt,6.6,7.4)));scenes.promise.style.transform=`translateX(${mix(80,0,ease(phase(tt,6.6,7.6)))}px)`;}
 else if(tt<18){index=2;blackPanel.style.height='68%';marquee.style.opacity='1';marquee.style.transform=`translateX(${-phase(tt,9,18)*W*.72}px)`;show('method');const cards=track.children,first=cards[0].getBoundingClientRect(),stepX=cards.length>1?cards[1].getBoundingClientRect().left-first.left:first.width,room=track.parentElement.clientWidth,visible=Math.max(1,Math.floor((room+stepX-first.width)/stepX)),n=Math.max(0,cards.length-visible),s=phase(tt,9.6,17.4)*n,i=Math.min(n,Math.floor(s)),f=i>=n?0:ease(clamp((s-i-.6)/.4));track.style.transform=`translate3d(${-Math.round((i+f)*stepX)}px,0,0)`;}
 else if(tt<26){index=3;show('route',ease(phase(tt,18.6,20))*(1-ease(phase(tt,FILL0+.4,FILL1))));const active=Math.min(2,Math.floor(phase(tt,18.8,24.6)*3));if(active!==routeActive){routeActive=active;[...routeCards.children].forEach((card,i)=>card.classList.toggle('on',i===active));}}
 else if(tt<33){index=4;show('distinction',ease(phase(tt,26.2,27)));const shift=ease(phase(tt,29.2,30.4));values.style.opacity=String(shift);values.style.transform=`translateY(${mix(40,0,shift)}px)`;values.style.visibility=shift>0?'visible':'hidden';const va=Math.min(valueItems.length-1,Math.floor(phase(tt,29.6,32.6)*valueItems.length));if(va!==valueActive){valueActive=va;valueItems.forEach((v,i)=>{v.classList.toggle('on',i===va);v.classList.toggle('done',i<va);});}}
 else if(tt<38){index=5;show('flight',ease(phase(tt,33.1,33.65))*(1-ease(phase(tt,37.75,38))));scenes.flight.style.transform=`translateY(${mix(26,0,ease(phase(tt,33.1,34)))}px)`;personaItems.forEach((p,i)=>p.classList.toggle('on',tt>=35.6+i*.25));scenes.flight.classList.toggle('found',tt>=36.7);}
 else if(tt<44){index=6;show('proof',ease(phase(tt,38,38.5)));scenes.proof.classList.toggle('signed',tt>=43.15);brandItems.forEach((b,i)=>b.classList.toggle('on',tt>=[39.15,40.15,41.15][i]&&tt<41.6));}
 else {index=7;show('finale',ease(phase(tt,44,44.5)));}
 if(tt<29.2)valueActive=-1;
 const reading=scrollY>film.offsetHeight-innerHeight+H*.2;document.body.classList.toggle('reading',reading);chapter.textContent=labels[index];timeline.value=String(tt);timeline.setAttribute('aria-valuetext',`${labels[index]}, ${Math.round(tt)} secondes sur 48`);
 const darkScene=(tt>=6&&tt<18)||tt>=38,orangeScene=tt>=25.6&&tt<33;
 document.body.dataset.theme=darkScene?'dark':orangeScene?'orange':'light';header.classList.toggle('on-dark',darkScene);header.classList.toggle('on-orange',orangeScene);header.classList.toggle('on-accent',tt>=18&&tt<25.6||tt>=33&&tt<38);
 header.classList.toggle('dotless',tt>=DROP0&&tt<25.6);
 if(tt<18||tt>=26)routeActive=-1;
}
function endY(){return Math.max(1,film.offsetHeight-innerHeight);}
function seek(seconds){t=clamp(seconds,0,DURATION);window.scrollTo({top:t/DURATION*endY(),behavior:'instant'});renderWorld(t);updateDOM(t);}
function stop(){motionPaused=false;playing=false;play.innerHTML='▶ <span>Lecture auto</span>';play.setAttribute('aria-label','Lancer la lecture automatique');}
play.addEventListener('click',()=>{if(playing){stop();motionPaused=true;return;}playing=true;motionPaused=false;autoT=t>=47.99?0:t;lastTime=performance.now();play.innerHTML='Ⅱ <span>Pause</span>';play.setAttribute('aria-label','Mettre la lecture en pause');});
$('#restart').addEventListener('click',()=>{stop();seek(0);});
timeline.addEventListener('input',()=>{stop();seek(Number(timeline.value));});
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{stop();seek(Number(b.dataset.go));}));
$('.logo').addEventListener('click',e=>{e.preventDefault();stop();seek(0);});
$('.back-film').addEventListener('click',e=>{e.preventDefault();stop();seek(0);});
for(const event of ['wheel','touchstart'])window.addEventListener(event,()=>{if(playing)stop();},{passive:true});
window.addEventListener('keydown',event=>{if(event.key==='Escape')stop();if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!['INPUT','BUTTON'].includes(document.activeElement.tagName)&&!$('#booking').open){stop();}});
const BOOKING_URL='';const dialog=$('#booking');document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>{stop();if(BOOKING_URL){location.assign(BOOKING_URL);return;}dialog.showModal();}));$('#close-booking').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
let previous=-1,previousFrame=0,previousRender=0;
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min((now-previousFrame)/1000,.06)||.016;previousFrame=now;
 if(document.hidden){lastTime=now;return;}if(!motionPaused&&!reduced)motionClock+=dt;
 if(playing){autoT+=Math.min((now-lastTime)/1000,.1);lastTime=now;t=clamp(autoT,0,DURATION);window.scrollTo({top:t/DURATION*endY(),behavior:'instant'});if(autoT>=DURATION)stop();}
 else {const target=clamp(scrollY/endY())*DURATION;t=reduced?target:mix(t,target,1-Math.exp(-dt*13));if(Math.abs(t-target)<.002)t=target;}
 const interval=software?(t>=26&&t<33?100:40):16;
 const changed=Math.abs(previous-t)>.0001||!initialized,ambient=!reduced&&!motionPaused&&t<44;
 if(now-previousRender>=interval&&(changed||ambient)){renderWorld(t);if(changed)updateDOM(t);previous=t;previousRender=now;initialized=true;}
}
let resizeFrame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{W=innerWidth;H=stage.clientHeight;mobile=W<901;if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(W,H);}initialized=false;});});
setupWorld();seek(clamp(scrollY/endY())*DURATION);requestAnimationFrame(frame);
if(reduced){$('#scroll-hint').textContent='DÉFILER OU LIRE LE TEXTE ↓';}
