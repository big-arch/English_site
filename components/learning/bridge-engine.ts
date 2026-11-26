import * as THREE from "three";

export type Part = "deck" | "pier" | "clearance";

export function mountBridge(canvas: HTMLCanvasElement, pick:(part:Part)=>void, lost:()=>void) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:"low-power"});
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e7ebe6");
  const camera = new THREE.PerspectiveCamera(34,1,0.1,100);
  const target = new THREE.Vector3(0,1.65,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x83918b,2.4));
  const sun = new THREE.DirectionalLight(0xffecd4,2.5);
  sun.position.set(-4,9,6);
  scene.add(sun);
  const materials:THREE.MeshStandardMaterial[]=[];
  const geometries:THREE.BufferGeometry[]=[];
  const selectable:THREE.Mesh[]=[];
  const slots=new Map<Part,THREE.MeshStandardMaterial>();
  function material(color:string,part?:Part) {
    const value=new THREE.MeshStandardMaterial({color,roughness:0.9});
    materials.push(value);
    if(part)slots.set(part,value);
    return value;
  }
  const concrete=material("#bcb4a5","pier"), deck=material("#666967","deck");
  const clay=material("#bdac90"), turf=material("#a4b196"), water=material("#73a7ac");
  const stripe=material("#fff3d9"), rail=material("#d9d0bd"), measure=material("#785ac0","clearance");
  function shape(geometry:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number,part?:Part) {
    geometries.push(geometry);
    const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);
    if(part){mesh.userData.part=part;selectable.push(mesh);}
    scene.add(mesh);return mesh;
  }
  function box(w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number,part?:Part){
    return shape(new THREE.BoxGeometry(w,h,d),mat,x,y,z,part);
  }
  box(11,.38,4.8,water,0,-.12,0);
  for(const x of [-4.55,4.55]){
    box(2.15,1.8,4.8,clay,x,.64,0);
    box(2.2,.12,4.85,turf,x,1.59,0);
  }
  for(const x of [-3.7,-1.7,1.7,3.7]){
    box(.48,2.45,1.7,concrete,x,1.33,0,"pier");
    box(.76,.2,2.05,concrete,x,2.48,0,"pier");
  }
  box(10.35,.44,2.24,deck,0,2.82,0,"deck");
  for(const z of [-1.08,1.08])box(10.35,.17,.09,rail,0,3.12,z,"deck");
  for(let x=-4.65;x<5;x+=1.15)box(.62,.014,.045,stripe,x,3.05,0,"deck");
  box(.065,2.04,.065,measure,0,1.34,1.07,"clearance");
  for(const [y,dir] of [[.25,-1],[2.44,1]]){
    const arrow=shape(new THREE.ConeGeometry(.14,.32,10),measure,0,y,1.07,"clearance");
    if(dir<0)arrow.rotation.z=Math.PI;
  }
  const invisible=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  box(.48,2.34,.3,invisible,0,1.35,1.07,"clearance");
  let yaw=.53, pitch=.34;
  function draw() {
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
    renderer.setSize(w,h,false);camera.aspect=w/h;
    const r=Math.max(12,15/(camera.aspect*.95));
    camera.position.set(Math.sin(yaw)*Math.cos(pitch)*r,target.y+Math.sin(pitch)*r,Math.cos(yaw)*Math.cos(pitch)*r);
    camera.lookAt(target);camera.updateProjectionMatrix();renderer.render(scene,camera);
  }
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let drag:{x:number;y:number;yaw:number;pitch:number;id:number;moved:boolean}|undefined;
  function down(e:PointerEvent){if(!e.isPrimary||e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw,pitch,id:e.pointerId,moved:false};canvas.setPointerCapture(e.pointerId);}
  function move(e:PointerEvent){if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;
    if(drag.moved){yaw=drag.yaw-dx*.009;pitch=THREE.MathUtils.clamp(drag.pitch+dy*.006,.09,1);draw();}
  }
  function up(e:PointerEvent){
    if(!drag||e.pointerId!==drag.id)return;
    const moved=drag.moved;drag=undefined;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(moved)return;
    const rect=canvas.getBoundingClientRect();
    pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);
    ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects(selectable,false)[0];
    if(hit)pick(hit.object.userData.part as Part);
  }
  function cancel(){drag=undefined;}
  function onLost(e:Event){e.preventDefault();lost();}
  const observer=new ResizeObserver(draw);observer.observe(canvas);
  canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);
  canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",cancel);
  canvas.addEventListener("webglcontextlost",onLost);
  draw();
  return {
    turn(delta:number){yaw+=delta;draw();},
    mark(part:string){for(const [id,mat] of slots)mat.emissive.setHex(id===part?0x49377c:0);draw();},
    dispose(){observer.disconnect();
      canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);
      canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",cancel);
      canvas.removeEventListener("webglcontextlost",onLost);
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());invisible.dispose();
      renderer.dispose();renderer.forceContextLoss();
    },
  };
}
