import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export interface Equipment { instances:THREE.InstancedMesh; material:THREE.MeshPhysicalMaterial; haze:THREE.Sprite[]; rays?:THREE.Mesh[] }

function texture(draw:(context:CanvasRenderingContext2D)=>void,size=256){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const context=canvas.getContext('2d')!;draw(context);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map}
function mesh(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){const result=new THREE.Mesh(geometry,material);result.position.set(x,y,z);result.castShadow=true;result.receiveShadow=true;parent.add(result);return result}
function tube(parent:THREE.Object3D,points:number[][],radius:number,material:THREE.Material){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),48,radius,10,false),material)}
function cylinder(parent:THREE.Object3D,radius:number,length:number,material:THREE.Material,x:number,y:number,z:number){return mesh(parent,new THREE.CylinderGeometry(radius,radius,length,64),material,x,y,z)}
function ring(parent:THREE.Object3D,radius:number,width:number,material:THREE.Material,x:number,y:number,z:number){const result=mesh(parent,new THREE.TorusGeometry(radius,width,10,64),material,x,y,z);result.rotation.x=Math.PI/2;return result}
function materials(){
 const grain=texture(context=>{context.fillStyle='#a5a5a5';context.fillRect(0,0,256,256);for(let y=0;y<256;y++){const v=120+Math.round(40*Math.sin(y*12.9898));context.fillStyle=`rgb(${v},${v},${v})`;context.fillRect(0,y,256,1)}});grain.colorSpace=THREE.NoColorSpace;grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,6);
 return {steel:new THREE.MeshPhysicalMaterial({color:0xd4d9df,metalness:1,roughness:.22,roughnessMap:grain,clearcoat:.35}),polished:new THREE.MeshPhysicalMaterial({color:0xe1e7ed,metalness:1,roughness:.12,clearcoat:.7}),black:new THREE.MeshPhysicalMaterial({color:0x11161b,metalness:.8,roughness:.32,clearcoat:.25}),rubber:new THREE.MeshStandardMaterial({color:0x15191e,roughness:.9}),brass:new THREE.MeshStandardMaterial({color:0xbaa275,metalness:.92,roughness:.26})};
}
function haze(parent:THREE.Object3D,count:number){const map=texture(context=>{const g=context.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.48)');g.addColorStop(.4,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');context.fillStyle=g;context.fillRect(0,0,128,128)},128);return Array.from({length:count},()=>{const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,color:0xdde5eb,transparent:true,opacity:.06,depthWrite:false}));parent.add(sprite);return sprite})}
function post(parent:THREE.Object3D,x:number,z:number,height:number,m:ReturnType<typeof materials>){cylinder(parent,.23,.07,m.black,x,.16,z);cylinder(parent,.045,height,m.polished,x,.2+height/2,z);cylinder(parent,.09,.13,m.steel,x,height+.16,z);const screw=cylinder(parent,.035,.12,m.black,x+.1,height+.17,z);screw.rotation.z=Math.PI/2}

export function createMistEquipment(parent:THREE.Group):Equipment{
 const m=materials(),nozzle=new THREE.Group();
 mesh(parent,new RoundedBoxGeometry(3.9,.18,2.4,3,.06),m.black,.05,.05,0);parent.add(nozzle);nozzle.position.set(-1.02,1.15,0);nozzle.rotation.z=-Math.PI/2;
 const profile=[[-.82,.13],[-.66,.13],[-.65,.19],[-.46,.19],[-.44,.22],[-.32,.22],[-.3,.2],[.25,.2],[.28,.23],[.36,.23],[.55,.12],[.65,.085]].map(([y,r])=>new THREE.Vector2(r,y));
 mesh(nozzle,new THREE.LatheGeometry(profile,96),m.steel);
 // Realistic hexagonal hose coupling and concentric machined grooves.
 const coupling=mesh(nozzle,new THREE.CylinderGeometry(.22,.22,.16,6),m.brass,0,-.57,0);coupling.rotation.y=Math.PI/6;
 for(let n=0;n<10;n++)ring(nozzle,.135,.006,m.polished,0,-.82+n*.014,0);
 for(const y of [-.3,-.25,.23,.28,.32])ring(nozzle,y>.25?.231:.202,.008,m.polished,0,y,0);
 const face=cylinder(nozzle,.083,.025,m.polished,0,.66,0);face.castShadow=false;
 cylinder(nozzle,.028,.027,m.black,0,.675,0);
 tube(parent,[[-1.85,1.15,0],[-2,1.05,-.12],[-1.95,.35,-.25],[-1.25,.16,.15],[-.7,.15,.55]],.064,m.rubber);
 for(let n=0;n<7;n++){const collar=ring(nozzle,.077,.009,m.rubber,0,-.93-n*.04,0);collar.castShadow=false;}
 post(parent,-1.12,0,.66,m);
 mesh(parent,new RoundedBoxGeometry(.32,.18,.39,3,.04),m.black,-1.12,.96,0);
 for(const z of [-.13,.13])cylinder(parent,.025,.025,m.polished,-1.12,1.06,z);
 const water=new THREE.MeshPhysicalMaterial({color:0xd9efff,metalness:.05,roughness:.06,clearcoat:1,transparent:true,opacity:.82});
 const instances=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),water,420);instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);parent.add(instances);
 return {instances,material:water,haze:haze(parent,18)};
}

