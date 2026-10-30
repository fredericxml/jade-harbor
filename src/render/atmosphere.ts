import * as THREE from "three";
import { clamp } from "../core/coords";

// The game clock starts at 06:00. Colors are converted to linear space once.
const frames = [
  [0,"night", "#162b48","#34475d","#364858","#a4bdd9",.07,.13,.60],
  [4.8,"pre-dawn", "#293b60","#8c7c88","#777f8e","#acb9cf",.12,.20,.72],
  [6.2,"sunrise", "#7498b5","#efbb8c","#c4b5a4","#ffd3a0",.48,1.35,1.28],
  [8.5,"morning", "#75a6ca","#c8d9d2","#afc6c5","#fff0cf",.91,2.0,1.85],
  [12,"midday", "#699bc2","#c1d4d3","#adc5c7","#fff6de",1,2.2,1.90],
  [16.2,"late afternoon", "#7da2bd","#e1caab","#bfc1b0","#ffdfac",.90,1.95,1.72],
  [18,"sunset", "#667a9e","#e9a67a","#ab9f9c","#ffc085",.42,1.10,1.15],
  [19.2,"blue hour", "#2c4772","#8b8fa6","#687b91","#a3b4d9",.16,.24,.78],
  [21,"night", "#162b48","#34475d","#364858","#a4bdd9",.07,.13,.60],
  [24,"night", "#162b48","#34475d","#364858","#a4bdd9",.07,.13,.60],
] as const;
const keys=frames.map(([hour,phase,zenith,horizon,fog,light,daylight,sun,ambient])=>({hour,phase,
  zenith:new THREE.Color(zenith),horizon:new THREE.Color(horizon),fog:new THREE.Color(fog),light:new THREE.Color(light),daylight,sun,ambient}));
const smooth=(t:number)=>t*t*(3-2*t);
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

/** Presentation only. No world query, random clock, saved state or per-frame Color allocation. */
export class Atmosphere {
  readonly zenith=new THREE.Color(); readonly horizon=new THREE.Color(); readonly fog=new THREE.Color();
  readonly light=new THREE.Color(); readonly water=new THREE.Color(); readonly cloud=new THREE.Color();
  readonly sunDirection=new THREE.Vector3();
  private readonly rainZenith=new THREE.Color("#526b80"); private readonly rainHorizon=new THREE.Color("#a1b2b8"); private readonly rainFog=new THREE.Color("#91a7af");
  private readonly rainLight=new THREE.Color("#b8c6ce");
  private readonly rainCloud=new THREE.Color("#81929f"); private readonly clearCloud=new THREE.Color("#eee6d6");
  private readonly dayWater=new THREE.Color("#b3d3d5"); private readonly nightWater=new THREE.Color("#778fae"); private readonly rainWater=new THREE.Color("#9bb7bc");
  phase:string="midday"; rain=0; daylight=1; sun=2; ambient=1.9; night=0; fogNear=50; fogFar=400; fogDetail=100;
  reset(time:number,rain=false,distance=5) {this.rain=rain?1:0;this.update(time,rain,false,distance,0);}
  update(time:number,raining=false,nightVision=false,distance=5,dt=1/60) {
    time=Number.isFinite(time)?((time%1)+1)%1:.25;
    distance=clamp(Number.isFinite(distance)?distance:5,3,8);
    const hour=(time*24+6)%24;
    let i=0;while(i<keys.length-2&&hour>=keys[i+1].hour)i++;
    const a=keys[i],b=keys[i+1],t=smooth(clamp((hour-a.hour)/(b.hour-a.hour),0,1));
    this.phase=a.phase;
    this.rain+=((raining?1:0)-this.rain)*(1-Math.exp(-clamp(Number.isFinite(dt)?dt:0,0,.2)/2.5));
    const wet=this.rain;
    this.zenith.copy(a.zenith).lerp(b.zenith,t);this.horizon.copy(a.horizon).lerp(b.horizon,t);this.fog.copy(a.fog).lerp(b.fog,t);this.light.copy(a.light).lerp(b.light,t);
    const day=mix(a.daylight,b.daylight,t);this.night=1-smooth(clamp((day-.08)/.7,0,1));
    this.zenith.lerp(this.rainZenith,wet*.7).multiplyScalar(1-this.night*wet*.5);
    this.horizon.lerp(this.rainHorizon,wet*.65).multiplyScalar(1-this.night*wet*.5);
    this.fog.lerp(this.rainFog,wet*.7).multiplyScalar(1-this.night*wet*.5);
    this.light.lerp(this.rainLight,wet*.45);
    this.daylight=nightVision?1:day*(1-.28*wet);
    this.sun=mix(a.sun,b.sun,t)*(1-.78*wet);
    this.ambient=nightVision?2.05:mix(a.ambient,b.ambient,t)*(1-.12*wet);
    this.water.copy(this.dayWater).lerp(this.nightWater,this.night).lerp(this.rainWater,wet*.5);
    this.cloud.copy(this.clearCloud).lerp(this.rainCloud,wet).multiplyScalar(1-this.night*.58);
    this.fogNear=distance*10*(1-.12*wet);
    this.fogDetail=(distance*16+48)*(1-.15*wet);
    this.fogFar=(560+distance*24)*(1-.15*wet);
    this.sunDirection.set(Math.cos(time*Math.PI*2),Math.sin(time*Math.PI*2),.32).normalize();
  }
}

export function makeSky(atmosphere:Atmosphere) {
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,
    uniforms:{zenith:{value:atmosphere.zenith},horizon:{value:atmosphere.horizon},sunDirection:{value:atmosphere.sunDirection},sunVisibility:{value:1}},
    vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 zenith;uniform vec3 horizon;uniform vec3 sunDirection;uniform float sunVisibility;varying vec3 vDirection;
void main(){vec3 d=normalize(vDirection);vec3 c=mix(horizon,zenith,smoothstep(-.08,.72,d.y));float disk=smoothstep(.9988,.9995,dot(d,sunDirection))*sunVisibility;c+=vec3(.65,.48,.25)*disk;gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`});
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(800,24,12),material);mesh.frustumCulled=false;mesh.renderOrder=-1000;return mesh;
}
