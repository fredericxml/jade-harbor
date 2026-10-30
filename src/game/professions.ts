import { Vec3 } from '../core/coords';
import { cityNear, Structure, CityPlan } from '../world/city/plan';
import { seedNumber } from '../world/noise';
export const PROFESSIONS = {
 merchant:{label:'Merchant',offers:[0,1,2,3,4],color:'#a85843'},
 farmer:{label:'Farmer',offers:[0,2],color:'#9b905b'},
 fisherman:{label:'Fisherman',offers:[0,2],color:'#547f8d'},
 chef:{label:'Tea-house keeper',offers:[2,5],color:'#b68f63'},
 carpenter:{label:'Carpenter',offers:[6,7],color:'#93724c'},
 blacksmith:{label:'Blacksmith',offers:[1,4],color:'#526a66'},
 potter:{label:'Pottery artisan',offers:[8],color:'#ae745b'},
 lantern_maker:{label:'Lantern maker',offers:[3],color:'#b45d42'},
 guard:{label:'Guard',offers:[],color:'#58676b'},
 resident:{label:'Resident',offers:[0],color:'#9b907c'},
 scholar:{label:'Scholar',offers:[5],color:'#718d91'},
 dock_worker:{label:'Dock worker',offers:[6],color:'#6c7c89'},
 researcher:{label:'Researcher',offers:[],color:'#a99974'},
 attendant:{label:'Palace attendant',offers:[],color:'#8e5d52'},
 caretaker:{label:'Caretaker',offers:[5],color:'#71865c'},
} as const;
export type Profession=keyof typeof PROFESSIONS;
export function buildingPoint(s:Structure,v:number):Vec3 {
 const width=s.facing%2?s.z2-s.z1+1:s.x2-s.x1+1,u=Math.floor(width/2);
 const [x,z]=s.facing===0?[s.x1+u,s.z1+v]:s.facing===1?[s.x2-v,s.z1+u]:s.facing===2?[s.x2-u,s.z2-v]:[s.x1+v,s.z2-u];
 return {x:x+.5,y:(s.baseY ?? 20)+1.002,z:z+.5};
}
export function residents(seed:string, city?:CityPlan) {
 const p=city ?? cityNear(0,0,seedNumber(seed))!;
 const buildings=p.structures.filter(s=>['home','shop','shophouse','merchant','workshop','teahouse','canal-house'].includes(s.kind));
 const used=new Set<string>();
 const centers=[[0,24],[25,-16],[-25,48],[144,-80],[-175,-144],[-144,144],[-185,170],[64,50],[0,10],[64,130]];
 const names=['Mei','Wen','Qing','Bo','Lian','Jun','Tao','Yan','Shan','Yu'];
 const roles:Profession[]=['merchant','blacksmith','farmer','fisherman','chef','carpenter','potter','lantern_maker','guard','resident'];
 return roles.map((profession,i)=>{
   const [x,z]=centers[i];
   const candidates=[...buildings].sort((a,b)=>Math.hypot(a.x1-x,a.z1-z)-Math.hypot(b.x1-x,b.z1-z));
   const home=candidates.find(s=>!used.has(s.id))!;used.add(home.id);
   const hp=buildingPoint(home,1),nearby=buildings.filter(s=>s.id!==home.id).sort((a,b)=>Math.hypot(a.x1-hp.x,a.z1-hp.z)-Math.hypot(b.x1-hp.x,b.z1-hp.z));
   // V5 has larger gaps between districts. Keep the existing navigation budget:
   // a distant shopkeeper works at the ground-floor counter of their own home.
   // Legacy generators retain their exact original workplace selection.
   const work=home.id.startsWith('v5:')?nearby.find(s=>{const q=buildingPoint(s,2);return Math.abs(q.x-hp.x)+Math.abs(q.z-hp.z)<=96;})??home:nearby[0];
   return {id:`resident:${seed}:${i}`,name:`${names[i]} · ${PROFESSIONS[profession].label}`,profession,home:hp,workplace:buildingPoint(work,2)};
 });
}