export function createDetectorEquipment(parent:THREE.Group):Equipment{
 const m=materials();
 mesh(parent,new RoundedBoxGeometry(3.65,.13,2.65,3,.045),m.black,0,.075,0);
 const holes=texture(context=>{context.fillStyle='#242a31';context.fillRect(0,0,256,256);for(let x=12;x<256;x+=24)for(let y=12;y<256;y+=24){context.fillStyle='#48515c';context.beginPath();context.arc(x,y,3.3,0,Math.PI*2);context.fill();context.fillStyle='#080b0f';context.beginPath();context.arc(x,y,2,0,Math.PI*2);context.fill()}},256);
 const board=mesh(parent,new THREE.PlaneGeometry(3.53,2.53),new THREE.MeshStandardMaterial({map:holes,metalness:.75,roughness:.42}),0,.144,0);board.rotation.x=-Math.PI/2;board.receiveShadow=true;
 const y=.93;
 const barrel=(x:number,z:number,angle:number,source=false)=>{
  const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=angle;parent.add(group);
  const body=cylinder(group,source?.15:.13,source?.58:.4,source?m.black:m.steel,0,0,0);body.rotation.z=Math.PI/2;
  for(let n=0;n<6;n++){const fin=ring(group,source?.163:.142,.009,source?m.black:m.polished,-.2+n*.065,0,0);fin.rotation.set(0,Math.PI/2,0);}
  const lensMaterial=new THREE.MeshPhysicalMaterial({color:source?0x48101a:0x18354a,metalness:.35,roughness:.06,clearcoat:1,emissive:source?0x761022:0x000000,emissiveIntensity:source?.7:0});
  const front=cylinder(group,source?.114:.1,.025,lensMaterial,source?.31:.22,0,0);front.rotation.z=Math.PI/2;
  const bezel=ring(group,source?.125:.112,.012,m.polished,source?.325:.235,0,0);bezel.rotation.set(0,Math.PI/2,0);
  post(parent,x,z,.55,m);return group;
 };
 barrel(-1.3,0,0,true);barrel(1.3,0,Math.PI);
 // The two collection heads face the sample at the supplied 90° and 145° angles.
 for(const degrees of [90,145]){const a=degrees*Math.PI/180,x=Math.cos(a)*1.03,z=Math.sin(a)*1.03;barrel(x,z,Math.atan2(z,-x));}
 tube(parent,[[-1.61,y,0],[-1.77,.65,-.25],[-1.35,.2,-.8],[.6,.18,-.9]],.025,m.rubber);
 // Alpha glass keeps the transparent aerosol cloud visible inside the flow cell.
 // Transmission samples opaque objects only and can conceal the smoke sprites.
 const glass=new THREE.MeshPhysicalMaterial({color:0xe2eff6,metalness:0,roughness:.07,opacity:.18,ior:1.46,clearcoat:1,transparent:true,side:THREE.DoubleSide,depthWrite:false});
 const chamber=mesh(parent,new THREE.CylinderGeometry(.4,.4,.95,64,1,true),glass,0,y,0);chamber.castShadow=false;
 for(const h of [y-.48,y+.48]){ring(parent,.415,.035,m.polished,0,h,0);ring(parent,.408,.011,m.rubber,0,h+.045,0);}
 cylinder(parent,.43,.09,m.steel,0,y-.53,0);cylinder(parent,.43,.07,m.steel,0,y+.53,0);
 const port=cylinder(parent,.075,.18,m.brass,0,y+.64,0);port.castShadow=false;
 tube(parent,[[0,y+.73,0],[0,y+.9,-.15],[.2,y+.9,-.35],[.7,y+.72,-.55]],.045,m.rubber);
 const ray=(to:THREE.Vector3,opacity:number)=>{const from=new THREE.Vector3(0,y,0),direction=new THREE.Vector3().subVectors(to,from);const result=mesh(parent,new THREE.CylinderGeometry(.006,.006,direction.length(),8),new THREE.MeshBasicMaterial({color:0xf84553,transparent:true,opacity,depthWrite:false}));result.position.copy(from).add(to).multiplyScalar(.5);result.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());result.castShadow=false;return result;};
 const laser=ray(new THREE.Vector3(-.98,y,0),.65);laser.position.x=-.49;ray(new THREE.Vector3(1.02,y,0),.65);
 const rays=[ray(new THREE.Vector3(0,y,.82),.32),ray(new THREE.Vector3(-.67,y,.47),.2)];
 const material=new THREE.MeshPhysicalMaterial({color:0xbba78d,roughness:.85,transparent:true,opacity:.7,depthWrite:false});
 const instances=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),material,130);instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);parent.add(instances);
 return {instances,material,haze:haze(parent,18),rays};
}
