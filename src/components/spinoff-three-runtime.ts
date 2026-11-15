import * as THREE from 'three';
import { createMistEquipment, createDetectorEquipment } from './spinoff-equipment';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type SceneKind = 'mist' | 'detector' | 'cylinders';
export type Medium = 'dust' | 'smoke' | 'mist';
export interface SceneInputs { value:number; medium:Medium; paused:boolean; yaw:number }

/** Illustrative product scenes. No rendered dimension is a qualification measurement. */
export function mountSpinoffScene(canvas:HTMLCanvasElement,kind:SceneKind,read:()=>SceneInputs,onFailure:()=>void){
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch{onFailure();return ()=>{}};
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=kind==='cylinders'?1.35:1.05;renderer.transmissionResolutionScale=.5;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
 const camera=new THREE.PerspectiveCamera(34,1,.1,40);
 if(kind==='cylinders'){camera.position.set(3.3,2.35,6.5);camera.lookAt(0,.85,0)}else{camera.position.set(2.9,2.25,6.1);camera.lookAt(0,.85,0)}
 const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04);
 scene.environment=environment.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xddeeff,0x525767,kind==='cylinders'?2.4:1.7));
 const key=new THREE.DirectionalLight(0xffffff,kind==='cylinders'?4.5:3.8);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.normalBias=.035;scene.add(key);
 const rim=new THREE.DirectionalLight(kind==='cylinders'?0x82baff:0xadc8ef,kind==='cylinders'?3:2.2);rim.position.set(4,3,-4);scene.add(rim);
 const floorMaterial=new THREE.MeshStandardMaterial({color:0xe2e8ef,roughness:.84,metalness:.08});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.07;floor.receiveShadow=true;scene.add(floor);
 const silver=new THREE.MeshStandardMaterial({color:0xbcc5cf,metalness:.92,roughness:.24});
 const darkMetal=new THREE.MeshStandardMaterial({color:0x253747,metalness:.65,roughness:.32});
 const blue=new THREE.MeshStandardMaterial({color:0x266fb5,metalness:.45,roughness:.27});
 const add=(geometry:THREE.BufferGeometry,material:THREE.Material,parent:THREE.Object3D=root,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh};
 const pedestal=add(new THREE.CylinderGeometry(2.1,2.16,.12,64),new THREE.MeshStandardMaterial({color:0xc4ced8,metalness:.3,roughness:.55}),root,0,.01,0);
 const dummy=new THREE.Object3D();let mist:THREE.InstancedMesh|undefined,particles:THREE.InstancedMesh|undefined;
 let particleMaterial:THREE.MeshPhysicalMaterial|undefined;
 const vessels:THREE.Group[]=[];let scatterBeams:THREE.Mesh[]=[],hazeSprites:THREE.Sprite[]=[];
 if(kind==='mist'){
  pedestal.visible=false;const equipment=createMistEquipment(root);mist=equipment.instances;hazeSprites=equipment.haze;
 }else if(kind==='detector'){
  pedestal.visible=false;const equipment=createDetectorEquipment(root);particles=equipment.instances;particleMaterial=equipment.material;scatterBeams=equipment.rays??[];hazeSprites=equipment.haze;
 }else{
  for(let i=0;i<2;i++){
   const group=new THREE.Group();group.position.set(i===0?-.78:.78,.14,0);root.add(group);vessels.push(group);
   const shell=i===0?silver:new THREE.MeshPhysicalMaterial({color:0x214461,metalness:.45,roughness:.25,clearcoat:.9,clearcoatRoughness:.16});
   add(new THREE.CylinderGeometry(.35,.35,1.5,48),shell,group,0,.98,0);
   add(new THREE.SphereGeometry(.35,48,24),shell,group,0,.23,0);
   add(new THREE.SphereGeometry(.35,48,24),shell,group,0,1.73,0);
   add(new THREE.CylinderGeometry(.15,.23,.25,32),silver,group,0,2.03,0);
   add(new THREE.BoxGeometry(.3,.13,.2),darkMetal,group,0,2.22,0);
   const wheel=add(new THREE.TorusGeometry(.15,.035,10,32),i===0?darkMetal:blue,group,.2,2.2,0);wheel.rotation.y=Math.PI/2;
   // Contrasting wraps suggest composite construction without claiming a specific weave.
   if(i===1)for(let n=0;n<15;n++){const band=add(new THREE.TorusGeometry(.353,.006,5,48),new THREE.MeshStandardMaterial({color:0x79a5bc,metalness:.5,roughness:.4}),group,0,.35+n*.09,0);band.rotation.x=Math.PI/2;band.rotation.z=n%2?.1:-.1;}
   const label=add(new THREE.CylinderGeometry(.356,.356,.36,48),new THREE.MeshStandardMaterial({color:i===0?0xe5ebf2:0xd0e4ee,metalness:.1,roughness:.6}),group,0,1,0);label.castShadow=false;
  }
 }
 const host=canvas.parentElement!;let visible=true,frame=0,disposed=false,last=0,elapsed=0,currentValue=read().value,blend=read().medium==='dust'?0:read().medium==='smoke'?1:2,currentYaw=0,needsRender=true;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;if(kind!=='cylinders')camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(17))*Math.max(1,1.25/camera.aspect)));camera.updateProjectionMatrix();needsRender=true;};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{rootMargin:'80px'});intersection.observe(host);
 const theme=()=>{const dark=document.documentElement.dataset.theme==='dark';scene.background=new THREE.Color(dark?0x111a25:kind==='cylinders'?0xeef2f6:0xd6dee7);floorMaterial.color.set(dark?0x1b2838:0xe2e8ef);needsRender=true;};
 const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});theme();
 const onLoss=(event:Event)=>{event.preventDefault();visible=false;onFailure();};canvas.addEventListener('webglcontextlost',onLoss);
 const color=new THREE.Color(),dustColor=new THREE.Color(0xc89762),smokeColor=new THREE.Color(0xb2b9c4),mistColor=new THREE.Color(0x78c5ed);
 const draw=(time:number)=>{
  if(disposed)return;frame=requestAnimationFrame(draw);if(time-last<32)return;const dt=Math.min((time-last)/1000,.05);last=time;if(!visible||document.hidden)return;
  const input=read(),targetMedium=input.medium==='dust'?0:input.medium==='smoke'?1:2;
  if((kind==='cylinders'||input.paused||reduced.matches)&&!needsRender&&Math.abs(currentValue-input.value)<.001&&Math.abs(currentYaw-input.yaw)<.001&&(kind!=='detector'||Math.abs(blend-targetMedium)<.001))return;
  if(needsRender||Math.abs(currentYaw-input.yaw)>.001||(kind==='cylinders'&&Math.abs(currentValue-input.value)>.001))renderer.shadowMap.needsUpdate=true;
  const smoothing=reduced.matches?1:1-Math.exp(-dt*9);currentValue=THREE.MathUtils.lerp(currentValue,input.value,smoothing);currentYaw=THREE.MathUtils.lerp(currentYaw,input.yaw,smoothing);root.rotation.y=currentYaw;
  if(!input.paused&&!reduced.matches)elapsed+=dt;
  if(mist){for(let n=0;n<mist.count;n++){const life=((n*.754877+elapsed*.29)%1),angle=n*2.399963,radius=Math.sqrt((n*.569841)%1)*life*.83;dummy.position.set(-.33+life*2.5,1.15+Math.cos(angle)*radius-life*life*.3,Math.sin(angle)*radius);const size=(.003+currentValue/80*.01)*(.65+(n%7)/10);dummy.scale.setScalar(size);dummy.updateMatrix();mist.setMatrixAt(n,dummy.matrix)}mist.instanceMatrix.needsUpdate=true;}
  if(particles&&particleMaterial){const target=input.medium==='dust'?0:input.medium==='smoke'?1:2;blend=THREE.MathUtils.lerp(blend,target,smoothing);color.copy(dustColor).lerp(smokeColor,Math.min(1,blend));if(blend>1)color.copy(smokeColor).lerp(mistColor,blend-1);particleMaterial.color.copy(color);particleMaterial.roughness=THREE.MathUtils.lerp(.9,.12,blend/2);particleMaterial.opacity=blend<=1?.88-blend*.18:.7+(blend-1)*.15;
   for(let n=0;n<particles.count;n++){const phase=n*2.399963+elapsed*.23,level=(n*.618033)%1;dummy.position.set(Math.sin(phase)*.27,.58+level*.7,Math.cos(phase*.7)*.25);const size=blend<=1?THREE.MathUtils.lerp(.014,.009,blend):THREE.MathUtils.lerp(.009,.01,blend-1);dummy.scale.set(size*(.7+(n%5)/6),size*(blend<1?1.5:1),size);dummy.rotation.set(n,n+elapsed*.12,n*.3);dummy.updateMatrix();particles.setMatrixAt(n,dummy.matrix)}particles.instanceMatrix.needsUpdate=true;scatterBeams.forEach((mesh,i)=>{(mesh.material as THREE.MeshBasicMaterial).opacity=THREE.MathUtils.lerp(i===0?.6:.16,i===0?.25:.7,blend/2)});
  }
  hazeSprites.forEach((sprite,n)=>{const phase=(n*.754877+elapsed*.16)%1;if(kind==='mist'){const radius=phase*.6,angle=n*2.399963;sprite.position.set(-.3+phase*2.5,1.15+Math.cos(angle)*radius-phase*phase*.3,Math.sin(angle)*radius);sprite.scale.setScalar(.08+phase*.6);(sprite.material as THREE.SpriteMaterial).opacity=.05*(1-phase);}else{sprite.position.set(Math.sin(n*2.4+elapsed*.06)*.2,.58+((n*.618+elapsed*.025)%1)*.65,Math.cos(n*1.7)*.2);const smokeWeight=Math.max(0,1-Math.abs(blend-1));sprite.scale.setScalar(.22+(n%4)*.025+smokeWeight*.12);const material=sprite.material as THREE.SpriteMaterial;material.color.set(document.documentElement.dataset.theme==='dark'?0xc3cbd5:0x65707d);material.opacity=.025+smokeWeight*.19;}});
  if(vessels.length){const scale=Math.cbrt(currentValue/6.8);vessels.forEach(group=>group.scale.setScalar(scale));}
  canvas.dataset.displayValue=currentValue.toFixed(3);canvas.dataset.displayMedium=blend.toFixed(3);renderer.render(scene,camera);needsRender=false;
 };
 frame=requestAnimationFrame(draw);
 return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();themeObserver.disconnect();canvas.removeEventListener('webglcontextlost',onLoss);const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Sprite){if(object instanceof THREE.Mesh)geometries.add(object.geometry);const material=object.material;if(Array.isArray(material))material.forEach(m=>materials.add(m));else materials.add(material);if(object instanceof THREE.InstancedMesh)object.dispose()}});geometries.forEach(g=>g.dispose());const textures=new Set<THREE.Texture>();materials.forEach(m=>{for(const value of Object.values(m)){if(value instanceof THREE.Texture&&value!==environment.texture)textures.add(value)}m.dispose()});textures.forEach(t=>t.dispose());environment.dispose();key.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();};
}
