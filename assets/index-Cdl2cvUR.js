(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();function Ro(i,t,e){if(!e[t]){const[n,,s]=t.split(",").map(Number),r=Array(27).fill(null);Math.hypot(n,s)>65&&!i.edits.has(t)&&(r[0]={id:111,count:2},r[1]={id:105,count:3}),e[t]=r}return e[t]}const zi=16,ie=-64,ge=319,Ui=-4,Ni=19,fn=(i,t,e)=>`${i},${t},${e}`,Xr=18,Ht=i=>Math.floor(i/zi),me=i=>(i%zi+zi)%zi,dn=(i,t)=>`${i},${t}`,Ve=(i,t,e)=>`${i},${t},${e}`,ms=(i,t,e)=>i+zi*(e+zi*t),pn=(i,t,e)=>Math.max(t,Math.min(e,i)),Be=(i,t)=>Math.hypot(i.x-t.x,i.y-t.y,i.z-t.z),xt=i=>i&255,Kt=i=>i>>>8,oe=(i,t=0)=>i|t<<8,v={Air:0,Grass:1,Dirt:2,Stone:3,Sand:4,Water:5,Log:6,Leaves:7,Planks:8,Red:9,Roof:10,JadeRoof:11,Brick:12,Paving:13,Lantern:14,Glass:15,Bamboo:16,Blossom:17,Coal:18,Iron:19,Jade:20,Snow:21,Terracotta:22,Workbench:23,Furnace:24,Chest:25,Bed:26,Door:27,Slab:28,Stairs:29,Farmland:30,Rice:31,Tea:32,Switch:33,Wire:34,Lamp:35,Obsidian:36,Lava:37,Gold:38,Marble:39,Moss:40,Paper:41,Fence:42,Ladder:43,Flower:44,Gravel:45,Basalt:46,Ice:47,Porcelain:48,Ink:49,SculptureStone:50,RubyRoof:51,BrownRoof:52,GoldTrim:53,CreamWall:54,DarkTimber:55,TeaSign:56,MarketSign:57,Pottery:58,Crate:59,Lotus:60,NoodleSign:61,PandaSign:62,Banner:63,PandaEye:64,PandaMouth:65,Enchanter:66,Apothecary:67,Anvil:68,Hopper:69,Timer:70,Plate:71},Th=[[0,"Air","Natural","#ffffff",{solid:!1,opaque:!1,hidden:!0}],[1,"Meadow grass","Natural","#81985a"],[2,"Earth","Natural","#806247"],[3,"Mountain stone","Natural","#92978f",{hardness:2.5,tool:"pickaxe",tier:1}],[4,"River sand","Natural","#dbcd9a",{hardness:.5}],[5,"River water","Natural","#568f95",{solid:!1,opaque:!1,hardness:0}],[6,"Cedar log","Timber","#745039",{tool:"axe",hardness:1.5}],[7,"Cedar leaves","Nature","#578052",{hardness:.25}],[8,"Cedar planks","Timber","#ac8256"],[9,"Vermilion pillar","Architecture","#a84637"],[10,"Charcoal roof tile","Architecture","#455557"],[11,"Jade roof tile","Architecture","#4d8879"],[12,"Courtyard brick","Architecture","#b9ada0"],[13,"Stone paving","Architecture","#939b91"],[14,"Festival lantern","Decor","#e48a4f",{shape:"lantern",opaque:!1,solid:!1,emission:14,hardness:.3}],[15,"Lattice window","Architecture","#c1d5c5",{opaque:!1,hardness:.3}],[16,"Bamboo","Nature","#8aab59",{shape:"plant",opaque:!1,solid:!1,hardness:.4}],[17,"Cherry blossom","Nature","#e7b3b0",{hardness:.25}],[18,"Coal ore","Minerals","#747b73",{hardness:2.8,tool:"pickaxe",tier:1,drop:101}],[19,"Iron ore","Minerals","#a88f7d",{hardness:3.4,tool:"pickaxe",tier:2}],[20,"Jade ore","Minerals","#64a99a",{hardness:4,tool:"pickaxe",tier:3,drop:103}],[21,"Snow","Natural","#e4e9db"],[22,"Terracotta","Architecture","#ba7555"],[23,"Crafting bench","Stations","#b28652"],[24,"Kiln furnace","Stations","#6f7976",{hardness:3,tool:"pickaxe",tier:1}],[25,"Cedar chest","Stations","#ad7f45"],[26,"Resting mat","Stations","#b14f44",{shape:"slab",opaque:!1}],[27,"Red courtyard door","Architecture","#ac4938",{shape:"door",opaque:!1}],[28,"Paving slab","Architecture","#9ea698",{shape:"slab",opaque:!1}],[29,"Jade roof stairs","Architecture","#588b7a",{shape:"stairs",opaque:!1}],[30,"Tilled soil","Farming","#655039"],[31,"Rice crop","Farming","#adbb62",{shape:"plant",opaque:!1,solid:!1,hardness:.1,drop:108}],[32,"Tea bush","Farming","#588456",{shape:"plant",opaque:!1,solid:!1,hardness:.4,drop:109}],[33,"Jade switch","Mechanisms","#b79d60",{opaque:!1,shape:"slab"}],[34,"Qi wire","Mechanisms","#568d71",{opaque:!1,solid:!1,shape:"wire"}],[35,"Jade lamp","Mechanisms","#ded3a1"],[36,"Obsidian","Natural","#494452",{hardness:8,tool:"pickaxe",tier:3}],[37,"Lava","Natural","#eb773b",{solid:!1,opaque:!1,emission:15}],[38,"Gold ore","Minerals","#bda35b",{hardness:3.5,tool:"pickaxe",tier:3}],[39,"Carved marble","Architecture","#d5d2bc"],[40,"Moss stone","Natural","#7f8b64"],[41,"Paper screen","Architecture","#e8d9b9"],[42,"Timber railing","Architecture","#865e3e",{shape:"fence",opaque:!1}],[43,"Bamboo ladder","Architecture","#b5aa68",{shape:"ladder",opaque:!1,solid:!1}],[44,"Peony","Nature","#db9292",{shape:"plant",opaque:!1,solid:!1,hardness:.1}],[45,"Gravel","Natural","#a09c8c"],[46,"Basalt","Natural","#555d60",{tool:"pickaxe",tier:1}],[47,"Ice","Natural","#adcbd0",{opaque:!1}],[48,"White porcelain","Architecture","#eeeade",{hardness:1.2}],[49,"Ink ceramic","Architecture","#242b2b",{hardness:1.2}],[50,"Sculpture stone","Architecture","#777f77"],[51,"Ruby ceramic roof","Architecture","#a75645"],[52,"Amber ceramic roof","Architecture","#916c45"],[53,"Gilded trim","Decor","#d6b15d"],[54,"Limewashed wall","Architecture","#ddd4b9"],[55,"Dark carved timber","Timber","#493a2d"],[56,"Tea house sign","Decor","#a14534"],[57,"Market sign","Decor","#305d4c"],[58,"Glazed pottery","Decor","#bd805e",{shape:"pot",opaque:!1}],[59,"Timber crate","Decor","#a88a5d"],[60,"Lotus blossom","Nature","#dfa5b1",{shape:"plant",solid:!1,opaque:!1}],[61,"Noodle shop sign","Decor","#a64d36"],[62,"Panda Plaza sign","Decor","#4d6758"],[63,"Festival banner","Decor","#ac5340"],[64,"Panda eye ceramic","Decor","#182422"],[65,"Panda smile ceramic","Decor","#eeeade"],[66,"Jade inscription table","Workstations","#6eaa94",{hardness:3,tool:"pickaxe",tier:2,emission:3}],[67,"Apothecary kettle","Workstations","#ad8064",{hardness:2,tool:"axe"}],[68,"Artisan anvil","Workstations","#68767a",{hardness:4,tool:"pickaxe",tier:2}],[69,"Jade hopper","Mechanisms","#638e83",{hardness:3,tool:"pickaxe",tier:2}],[70,"Festival timer","Mechanisms","#b89b60",{hardness:2,tool:"pickaxe"}],[71,"Pressure plate","Mechanisms","#a89a7c",{hardness:1,opaque:!1,solid:!1,shape:"wire"}]],Mr=Th.map(([i,t,e,n,s])=>({id:i,name:t,category:e,color:n,solid:!0,opaque:!0,hardness:1,shape:"cube",...s})),ue=i=>Mr[xt(i)]??Mr[0];function Dr(i){const t=ue(i),e=Kt(i);switch(t.shape){case"slab":return[[0,e&2?.5:0,0,1,t.id===v.Bed?.3:e&1||e&2?1:.5,1]];case"door":{const n=((e&3)+(e&4?1:0))%4;return n===0?[[0,0,0,1,1,.16]]:n===1?[[0,0,0,.16,1,1]]:n===2?[[0,0,.84,1,1,1]]:[[.84,0,0,1,1,1]]}case"stairs":return[[0,0,0,1,.5,1],(e&3)===0?[0,.5,0,1,1,.5]:(e&3)===1?[0,.5,0,.5,1,1]:(e&3)===2?[0,.5,.5,1,1,1]:[.5,.5,0,1,1,1]];case"lantern":return[[.22,.15,.22,.78,.85,.78],[.33,.85,.33,.67,1,.67],[.4,0,.4,.6,.15,.6]];case"pot":return[[.2,0,.2,.8,.65,.8],[.3,.65,.3,.7,.9,.7]];case"plant":return t.id===v.Bamboo?[[.36,0,.36,.62,1,.62]]:t.id===v.Rice?[[.22,0,.2,.8,.2+e%4*.22,.8]]:[[.15,0,.15,.85,.75,.85]];case"fence":return[[.36,0,.36,.64,1,.64],[0,.35,.43,1,.5,.57],[0,.75,.43,1,.9,.57]];case"wire":return[[0,0,.4,1,.06,.6],[.4,0,0,.6,.06,1]];case"ladder":return[[.15,0,.88,.24,1,1],[.76,0,.88,.85,1,1],[.15,.2,.88,.85,.28,1],[.15,.65,.88,.85,.73,1]];default:return[[0,0,0,1,1,1]]}}const bc=i=>ue(i).emission??(xt(i)===v.Lamp&&Kt(i)&1?14:xt(i)===v.Furnace&&Kt(i)&1?12:0),ws=Mr.filter(i=>!i.hidden).map(i=>({id:i.id,name:i.name,category:i.category,color:i.color,stack:64,block:i.id}));ws.push({id:168,name:"Iron bucket",category:"Tools",color:"#c6cec5",stack:1},{id:169,name:"Water bucket",category:"Tools",color:"#81bfc1",stack:1},{id:170,name:"Lava bucket",category:"Tools",color:"#db9057",stack:1},{id:160,name:"Glass flask",category:"Brewing",color:"#b8d7d0",stack:16},{id:161,name:"Restoring infusion",category:"Brewing",color:"#e59b9b",stack:16},{id:162,name:"Swift current infusion",category:"Brewing",color:"#b0d5db",stack:16},{id:163,name:"Jade renewal infusion",category:"Brewing",color:"#82d4aa",stack:16},{id:164,name:"Ember shelter infusion",category:"Brewing",color:"#dd995f",stack:16},{id:165,name:"Tiger strength infusion",category:"Brewing",color:"#cb8b79",stack:16},{id:166,name:"Moon sight infusion",category:"Brewing",color:"#b6a2d5",stack:16},{id:167,name:"Bitter infusion",category:"Brewing",color:"#a8b856",stack:16},{id:101,name:"Coal",category:"Materials",color:"#414947",stack:64},{id:102,name:"Iron ingot",category:"Materials",color:"#c5cbc5",stack:64},{id:103,name:"Jade shard",category:"Materials",color:"#77c9a5",stack:64},{id:104,name:"Cedar stick",category:"Materials",color:"#ac845a",stack:64},{id:105,name:"Steamed dumpling",category:"Food",color:"#eee0bb",stack:64,food:7},{id:106,name:"Gold ingot",category:"Materials",color:"#dbb76b",stack:64},{id:107,name:"Rice seeds",category:"Farming",color:"#b2b777",stack:64},{id:108,name:"Harvested rice",category:"Food",color:"#dccfa3",stack:64,food:1},{id:109,name:"Tea leaves",category:"Brewing",color:"#77a276",stack:64},{id:110,name:"Cooked rice",category:"Food",color:"#f0e8d0",stack:64,food:5},{id:111,name:"Jade token",category:"Materials",color:"#8bc7ac",stack:64},{id:112,name:"Warm tea",category:"Food",color:"#bda16c",stack:16,food:3});for(const[i,t,e,n,s]of[[0,1,"Wooden","#a9885d",48],[1,2,"Stone","#9da79d",112],[2,3,"Iron","#d4d8cb",240],[3,4,"Jade","#8dd6b3",680]])for(const[r,o,a]of[[0,"pickaxe","pickaxe"],[1,"axe","axe"],[2,"shovel","shovel"],[3,"hoe","hoe"],[4,"sword","sword"]])ws.push({id:120+i*5+r,name:`${e} ${o}`,category:"Tools",color:n,stack:1,tool:a,tier:t,durability:s,damage:a==="sword"?t*2+2:t+1});for(let i=0;i<2;i++)for(let t=0;t<4;t++){const e=["helmet","tunic","greaves","boots"][t];ws.push({id:150+i*4+t,name:`${i?"Jade":"Iron"} ${e}`,category:"Equipment",color:i?"#8dd6b3":"#d4d8cb",stack:1,armorSlot:e,protection:(i?[3,8,6,3]:[2,6,5,2])[t],durability:(i?400:160)+t*20})}const Ut=i=>ws.find(t=>t.id===i),Ah=[v.Red,v.JadeRoof,v.Planks,v.Paving,v.Lantern,v.Glass,v.Bamboo,v.Workbench,133],Ce=i=>i?{...i,...i.enchants?{enchants:{...i.enchants}}:{}}:null;function us(i,t){return i.id===t.id&&i.durability===t.durability&&(i.wearCounter??0)===(t.wearCounter??0)&&Object.entries(i.enchants??{}).every(([e,n])=>t.enchants?.[e]===n)&&Object.keys(i.enchants??{}).length===Object.keys(t.enchants??{}).length}const oi={efficiency:{name:"Artisan speed",max:3,description:"+40% correct-tool mining speed per rank."},unbreaking:{name:"Enduring jade",max:3,description:"Spend durability once every rank + 1 uses."},fortune:{name:"Prosperity",max:2,description:"+1 coal or jade per rank; incompatible with Gentle touch."},silk:{name:"Gentle touch",max:1,description:"Collect coal and jade ore intact; incompatible with Prosperity."},protection:{name:"Guardian script",max:3,description:"Armor: 3% less combat damage per rank, up to 36%."},fire_protection:{name:"Ember ward",max:3,description:"Armor: 6% less fire damage per rank, up to 72%."},sharpness:{name:"Keen edge",max:3,description:"+1 melee damage per rank for swords and axes."}},Ue=(i,t)=>i?.enchants?.[t]??0;function Ta(i,t){const e=Ut(i);return e?.durability?t==="unbreaking"?!0:t==="protection"||t==="fire_protection"?!!e.armorSlot:t==="sharpness"?e.tool==="sword"||e.tool==="axe":t==="fortune"||t==="silk"?e.tool==="pickaxe":!!e.tool&&e.tool!=="sword":!1}function Ec(i){return{xp:8+(i-1)*4,jade:i}}function Rh(i,t,e){const n=i.held,s=oi[e];if(!n||!s||!Ta(n.id,e))return{ok:!1,xp:t};const r=Ue(n,e)+1,o=Ec(r);return r>s.max||t<o.xp||i.count(103)<o.jade||e==="fortune"&&Ue(n,"silk")||e==="silk"&&Ue(n,"fortune")?{ok:!1,xp:t}:(i.remove(103,o.jade),n.enchants={...n.enchants,[e]:r},{ok:!0,xp:t-o.xp})}function wc(i){const t=Ut(i);return t?.armorSlot?i>=154?103:102:[0,8,3,102,103][t?.tier??0]}function Ch(i,t){const e=i.held,n=e&&Ut(e.id)?.durability,s=e&&wc(e.id);return!e||!n||!s||e.durability===void 0||e.durability>=n||t<2||!i.count(s)?{ok:!1,xp:t}:(i.remove(s),e.durability=Math.min(n,e.durability+Math.ceil(n/4)),{ok:!0,xp:t-2})}function Tc(i,t=1){if(i.durability===void 0)return;const e=Ue(i,"unbreaking")+1,n=(i.wearCounter??0)+t;i.durability-=Math.floor(n/e),i.wearCounter=n%e}function Ph(i){if(i.enchants!==void 0&&(!i.enchants||typeof i.enchants!="object"||Array.isArray(i.enchants)))return!1;for(const[t,e]of Object.entries(i.enchants??{})){const n=t;if(!Object.hasOwn(oi,n)||!Ta(i.id,n)||!Number.isInteger(e)||e<1||e>oi[n].max)return!1}return!(Ue(i,"silk")&&Ue(i,"fortune"))&&(i.wearCounter===void 0||!!Ut(i.id)?.durability&&Number.isInteger(i.wearCounter)&&i.wearCounter>=0&&i.wearCounter<=Ue(i,"unbreaking"))}const gs={speed:{name:"Swift current",duration:60},regeneration:{name:"Jade renewal",duration:40},fire_resistance:{name:"Ember shelter",duration:60},strength:{name:"Tiger strength",duration:60},night_vision:{name:"Moon sight",duration:90},poison:{name:"Bitter infusion",duration:15}},Qa={161:"healing",162:"speed",163:"regeneration",164:"fire_resistance",165:"strength",166:"night_vision",167:"poison"};class Is{list;constructor(t=[]){this.list=t.map(e=>({...e}))}has(t){return this.list.some(e=>e.id===t&&e.remaining>0)}apply(t){const e=this.list.find(n=>n.id===t);e?e.remaining=gs[t].duration:this.list.push({id:t,remaining:gs[t].duration,pulse:0})}tick(t,e,n=!1){for(const s of this.list){const r=Math.min(s.remaining,t);for(s.remaining=Math.max(0,s.remaining-t),s.pulse+=r;s.pulse>=2;)s.pulse-=2,s.id==="regeneration"&&(e=Math.min(20,e+1)),s.id==="poison"&&!n&&e>1&&(e=Math.max(1,e-1))}return this.list=this.list.filter(s=>s.remaining>0),e}}function Lh(i){if(!Array.isArray(i)||i.length>6)return!1;const t=new Set;return i.every(e=>!e||!Object.hasOwn(gs,e.id)||t.has(e.id)?!1:(t.add(e.id),Number.isFinite(e.remaining)&&e.remaining>0&&e.remaining<=gs[e.id].duration&&Number.isFinite(e.pulse)&&e.pulse>=0&&e.pulse<2))}const ki=["helmet","tunic","greaves","boots"];class Co{slots;constructor(t){this.slots=ki.map((e,n)=>Ce(t?.[n]??null))}get protection(){return this.slots.reduce((t,e)=>t+(e?Ut(e.id)?.protection??0:0),0)}click(t,e){if(!Number.isInteger(t)||t<0||t>=ki.length)return!1;const n=e.cursor;if(n&&Ut(n.id)?.armorSlot!==ki[t])return!1;const s=this.slots[t];return this.slots[t]=n,e.cursor=s,!0}equipHeld(t){const e=t.held,n=e&&Ut(e.id)?.armorSlot;if(!e||!n)return!1;const s=ki.indexOf(n),r=this.slots[s];return this.slots[s]=e,t.slots[t.selected]=r,!0}absorb(t,e=!1){const n=this.slots.reduce((r,o)=>r+Ue(o,e?"fire_protection":"protection"),0),s=t*(1-Math.min(20,this.protection)*.04)*(1-Math.min(e?.72:.36,n*(e?.06:.03)));for(let r=0;r<4;r++){const o=this.slots[r];o?.durability!==void 0&&(Tc(o,Math.max(1,Math.floor(t/4))),o.durability<=0&&(this.slots[r]=null))}return s}}class We{equipment=new Co;slots;selected=0;cursor=null;constructor(t,e=36){this.slots=Array.from({length:e},(n,s)=>Ce(t?.[s]??null))}static creative(){const t=new We;return Ah.forEach((e,n)=>t.slots[n]={id:e,count:64,...Ut(e)?.durability?{durability:Ut(e).durability,count:1}:{}}),t}get held(){return this.slots[this.selected]}count(t){return this.slots.reduce((e,n)=>e+(n?.id===t?n.count:0),0)}add(t,e=1,n){return this.addStack({id:t,count:e,...n===void 0?{}:{durability:n}})}addStack(t){const{id:e}=t;let{count:n}=t;const s=Ut(e);if(!s||!Number.isSafeInteger(n)||n<=0)return n;const r=t.durability??s.durability,o={...Ce(t),...r===void 0?{}:{durability:r}};for(let a=0;a<this.slots.length&&n>0;a++){const l=this.slots[a];if(l&&us(l,o)&&l.count<s.stack){const c=Math.min(n,s.stack-l.count);l.count+=c,n-=c}}for(let a=0;a<this.slots.length&&n>0;a++)if(!this.slots[a]){const l=Math.min(n,s.stack);this.slots[a]={...Ce(o),count:l},n-=l}return n}remove(t,e=1){if(!Number.isSafeInteger(e)||e<=0||this.count(t)<e)return!1;for(let n=0;n<this.slots.length&&e;n++){const s=this.slots[n];if(s?.id===t){const r=Math.min(e,s.count);s.count-=r,e-=r,s.count===0&&(this.slots[n]=null)}}return!0}consumeHeld(){const t=this.held;t&&--t.count<=0&&(this.slots[this.selected]=null)}wear(){const t=this.held;return t?.durability!==void 0&&(Tc(t),t.durability<=0)?(this.slots[this.selected]=null,!0):!1}insertHeld(t){const e=Ut(t);e&&(this.slots[this.selected]={id:t,count:e.stack,...e.durability?{durability:e.durability}:{}})}click(t,e=!1,n){const s=n??this.slots,r=s[t];if(!(!Number.isInteger(t)||t<0||t>=s.length))if(e)if(!this.cursor&&r){const o=Math.ceil(r.count/2);this.cursor={...Ce(r),count:o},r.count-=o,r.count||(s[t]=null)}else this.cursor&&(!r||us(r,this.cursor)&&r.count<(Ut(r.id)?.stack??64))&&(r?r.count++:s[t]={...Ce(this.cursor),count:1},--this.cursor.count===0&&(this.cursor=null));else if(r&&this.cursor&&us(r,this.cursor)){const o=Math.min(this.cursor.count,(Ut(r.id)?.stack??64)-r.count);r.count+=o,this.cursor.count-=o,this.cursor.count||(this.cursor=null)}else s[t]=this.cursor,this.cursor=r}move(t,e,n=this.slots,s=this.slots){if(!Number.isInteger(t)||t<0||t>=n.length||!Number.isInteger(e)||e<0||e>=s.length||n===s&&t===e)return!1;const r=n[t];if(!r||!Ut(r.id)||!Number.isSafeInteger(r.count)||r.count<=0)return!1;const o=s[e];if(o&&us(r,o)){const a=Ut(o.id)?.stack??64,l=Math.min(r.count,Math.max(0,a-o.count));if(l<=0)return!1;const c=Ce(o);c.count+=l;const u=Ce(r);u.count-=l,s[e]=c,n[t]=u.count?u:null}else n[t]=Ce(o),s[e]=Ce(r);return!0}settleCursor(){if(this.cursor){const t=this.cursor,e=this.addStack(t);this.cursor=e?{...Ce(t),count:e}:null}return!this.cursor}transaction(t,e){const n=new Map;for(const[r,o]of[...t,e])if(!Ut(r)||!Number.isSafeInteger(o)||o<=0||o>1e6)return!1;for(const[r,o]of t)n.set(r,(n.get(r)??0)+o);if([...n].some(([r,o])=>this.count(r)<o))return!1;const s=new We(this.slots);for(const[r,o]of n)if(!s.remove(r,o))return!1;return s.add(...e)?!1:(this.slots=s.slots,!0)}}const Ir=[{id:"hopper",name:"Jade hopper",cost:[[102,5],[25,1]],output:[69,1],station:"bench"},{id:"timer",name:"Festival timer",cost:[[102,2],[103,1],[3,3]],output:[70,1],station:"bench"},{id:"plate",name:"Pressure plate",cost:[[3,2]],output:[71,1]},{id:"bucket",name:"Iron bucket",cost:[[102,3]],output:[168,1],station:"bench"},{id:"inscription",name:"Jade inscription table",cost:[[39,4],[103,3],[8,4]],output:[66,1],station:"bench"},{id:"apothecary",name:"Apothecary kettle",cost:[[8,4],[15,2],[102,1]],output:[67,1],station:"bench"},{id:"anvil",name:"Artisan anvil",cost:[[102,6],[3,3]],output:[68,1],station:"bench"},{id:"flask",name:"Glass flasks",cost:[[15,3]],output:[160,3],station:"bench"},{id:"planks",name:"Cedar planks",cost:[[6,1]],output:[8,4]},{id:"sticks",name:"Cedar sticks",cost:[[8,2]],output:[104,4]},{id:"bench",name:"Crafting bench",cost:[[8,4]],output:[23,1]},{id:"chest",name:"Cedar chest",cost:[[8,8]],output:[25,1],station:"bench"},{id:"kiln",name:"Kiln furnace",cost:[[3,8]],output:[24,1],station:"bench"},{id:"lantern",name:"Festival lantern",cost:[[16,2],[101,1]],output:[14,4],station:"bench"},{id:"roof",name:"Jade roof tiles",cost:[[3,2],[103,1]],output:[11,8],station:"bench"},{id:"red",name:"Vermilion pillars",cost:[[8,4],[44,1]],output:[9,4]},{id:"door",name:"Courtyard door",cost:[[8,6]],output:[27,2],station:"bench"},{id:"slab",name:"Stone slabs",cost:[[3,3]],output:[28,6]},{id:"stairs",name:"Jade roof stairs",cost:[[11,6]],output:[29,4],station:"bench"},{id:"fence",name:"Timber railing",cost:[[8,4],[104,2]],output:[42,4]},{id:"ladder",name:"Bamboo ladder",cost:[[16,4]],output:[43,4]},{id:"bed",name:"Resting mat",cost:[[8,3],[16,3]],output:[26,1],station:"bench"},{id:"switch",name:"Jade switch",cost:[[3,1],[104,1]],output:[33,1]},{id:"wire",name:"Qi wire",cost:[[103,1],[102,1]],output:[34,8],station:"bench"},{id:"lamp",name:"Jade lamp",cost:[[103,1],[14,1]],output:[35,1],station:"bench"},{id:"tea",name:"Warm tea",cost:[[109,3]],output:[112,1]},{id:"dumpling",name:"Steamed dumplings",cost:[[110,2],[109,1]],output:[105,2],station:"bench"}];for(let i=0;i<4;i++)for(let t=0;t<5;t++){const e=120+i*5+t;Ir.push({id:`tool-${e}`,name:Ut(e).name,cost:[[104,2],[[8,3,102,103][i],t===2?1:t===3||t===4?2:3]],output:[e,1],station:"bench"})}for(let i=0;i<2;i++)for(let t=0;t<4;t++){const e=150+i*4+t;Ir.push({id:`armor-${e}`,name:Ut(e).name,cost:[[i?103:102,[5,8,7,4][t]]],output:[e,1],station:"bench"})}function Aa(i){let t=2166136261;for(const e of i)t=Math.imul(t^e.charCodeAt(0),16777619);return t>>>0}function ne(i,t,e,n=0){let s=Math.imul(i|0,374761393)^Math.imul(t|0,668265263)^Math.imul(n|0,1274126177)^e;return s=Math.imul(s^s>>>13,1274126177),((s^s>>>16)>>>0)/4294967295}const ps=i=>i*i*(3-2*i);function Oi(i,t,e){const n=Math.floor(i),s=Math.floor(t),r=ps(i-n),o=ps(t-s);return(ne(n,s,e)*(1-r)+ne(n+1,s,e)*r)*(1-o)+(ne(n,s+1,e)*(1-r)+ne(n+1,s+1,e)*r)*o}function Dh(i,t,e){return Oi(i,t,e)*.57+Oi(i*2,t*2,e+17)*.28+Oi(i*4,t*4,e+29)*.15}function ts(i,t,e,n){const s=Math.floor(i),r=Math.floor(t),o=Math.floor(e),a=ps(i-s),l=ps(t-r),c=ps(e-o);let u=0;for(let h=0;h<2;h++)for(let d=0;d<2;d++)for(let f=0;f<2;f++)u+=ne(s+f,o+d,n,r+h)*(f?a:1-a)*(h?l:1-l)*(d?c:1-c);return u}const Bi={105:161,109:162,103:163,[v.Basalt]:164,106:165,[v.Blossom]:166,101:167},Ih=()=>({slots:[null,null,null,null],progress:0,fuel:0,recipe:0});function Ac(i,t,e,n){for(let s=-4;s<=4;s++)for(let r=-4;r<=4;r++)for(let o=-1;o<=1;o++)if(i.loaded(t+s,n+r)&&xt(i.get(t+s,e+o,n+r))===v.Water)return!0;return!1}function Uh(i,t,e){const[n,s,r,o]=i.slots,a=s&&Bi[s.id];if(!n||n.id!==160||!a||o&&(o.id!==a||o.count>=16))return i.progress=0,i.recipe=0,!1;if(i.recipe!==s.id&&(i.recipe=s.id,i.progress=0),!e||(i.fuel<=0&&r?.id===v.Bamboo&&(i.fuel=12,--r.count===0&&(i.slots[2]=null)),i.fuel<=0))return!1;const l=Math.min(t,i.fuel);return i.fuel=Math.max(0,i.fuel-l),i.progress+=l,i.progress+1e-7<6?!1:(i.progress=Math.max(0,i.progress-6),--n.count===0&&(i.slots[0]=null),--s.count===0&&(i.slots[1]=null),o?o.count++:i.slots[3]={id:a,count:1},!0)}const Ra={[v.Iron]:102,[v.Gold]:106,108:110,[v.Sand]:v.Glass,[v.Dirt]:v.Terracotta},Sr={101:32,[v.Log]:8,[v.Planks]:8,[v.Bamboo]:2,104:3};function Nh(i,t){const e=i.slots[0],n=i.slots[1],s=i.slots[2],r=e?Ra[e.id]:void 0,o=!!r&&(!s||s.id===r&&s.count<64);if(i.burn<=0&&o&&n&&Sr[n.id]&&(i.burn=Sr[n.id],--n.count<=0&&(i.slots[1]=null)),i.burn>0)if(i.burn=Math.max(0,i.burn-t),o&&e){if(i.recipe!==e.id&&(i.progress=0,i.recipe=e.id),i.progress+=t,i.progress>=4)return i.progress-=4,s?s.count++:i.slots[2]={id:r,count:1},--e.count===0&&(i.slots[0]=null),!0}else i.progress=0;else i.progress=0;return!1}const gi=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],tl=new Set([v.Rice,v.Tea,v.Switch,v.Wire,v.Lamp,v.Door,v.Lantern,v.Furnace,v.Hopper,v.Timer,v.Plate]);class el{constructor(t,e){this.world=t,e&&(this.furnaces=e.furnaces??{},this.brewers=structuredClone(e.brewers??{}),this.weather=String(e.weather??"clear"),this.weatherTimer=Number(e.weatherTimer??180)),this.elapsed=Number(e?.elapsed??0),this.tickNo=Number(e?.tickNo??0),this.cropTimer=Number(e?.cropTimer??0),this.automation=new Oh(t,this.furnaces,e?.hoppers);for(const n of e?.pendingTicks??[])this.queue.add(n);for(const[n,s]of t.edits)if([v.Water,v.Lava,v.Sand,v.Gravel].includes(xt(s))){const[r,o,a]=n.split(",").map(Number);this.changed(r,o,a)}}automation;power=new Map;occupants=[];furnaces={};brewers={};specials=new Map;indexed=new Map;queue=new Set;radius=64;elapsed=0;weather="clear";weatherTimer=180;cropTimer=0;tickNo=0;indexChunks(){for(const[t,e]of this.world.chunks)if(this.indexed.get(t)!==e.revision){this.indexed.set(t,e.revision);for(const n of this.specials.keys()){const[s,,r]=n.split(",").map(Number);Ht(s)===e.cx&&Ht(r)===e.cz&&this.specials.delete(n)}for(const[n,s]of e.blocks.sections)for(let r=0;r<4096&&!(typeof s.values=="number"&&!tl.has(xt(s.values)));r++){const o=s.get(r);if(!tl.has(xt(o)))continue;const a=n*16+Math.floor(r/256),l=Math.floor(r%256/16),c=r%16,u=Ve(e.cx*16+c,a,e.cz*16+l);this.specials.set(u,o),xt(o)===v.Hopper&&this.automation.hopper(u)}}for(const t of this.indexed.keys())if(!this.world.chunks.has(t)){this.indexed.delete(t);const[e,n]=t.split(",").map(Number);for(const s of this.specials.keys()){const[r,,o]=s.split(",").map(Number);Ht(r)===e&&Ht(o)===n&&this.specials.delete(s)}}}changed(t,e,n){for(const[s,r,o]of[[0,0,0],...gi])this.queue.add(Ve(t+s,e+r,n+o))}furnace(t){return this.furnaces[t]??={slots:[null,null,null],burn:0,progress:0,recipe:0}}brewer(t){return this.brewers[t]??=Ih()}tick(t,e,n=!0){this.elapsed+=t,this.tickNo++,this.weatherTimer-=t,this.weatherTimer<=0&&(this.weather=this.weather==="clear"?"rain":"clear",this.weatherTimer=this.weather==="rain"?90:180),this.tickNo%10===0&&this.indexChunks();for(const[s,r]of Object.entries(this.brewers)){const[o,a,l]=s.split(",").map(Number);this.world.loaded(o,l)&&Math.hypot(o-e.x,l-e.z)<=this.radius&&xt(this.world.get(o,a,l))===v.Apothecary&&Uh(r,t,Ac(this.world,o,a,l))}for(const[s,r]of Object.entries(this.furnaces)){const[o,a,l]=s.split(",").map(Number);if(this.world.loaded(o,l)&&Math.hypot(o-e.x,l-e.z)<=this.radius&&xt(this.world.get(o,a,l))===v.Furnace){Nh(r,t);const c=oe(v.Furnace,r.burn>0?1:0);this.world.get(o,a,l)!==c&&this.world.set(o,a,l,c)}}if(this.tickNo%4===0&&(this.circuits(n?e:void 0),this.updates(64)),this.automation.tick(t,e,this.radius,(s,r,o)=>this.powered(s,r,o)),this.cropTimer+=t,this.cropTimer>=12){this.cropTimer=0;for(const[s,r]of this.specials){if(xt(r)!==v.Rice||Kt(r)>=3)continue;const[o,a,l]=s.split(",").map(Number);if(Math.hypot(o-e.x,l-e.z)>this.radius)continue;let c=this.weather==="rain";for(let u=-4;u<=4;u++)for(let h=-4;h<=4;h++)xt(this.world.get(o+u,a-1,l+h))===v.Water&&(c=!0);c&&this.world.get(o,a+1,l)===0&&ne(o,l,Math.floor(this.elapsed))>.3&&this.world.set(o,a,l,oe(v.Rice,Kt(r)+1))}}}powered(t,e,n){return gi.some(([s,r,o])=>{const a=this.world.get(t+s,e+r,n+o),l=xt(a);return l===v.Wire?Kt(a)>0:[v.Switch,v.Timer,v.Plate].includes(l)&&!!(Kt(a)&1)})}circuits(t){for(const[s,r]of this.specials){const[o,a,l]=s.split(",").map(Number),c=this.world.get(o,a,l),u=xt(c);if(u!==v.Timer&&u!==v.Plate)continue;let h=!1;u===v.Timer?h=!!(Kt(c)&2)&&Math.floor(this.elapsed/[.5,1,2,4][Kt(c)>>2&3])%2===0:h=[...t?[t]:[],...this.occupants].some(f=>Math.abs(f.x-o-.5)<.8&&Math.abs(f.z-l-.5)<.8&&f.y>=a-.1&&f.y<=a+1.8);const d=oe(u,Kt(c)&-2|(h?1:0));d!==c&&this.world.set(o,a,l,d),this.specials.set(s,d)}const e=new Map,n=[];for(const[s]of this.specials){const r=this.world.get(...s.split(",").map(Number));[v.Switch,v.Timer,v.Plate].includes(xt(r))&&Kt(r)&1&&(e.set(s,15),n.push([s,15]))}for(let s=0;s<n.length&&s<4096;s++){const[r,o]=n[s];if(o<=1)continue;const[a,l,c]=r.split(",").map(Number);for(const[u,h,d]of gi){const f=Ve(a+u,l+h,c+d),g=this.world.get(a+u,l+h,c+d);xt(g)!==v.Wire||o-1<=(e.get(f)??0)||(e.set(f,o-1),n.push([f,o-1]))}}this.power=e;for(const[s,r]of this.specials){const[o,a,l]=s.split(",").map(Number),c=this.world.get(o,a,l),u=xt(c);if(![v.Wire,v.Door,v.Lamp].includes(u))continue;const[h,d,f]=s.split(",").map(Number);let g=e.get(s)??0,_=!1;for(const[p,S,w]of gi){const y=Ve(h+p,d+S,f+w),A=xt(this.world.get(h+p,d+S,f+w));[v.Wire,v.Switch,v.Timer,v.Plate].includes(A)&&(_=!0),g=Math.max(g,e.get(y)??0)}let m=c;if(u===v.Wire&&(m=oe(u,e.get(s)??0)),u===v.Lamp&&(m=oe(u,g>0?1:0)),u===v.Door){const p=d+(Kt(c)&8?-1:1),S=this.world.get(h,p,f);if(xt(S)===v.Door)for(const[w,y,A]of gi){const R=Ve(h+w,p+y,f+A),P=xt(this.world.get(h+w,p+y,f+A));[v.Wire,v.Switch,v.Timer,v.Plate].includes(P)&&(_=!0),g=Math.max(g,e.get(R)??0)}_&&(m=oe(u,g>0?Kt(c)|4:Kt(c)&-5))}m!==c&&(this.world.set(h,d,f,m),this.specials.set(s,m))}}updates(t){if(!Number.isFinite(t)||t<=0)return;const e=[];for(const s of this.queue)if(e.push(s),e.length>=t)break;const n=new Set;for(const s of e){if(this.queue.delete(s),n.has(s)){this.queue.add(s);continue}const[r,o,a]=s.split(",").map(Number);if(o<=ie||o>ge)continue;if(!this.world.loaded(r,a)){this.queue.add(s);continue}const l=this.world.get(r,o,a),c=xt(l),u=this.world.get(r,o-1,a);if((c===v.Sand||c===v.Gravel)&&o>ie+1&&(u===0||xt(u)===v.Water)){this.world.set(r,o,a,0),this.world.set(r,o-1,a,l),n.add(Ve(r,o-1,a)),this.changed(r,o-1,a),this.changed(r,o,a);continue}if(c===v.Water||c===v.Lava){let h=!1;for(const[f,g,_]of gi)xt(this.world.get(r+f,o+g,a+_))===(c===v.Water?v.Lava:v.Water)&&(c===v.Lava?(this.world.set(r,o,a,v.Obsidian),h=!0):this.world.set(r+f,o+g,a+_,v.Stone));if(h)continue;const d=Kt(l);if(d>0){let f=8;xt(this.world.get(r,o+1,a))===c&&(f=1);for(const[g,,_]of[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){const m=this.world.get(r+g,o,a+_);xt(m)===c&&(f=Math.min(f,Kt(m)+1))}if(f>7){this.world.set(r,o,a,0),this.changed(r,o,a);continue}if(f!==d){this.world.set(r,o,a,oe(c,f)),this.changed(r,o,a);continue}}if(o>ie+1&&u===0)this.world.set(r,o-1,a,oe(c,1)),this.changed(r,o-1,a);else if(ue(u).solid&&d<7)for(const[f,g]of[[1,0],[-1,0],[0,1],[0,-1]])this.world.get(r+f,o,a+g)===0&&this.world.loaded(r+f,a+g)&&(this.world.set(r+f,o,a+g,oe(c,d+1)),this.changed(r+f,o,a+g))}}}serialize(){return{furnaces:structuredClone(this.furnaces),brewers:structuredClone(this.brewers),hoppers:structuredClone(this.automation.hoppers),elapsed:this.elapsed,tickNo:this.tickNo,cropTimer:this.cropTimer,pendingTicks:[...this.queue],weather:this.weather,weatherTimer:this.weatherTimer}}}const kh=()=>({slots:Array(5).fill(null),cooldown:0}),Fh=["Down","North","East","South","West"],zh=[[0,-1,0],[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]];function nl(i,t){if(i.slots===t.slots)return!1;for(let e=0;e<i.slots.length;e++){const n=i.slots[e];if(!(!n||!i.extracts(e)))for(let s=0;s<t.slots.length;s++){if(!t.accepts(n.id,s))continue;const r=new We([t.slots[s]],1);if(!r.addStack({...n,count:1}))return t.slots[s]=r.slots[0],--n.count===0&&(i.slots[e]=null),!0}}return!1}class Oh{constructor(t,e,n){this.world=t,this.furnaces=e,this.hoppers=structuredClone(n??{})}hoppers={};containers={};drops=[];cursor=0;hopper(t){return this.hoppers[t]??=kh()}storage(t,e,n,s,r=!0){if(!this.world.loaded(t,n))return null;const o=xt(this.world.get(t,e,n)),a=Ve(t,e,n);if(o===v.Hopper)return{slots:this.hopper(a).slots,accepts:()=>!0,extracts:()=>!0};if(o===v.Chest)return{slots:Ro(this.world,a,this.containers),accepts:()=>!0,extracts:()=>!0};if(o===v.Furnace){const l=this.furnaces[a]??(r?this.furnaces[a]={slots:[null,null,null],burn:0,progress:0,recipe:0}:void 0);return l?{slots:l.slots,accepts:(c,u)=>s>e?u===0&&!!Ra[c]:u===1&&!!Sr[c],extracts:c=>c===2}:null}return null}tick(t,e,n,s){const r=Object.keys(this.hoppers).sort();for(let o=0;o<Math.min(64,r.length);o++){const a=r[(this.cursor+o)%r.length],l=this.hoppers[a],[c,u,h]=a.split(",").map(Number);if(!this.world.loaded(c,h)||Math.hypot(c-e.x,h-e.z)>n||xt(this.world.get(c,u,h))!==v.Hopper||(l.cooldown=Math.max(0,l.cooldown-t),l.cooldown>1e-8||s(c,u,h)))continue;l.cooldown=.4;const d={slots:l.slots,accepts:()=>!0,extracts:()=>!0},[f,g,_]=zh[Kt(this.world.get(c,u,h))%5],m=this.storage(c+f,u+g,h+_,u);m&&nl(d,m);const p=this.storage(c,u+1,h,u);if(p)nl(p,d);else for(const S of this.drops){if(S.stack.count<=0||Math.abs(S.position.x-c-.5)>.7||Math.abs(S.position.z-h-.5)>.7||S.position.y<u+.7||S.position.y>u+2)continue;const w=new We(l.slots,5),y=w.addStack(S.stack);y!==S.stack.count&&(l.slots=w.slots,S.stack.count=y);break}}this.cursor=(this.cursor+64)%Math.max(1,r.length)}}function en(i,t,e=1.75,n=.29){for(let s=Math.floor(t.y+.001);s<=Math.floor(t.y+e-.001);s++)for(let r=Math.floor(t.z-n);r<=Math.floor(t.z+n);r++)for(let o=Math.floor(t.x-n);o<=Math.floor(t.x+n);o++){const a=i.get(o,s,r);if(ue(a).solid){for(const[l,c,u,h,d,f]of Dr(a))if(t.x+n>o+l+.001&&t.x-n<o+h-.001&&t.y+e>s+c+.001&&t.y<s+d-.001&&t.z+n>r+u+.001&&t.z-n<r+f-.001)return!0}}return!1}function Rc(i,t,e,n=!1,s=1.75){const r=t.position,o=t.velocity;if(i.loaded&&!i.loaded(r.x,r.z))return 0;let a=0;const l=t.grounded&&!t.flying&&!n;let c=!1;t.grounded=!1;const u=Math.max(1,Math.ceil(Math.max(Math.abs(o.x),Math.abs(o.y),Math.abs(o.z))*e/.18));for(let h=0;h<u;h++)for(const d of["x","z","y"]){const f=o[d]*e/u,g=r[d];if(r[d]+=f,d!=="y"&&i.loaded&&!i.loaded(r.x,r.z)){r[d]=g,o[d]=0;continue}if(!n&&en(i,r,s)){if(d!=="y"&&l&&!c&&f!==0){const _=r.y;r.y+=.501;const m=!en(i,r,s),p=en(i,{...r,y:r.y-.04},s);if(m&&p){c=!0,t.fallStart=r.y;continue}r.y=_}r[d]=g,d==="y"&&f<0&&(t.grounded=!0,a=Math.max(a,t.fallStart-r.y),t.fallStart=r.y),o[d]=0}}return(o.y>=0||t.grounded)&&(t.fallStart=r.y),a}function ur(i,t,e,n,s=v.Stone){if(!ue(s).solid)return!1;for(const[r,o,a,l,c,u]of Dr(s))if(i.x+.29>t+r+.001&&i.x-.29<t+l-.001&&i.y+1.75>e+o+.001&&i.y<e+c-.001&&i.z+.29>n+a+.001&&i.z-.29<n+u-.001)return!0;return!1}function Bh(i,t){return xt(i.get(t.x,t.y+.6,t.z))===v.Water}function Hh(i,t){for(let e=0;e<=3;e++)for(let n=-e;n<=e;n++)for(let s=-e;s<=e;s++){if(e>0&&Math.max(Math.abs(n),Math.abs(s))!==e)continue;const r=Math.floor(t.x)+n+.5,o=Math.floor(t.z)+s+.5;if(!(i.loaded&&!i.loaded(r,o)))for(let a=0;a<=12;a++)for(const l of a===0?[1]:[1,-1]){const c=Math.floor(t.y)+a*l+.01;if(c<=ie+1||c+1.75>=ge)continue;const u={x:r,y:c,z:o};if(en(i,u)||!en(i,{...u,y:c-.18}))continue;const h=xt(i.get(r,c,o)),d=xt(i.get(r,c+1,o));if(!(h===v.Lava||h===v.Water||d===v.Lava||d===v.Water))return u}}return null}function Gh(i,t,e,n,s=!1){const r=t.held;if(!r||![168,169,170].includes(r.id))return!1;if(r.id===168){const c=xt(e.value);return![v.Water,v.Lava].includes(c)||Kt(e.value)!==0||!i.set(e.x,e.y,e.z,0)?!1:(t.slots[t.selected]={id:c===v.Water?169:170,count:1},!0)}const o=e.x+e.normal.x,a=e.y+e.normal.y,l=e.z+e.normal.z;return a<=ie||a>ge||!i.loaded(o,l)||i.get(o,a,l)!==0||ur(n,o,a,l)||!i.set(o,a,l,r.id===169?v.Water:v.Lava)?!1:(s||(t.slots[t.selected]={id:168,count:1}),!0)}const Us='<svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true"><path fill="currentColor" d="M7 1h10v3H7zM5 6h14l3 5v11l-4 4H6l-4-4V11zM7 28h10v2H7zM11 30h2v2h-2z"/><path d="M9 7v18m6-18V7" stroke="#f2dba8" stroke-width="1" fill="none"/></svg>',Vh=new Set(["slot","container-slot","furnace-slot","grid-slot","brew-slot","hopper-slot"]),Wh=new Set(["slot","hotbar-select","container-slot"]),Xh=["All","Architecture","Natural","Timber","Nature","Decor","Stations","Workstations","Farming","Mechanisms","Tools","Equipment","Brewing","Food","Materials","Minerals"],$h=[["W A S D","Walk"],["Mouse","Look around"],["Space","Jump / swim up"],["Shift","Sprint"],["C / Ctrl","Crouch / fly down"],["Double Space / G","Toggle creative flight"],["Left click","Hold to mine / attack"],["Right click / F","Place / use / interact"],["E","Inventory & collection"],["1–9 / Scroll","Select hotbar slot"],["Q","Drop selected item"],["F3","Performance details"],["Esc","Toggle pause / close dialog"]],Qt=i=>String(i).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),ii=i=>{const t=Ut(i);if(!t)return"";const e=a=>`<svg viewBox="0 0 32 32" aria-hidden="true">${a}</svg>`;let n="";if(t.tool){const a=t.tool==="sword"?'<path fill="var(--item)" d="M23 2l6 1-1 6-14 14-5-5z"/><path fill="#b29557" d="M6 17l10 10 3-3L9 14z"/>':t.tool==="shovel"?'<path fill="var(--item)" d="M19 3l10 10-8 8-9-9z"/>':t.tool==="axe"?'<path fill="var(--item)" d="M16 3l12 2-1 12-10-1-4-5z"/>':t.tool==="hoe"?'<path fill="var(--item)" d="M7 4h19v7h-6V8H7z"/>':'<path fill="var(--item)" d="M4 7l5-4h16l5 5-2 8-4-7H10l-5 4z"/>';n=e(`<path fill="#96704d" d="M20 9l4 4L8 30l-5-4z"/>${a}`)}else t.armorSlot?n=e(`<g fill="var(--item)">${{helmet:'<path d="M5 17V12a11 11 0 0122 0v5l-4 1v8h-6v-8h-2v8H9v-8z"/><path fill="#fff7" d="M8 12h16v3H8z"/>',tunic:'<path d="M9 4l7 4 7-4 7 8-6 6-3-3v14H11V15l-3 3-6-6z"/><path fill="#fff7" d="M12 10h8v3h-8z"/>',greaves:'<path d="M7 3h18v10l-3 16h-6l-1-13-2 13H7L5 13z"/><path fill="#fff7" d="M8 7h14v3H8z"/>',boots:'<path d="M5 4h9v17l5 2v5H3v-7h2zm14 0h8v17l3 2v5H17v-6h2z"/><path fill="#fff7" d="M6 6h6v3H6z"/>'}[t.armorSlot]}</g>`):i>=160&&i<=167?n=e('<path fill="#7a6648" d="M12 2h8v4h-8z"/><path fill="#b5d0c9" d="M11 6h10v7l6 7v9H5v-9l6-7z"/><path fill="var(--item)" d="M8 21h16v5H8z"/>'):i>=168&&i<=170?n=e('<path fill="#b7c3bb" d="M5 11h22l-4 18H9z"/><path fill="none" stroke="#738d83" stroke-width="3" d="M9 12V6q7-8 14 0v6"/><path fill="var(--item)" d="M9 14h14l-2 11H11z"/>'):t.block===void 0&&(i===104||i===107||i===109?n=e(`<g fill="var(--item)">${i===104?'<path d="M9 27L23 5l3 2-14 22z"/>':i===107?'<path d="M14 29V9M14 18Q6 5 5 13q0 8 9 5M14 23q14-15 13-6-1 8-13 6" fill="none" stroke="var(--item)" stroke-width="4"/>':'<path d="M15 28V9M14 13Q2 6 4 17q4 6 10-4M17 20q13-17 13-6-1 7-13 6"/>'}</g>`):i===105||i===108||i===110||i===112?i===112?n=e('<path fill="#e6ddbe" d="M5 8h20v16q0 6-10 6T5 24z"/><path fill="var(--item)" d="M7 12h16v11q0 4-8 4t-8-4z"/><path fill="none" stroke="#947956" stroke-width="3" d="M24 11q12-2 4 11h-4"/>'):i===105?n=e('<path fill="var(--item)" d="M3 21Q5 6 16 8q12-1 13 13Q16 33 3 21z"/><path fill="none" stroke="#ab9779" stroke-width="2" d="M8 19l2-4 3 3 3-5 3 5 3-3 2 4"/>'):i===108?n=e('<g fill="var(--item)"><ellipse cx="8" cy="14" rx="4" ry="8" transform="rotate(-20 8 14)"/><ellipse cx="17" cy="11" rx="4" ry="8" transform="rotate(15 17 11)"/><ellipse cx="23" cy="21" rx="4" ry="8" transform="rotate(35 23 21)"/></g>'):n=e('<path fill="#a88a60" d="M3 17h26l-5 12H8z"/><path fill="#fff6de" d="M5 16q0-11 11-11t11 11z"/><path fill="var(--item)" d="M7 16q1-9 9-9t9 9z"/><path stroke="#b19e7e" stroke-width="1.5" d="M8 14h16"/>'):n=e(i===102||i===106?'<path fill="var(--item)" d="M4 20l6-13h12l6 13-4 8H8z"/><path fill="#fff7" d="M10 9h12l-3 7H7z"/>':i===111?'<circle cx="16" cy="16" r="13" fill="var(--item)"/><circle cx="16" cy="16" r="9" fill="none" stroke="#e9dec0" stroke-width="2"/><path fill="#e9dec0" d="M16 7l5 9-5 9-5-9z"/>':i===101?'<path fill="#414947" d="M3 24L8 7l9 3 5-8 8 16-6 11H8z"/><path fill="#849087" d="M8 7l9 3-5 12z"/>':'<path fill="var(--item)" d="M16 2l11 8 1 13-12 7L4 23 5 10z"/><path fill="#fff7" d="M16 2l-4 13 4 15 3-16z"/>'));const s=(t.block??0)*3+1,r=t.block!==void 0,o=r?`;--atlas-x:${s%16};--atlas-y:${Math.floor(s/16)}`:"";return`<span class="item-icon ${r?"block-texture":"tool"}" data-item-id="${i}" role="img" aria-label="${Qt(t.name)}" style="--item:${t.color}${o}">${n}</span>`},He=(i,t,e="slot",n={})=>{const s=i?.enchants?Object.entries(i.enchants).map(([c,u])=>`${oi[c].name} ${u}`).join(", "):"",r=i?Qt(`${Ut(i.id)?.name}${s?` · ${s}`:""}`):"Empty slot",o=`slot${n.className?` ${n.className}`:""}`,a=n.ariaPressed===void 0?"":` aria-pressed="${n.ariaPressed}"`,l=i?.durability===void 0?"":`<i class="durability" style="width:${i.durability/(Ut(i.id)?.durability??1)*80}%"></i>`;return`<button class="${o}" data-action="${e}" data-index="${t}" title="${r}" draggable="${!!i}"${a}>${i?ii(i.id):""}${i&&i.count>1?`<b>${i.count}</b>`:""}${l}</button>`};class qh{root;overlay;hud;toastEl;saveStatusEl;screen="menu";onAction;onMove;onChange;onSearch;constructor(t){this.root=t,t.innerHTML=['<canvas id="game" aria-label="Jade Harbor voxel world"></canvas>','<div id="vignette"></div>','<div id="hud" hidden></div>','<div id="overlay"></div>','<div id="toast" role="status"></div>','<div id="save-status" aria-live="polite"></div>'].join(""),this.overlay=t.querySelector("#overlay"),this.hud=t.querySelector("#hud"),this.toastEl=t.querySelector("#toast"),this.saveStatusEl=t.querySelector("#save-status"),this.overlay.addEventListener("click",s=>{const r=s.target.closest("[data-action]");r&&this.onAction?.(r.dataset.action,r,s)}),this.overlay.addEventListener("contextmenu",s=>{const r=s.target.closest("[data-action]"),o=r?.dataset.action;!r||!o||!Vh.has(o)||(s.preventDefault(),this.onAction?.(o,r,s))}),this.overlay.addEventListener("input",s=>{const r=s.target;r.id==="search"?this.onSearch?.():this.onChange?.(r)}),this.overlay.addEventListener("change",s=>this.onChange?.(s.target));let e=null;const n=s=>Wh.has(s);this.overlay.addEventListener("dragstart",s=>{const r=s.target.closest("[data-index]"),o=r?.dataset.action??"",a=Number(r?.dataset.index);if(!r||!n(o)||!Number.isInteger(a)||this.screen!=="inventory"&&this.screen!=="chest"||r.getAttribute("draggable")!=="true"){e=null,s.preventDefault();return}e={action:o,index:a,screen:this.screen},s.dataTransfer&&(s.dataTransfer.effectAllowed="move",s.dataTransfer.setData("text/plain",`${o}:${a}`))}),this.overlay.addEventListener("dragover",s=>{const r=s.target.closest("[data-index]");e&&e.screen===this.screen&&r&&n(r.dataset.action??"")&&(s.preventDefault(),s.dataTransfer&&(s.dataTransfer.dropEffect="move"))}),this.overlay.addEventListener("drop",s=>{const r=e;e=null;const o=s.target.closest("[data-index]");if(!r||r.screen!==this.screen||!o||!n(o.dataset.action??""))return;const a=Number(o.dataset.index);Number.isInteger(a)&&(s.preventDefault(),this.onMove?.(r.action,r.index,o.dataset.action,a))}),this.overlay.addEventListener("dragend",()=>{e=null})}show(t,e=""){this.screen=t,this.overlay.className=t==="menu"||t==="create"?"home":t==="none"?"hidden":"modal-wrap",this.overlay.innerHTML=e,this.hud.hidden=["menu","create"].includes(t)}toast(t){this.toastEl.textContent=t,this.toastEl.classList.add("visible"),setTimeout(()=>this.toastEl.classList.remove("visible"),3200)}saveStatus(t){this.saveStatusEl.textContent=t}worldProcessing(t,e){const n=Array.from(this.overlay.querySelectorAll(".world-card")).find(a=>a.dataset.worldId===t);if(!n)return;const s=!!e;n.classList.toggle("is-processing",s),n.setAttribute("aria-busy",s?"true":"false"),n.querySelectorAll("button").forEach(a=>{a.disabled=s});const r=n.querySelector(".world-processing"),o=r?.querySelector(".world-processing-label");r&&(r.hidden=!s),o&&(o.textContent=e??"")}menu(t){const e=t.length?[...t].sort((n,s)=>s.updated-n.updated).map(n=>{const s=Qt(n.id),r=new Date(n.updated).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});return[`<div class="world-card" data-world-id="${s}" aria-busy="false">`,`<button class="world-open" data-action="load" data-id="${s}">`,`<span class="world-thumbnail">${Us}</span>`,`<span><strong>${Qt(n.name)}</strong><small>${Qt(n.mode)} · ${r}</small></span>`,'<span class="arrow">↗</span>',"</button>",'<div class="world-tools">','<div class="world-tool-bar world-tool-bar-main">',`<button data-action="rename" data-id="${s}">Rename</button>`,`<button data-action="export-world" data-id="${s}">Export</button>`,`<button data-action="duplicate" data-id="${s}">Duplicate</button>`,"</div>",'<div class="world-tool-bar world-tool-bar-danger">',`<button data-action="reset" data-id="${s}">Reset</button>`,`<button data-action="delete" data-id="${s}">Delete</button>`,"</div>","</div>",'<div class="world-processing" role="status" aria-live="polite" hidden>','<span class="processing-spinner" aria-hidden="true"></span>','<span class="world-processing-label"></span>',"</div>","</div>"].join("")}).join(""):'<div class="empty-world"><span>⌂</span><h3>Start with a blank horizon.</h3><p>Create a world, choose how you want to play, and shape it block by block.</p></div>';this.show("menu",[`<header class="brand"><span class="brand-mark">${Us}</span><span>JADE HARBOR <small>A CHINATOWN VOXEL SANDBOX</small></span></header>`,'<div class="home-body">','<section class="intro">','<div class="eyebrow"><span></span> BUILD. EXPLORE. MAKE IT YOURS.</div>',"<h1>Build beyond.<br><em>Boundaries.</em></h1>",'<p>Explore a living Chinatown, carve into the mountains,<br class="wide"> or build something entirely your own.</p>','<button class="primary large" data-action="new">Create your world <span>↗</span></button>','<div class="home-links"><button data-action="controls">How to play</button><i></i><button data-action="settings">Settings</button><i></i><button data-action="import">Import world</button></div>',"</section>",'<section class="world-panel">','<div class="world-panel-sticky">',`<div class="panel-heading"><span>YOUR WORLDS</span><span class="tiny">${t.length.toString().padStart(2,"0")}</span></div>`,'<div class="local-note"><span class="status-dot"></span><span>Saved locally in this browser. Export a backup anytime.</span></div>',"</div>",`<div class="world-list">${e}</div>`,"</section>","</div>",'<footer class="home-footer"><span>JADE HARBOR <i> / </i> MORTAL REALM</span><span>Built block by block.</span><span>JADE HARBOR · v1.0.0</span></footer>'].join(""))}create(){this.show("create",[`<header class="brand"><span class="brand-mark">${Us}</span><span>JADE HARBOR</span></header>`,'<section class="create-panel">','<button class="text-button" data-action="menu">← Your worlds</button>','<div class="eyebrow">CREATE A WORLD</div>',"<h2>Choose your next world.</h2>","<p>Use the same seed to revisit a landscape, or change it for a new one.</p>",'<label>World name<input id="world-name" maxlength="64" value="My Jade Harbor" placeholder="Name your world"></label>','<label>World seed <span>Same seed, same landscape</span><input id="world-seed" maxlength="100" value="jade-harbor"></label>','<label>How will you play?<select id="world-mode"><option value="creative">Creative — unlimited building & flight</option><option value="survival">Survival — gather, craft & stay alive</option><option value="adventure">Adventure — explore without editing blocks</option><option value="spectator">Spectator — fly freely through the world</option><option value="hardcore">Hardcore — survival with one life</option></select></label>','<p class="form-note">Hardcore death permanently turns the world into spectator mode.</p>','<button class="primary large full" data-action="create">Create & enter <span>↗</span></button>',"</section>"].join(""))}panel(t,e,n,s){const r=t==="settings"||t==="controls",o=r?"back":"resume",a=r?"Back to previous screen":"Close dialog and return to world",l=r?"Back (Esc)":"Return to world (Esc)",c=t==="inventory"?"dialog inventory-dialog":"dialog";this.show(t,[`<section class="${c}">`,'<div class="dialog-head"><div><div class="eyebrow">JADE HARBOR</div>',`<h2>${e}</h2><p>${n}</p></div>`,`<button type="button" class="close" data-action="${o}" aria-label="${a}" title="${l}">×</button>`,"</div>",s,"</section>"].join(""))}pause(t,e,n=!1){const s=e!=="hardcore"&&!n?`<div class="mode-control"><label>Game mode<select id="change-mode">${["creative","survival","adventure","spectator"].map(o=>`<option ${o===e?"selected":""}>${o}</option>`).join("")}</select></label></div>`:"",r=['<button class="primary" data-action="resume">Return to world <span>↗</span></button>','<button data-action="save">Save world</button>','<button data-action="menu">Save & return home</button>','<button data-action="export">Export backup</button>','<button data-action="settings">Settings</button>','<button data-action="controls">Controls</button>'].join("");this.panel("pause","World paused.",`${Qt(t)} · ${e}`,`<div class="pause-grid">${r}</div>${s}`)}inventory(t,e,n="All",s=""){const r=this.screen==="inventory"?this.overlay.querySelector(".inventory-scroll-area"):null,o=this.screen==="inventory"?this.overlay.querySelector("#catalog"):null,a=this.screen==="inventory"?this.overlay.querySelector(".categories"):null,l=r?.scrollTop??0,c=o?.scrollTop??0,u=a?.scrollLeft??0,h=`<div class="inventory-toolbar"><button class="pill active" data-action="inventory">${e?"Collection":"Inventory"}</button><button class="pill" data-action="craft">Crafting book</button>${e?'<input id="search" placeholder="Find a block or item…" autocomplete="off">':""}</div>`,d=e?['<div class="categories">',Xh.map(R=>`<button data-action="category" data-category="${R}" class="${R===n?"active":""}">${R}</button>`).join(""),"</div>",`<div id="catalog" class="catalog">${this.catalog(n,s)}</div>`].join(""):"",f=`<div class="equipment-row">${t.equipment.slots.map((R,P)=>`<div>${He(R,P,"armor-slot")}<small>${ki[P]}</small></div>`).join("")}<p>${t.equipment.protection} / 20 protection<br><small>Reduces melee damage · wears with use</small></p></div>`,_=`<div class="section-label">SATCHEL <span>${t.cursor?`Holding: ${Qt(Ut(t.cursor.id)?.name)} ×${t.cursor.count}`:"36 slots"}</span></div><div class="slots">${t.slots.slice(9).map((R,P)=>He(R,P+9)).join("")}</div>`,m=Qt(Ut(t.held?.id??-1)?.name??"Empty"),p=`<div class="inventory-hotbar-dock"><div class="section-label">HOTBAR <span>Selected: ${t.selected+1} · ${m} · Press 1–9</span></div><div class="slots hotbar-slots">${t.slots.slice(0,9).map((R,P)=>He(R,P,e?"hotbar-select":"slot",{className:t.selected===P?"chosen":void 0,ariaPressed:t.selected===P})).join("")}</div></div>`;this.panel("inventory",e?"The builder’s collection.":"Your satchel.",e?"Choose a block to put it in your selected hotbar slot.":"Click to move · Right-click to split · Drag to move items",`<div class="inventory-scroll-area">${h}${d}${f}${_}</div>${p}`);const S=this.overlay.querySelector("#search");S&&(S.value=s);const w=this.overlay.querySelector(".inventory-scroll-area"),y=this.overlay.querySelector("#catalog"),A=this.overlay.querySelector(".categories");w&&(w.scrollTop=l),y&&(y.scrollTop=c),A&&(A.scrollLeft=u)}catalog(t,e){const n=e.toLowerCase();return ws.filter(s=>(t==="All"||s.category===t)&&s.name.toLowerCase().includes(n)).map(s=>`<button class="catalog-item" data-action="choose" data-id="${s.id}" title="${Qt(s.name)}">${ii(s.id)}<span>${Qt(s.name)}</span></button>`).join("")||'<p class="empty-search">No matching items.</p>'}craft(t,e,n,s=Array(9).fill(null),r=2,o=null){const a=s.slice(0,r*r).map((f,g)=>He(f,g,"grid-slot")).join(""),l=!!(o&&(r===2||e)),c=o?`${ii(o[0])}<small>×${o[1]}</small>`:"<small>Output</small>",u=t.cursor?`Holding ${Qt(Ut(t.cursor.id)?.name)} ×${t.cursor.count}`:"Click a slot to move items.",h=Ir.map(f=>{const g=(!f.station||e)&&(n||f.cost.every(([p,S])=>t.count(p)>=S)),_=f.cost.map(([p,S])=>`${S} ${Ut(p)?.name}`).join(" + "),m=f.station&&!e?" · Needs bench":"";return`<button class="recipe" data-action="make" data-id="${f.id}" ${g?"":"disabled"}>${ii(f.output[0])}<span><strong>${f.name} <em>×${f.output[1]}</em></strong><small>${_}${m}</small></span><span class="recipe-arrow">${g?"↗":"—"}</span></button>`}).join(""),d=['<div class="inventory-toolbar"><button class="pill" data-action="inventory">Inventory</button><button class="pill active">Crafting book</button></div>','<div class="manual-crafting">',`<div class="craft-grid craft-grid-${r}">${a}</div>`,"<span>→</span>",`<button class="craft-output" data-action="grid-output" ${l?"":"disabled"}>${c}</button>`,`<p>Arrange ingredients<br>or use a recipe below.<br><small>${u}</small></p>`,"</div>",`<div class="slots">${t.slots.map((f,g)=>He(f,g)).join("")}</div>`,'<div class="section-label">RECIPE BOOK</div>',`<div class="recipe-list">${h}</div>`].join("");this.panel("craft","Make something useful.",e?"Crafting bench in range · all recipes available":"Basic recipes · stand near a crafting bench for tools and stations",d)}container(t,e,n="Cedar chest"){const s=t.cursor?`Holding ${Qt(Ut(t.cursor.id)?.name)} ×${t.cursor.count}`:"";this.panel("chest",Qt(n),"Click to move · Right-click to split · Shift-click to transfer",`<div class="slots">${e.map((r,o)=>He(r,o,"container-slot")).join("")}</div><div class="section-label">YOUR INVENTORY <span>${s}</span></div><div class="slots">${t.slots.map((r,o)=>He(r,o)).join("")}</div>`)}settings(t){this.panel("settings","Tune your experience.","Changes apply immediately.",['<div class="settings">',`<label>Field of view <output>${t.fov}°</output><input id="fov" type="range" min="55" max="105" value="${t.fov}"></label>`,`<label>View distance <output>${t.distance} chunks</output><input id="distance" type="range" min="3" max="8" value="${t.distance}"></label>`,`<label>Simulation distance <output>${t.simulationDistance} chunks</output><input id="simulationDistance" type="range" min="2" max="6" value="${t.simulationDistance}"></label>`,`<label>Mouse sensitivity <output>${t.sensitivity}</output><input id="sensitivity" type="range" min="1" max="12" value="${t.sensitivity}"></label>`,`<label>Sound volume <output>${t.volume}%</output><input id="volume" type="range" min="0" max="100" value="${t.volume}"></label>`,'<div class="settings-actions"><button data-action="fullscreen">Toggle fullscreen ↗</button><button data-action="reset-settings">Reset to defaults</button></div>',"</div>"].join(""))}controls(){const t=$h.map(([e,n])=>`<div><kbd>${e}</kbd><span>${n}</span></div>`).join("");this.panel("controls","Controls at a glance.","Designed for desktop keyboard and mouse.",`<div class="control-grid">${t}</div><p class="form-note">Workbenches, chests, kilns, beds and villagers use right-click. Hold Ctrl to place against an interactive block. Rice seeds plant on tilled soil; use a hoe on grass or earth first.</p><button class="primary full" data-action="resume">Back to game <span>↗</span></button>`)}updateHUD(t,e){const n=["creative","spectator"].includes(e.mode)?"":`<div class="survival-stats"><span class="health">♥ ${Math.ceil(e.health)} / 20</span><span>◇ ${t.equipment.protection} armor · ✦ Lv ${Math.floor(Math.sqrt(e.xp/8))} · ${e.xp} XP</span><span class="hunger">◒ ${Math.ceil(e.hunger)} / 20</span></div>`,s=e.breath<10?`<div class="effect-status">Air · ${Math.ceil(e.breath)} / 10</div>`:"",r=e.effects?`<div class="effect-status">${Qt(e.effects)}</div>`:"",o=t.slots.slice(0,9).map((l,c)=>`<div class="hotbar-slot ${c===t.selected?"selected":""}"><small>${c+1}</small>${l?ii(l.id):""}${l&&e.mode!=="creative"?`<b>${l.count}</b>`:""}</div>`).join(""),a=Qt(t.held?Ut(t.held.id)?.name:"Empty hand");this.hud.innerHTML=['<div class="hud-top">',`<div class="location"><span class="mini-brand">${Us}</span><div><strong>${Qt(e.biome)}</strong><small title="World position: X (east/west), Y (height), Z (north/south)">XYZ ${e.x} / ${e.y} / ${e.z}</small></div></div>`,`<div class="world-clock"><span>${e.time}</span><small>${e.mode.toUpperCase()}${e.flying?" · FLIGHT":""}</small></div>`,"</div>",e.target?`<div class="target-label">${Qt(e.target)}</div>`:"",`<div class="crosshair${e.hitFlash?" hit":""}"><i></i><b></b></div>`,e.hitMessage?`<div class="combat-feedback" role="status">${Qt(e.hitMessage)}</div>`:"",e.progress>0?`<div class="mining-track"><div style="width:${e.progress*100}%"></div></div>`:"",'<div class="hud-bottom">',n,s,r,`<div class="held-name">${a}</div>`,`<div class="hotbar">${o}</div>`,'<div class="hud-hints"><span><kbd>E</kbd> Inventory</span><span><kbd>LMB</kbd> Mine</span><span><kbd>RMB</kbd> Use / place</span><span><kbd>Esc</kbd> Pause</span></div>',"</div>",e.debug?`<pre class="debug">${Qt(e.debug)}</pre>`:""].join("")}}function Yh(i,t,e,n){const s=t.held,r=s&&Ut(s.id),o=Object.entries(s?.enchants??{}).map(([u,h])=>`${oi[u].name} ${h}`).join(" · "),a=`<div class="selected-tool">${s?ii(s.id):""}<div><strong>${Qt(r?.name??"Empty hand")}</strong><p>${s?.durability!==void 0?`${s.durability} / ${r.durability} durability`:"Select a tool or armor from your hotbar."}</p><small>${Qt(o)}</small></div></div>`,l=`<div class="section-label">SELECT A HOTBAR ITEM</div><div class="slots station-hotbar">${t.slots.slice(0,9).map((u,h)=>He(u,h,"station-select",{className:t.selected===h?"chosen":void 0})).join("")}</div>`;let c="";if(n==="enchant")c=`<div class="enchant-list">${Object.keys(oi).filter(h=>s&&Ta(s.id,h)).map(h=>{const d=oi[h],f=Ue(s,h)+1,g=Ec(f),_=f>d.max,m=h==="fortune"&&Ue(s,"silk")||h==="silk"&&Ue(s,"fortune"),p=_||!!m||e<g.xp||t.count(103)<g.jade,S=m?"Conflicts with current inscription":_?"Fully inscribed":`${g.xp} XP + ${g.jade} jade shard${g.jade>1?"s":""}`;return`<button data-action="enchant" data-id="${h}" ${p?"disabled":""}><strong>${d.name} ${_?"· MAX":f}</strong><span>${d.description}</span><small>${S}</small></button>`}).join("")||'<p class="form-note">Choose a tool or armor to see its available inscriptions. Obtain XP by mining coal and jade, collecting kiln output, or defeating spirits.</p>'}</div>`;else{const u=s&&wc(s.id);c=`<p class="form-note">Restore 25% of maximum durability for 2 XP and one matching material. Inscriptions are preserved.</p><button class="primary full" data-action="repair" ${!!(s?.durability!==void 0&&r?.durability&&s.durability<r.durability&&u&&e>=2&&t.count(u))?"":"disabled"}>Repair ${Qt(r?.name??"selected item")} <span>${Qt(u?Ut(u)?.name:"Choose a tool or armor")}</span></button>`}i.panel(n,n==="enchant"?"Words that strengthen your tools.":"Give a trusted tool new life.",`Level ${Math.floor(Math.sqrt(e/8))} · ${e} XP · ${t.count(103)} jade shards`,a+l+c)}function jh(i,t,e,n){const s=["Flask","Ingredient","Bamboo","Infusion"],r=e.slots.map((l,c)=>`<div>${He(l,c,"brew-slot")}<div class="station-slot-label">${s[c]}</div></div>`).join(""),o=Object.entries(Bi).map(([l,c])=>`<p>${Qt(Ut(Number(l))?.name)} → ${Qt(Ut(c)?.name)}</p>`).join(""),a=t.cursor?`Holding ${Qt(Ut(t.cursor.id)?.name)} ×${t.cursor.count}`:"";i.panel("brew","From the apothecary.","One glass flask + one ingredient · bamboo heat · water within four blocks",`<div class="station-slots">${r}</div><div class="station-progress"><div style="width:${e.progress/6*100}%"></div></div><p class="form-note">${n?"Water available":"Needs nearby water"} · ${Math.ceil(e.fuel)}s heat remaining · ${e.progress.toFixed(1)} / 6s brewed</p><details class="brew-recipes"><summary>Infusion recipes</summary>${o}<p>Drink with right-click. Bitter infusion causes poison. All recipes return an empty flask when drunk.</p></details><div class="section-label">YOUR INVENTORY <span>${a}</span></div><div class="slots">${t.slots.map((l,c)=>He(l,c)).join("")}</div>`)}class il{values=0;nonAir=0;revision=0;constructor(t=0){this.values=t,this.nonAir=typeof t=="number"?t?4096:0:t.reduce((e,n)=>e+ +(n!==0),0)}get(t){return typeof this.values=="number"?this.values:this.values[t]}set(t,e){const n=this.get(t);return n===e?!1:(typeof this.values=="number"&&(this.values=new Uint16Array(4096).fill(this.values)),this.values[t]=e,this.nonAir+=+(e!==0)-+(n!==0),this.revision++,!0)}compact(){const t=this.values;t instanceof Uint16Array&&t.every(e=>e===t[0])&&(this.values=t[0])}get byteLength(){return typeof this.values=="number"?2:this.values.byteLength}}class Ur{sections=new Map;get(t,e,n){return this.sections.get(Ht(e))?.get(ms(t,me(e),n))??0}set(t,e,n,s){if(e<ie||e>ge)return!1;const r=Ht(e);let o=this.sections.get(r);if(!o){if(!s)return!1;o=new il,this.sections.set(r,o)}const a=o.set(ms(t,me(e),n),s);return o.nonAir===0&&this.sections.delete(r),a}some(t){for(const e of this.sections.values())if(typeof e.values=="number"){if(t(e.values))return!0}else if(e.values.some(t))return!0;return this.sections.size<Ni-Ui+1&&t(0)}compact(){for(const t of this.sections.values())t.compact()}get byteLength(){let t=0;for(const e of this.sections.values())t+=e.byteLength;return t}serialize(){return[...this.sections].map(([t,e])=>typeof e.values=="number"?{sy:t,uniform:e.values}:{sy:t,data:e.values})}static from(t){const e=new Ur;for(const n of t)e.sections.set(n.sy,new il(n.data??n.uniform??0));return e}}const Ns=1024,Cc=328,sl={x:.5,y:21.1,z:24.5},ye=["Grand Lantern Avenue","Residential Old Town","Grand Market","Temple Quarter","Canal Quarter","Imperial Quarter","Artisan Quarter","Classical Gardens"],br=(i,t,e)=>t>=i.x1&&t<=i.x2&&e>=i.z1&&e<=i.z2,rl=(i,t,e=0)=>i.x1-e<=t.x2&&i.x2+e>=t.x1&&i.z1-e<=t.z2&&i.z2+e>=t.z1;function Er(i,t){return t<-218?i<-80?ye[2]:i>80?ye[5]:ye[3]:i>100?t>116?ye[7]:ye[4]:i<-80?t<-64?ye[2]:t>116?ye[6]:ye[1]:t>180?ye[1]:ye[0]}const ai=(i,t)=>Math.max(Math.abs(i),Math.abs(t))<=Cc&&Math.hypot(i,t)<436,es=new Map;function Hi(i,t,e){const n=Math.round(i/Ns)*Ns,s=Math.round(t/Ns)*Ns;return(n||s)&&ne(n,s,e+713)<.38||Math.max(Math.abs(i-n),Math.abs(t-s))>Cc+60?null:Kh(e,n,s)}function Kh(i,t=0,e=0){const n=`${i}:${t}:${e}`,s=es.get(n);if(s)return s;const r=i^(Math.imul(t,173)^Math.imul(e,271)),o=[-304,-224,-144,-64,0,64,144,224,304],a=[-304,-224,-144,-80,-16,48,128,208,288];for(let d=0;d<o.length;d++)Math.abs(o[d])>144&&(o[d]+=Math.floor(ne(d,7,r)*9)-4);for(let d=0;d<a.length;d++)(d<3||d>5)&&(a[d]+=Math.floor(ne(d,13,r)*9)-4);const l={seed:r,ox:t,oz:e,roads:[],structures:[],byChunk:new Map,reservations:[],parks:[],alleys:[]};for(const d of o)l.roads.push({axis:"x",at:d,half:d===0?5:Math.abs(d)===144?4:3,name:d===0?"Lantern Avenue":"Neighborhood street"});for(const d of a)l.roads.push({axis:"z",at:d,half:Math.abs(d+16)<1||Math.abs(d+144)<5||Math.abs(d-128)<5?4:3,name:"Cross avenue"});const c=[v.JadeRoof,v.Roof,v.RubyRoof,v.BrownRoof],u=(d,f,g=0,_=1,m=!1)=>{if(!ai(d.x1,d.z1)||!ai(d.x2,d.z2))return;const p=Math.floor(ne(d.x1,d.z1,r)*2147483647),S={...d,id:`${t+d.x1},${e+d.z1}:${f}`,kind:f,district:Er((d.x1+d.x2)/2,(d.z1+d.z2)/2),facing:g,floors:_,roof:c[p%4],style:p%5,seed:p};l.structures.push(S),m&&l.reservations.push(d)};u({x1:-21,z1:-71,x2:21,z2:-27},"panda-plaza",2,1,!0),u({x1:-58,z1:-296,x2:-7,z2:-234},"pagoda",2,5,!0),u({x1:153,z1:-296,x2:215,z2:-234},"civic",2,2,!0),u({x1:-216,z1:-216,x2:-153,z2:-153},"market-hall",2,1,!0),u({x1:-216,z1:-8,x2:-153,z2:40},"courtyard",0,1,!0),u({x1:-216,z1:138,x2:-153,z2:199},"workshop",0,2,!0),u({x1:153,z1:138,x2:215,z2:199},"garden",0,1,!0),u({x1:-9,z1:8,x2:9,z2:16},"gate",2,1,!0),u({x1:-9,z1:-212,x2:9,z2:-204},"gate",2,1,!0);const h=d=>l.reservations.some(f=>rl(d,f,3))||d.x1<=152&&d.x2>=136&&d.z1<144&&d.z2>-234;for(let d=0;d<a.length-1;d++)for(let f=0;f<o.length-1;f++){const g=o[f]+(o[f]===0?8:6),_=o[f+1]-(o[f+1]===0?8:6),m=a[d]+7,p=a[d+1]-7,S=Er((g+_)/2,(m+p)/2),w=ne(f,d,r+31),y=12+Math.floor(w*5),A=Math.floor((g+_)/2)+(w>.5?3:-3),R=Math.floor((m+p)/2);l.alleys.push({x1:A-1,z1:m,x2:A+1,z2:p},{x1:g,z1:R-1,x2:_,z2:R+1});const P=(E,L)=>{const k=ne(f*31+E,L,r+132);return S===ye[0]?k<.3?"merchant":k<.65?"shophouse":k<.85?"teahouse":"corner-shop":S===ye[1]?k<.55?"home":k<.8?"courtyard":"teahouse":S===ye[2]?k<.35?"stall":k<.8?"shop":"market-hall":S===ye[3]?k<.3?"temple":k<.6?"home":"pavilion":S===ye[4]?k<.7?"canal-house":"teahouse":S===ye[5]?k<.4?"temple":"merchant":S===ye[6]?k<.65?"workshop":"warehouse":k<.55?"pavilion":"home"},N=(E,L,k,H,V)=>{const q=k===0||k===2?A:R;let X=0;for(const[et,G]of[[E,Math.min(L,q-3)],[Math.max(E,q+3),L]]){let Z=et;for(;Z+8<=G;){const ot=Math.min(G-Z+1,9+Math.floor(ne(Z,H,r+49)*8));if(ot<9)break;const ft=k===0?{x1:Z,z1:H,x2:Z+ot-1,z2:H+V-1}:k===2?{x1:Z,z1:H-V+1,x2:Z+ot-1,z2:H}:k===3?{x1:H,z1:Z,x2:H+V-1,z2:Z+ot-1}:{x1:H-V+1,z1:Z,x2:H,z2:Z+ot-1},Ct=P(k,Z),jt=S===ye[7]&&ne(Z,H,r+6)>.35;if(!h(ft)&&!jt&&!l.alleys.some(Gt=>rl(ft,Gt,1))){let Gt=Ct==="merchant"?3:Ct==="shophouse"||Ct==="canal-house"||Ct==="teahouse"?2:Ct==="corner-shop"?X%2?3:2:1;Ct==="home"&&ne(Z,H,r+8)>.65&&(Gt=2),u(ft,Ct,k,Gt)}else jt&&!h(ft)&&l.parks.push(ft);Z+=ot+3+(S===ye[1]?1:0),X++}}};N(g,_,0,m,y),N(g,_,2,p,y+(w>.7?2:0)),p-m>y*2+13&&(N(m+y+3,p-y-3,3,g,y),N(m+y+3,p-y-3,1,_,y));const b={x1:g+y+3,z1:m+y+3,x2:_-y-3,z2:p-y-3};b.x2-b.x1>8&&b.z2-b.z1>8&&!h(b)&&l.parks.push(b)}for(const d of l.structures){d.x1+=t,d.x2+=t,d.z1+=e,d.z2+=e;for(let f=Math.floor((d.z1-3)/16);f<=Math.floor((d.z2+3)/16);f++)for(let g=Math.floor((d.x1-3)/16);g<=Math.floor((d.x2+3)/16);g++){const _=`${g},${f}`,m=l.byChunk.get(_)??[];m.push(d),l.byChunk.set(_,m)}}for(const d of[...l.reservations,...l.parks,...l.alleys])d.x1+=t,d.x2+=t,d.z1+=e,d.z2+=e;return es.set(n,l),es.size>6&&es.delete(es.keys().next().value),l}function Pc(i,t,e,n=0){return i.roads.find(s=>Math.abs((s.axis==="x"?t-i.ox:e-i.oz)-s.at)<=s.half+n)}function Lc(i,t,e){return Math.abs(t-i.ox-144)<=4&&e-i.oz>-234&&e-i.oz<144}function Jh(i,t){return i.roads.some(e=>e.axis==="z"&&Math.abs(t-i.oz-e.at)<=e.half)}function Dc(i,t,e){return i.parks.some(n=>br(n,t,e))}function Zh(i,t,e){const n=t-i.ox,s=e-i.oz;if(Lc(i,t,e))return Jh(i,e)?"road":"water";if(Math.abs(n-144)<=8&&s>-234&&s<144||Pc(i,t,e,2))return"road";for(const r of i.byChunk.get(`${Math.floor(t/16)},${Math.floor(e/16)}`)??[])if(br(r,t,e))return r.kind==="garden"?"garden":r.kind==="panda-plaza"?"plaza":"building";return i.alleys.some(r=>br(r,t,e))?"road":Dc(i,t,e)||Er(n,s)===ye[7]||ne(Math.floor(n/48),Math.floor(s/48),i.seed+901)<.12?"garden":"court"}class Qh{constructor(t,e,n){this.data=t,this.ox=e,this.oz=n}put(t,e,n,s){t>=this.ox&&t<this.ox+16&&n>=this.oz&&n<this.oz+16&&e>=ie&&e<=ge&&this.data.set(t-this.ox,e,n-this.oz,s)}fill(t,e,n,s,r,o,a){for(let l=Math.max(ie,e);l<=Math.min(ge,r);l++)for(let c=Math.max(this.oz,n);c<=Math.min(this.oz+15,o);c++)for(let u=Math.max(this.ox,t);u<=Math.min(this.ox+15,s);u++)this.data.set(u-this.ox,l,c-this.oz,a)}local(t){const e=t.facing,n=e%2?t.z2-t.z1+1:t.x2-t.x1+1,s=e%2?t.x2-t.x1+1:t.z2-t.z1+1,r=(a,l)=>e===0?[t.x1+a,t.z1+l]:e===1?[t.x2-l,t.z1+a]:e===2?[t.x2-a,t.z2-l]:[t.x1+l,t.z2-a],o=(a,l,c,u,h,d,f)=>{const[g,_]=r(a,c),[m,p]=r(u,d);this.fill(Math.min(g,m),l,Math.min(_,p),Math.max(g,m),h,Math.max(_,p),f)};return{w:n,d:s,fill:o,put:(a,l,c,u)=>o(a,l,c,a,l,c,u)}}}const ui=new Map;function Gn(i,t,e,n,s,r,o){for(let a=Math.floor(t-s);a<=Math.ceil(t+s);a++)for(let l=Math.floor(e-r);l<=Math.ceil(e+r);l++)for(let c=Math.floor(i-n);c<=Math.ceil(i+n);c++)((c-i)/n)**2+((a-t)/s)**2+((l-e)/r)**2<=1&&ui.set(`${c},${a},${l}`,o)}Gn(0,5,-1,4.4,4.9,3.3,v.Porcelain);Gn(0,9,-1,4.7,1.8,3.1,v.Ink);for(const i of[-1,1])Gn(i*3.25,1.6,3.1,2.65,1.7,3.2,v.Ink),Gn(i*4.1,6,.4,1.7,3.4,2.3,v.Ink),Gn(i*3.9,3.4,2.1,1.7,1.8,1.7,v.Ink);Gn(0,5.2,1,3.25,3.8,2.6,v.Porcelain);Gn(0,12,-.6,4.65,4.05,3.7,v.Porcelain);for(const i of[-1,1])Gn(i*3.5,15.5,-.6,1.8,1.8,1.5,v.Ink);function Nr(i,t){for(let e=6;e>=-5;e--)if(ui.has(`${i},${t},${e}`))return e;return 0}for(const i of[-1,1])for(let t=11;t<=14;t++)for(let e=i*2-1;e<=i*2+1;e++)if(((e-i*2)/1.5)**2+((t-12.6)/1.7)**2<1.25){const n=Nr(e,t);ui.set(`${e},${t},${n}`,v.Ink)}for(const i of[-1,1])ui.set(`${i*2},13,${Nr(i*2,13)}`,v.PandaEye);for(let i=-1;i<=1;i++)ui.set(`${i},11,${Nr(i,11)+1}`,v.Ink);ui.set(`0,10,${Nr(0,10)}`,v.PandaMouth);const ol=[...ui].map(([i,t])=>[...i.split(",").map(Number),t]);function Ic(i,t,e,n,s=!1){if(!s){i.fill(t+5,e+2,n+3,t+5,e+10,n+3,v.Bamboo),i.put(t+6,e+9,n+3,v.Leaves),i.put(t+4,e+10,n+3,v.Leaves);for(const[o,a,l,c]of ol)i.put(t+o,e+a,n+l,c);return}const r=new Map;for(const[o,a,l,c]of ol)r.set(`${Math.round(o*.4)},${Math.round(a*.4)},${Math.round(l*.4)}`,c);for(const[o,a]of r){const[l,c,u]=o.split(",").map(Number);i.put(t+l,e+c,n+u,a)}}function Mn(i,t,e,n,s,r,o=0,a=1){return{...i,x1:t,z1:e,x2:n,z2:s,kind:r,facing:o,floors:a,style:(i.style+t+e+1e4)%5}}function vs(i,t,e,n,s=!0,r=v.DarkTimber){i.fill(t,e,n,t,e+4,n,r);for(let o=0;o<3;o++)for(let a=-3;a<=3;a++)for(let l=-3;l<=3;l++)l*l+a*a+(o-1)**2*3<12&&i.put(t+l,e+4+o,n+a,s?v.Blossom:v.Leaves)}function Ca(i,t,e,n=1){const{w:s,d:r,fill:o,put:a}=i.local(t),l=Math.min(5,Math.floor(Math.min(s,r)/2));for(let c=0;c<l;c++){const u=t.style%3!==1,h=u?c:Math.min(1,c);o(-n+h,e+c,-n+c,s-1+n-h,e+c,r-1+n-c,t.roof)}o(t.style%3===1?0:l-1,e+l,-n+l,s-1-(t.style%3===1?0:l-1),e+l,r-1+n-l,v.DarkTimber);for(const c of[-n,s-1+n])for(const u of[-n,r-1+n])a(c,e+1,u,t.roof);if(s>=15)for(const c of[0,s-1])a(c,e+2,0,v.GoldTrim),a(c,e+2,r-1,v.GoldTrim)}function Gi(i,t,e=20){const{w:n,d:s,fill:r,put:o}=i.local(t),a=t.floors,l=["shop","shophouse","merchant","corner-shop","teahouse","canal-house"].includes(t.kind),c=t.style%2?v.DarkTimber:v.Red,u=[v.CreamWall,v.Planks,v.Brick,v.CreamWall,v.Planks][t.style],h=Math.floor(n/2);r(0,e,0,n-1,e,s-1,v.Paving);for(let d=0;d<a;d++){const f=e+d*5;r(0,f+1,0,n-1,f+4,s-1,u),r(1,f+1,1,n-2,f+4,s-2,v.Air),r(0,f+5,0,n-1,f+5,s-1,v.DarkTimber);for(const g of[0,n-1])for(const _ of[0,s-1])r(g,f+1,_,g,f+5,_,c);for(let g=2;g<n-2;g+=4)r(g,f+2,0,Math.min(g+1,n-2),f+3,0,d%2?v.Paper:v.Glass),r(g,f+2,s-1,Math.min(g+1,n-2),f+3,s-1,v.Glass);for(let g=3;g<s-2;g+=5)r(0,f+2,g,0,f+3,g+1,v.Glass),r(n-1,f+2,g,n-1,f+3,g+1,v.Paper);if(d<a-1){r(n-4,f+5,2,n-2,f+7,7,v.Air);for(let g=0;g<5;g++)o(n-3,f+1+g,3+g,oe(v.Stairs,(2-t.facing+4)%4))}d>0&&l&&(r(1,f,-1,n-2,f,-1,v.Planks),r(1,f+1,-1,n-2,f+1,-1,v.Fence),r(h,f+1,0,h,f+2,0,v.Air))}if(r(h-1,e+1,0,h+1,e+3,0,v.Air),l||(o(h,e+1,0,oe(v.Door,t.facing)),o(h,e+2,0,oe(v.Door,t.facing|8))),l){r(1,e+4,-1,n-2,e+4,-1,t.style%2?v.RubyRoof:v.JadeRoof);const d=t.kind==="teahouse"?v.TeaSign:t.style%3===0?v.NoodleSign:v.MarketSign;o(h,e+4,0,d),o(n-2,e+6,-1,d),o(n-2,e+7,-1,v.Banner)}o(1,e+3,-1,v.Lantern),o(n-2,e+3,-1,v.Lantern);for(const d of[1,n-2])o(d,e+4,0,v.DarkTimber);if(o(2,e+1,s-3,t.kind==="workshop"?v.Furnace:v.Chest),o(3,e+1,s-3,v.Workbench),o(n-3,e+1,s-3,t.kind==="home"?v.Bed:v.Pottery),l&&(r(1,e+1,3,2,e+1,4,v.Planks),o(1,e+2,3,v.Pottery),t.kind==="teahouse"&&(o(2,e+1,s-5,v.Slab),o(4,e+1,s-5,v.Slab))),t.kind==="workshop"||t.kind==="warehouse"){for(let d=1;d<n-2;d+=3)o(d,e+1,s-2,v.Crate);r(n-2,e+1,s-2,n-2,e+a*5+3,s-2,v.Brick)}Ca(i,t,e+a*5+1)}function kr(i,t,e=20){const{w:n,d:s,fill:r,put:o}=i.local(t);r(0,e,0,n-1,e,s-1,v.Paving);for(const a of[0,n-1])for(const l of[0,s-1])r(a,e+1,l,a,e+5,l,v.Red),o(a,e+4,l,v.GoldTrim);r(0,e+5,0,n-1,e+5,s-1,v.DarkTimber),Ca(i,t,e+6),o(2,e+4,2,v.Lantern),n>6&&r(2,e+1,s-2,n-3,e+1,s-2,v.Slab)}function Po(i,t,e=20){const{w:n,d:s,fill:r,put:o}=i.local(t),a=Math.min(6,s);r(0,e,0,n-1,e,a,v.Paving);for(const l of[0,n-1])for(const c of[0,a])r(l,e+1,c,l,e+4,c,v.DarkTimber);for(let l=-1;l<=n;l++)r(l,e+5,-1,l,e+5,a+1,(l+t.style)%3?v.RubyRoof:v.CreamWall);r(1,e+1,1,n-2,e+1,1,v.Planks);for(let l=1;l<n-1;l+=2)o(l,e+2,1,[v.Pottery,v.Tea,v.Flower,v.Crate][(l+t.style)%4]);o(Math.floor(n/2),e+4,0,v.Lantern)}function tu(i,t){const e=Math.floor((t.x1+t.x2)/2),n=Math.floor((t.z1+t.z2)/2);for(const r of[e-6,e+6])i.fill(r-1,20,n-1,r+1,21,n+1,v.Marble),i.fill(r,22,n,r,30,n,v.Red),i.put(r,29,n+1,v.GoldTrim);i.fill(e-7,28,n,e+7,30,n,v.Red),i.put(e,29,n+1,v.PandaSign);const s=Mn(t,e-8,n-2,e+8,n+2,"gate");s.roof=v.JadeRoof,s.style=1,Ca(i,s,31);for(const r of[e-4,e+4])i.put(r,27,n,v.Lantern)}function eu(i,t){const e=Math.floor((t.x1+t.x2)/2),n=Math.floor((t.z1+t.z2)/2),s=t.x2-t.x1,r=t.z2-t.z1;i.fill(t.x1,20,t.z1,t.x2,20,t.z2,v.Paving);for(const a of[t.x1,t.x2])i.fill(a,21,t.z1,a,23,t.z2,v.CreamWall);for(const a of[t.z1,t.z2])i.fill(t.x1,21,a,t.x2,23,a,v.CreamWall);i.fill(e-2,21,t.z1,e+2,24,t.z1,v.Air),i.fill(e-2,21,t.z2,e+2,24,t.z2,v.Air);const o=Math.min(12,Math.floor(r/3));if(Gi(i,Mn(t,t.x1+3,t.z1+3,t.x2-3,t.z1+o,"home",2,t.floors)),s>28&&(Gi(i,Mn(t,t.x1+3,t.z1+o+4,t.x1+13,t.z2-4,"home",1)),Gi(i,Mn(t,t.x2-13,t.z1+o+4,t.x2-3,t.z2-4,t.kind==="workshop"?"workshop":"home",3))),s>36){for(const a of[e-7,e+7])i.fill(a-1,20,n-1,a+1,20,n+1,v.Dirt),i.fill(a,21,n,a,25,n,v.Bamboo);i.put(e,21,n,v.Pottery)}t.kind==="workshop"&&(i.fill(e-5,21,n+7,e-3,22,n+9,v.Crate),i.put(e+3,21,n+7,v.Furnace),i.put(e+4,21,n+7,v.Workbench))}function nu(i,t){const e=Math.floor((t.x1+t.x2)/2),n=Math.floor((t.z1+t.z2)/2)-8;i.fill(t.x1,20,t.z1,t.x2,20,t.z2,v.Paving),i.fill(e-12,21,n-12,e+12,22,n+12,v.Marble);for(let s=0;s<5;s++){const r=8-s,o=23+s*6,a=Mn(t,e-r,n-r,e+r,n+r,"pavilion");a.roof=s%2?v.Roof:v.JadeRoof,a.style=0,kr(i,a,o-1),s<4&&i.fill(e+2,o,n+1,e+2,o+6,n+1,v.Ladder)}for(let s=0;s<4;s++){const r=21+Math.floor(s/2);i.fill(e-4,r,n+16-s,e+4,r,n+16-s,s%2?v.Marble:v.Slab)}for(const s of[-1,1]){const r=e+s*17;i.fill(r-3,20,t.z2-9,r+3,21,t.z2-3,v.Marble),Ic(i,r,22,t.z2-6,!0)}for(const s of[t.x1+1,t.x2-1])i.fill(s,21,t.z1+1,s,23,t.z2-1,v.CreamWall)}function iu(i,t){const e=Math.floor((t.x1+t.x2)/2);i.fill(t.x1,20,t.z1,t.x2,20,t.z2,v.Paving),i.fill(t.x1+5,21,t.z1+6,t.x2-5,23,t.z1+35,v.Marble);const n=Mn(t,t.x1+9,t.z1+10,t.x2-9,t.z1+31,"temple",2,2);n.roof=v.RubyRoof,Gi(i,n,24);for(let s=0;s<8;s++){const r=21+Math.floor(s/2);i.fill(e-5,r,t.z1+44-s,e+5,r,t.z1+44-s,s%2?v.Marble:v.Slab)}i.fill(e-5,21,t.z1+32,e+5,24,t.z1+36,v.Marble);for(const s of[t.x1,t.x2])i.fill(s,21,t.z1,s,25,t.z2,v.Red);i.fill(t.x1,25,t.z1,t.x2,25,t.z1,v.Roof);for(const s of[t.x1+6,t.x2-6])for(const r of[t.z2-8,t.z2-22])i.fill(s,21,r,s,25,r,v.SculptureStone),i.put(s,26,r,v.Lantern)}function su(i,t){const e=t.x2-t.x1,n=t.z2-t.z1;if(e<26||n<26){Gi(i,{...t,kind:"shop"});return}const s=Math.floor((t.x1+t.x2)/2);i.fill(t.x1,20,t.z1,t.x2,20,t.z2,v.Paving);const r=Mn(t,s-11,t.z1+6,s+11,t.z1+22,"pavilion");r.roof=v.RubyRoof,kr(i,r);for(let o=t.z1+29;o<t.z2-7;o+=13)for(const a of[t.x1+4,t.x2-12])Po(i,Mn(t,a,o,a+8,o+7,"stall",a<s?1:3));for(let o=t.x1+5;o<t.x2-4;o+=11)Po(i,Mn(t,o,t.z2-8,Math.min(o+7,t.x2-3),t.z2-2,"stall"))}function ru(i,t){const e=Math.floor((t.x1+t.x2)/2),n=Math.floor((t.z1+t.z2)/2);i.fill(t.x1,20,t.z1,t.x2,20,t.z2,v.Grass);for(let s=-13;s<=13;s++)for(let r=-19;r<=19;r++){const o=r*r/324+s*s/144;o<1?(i.fill(e+r,18,n+s,e+r,19,n+s,v.Water),i.put(e+r,20,n+s,v.Air),ne(r,s,t.seed)>.95&&i.put(e+r,20,n+s,v.Lotus)):o<1.25&&i.put(e+r,20,n+s,v.Marble)}for(let s=-21;s<=21;s++){const r=Math.abs(s),o=r>16?20:r>5?21:22,a=r<=16&&r>10||r<=5;if(i.fill(e+s,20,n-1,e+s,o-1,n+1,v.Planks),i.fill(e+s,o,n-1,e+s,o,n+1,a?v.Slab:v.Planks),r<19)for(const l of[n-2,n+2])i.put(e+s,o+(a?0:1),l,v.Fence)}for(const s of[-10,10])i.fill(e+s,18,n-1,e+s,20,n+1,v.SculptureStone);for(const s of[-1,1])vs(i,e+s*24,21,n-17),vs(i,e+s*24,21,n+19);kr(i,Mn(t,t.x1+5,t.z1+5,t.x1+13,t.z1+13,"pavilion"));for(let s=t.z1+2;s<=t.z2-2;s++)i.put(t.x1+2,20,s,v.Paving),i.put(t.x2-2,20,s,v.Paving);for(let s=t.x1+2;s<=t.x2-2;s++)i.put(s,20,t.z1+2,v.Paving),i.put(s,20,t.z2-2,v.Paving)}function ou(i,t){const e=Math.floor((t.x1+t.x2)/2),n=-48+(t.z1+71);for(let s=t.z1;s<=t.z2;s++)for(let r=t.x1;r<=t.x2;r++){const o=Math.round(Math.hypot(r-e,s-n)),a=o===15||Math.abs(r-e)===19||s===t.z1+1||s===t.z2-1?v.Marble:o===13?v.GoldTrim:v.Paving;i.put(r,20,s,a)}i.fill(e-9,21,n-6,e+9,21,n+7,v.SculptureStone),i.fill(e-8,22,n-5,e+8,22,n+7,v.Marble);for(let s=0;s<4;s++){const r=21+Math.floor(s/2),o=n+11-s;i.fill(e-4,r,o,e+4,r,o,s%2?v.Marble:v.Slab)}Ic(i,e,23,n);for(const s of[t.x1+1,t.x2-1])i.fill(s,21,t.z1+2,s,21,t.z1+12,v.Fence);for(const s of[t.x1+5,t.x2-5])for(const r of[t.z1+5,t.z2-5])i.fill(s-2,20,r-2,s+2,20,r+2,v.Marble),i.fill(s-1,21,r-1,s+1,21,r+1,v.Dirt),r<t.z1+10?vs(i,s,22,r,!0):(i.fill(s,22,r,s,27,r,v.Bamboo),i.put(s-1,22,r+1,v.Flower));for(const s of[e-13,e+13])i.fill(s,21,n+7,s,25,n+7,v.Red),i.fill(s-1,25,n+7,s+1,25,n+7,v.DarkTimber),i.put(s,24,n+8,v.Lantern),i.fill(s-2,21,n+12,s+2,21,n+12,v.Slab);i.fill(e+7,21,t.z2+1,e+7,23,t.z2+1,v.DarkTimber),i.put(e+7,24,t.z2+1,v.PandaSign)}function au(i,t){return t.kind==="panda-plaza"?ou(i,t):t.kind==="gate"?tu(i,t):t.kind==="pagoda"?nu(i,t):t.kind==="civic"?iu(i,t):t.kind==="garden"?ru(i,t):t.kind==="market-hall"?su(i,t):(t.kind==="courtyard"||t.kind==="workshop")&&t.x2-t.x1>27&&t.z2-t.z1>27?eu(i,t):t.kind==="pavilion"?kr(i,t):t.kind==="stall"?Po(i,t):Gi(i,t)}function lu(i,t){for(let e=i.oz;e<i.oz+16;e++)if(e-t.oz>-234&&e-t.oz<144){const n=t.roads.find(s=>s.axis==="z"&&Math.abs(e-t.oz-s.at)<=s.half);for(let s=i.ox;s<i.ox+16;s++){const r=Math.abs(s-t.ox-144);r<=4?n?i.put(s,20,e,v.Marble):(i.fill(s,18,e,s,19,e,v.Water),i.put(s,20,e,v.Air)):r===5?i.fill(s,18,e,s,20,e,v.SculptureStone):r<=8&&i.put(s,20,e,v.Paving),n&&Math.abs(e-t.oz-n.at)===n.half&&r<=5&&i.put(s,21,e,v.Fence)}}for(const e of t.roads)if(e.axis==="x")for(let n=Math.floor((i.oz-t.oz-3)/24)*24;n<i.oz-t.oz+19;n+=24){const s=n+t.oz,r=e.at+t.ox;if(!(Math.abs(n)>306||t.reservations.some(o=>br(o,r,s))||t.roads.some(o=>o.axis==="z"&&Math.abs(o.at-n)<10))){for(const o of[-1,1]){const a=r+o*(e.half+1);Lc(t,a,s)||Math.abs(e.at-144)<1&&n>-234&&n<144||(i.fill(a,21,s,a,25,s,v.DarkTimber),i.put(a,26,s,v.GoldTrim),i.put(a,24,s+1,v.Lantern))}if(e.at===0){i.fill(r-6,26,s,r+6,26,s,v.Fence);for(const o of[-3,0,3])i.put(r+o,25,s,v.Lantern)}}}for(let e=Math.floor((i.oz-5)/9)*9;e<=i.oz+21;e+=9)for(let n=Math.floor((i.ox-5)/9)*9;n<=i.ox+21;n+=9)!Dc(t,n,e)||Pc(t,n,e,6)||t.structures.some(s=>n>=s.x1-4&&n<=s.x2+4&&e>=s.z1-4&&e<=s.z2+4)||t.alleys.some(s=>n>=s.x1-4&&n<=s.x2+4&&e>=s.z1-4&&e<=s.z2+4)||(ne(n,e,t.seed)<.5?vs(i,n,21,e,ne(n,e,t.seed+3)>.25):i.fill(n,21,e,n,27,e,v.Bamboo))}const Fr=3;function Lo(i,t,e){const n=Hi(i,t,e);if(n&&ai(i-n.ox,t-n.oz))return"Jade Harbor · "+Er(i-n.ox,t-n.oz);const s=Oi(i/190,t/190,e+82);return s<.22?"Cherry Blossom Valley":s<.44?"Bamboo Forest":s<.66?"Cedar Highlands":s<.83?"Jade Mountains":"Snow Peaks"}function al(i,t,e){const n=Dh(i/100,t/100,e),s=Math.pow(Math.max(0,Oi(i/170,t/170,e+8)-.45)*2,2)*185;let r=15+Math.floor(n*16+s);const o=380+Math.round((Oi(t/130,0,e+91)-.5)*24);return Math.abs(i-o)<6&&(r=Math.min(r,16)),pn(r,5,ge-20)}function dr(i,t){return i>=350&&i<=374&&t>=120&&t<=166}function ns(i,t,e){if(dr(i,t))return 21+Math.floor((t-120)/16);const n=Hi(i,t,e);if(n){const s=i-n.ox,r=t-n.oz;if(ai(s,r))return 20;const o=pn(Math.max((Math.max(Math.abs(s),Math.abs(r))-328)/48,(Math.hypot(s,r)-436)/48),0,1);return Math.round(20*(1-o)+al(i,t,e)*o)}return al(i,t,e)}function cu(i,t,e){const n=Aa(e),s=new Ur,r=i*16,o=t*16,a=new Qh(s,r,o),l=new Map;for(let u=0;u<16;u++)for(let h=0;h<16;h++){const d=r+h,f=o+u,g=Hi(d,f,n),_=g&&ai(d-g.ox,f-g.oz),m=ns(d,f,n),p=_?"":Lo(d,f,n);_&&l.set(`${g.ox},${g.oz}`,g);const S=_?Zh(g,d,f):null,w=dr(d,f);for(let y=ie;y<=Math.max(Xr,m);y++){let A=y>m?v.Water:y===m?_?S==="garden"?v.Grass:S==="water"?v.Air:S==="court"?v.Gravel:v.Paving:m<Xr+1?v.Sand:p==="Snow Peaks"&&m>30?v.Snow:v.Grass:y>m-4?v.Dirt:v.Stone;if(y>ie+3&&y<m-7&&(Math.abs(ts(d/27,y/19,f/27,n+381)-.5)<.065&&ts(d/43,y/31,f/43,n+13)>.51||y<-8&&ts(d/36,y/15,f/36,n+811)>.72)&&(A=y<-54?v.Lava:y<-28&&ts(d/64,y/32,f/64,n+719)>.68?v.Water:v.Air),A===v.Stone){const R=ne(d,f,n,y);R>.977?A=v.Coal:R>.962&&y<24?A=v.Iron:R>.954&&y<-18?A=v.Jade:R>.948&&y<-8&&(A=v.Gold)}S==="water"&&y>=18&&(A=y===20?v.Air:v.Water),w&&y===m&&(A=d===350||d===374||(f-120)%16===0?v.Moss:(d-351)%7===0?v.Water:v.Farmland),A===v.Stone&&y<-8&&(A=y<-36?v.Basalt:ts(d/22,y/7,f/22,n+300)>.63?v.Marble:v.Stone),s.set(h,y,u,y===ie?v.Obsidian:A)}w&&s.get(h,m,u)===v.Farmland&&s.set(h,m+1,u,oe(v.Rice,3))}for(let u=o-4;u<o+20;u++)for(let h=r-4;h<r+20;h++){const d=Hi(h,u,n);if(d&&ai(h-d.ox,u-d.oz)||dr(h,u))continue;const f=Math.round((h-80)/160)*160+80,g=Math.round((u-80)/160)*160+80;if(Math.abs(h-f)<8&&Math.abs(u-g)<8||ne(h,u,n+24)<.992)continue;const _=ns(h,u,n);if(_<=Xr)continue;const m=Lo(h,u,n);m==="Bamboo Forest"?a.fill(h,_+1,u,h,_+7,u,v.Bamboo):vs(a,h,_+1,u,m==="Cherry Blossom Valley",v.Log)}for(const u of l.values()){for(const h of u.byChunk.get(`${i},${t}`)??[])au(a,h);lu(a,u)}for(let u=Math.floor((o-5-80)/160)*160+80;u<o+21;u+=160)for(let h=Math.floor((r-5-80)/160)*160+80;h<r+21;h+=160){const d=Hi(h,u,n);if(d&&ai(h-d.ox,u-d.oz)||dr(h,u))continue;const f=ns(h,u,n)+1;for(let g=u-3;g<=u+3;g++)for(let _=h-3;_<=h+3;_++)a.fill(_,Math.min(f-1,ns(_,g,n)),g,_,f-1,g,v.Moss),a.fill(_,f,g,_,f+6,g,v.Air);for(const g of[h-2,h+2])for(const _ of[u-2,u+2])a.fill(g,f,_,g,f+3,_,v.Red);a.fill(h-3,f+4,u-3,h+3,f+4,u+3,v.JadeRoof),a.fill(h-2,f+5,u-2,h+2,f+5,u+2,v.JadeRoof),a.put(h,f,u,v.Chest),a.put(h,f+3,u,v.Lantern)}const c=ns(360,0,n);for(let u=Math.max(0,o);u<=Math.min(144,o+15);u++){const h=c-Math.floor(u/2);for(let d=358;d<=362;d++)a.fill(d,h-2,u,d,h+3,u,v.Air),a.put(d,h-1,u,v.Stone),a.put(d,h,u,u%2?v.Slab:v.Planks),u>5&&u%8===0&&((d===358||d===362)&&a.fill(d,h+1,u,d,h+3,u,v.DarkTimber),a.put(d,h+4,u,v.DarkTimber));u>5&&u%8===0&&a.put(360,h+3,u,v.Lantern)}return s.compact(),s}class ll{constructor(t,e={},n=!0){this.seed=t,this.edits=new Map(Object.entries(e));for(const[s,r]of this.edits)this.indexEdit(s,r);n&&typeof Worker<"u"&&(this.worker=new Worker(new URL(""+new URL("generation.worker-CAkWRslv.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.onmessage=s=>{const r=dn(s.data.cx,s.data.cz);s.data.epoch===this.epoch&&this.tickets.get(r)===s.data.ticket&&(this.onGeneration?.(s.data.elapsedMs),this.accept(s.data.cx,s.data.cz,Ur.from(s.data.sections)))},this.worker.onerror=()=>{this.worker?.terminate(),this.worker=void 0,this.pending.clear(),this.tickets.clear()})}chunks=new Map;edits=new Map;dirty=new Set;pending=new Set;dirtyEdits=new Map;editSequence=0;editChunks=new Map;worker;epoch=0;ticket=0;tickets=new Map;evictionBlocked=0;navRevision=0;onEvictionPending;onGeneration;onChange;accept(t,e,n){const s=dn(t,e);if(!(!this.pending.has(s)&&this.chunks.has(s))){for(let r=Ui;r<=Ni;r++)for(const[o,a]of this.editChunks.get(fn(t,r,e))??[]){const[l,c,u]=o.split(",").map(Number);n.set(me(l),c,me(u),a)}this.navRevision++,this.chunks.set(s,{cx:t,cz:e,blocks:n,revision:0}),this.pending.delete(s),this.tickets.delete(s),this.markDirty(t,e)}}ensure(t,e,n=!1){const s=dn(t,e);if(!(this.chunks.has(s)||this.pending.has(s)&&!n))if(this.pending.add(s),this.worker&&!n){const r=++this.ticket;this.tickets.set(s,r),this.worker.postMessage({cx:t,cz:e,seed:this.seed,epoch:this.epoch,ticket:r})}else this.accept(t,e,cu(t,e,this.seed))}get(t,e,n){return t=Math.floor(t),e=Math.floor(e),n=Math.floor(n),e<ie?v.Obsidian:e>ge?v.Air:this.chunks.get(dn(Ht(t),Ht(n)))?.blocks.get(me(t),e,me(n))??v.Air}loaded(t,e){return this.chunks.has(dn(Ht(t),Ht(e)))}set(t,e,n,s){if(![t,e,n,s].every(Number.isInteger)||e<=ie||e>ge)return!1;if(this.loaded(t,n)&&this.get(t,e,n)===s)return!0;this.navRevision++;const r=Ve(t,e,n);this.edits.set(r,s),this.indexEdit(r,s),this.dirtyEdits.set(fn(Ht(t),Ht(e),Ht(n)),++this.editSequence);const o=Ht(t),a=Ht(n),l=this.chunks.get(dn(o,a));return l&&(l.blocks.set(me(t),e,me(n),s),l.revision++),this.markSection(o,Ht(e),a),me(t)===0&&this.markSection(o-1,Ht(e),a),me(t)===15&&this.markSection(o+1,Ht(e),a),me(n)===0&&this.markSection(o,Ht(e),a-1),me(n)===15&&this.markSection(o,Ht(e),a+1),me(e)===0&&this.markSection(o,Ht(e)-1,a),me(e)===15&&this.markSection(o,Ht(e)+1,a),this.onChange?.(t,e,n,s),!0}indexEdit(t,e){const[n,s,r]=t.split(",").map(Number),o=fn(Ht(n),Ht(s),Ht(r));let a=this.editChunks.get(o);a||this.editChunks.set(o,a=new Map),a.set(t,e)}captureChanges(){const t=new Map([...this.dirtyEdits].sort(([n],[s])=>n.localeCompare(s))),e=[...t.keys()].map(n=>{const s=[];for(const[o,a]of this.editChunks.get(n)??[]){const[l,c,u]=o.split(",").map(Number);s.push([ms(me(l),me(c),me(u)),a])}s.sort((o,a)=>o[0]-a[0]);const r=new Uint16Array(s.length*2);for(let o=0;o<s.length;o++)r[o*2]=s[o][0],r[o*2+1]=s[o][1];return{key:n,entries:r}});return{revisions:t,chunks:e}}acknowledgeChanges(t){for(const[e,n]of t)this.dirtyEdits.get(e)===n&&this.dirtyEdits.delete(e)}markSection(t,e,n){e>=Ui&&e<=Ni&&this.dirty.add(fn(t,e,n))}markDirty(t,e){for(const[n,s]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const r=this.chunks.get(dn(t+n,e+s));if(r)for(const o of r.blocks.sections.keys())this.markSection(r.cx,o,r.cz)}}hasDirtyColumn(t,e){for(let n=Ui;n<=Ni;n++)if(this.dirtyEdits.has(fn(t,n,e)))return!0;return!1}stream(t,e,n,s=0){const r=Ht(t),o=Ht(e);let a=0;const l=[];for(let u=-n;u<=n;u++)for(let h=-n;h<=n;h++)h*h+u*u<=(n+.5)**2&&l.push([r+h,o+u,h*h+u*u+.7*(h*Math.sin(s)+u*Math.cos(s))]);l.sort((u,h)=>u[2]-h[2]);for(const[u,h]of l){if(this.evictionBlocked>64||this.pending.size>=8||a>=4)break;const d=dn(u,h);!this.chunks.has(d)&&!this.pending.has(d)&&(this.ensure(u,h),a++)}const c=[];this.evictionBlocked=0;for(const u of this.pending){const[h,d]=u.split(",").map(Number);(Math.abs(h-r)>n+2||Math.abs(d-o)>n+2)&&(this.pending.delete(u),this.tickets.delete(u))}for(const[u,h]of this.chunks)if(Math.abs(h.cx-r)>n+2||Math.abs(h.cz-o)>n+2){if(this.hasDirtyColumn(h.cx,h.cz)){this.evictionBlocked++;continue}this.navRevision++,this.chunks.delete(u);for(let d=Ui;d<=Ni;d++)this.dirty.delete(fn(h.cx,d,h.cz));this.markDirty(h.cx,h.cz),c.push(u)}return this.evictionBlocked&&this.onEvictionPending?.(),c}dispose(){this.epoch++,this.worker?.terminate(),this.worker=void 0,this.chunks.clear(),this.pending.clear(),this.tickets.clear(),this.dirty.clear(),this.dirtyEdits.clear(),this.editChunks.clear(),this.edits.clear(),this.onEvictionPending=void 0,this.onGeneration=void 0,this.onChange=void 0}}/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Pa="180",hu=0,cl=1,uu=2,Uc=1,du=2,Ln=3,In=0,Xe=1,gn=2,Vn=0,Vi=1,hl=2,ul=3,dl=4,fu=5,ei=100,pu=101,mu=102,gu=103,vu=104,_u=200,xu=201,yu=202,Mu=203,Do=204,Io=205,Su=206,bu=207,Eu=208,wu=209,Tu=210,Au=211,Ru=212,Cu=213,Pu=214,Uo=0,No=1,ko=2,Xi=3,Fo=4,zo=5,Oo=6,Bo=7,La=0,Lu=1,Du=2,Wn=0,Iu=1,Uu=2,Nu=3,ku=4,Fu=5,zu=6,Ou=7,Nc=300,$i=301,qi=302,Ho=303,Go=304,zr=306,Vo=1e3,si=1001,Wo=1002,$e=1003,Bu=1004,ds=1005,_n=1006,$r=1007,ri=1008,Sn=1009,kc=1010,Fc=1011,_s=1012,Da=1013,ci=1014,xn=1015,Ts=1016,Ia=1017,Ua=1018,xs=1020,zc=35902,Oc=35899,Bc=1021,Hc=1022,hn=1023,ys=1026,Ms=1027,Na=1028,ka=1029,Gc=1030,Fa=1031,za=1033,fr=33776,pr=33777,mr=33778,gr=33779,Xo=35840,$o=35841,qo=35842,Yo=35843,jo=36196,Ko=37492,Jo=37496,Zo=37808,Qo=37809,ta=37810,ea=37811,na=37812,ia=37813,sa=37814,ra=37815,oa=37816,aa=37817,la=37818,ca=37819,ha=37820,ua=37821,da=36492,fa=36494,pa=36495,ma=36283,ga=36284,va=36285,_a=36286,Hu=3200,Gu=3201,Vc=0,Vu=1,Bn="",Ge="srgb",Yi="srgb-linear",wr="linear",ee="srgb",vi=7680,fl=519,Wu=512,Xu=513,$u=514,Wc=515,qu=516,Yu=517,ju=518,Ku=519,pl=35044,Ju=35048,ml="300 es",yn=2e3,Tr=2001;class Ji{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const s=n[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const De=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],vr=Math.PI/180,xa=180/Math.PI;function As(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(De[i&255]+De[i>>8&255]+De[i>>16&255]+De[i>>24&255]+"-"+De[t&255]+De[t>>8&255]+"-"+De[t>>16&15|64]+De[t>>24&255]+"-"+De[e&63|128]+De[e>>8&255]+"-"+De[e>>16&255]+De[e>>24&255]+De[n&255]+De[n>>8&255]+De[n>>16&255]+De[n>>24&255]).toLowerCase()}function $t(i,t,e){return Math.max(t,Math.min(e,i))}function Zu(i,t){return(i%t+t)%t}function qr(i,t,e){return(1-e)*i+e*t}function is(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Oe(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Jt{constructor(t=0,e=0){Jt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar($t(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos($t(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Rs{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],u=n[s+2],h=n[s+3];const d=r[o+0],f=r[o+1],g=r[o+2],_=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=_;return}if(h!==_||l!==d||c!==f||u!==g){let m=1-a;const p=l*d+c*f+u*g+h*_,S=p>=0?1:-1,w=1-p*p;if(w>Number.EPSILON){const A=Math.sqrt(w),R=Math.atan2(A,p*S);m=Math.sin(m*R)/A,a=Math.sin(a*R)/A}const y=a*S;if(l=l*m+d*y,c=c*m+f*y,u=u*m+g*y,h=h*m+_*y,m===1-a){const A=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=A,c*=A,u*=A,h*=A}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],u=n[s+3],h=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return t[e]=a*g+u*h+l*f-c*d,t[e+1]=l*g+u*d+c*h-a*f,t[e+2]=c*g+u*f+a*d-l*h,t[e+3]=u*g-a*h-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(s/2),h=a(r/2),d=l(n/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"YXZ":this._x=d*u*h+c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"ZXY":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h-d*f*g;break;case"ZYX":this._x=d*u*h-c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h+d*f*g;break;case"YZX":this._x=d*u*h+c*f*g,this._y=c*f*h+d*u*g,this._z=c*u*g-d*f*h,this._w=c*u*h-d*f*g;break;case"XZY":this._x=d*u*h-c*f*g,this._y=c*f*h-d*u*g,this._z=c*u*g+d*f*h,this._w=c*u*h+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=n+a+h;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(n>a&&n>h){const f=2*Math.sqrt(1+n-a-h);this._w=(u-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>h){const f=2*Math.sqrt(1+a-n-h);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+u)/f}else{const f=2*Math.sqrt(1+h-n-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs($t(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-n*c,this._z=r*u+o*c+n*l-s*a,this._w=o*u-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const f=1-e;return this._w=f*o+e*this._w,this._x=f*n+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=s*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class z{constructor(t=0,e=0,n=0){z.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(gl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(gl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),u=2*(a*e-r*s),h=2*(r*n-o*e);return this.x=e+l*c+o*h-a*u,this.y=n+l*u+a*c-r*h,this.z=s+l*h+r*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this.z=$t(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this.z=$t(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar($t(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Yr.copy(this).projectOnVector(t),this.sub(Yr)}reflect(t){return this.sub(Yr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos($t(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Yr=new z,gl=new Rs;class zt{constructor(t,e,n,s,r,o,a,l,c){zt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){const u=this.elements;return u[0]=t,u[1]=s,u[2]=a,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],f=n[5],g=n[8],_=s[0],m=s[3],p=s[6],S=s[1],w=s[4],y=s[7],A=s[2],R=s[5],P=s[8];return r[0]=o*_+a*S+l*A,r[3]=o*m+a*w+l*R,r[6]=o*p+a*y+l*P,r[1]=c*_+u*S+h*A,r[4]=c*m+u*w+h*R,r[7]=c*p+u*y+h*P,r[2]=d*_+f*S+g*A,r[5]=d*m+f*w+g*R,r[8]=d*p+f*y+g*P,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-n*r*u+n*a*l+s*r*c-s*o*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=u*o-a*c,d=a*l-u*r,f=c*r-o*l,g=e*h+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=h*_,t[1]=(s*c-u*n)*_,t[2]=(a*n-s*o)*_,t[3]=d*_,t[4]=(u*e-s*l)*_,t[5]=(s*r-a*e)*_,t[6]=f*_,t[7]=(n*l-c*e)*_,t[8]=(o*e-n*r)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(jr.makeScale(t,e)),this}rotate(t){return this.premultiply(jr.makeRotation(-t)),this}translate(t,e){return this.premultiply(jr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const jr=new zt;function Xc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Ar(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Qu(){const i=Ar("canvas");return i.style.display="block",i}const vl={};function Ss(i){i in vl||(vl[i]=!0,console.warn(i))}function td(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const _l=new zt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xl=new zt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function ed(){const i={enabled:!0,workingColorSpace:Yi,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===ee&&(s.r=Dn(s.r),s.g=Dn(s.g),s.b=Dn(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===ee&&(s.r=Wi(s.r),s.g=Wi(s.g),s.b=Wi(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Bn?wr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Ss("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Ss("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Yi]:{primaries:t,whitePoint:n,transfer:wr,toXYZ:_l,fromXYZ:xl,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ge},outputColorSpaceConfig:{drawingBufferColorSpace:Ge}},[Ge]:{primaries:t,whitePoint:n,transfer:ee,toXYZ:_l,fromXYZ:xl,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ge}}}),i}const Yt=ed();function Dn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Wi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let _i;class nd{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{_i===void 0&&(_i=Ar("canvas")),_i.width=t.width,_i.height=t.height;const s=_i.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=_i}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ar("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Dn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Dn(e[n]/255)*255):e[n]=Dn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let id=0;class Oa{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:id++}),this.uuid=As(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):e instanceof VideoFrame?t.set(e.displayHeight,e.displayWidth,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Kr(s[o].image)):r.push(Kr(s[o]))}else r=Kr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Kr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?nd.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let sd=0;const Jr=new z;class Ne extends Ji{constructor(t=Ne.DEFAULT_IMAGE,e=Ne.DEFAULT_MAPPING,n=si,s=si,r=_n,o=ri,a=hn,l=Sn,c=Ne.DEFAULT_ANISOTROPY,u=Bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:sd++}),this.uuid=As(),this.name="",this.source=new Oa(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Jt(0,0),this.repeat=new Jt(1,1),this.center=new Jt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new zt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Jr).x}get height(){return this.source.getSize(Jr).y}get depth(){return this.source.getSize(Jr).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Nc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Vo:t.x=t.x-Math.floor(t.x);break;case si:t.x=t.x<0?0:1;break;case Wo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Vo:t.y=t.y-Math.floor(t.y);break;case si:t.y=t.y<0?0:1;break;case Wo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ne.DEFAULT_IMAGE=null;Ne.DEFAULT_MAPPING=Nc;Ne.DEFAULT_ANISOTROPY=1;class ve{constructor(t=0,e=0,n=0,s=1){ve.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],f=l[5],g=l[9],_=l[2],m=l[6],p=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const w=(c+1)/2,y=(f+1)/2,A=(p+1)/2,R=(u+d)/4,P=(h+_)/4,N=(g+m)/4;return w>y&&w>A?w<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(w),s=R/n,r=P/n):y>A?y<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),n=R/s,r=N/s):A<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(A),n=P/r,s=N/r),this.set(n,s,r,e),this}let S=Math.sqrt((m-g)*(m-g)+(h-_)*(h-_)+(d-u)*(d-u));return Math.abs(S)<.001&&(S=1),this.x=(m-g)/S,this.y=(h-_)/S,this.z=(d-u)/S,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this.z=$t(this.z,t.z,e.z),this.w=$t(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this.z=$t(this.z,t,e),this.w=$t(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar($t(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class rd extends Ji{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:_n,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ve(0,0,t,e),this.scissorTest=!1,this.viewport=new ve(0,0,t,e);const s={width:t,height:e,depth:n.depth},r=new Ne(s);this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){const e={minFilter:_n,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const s=Object.assign({},t.textures[e].image);this.textures[e].source=new Oa(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class hi extends rd{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class $c extends Ne{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=$e,this.minFilter=$e,this.wrapR=si,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class od extends Ne{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=$e,this.minFilter=$e,this.wrapR=si,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class di{constructor(t=new z(1/0,1/0,1/0),e=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(an.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(an.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=an.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,an):an.fromBufferAttribute(r,o),an.applyMatrix4(t.matrixWorld),this.expandByPoint(an);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ks.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ks.copy(n.boundingBox)),ks.applyMatrix4(t.matrixWorld),this.union(ks)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,an),an.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ss),Fs.subVectors(this.max,ss),xi.subVectors(t.a,ss),yi.subVectors(t.b,ss),Mi.subVectors(t.c,ss),Un.subVectors(yi,xi),Nn.subVectors(Mi,yi),qn.subVectors(xi,Mi);let e=[0,-Un.z,Un.y,0,-Nn.z,Nn.y,0,-qn.z,qn.y,Un.z,0,-Un.x,Nn.z,0,-Nn.x,qn.z,0,-qn.x,-Un.y,Un.x,0,-Nn.y,Nn.x,0,-qn.y,qn.x,0];return!Zr(e,xi,yi,Mi,Fs)||(e=[1,0,0,0,1,0,0,0,1],!Zr(e,xi,yi,Mi,Fs))?!1:(zs.crossVectors(Un,Nn),e=[zs.x,zs.y,zs.z],Zr(e,xi,yi,Mi,Fs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,an).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(an).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Tn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Tn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Tn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Tn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Tn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Tn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Tn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Tn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Tn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Tn=[new z,new z,new z,new z,new z,new z,new z,new z],an=new z,ks=new di,xi=new z,yi=new z,Mi=new z,Un=new z,Nn=new z,qn=new z,ss=new z,Fs=new z,zs=new z,Yn=new z;function Zr(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Yn.fromArray(i,r);const a=s.x*Math.abs(Yn.x)+s.y*Math.abs(Yn.y)+s.z*Math.abs(Yn.z),l=t.dot(Yn),c=e.dot(Yn),u=n.dot(Yn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const ad=new di,rs=new z,Qr=new z;class fi{constructor(t=new z,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):ad.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;rs.subVectors(t,this.center);const e=rs.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(rs,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Qr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(rs.copy(t.center).add(Qr)),this.expandByPoint(rs.copy(t.center).sub(Qr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}const An=new z,to=new z,Os=new z,kn=new z,eo=new z,Bs=new z,no=new z;class Ba{constructor(t=new z,e=new z(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,An)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=An.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(An.copy(this.origin).addScaledVector(this.direction,e),An.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){to.copy(t).add(e).multiplyScalar(.5),Os.copy(e).sub(t).normalize(),kn.copy(this.origin).sub(to);const r=t.distanceTo(e)*.5,o=-this.direction.dot(Os),a=kn.dot(this.direction),l=-kn.dot(Os),c=kn.lengthSq(),u=Math.abs(1-o*o);let h,d,f,g;if(u>0)if(h=o*l-a,d=o*a-l,g=r*u,h>=0)if(d>=-g)if(d<=g){const _=1/u;h*=_,d*=_,f=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d=-r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-l),r),f=-h*h+d*(d+2*l)+c);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(to).addScaledVector(Os,d),f}intersectSphere(t,e){An.subVectors(t.center,this.origin);const n=An.dot(this.direction),s=An.dot(An)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),u>=0?(r=(t.min.y-d.y)*u,o=(t.max.y-d.y)*u):(r=(t.max.y-d.y)*u,o=(t.min.y-d.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(a=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,An)!==null}intersectTriangle(t,e,n,s,r){eo.subVectors(e,t),Bs.subVectors(n,t),no.crossVectors(eo,Bs);let o=this.direction.dot(no),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;kn.subVectors(this.origin,t);const l=a*this.direction.dot(Bs.crossVectors(kn,Bs));if(l<0)return null;const c=a*this.direction.dot(eo.cross(kn));if(c<0||l+c>o)return null;const u=-a*kn.dot(no);return u<0?null:this.at(u/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ae{constructor(t,e,n,s,r,o,a,l,c,u,h,d,f,g,_,m){ae.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,_,m)}set(t,e,n,s,r,o,a,l,c,u,h,d,f,g,_,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=g,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ae().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Si.setFromMatrixColumn(t,0).length(),r=1/Si.setFromMatrixColumn(t,1).length(),o=1/Si.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(t.order==="XYZ"){const d=o*u,f=o*h,g=a*u,_=a*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=f+g*c,e[5]=d-_*c,e[9]=-a*l,e[2]=_-d*c,e[6]=g+f*c,e[10]=o*l}else if(t.order==="YXZ"){const d=l*u,f=l*h,g=c*u,_=c*h;e[0]=d+_*a,e[4]=g*a-f,e[8]=o*c,e[1]=o*h,e[5]=o*u,e[9]=-a,e[2]=f*a-g,e[6]=_+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*u,f=l*h,g=c*u,_=c*h;e[0]=d-_*a,e[4]=-o*h,e[8]=g+f*a,e[1]=f+g*a,e[5]=o*u,e[9]=_-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*u,f=o*h,g=a*u,_=a*h;e[0]=l*u,e[4]=g*c-f,e[8]=d*c+_,e[1]=l*h,e[5]=_*c+d,e[9]=f*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,f=o*c,g=a*l,_=a*c;e[0]=l*u,e[4]=_-d*h,e[8]=g*h+f,e[1]=h,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=f*h+g,e[10]=d-_*h}else if(t.order==="XZY"){const d=o*l,f=o*c,g=a*l,_=a*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+_,e[5]=o*u,e[9]=f*h-g,e[2]=g*h-f,e[6]=a*u,e[10]=_*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(ld,t,cd)}lookAt(t,e,n){const s=this.elements;return je.subVectors(t,e),je.lengthSq()===0&&(je.z=1),je.normalize(),Fn.crossVectors(n,je),Fn.lengthSq()===0&&(Math.abs(n.z)===1?je.x+=1e-4:je.z+=1e-4,je.normalize(),Fn.crossVectors(n,je)),Fn.normalize(),Hs.crossVectors(je,Fn),s[0]=Fn.x,s[4]=Hs.x,s[8]=je.x,s[1]=Fn.y,s[5]=Hs.y,s[9]=je.y,s[2]=Fn.z,s[6]=Hs.z,s[10]=je.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],f=n[13],g=n[2],_=n[6],m=n[10],p=n[14],S=n[3],w=n[7],y=n[11],A=n[15],R=s[0],P=s[4],N=s[8],b=s[12],E=s[1],L=s[5],k=s[9],H=s[13],V=s[2],q=s[6],X=s[10],et=s[14],G=s[3],Z=s[7],ot=s[11],ft=s[15];return r[0]=o*R+a*E+l*V+c*G,r[4]=o*P+a*L+l*q+c*Z,r[8]=o*N+a*k+l*X+c*ot,r[12]=o*b+a*H+l*et+c*ft,r[1]=u*R+h*E+d*V+f*G,r[5]=u*P+h*L+d*q+f*Z,r[9]=u*N+h*k+d*X+f*ot,r[13]=u*b+h*H+d*et+f*ft,r[2]=g*R+_*E+m*V+p*G,r[6]=g*P+_*L+m*q+p*Z,r[10]=g*N+_*k+m*X+p*ot,r[14]=g*b+_*H+m*et+p*ft,r[3]=S*R+w*E+y*V+A*G,r[7]=S*P+w*L+y*q+A*Z,r[11]=S*N+w*k+y*X+A*ot,r[15]=S*b+w*H+y*et+A*ft,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],f=t[14],g=t[3],_=t[7],m=t[11],p=t[15];return g*(+r*l*h-s*c*h-r*a*d+n*c*d+s*a*f-n*l*f)+_*(+e*l*f-e*c*d+r*o*d-s*o*f+s*c*u-r*l*u)+m*(+e*c*h-e*a*f-r*o*h+n*o*f+r*a*u-n*c*u)+p*(-s*a*u-e*l*h+e*a*d+s*o*h-n*o*d+n*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],f=t[11],g=t[12],_=t[13],m=t[14],p=t[15],S=h*m*c-_*d*c+_*l*f-a*m*f-h*l*p+a*d*p,w=g*d*c-u*m*c-g*l*f+o*m*f+u*l*p-o*d*p,y=u*_*c-g*h*c+g*a*f-o*_*f-u*a*p+o*h*p,A=g*h*l-u*_*l-g*a*d+o*_*d+u*a*m-o*h*m,R=e*S+n*w+s*y+r*A;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const P=1/R;return t[0]=S*P,t[1]=(_*d*r-h*m*r-_*s*f+n*m*f+h*s*p-n*d*p)*P,t[2]=(a*m*r-_*l*r+_*s*c-n*m*c-a*s*p+n*l*p)*P,t[3]=(h*l*r-a*d*r-h*s*c+n*d*c+a*s*f-n*l*f)*P,t[4]=w*P,t[5]=(u*m*r-g*d*r+g*s*f-e*m*f-u*s*p+e*d*p)*P,t[6]=(g*l*r-o*m*r-g*s*c+e*m*c+o*s*p-e*l*p)*P,t[7]=(o*d*r-u*l*r+u*s*c-e*d*c-o*s*f+e*l*f)*P,t[8]=y*P,t[9]=(g*h*r-u*_*r-g*n*f+e*_*f+u*n*p-e*h*p)*P,t[10]=(o*_*r-g*a*r+g*n*c-e*_*c-o*n*p+e*a*p)*P,t[11]=(u*a*r-o*h*r-u*n*c+e*h*c+o*n*f-e*a*f)*P,t[12]=A*P,t[13]=(u*_*s-g*h*s+g*n*d-e*_*d-u*n*m+e*h*m)*P,t[14]=(g*a*s-o*_*s-g*n*l+e*_*l+o*n*m-e*a*m)*P,t[15]=(o*h*s-u*a*s+u*n*l-e*h*l-o*n*d+e*a*d)*P,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,u=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+n,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,u=o+o,h=a+a,d=r*c,f=r*u,g=r*h,_=o*u,m=o*h,p=a*h,S=l*c,w=l*u,y=l*h,A=n.x,R=n.y,P=n.z;return s[0]=(1-(_+p))*A,s[1]=(f+y)*A,s[2]=(g-w)*A,s[3]=0,s[4]=(f-y)*R,s[5]=(1-(d+p))*R,s[6]=(m+S)*R,s[7]=0,s[8]=(g+w)*P,s[9]=(m-S)*P,s[10]=(1-(d+_))*P,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Si.set(s[0],s[1],s[2]).length();const o=Si.set(s[4],s[5],s[6]).length(),a=Si.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],ln.copy(this);const c=1/r,u=1/o,h=1/a;return ln.elements[0]*=c,ln.elements[1]*=c,ln.elements[2]*=c,ln.elements[4]*=u,ln.elements[5]*=u,ln.elements[6]*=u,ln.elements[8]*=h,ln.elements[9]*=h,ln.elements[10]*=h,e.setFromRotationMatrix(ln),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=yn,l=!1){const c=this.elements,u=2*r/(e-t),h=2*r/(n-s),d=(e+t)/(e-t),f=(n+s)/(n-s);let g,_;if(l)g=r/(o-r),_=o*r/(o-r);else if(a===yn)g=-(o+r)/(o-r),_=-2*o*r/(o-r);else if(a===Tr)g=-o/(o-r),_=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=yn,l=!1){const c=this.elements,u=2/(e-t),h=2/(n-s),d=-(e+t)/(e-t),f=-(n+s)/(n-s);let g,_;if(l)g=1/(o-r),_=o/(o-r);else if(a===yn)g=-2/(o-r),_=-(o+r)/(o-r);else if(a===Tr)g=-1/(o-r),_=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=h,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Si=new z,ln=new ae,ld=new z(0,0,0),cd=new z(1,1,1),Fn=new z,Hs=new z,je=new z,yl=new ae,Ml=new Rs;class bn{constructor(t=0,e=0,n=0,s=bn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin($t(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-$t(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin($t(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-$t(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin($t(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-$t(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return yl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(yl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Ml.setFromEuler(this),this.setFromQuaternion(Ml,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}bn.DEFAULT_ORDER="XYZ";class qc{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let hd=0;const Sl=new z,bi=new Rs,Rn=new ae,Gs=new z,os=new z,ud=new z,dd=new Rs,bl=new z(1,0,0),El=new z(0,1,0),wl=new z(0,0,1),Tl={type:"added"},fd={type:"removed"},Ei={type:"childadded",child:null},io={type:"childremoved",child:null};class be extends Ji{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:hd++}),this.uuid=As(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=be.DEFAULT_UP.clone();const t=new z,e=new bn,n=new Rs,s=new z(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ae},normalMatrix:{value:new zt}}),this.matrix=new ae,this.matrixWorld=new ae,this.matrixAutoUpdate=be.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=be.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new qc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return bi.setFromAxisAngle(t,e),this.quaternion.multiply(bi),this}rotateOnWorldAxis(t,e){return bi.setFromAxisAngle(t,e),this.quaternion.premultiply(bi),this}rotateX(t){return this.rotateOnAxis(bl,t)}rotateY(t){return this.rotateOnAxis(El,t)}rotateZ(t){return this.rotateOnAxis(wl,t)}translateOnAxis(t,e){return Sl.copy(t).applyQuaternion(this.quaternion),this.position.add(Sl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(bl,t)}translateY(t){return this.translateOnAxis(El,t)}translateZ(t){return this.translateOnAxis(wl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Rn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Gs.copy(t):Gs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),os.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Rn.lookAt(os,Gs,this.up):Rn.lookAt(Gs,os,this.up),this.quaternion.setFromRotationMatrix(Rn),s&&(Rn.extractRotation(s.matrixWorld),bi.setFromRotationMatrix(Rn),this.quaternion.premultiply(bi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Tl),Ei.child=t,this.dispatchEvent(Ei),Ei.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(fd),io.child=t,this.dispatchEvent(io),io.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Rn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Rn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Rn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Tl),Ei.child=t,this.dispatchEvent(Ei),Ei.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,t,ud),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,dd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];r(t.shapes,h)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),h=o(t.shapes),d=o(t.skeletons),f=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}be.DEFAULT_UP=new z(0,1,0);be.DEFAULT_MATRIX_AUTO_UPDATE=!0;be.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const cn=new z,Cn=new z,so=new z,Pn=new z,wi=new z,Ti=new z,Al=new z,ro=new z,oo=new z,ao=new z,lo=new ve,co=new ve,ho=new ve;class nn{constructor(t=new z,e=new z,n=new z){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),cn.subVectors(t,e),s.cross(cn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){cn.subVectors(s,e),Cn.subVectors(n,e),so.subVectors(t,e);const o=cn.dot(cn),a=cn.dot(Cn),l=cn.dot(so),c=Cn.dot(Cn),u=Cn.dot(so),h=o*c-a*a;if(h===0)return r.set(0,0,0),null;const d=1/h,f=(c*l-a*u)*d,g=(o*u-a*l)*d;return r.set(1-f-g,g,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Pn)===null?!1:Pn.x>=0&&Pn.y>=0&&Pn.x+Pn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Pn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Pn.x),l.addScaledVector(o,Pn.y),l.addScaledVector(a,Pn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return lo.setScalar(0),co.setScalar(0),ho.setScalar(0),lo.fromBufferAttribute(t,e),co.fromBufferAttribute(t,n),ho.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(lo,r.x),o.addScaledVector(co,r.y),o.addScaledVector(ho,r.z),o}static isFrontFacing(t,e,n,s){return cn.subVectors(n,e),Cn.subVectors(t,e),cn.cross(Cn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return cn.subVectors(this.c,this.b),Cn.subVectors(this.a,this.b),cn.cross(Cn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return nn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return nn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return nn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return nn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return nn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;wi.subVectors(s,n),Ti.subVectors(r,n),ro.subVectors(t,n);const l=wi.dot(ro),c=Ti.dot(ro);if(l<=0&&c<=0)return e.copy(n);oo.subVectors(t,s);const u=wi.dot(oo),h=Ti.dot(oo);if(u>=0&&h<=u)return e.copy(s);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(n).addScaledVector(wi,o);ao.subVectors(t,r);const f=wi.dot(ao),g=Ti.dot(ao);if(g>=0&&f<=g)return e.copy(r);const _=f*c-l*g;if(_<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(Ti,a);const m=u*g-f*h;if(m<=0&&h-u>=0&&f-g>=0)return Al.subVectors(r,s),a=(h-u)/(h-u+(f-g)),e.copy(s).addScaledVector(Al,a);const p=1/(m+_+d);return o=_*p,a=d*p,e.copy(n).addScaledVector(wi,o).addScaledVector(Ti,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Yc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},zn={h:0,s:0,l:0},Vs={h:0,s:0,l:0};function uo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class kt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ge){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Yt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Yt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Yt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Yt.workingColorSpace){if(t=Zu(t,1),e=$t(e,0,1),n=$t(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=uo(o,r,t+1/3),this.g=uo(o,r,t),this.b=uo(o,r,t-1/3)}return Yt.colorSpaceToWorking(this,s),this}setStyle(t,e=Ge){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ge){const n=Yc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Dn(t.r),this.g=Dn(t.g),this.b=Dn(t.b),this}copyLinearToSRGB(t){return this.r=Wi(t.r),this.g=Wi(t.g),this.b=Wi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ge){return Yt.workingToColorSpace(Ie.copy(this),t),Math.round($t(Ie.r*255,0,255))*65536+Math.round($t(Ie.g*255,0,255))*256+Math.round($t(Ie.b*255,0,255))}getHexString(t=Ge){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Yt.workingColorSpace){Yt.workingToColorSpace(Ie.copy(this),e);const n=Ie.r,s=Ie.g,r=Ie.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case n:l=(s-r)/h+(s<r?6:0);break;case s:l=(r-n)/h+2;break;case r:l=(n-s)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Yt.workingColorSpace){return Yt.workingToColorSpace(Ie.copy(this),e),t.r=Ie.r,t.g=Ie.g,t.b=Ie.b,t}getStyle(t=Ge){Yt.workingToColorSpace(Ie.copy(this),t);const e=Ie.r,n=Ie.g,s=Ie.b;return t!==Ge?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(zn),this.setHSL(zn.h+t,zn.s+e,zn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(zn),t.getHSL(Vs);const n=qr(zn.h,Vs.h,e),s=qr(zn.s,Vs.s,e),r=qr(zn.l,Vs.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ie=new kt;kt.NAMES=Yc;let pd=0;class pi extends Ji{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:pd++}),this.uuid=As(),this.name="",this.type="Material",this.blending=Vi,this.side=In,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Do,this.blendDst=Io,this.blendEquation=ei,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new kt(0,0,0),this.blendAlpha=0,this.depthFunc=Xi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=fl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=vi,this.stencilZFail=vi,this.stencilZPass=vi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Vi&&(n.blending=this.blending),this.side!==In&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Do&&(n.blendSrc=this.blendSrc),this.blendDst!==Io&&(n.blendDst=this.blendDst),this.blendEquation!==ei&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Xi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==fl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==vi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==vi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==vi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Hn extends pi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new kt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=La,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const xe=new z,Ws=new Jt;let md=0;class rn{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:md++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=pl,this.updateRanges=[],this.gpuType=xn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ws.fromBufferAttribute(this,e),Ws.applyMatrix3(t),this.setXY(e,Ws.x,Ws.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)xe.fromBufferAttribute(this,e),xe.applyMatrix3(t),this.setXYZ(e,xe.x,xe.y,xe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)xe.fromBufferAttribute(this,e),xe.applyMatrix4(t),this.setXYZ(e,xe.x,xe.y,xe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)xe.fromBufferAttribute(this,e),xe.applyNormalMatrix(t),this.setXYZ(e,xe.x,xe.y,xe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)xe.fromBufferAttribute(this,e),xe.transformDirection(t),this.setXYZ(e,xe.x,xe.y,xe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=is(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Oe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=is(e,this.array)),e}setX(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=is(e,this.array)),e}setY(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=is(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=is(e,this.array)),e}setW(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),n=Oe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),n=Oe(n,this.array),s=Oe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),n=Oe(n,this.array),s=Oe(s,this.array),r=Oe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==pl&&(t.usage=this.usage),t}}class jc extends rn{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Kc extends rn{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Pe extends rn{constructor(t,e,n){super(new Float32Array(t),e,n)}}let gd=0;const tn=new ae,fo=new be,Ai=new z,Ke=new di,as=new di,Re=new z;class on extends Ji{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:gd++}),this.uuid=As(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Xc(t)?Kc:jc)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new zt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return tn.makeRotationFromQuaternion(t),this.applyMatrix4(tn),this}rotateX(t){return tn.makeRotationX(t),this.applyMatrix4(tn),this}rotateY(t){return tn.makeRotationY(t),this.applyMatrix4(tn),this}rotateZ(t){return tn.makeRotationZ(t),this.applyMatrix4(tn),this}translate(t,e,n){return tn.makeTranslation(t,e,n),this.applyMatrix4(tn),this}scale(t,e,n){return tn.makeScale(t,e,n),this.applyMatrix4(tn),this}lookAt(t){return fo.lookAt(t),fo.updateMatrix(),this.applyMatrix4(fo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ai).negate(),this.translate(Ai.x,Ai.y,Ai.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Pe(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new di);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];Ke.setFromBufferAttribute(r),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,Ke.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,Ke.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint(Ke.min),this.boundingBox.expandByPoint(Ke.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new fi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(t){const n=this.boundingSphere.center;if(Ke.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];as.setFromBufferAttribute(a),this.morphTargetsRelative?(Re.addVectors(Ke.min,as.min),Ke.expandByPoint(Re),Re.addVectors(Ke.max,as.max),Ke.expandByPoint(Re)):(Ke.expandByPoint(as.min),Ke.expandByPoint(as.max))}Ke.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Re.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Re.fromBufferAttribute(a,c),l&&(Ai.fromBufferAttribute(t,c),Re.add(Ai)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new rn(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let N=0;N<n.count;N++)a[N]=new z,l[N]=new z;const c=new z,u=new z,h=new z,d=new Jt,f=new Jt,g=new Jt,_=new z,m=new z;function p(N,b,E){c.fromBufferAttribute(n,N),u.fromBufferAttribute(n,b),h.fromBufferAttribute(n,E),d.fromBufferAttribute(r,N),f.fromBufferAttribute(r,b),g.fromBufferAttribute(r,E),u.sub(c),h.sub(c),f.sub(d),g.sub(d);const L=1/(f.x*g.y-g.x*f.y);isFinite(L)&&(_.copy(u).multiplyScalar(g.y).addScaledVector(h,-f.y).multiplyScalar(L),m.copy(h).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(L),a[N].add(_),a[b].add(_),a[E].add(_),l[N].add(m),l[b].add(m),l[E].add(m))}let S=this.groups;S.length===0&&(S=[{start:0,count:t.count}]);for(let N=0,b=S.length;N<b;++N){const E=S[N],L=E.start,k=E.count;for(let H=L,V=L+k;H<V;H+=3)p(t.getX(H+0),t.getX(H+1),t.getX(H+2))}const w=new z,y=new z,A=new z,R=new z;function P(N){A.fromBufferAttribute(s,N),R.copy(A);const b=a[N];w.copy(b),w.sub(A.multiplyScalar(A.dot(b))).normalize(),y.crossVectors(R,b);const L=y.dot(l[N])<0?-1:1;o.setXYZW(N,w.x,w.y,w.z,L)}for(let N=0,b=S.length;N<b;++N){const E=S[N],L=E.start,k=E.count;for(let H=L,V=L+k;H<V;H+=3)P(t.getX(H+0)),P(t.getX(H+1)),P(t.getX(H+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new rn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new z,r=new z,o=new z,a=new z,l=new z,c=new z,u=new z,h=new z;if(t)for(let d=0,f=t.count;d<f;d+=3){const g=t.getX(d+0),_=t.getX(d+1),m=t.getX(d+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,_),o.fromBufferAttribute(e,m),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(a,l){const c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u);let f=0,g=0;for(let _=0,m=l.length;_<m;_++){a.isInterleavedBufferAttribute?f=l[_]*a.data.stride+a.offset:f=l[_]*u;for(let p=0;p<u;p++)d[g++]=c[f++]}return new rn(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new on,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let u=0,h=c.length;u<h;u++){const d=c[u],f=t(d,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const f=c[h];u.push(f.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const s=t.attributes;for(const c in s){const u=s[c];this.setAttribute(c,u.clone(e))}const r=t.morphAttributes;for(const c in r){const u=[],h=r[c];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Rl=new ae,jn=new Ba,Xs=new fi,Cl=new z,$s=new z,qs=new z,Ys=new z,po=new z,js=new z,Pl=new z,Ks=new z;class Se extends be{constructor(t=new on,e=new Hn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){js.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=a[l],h=r[l];u!==0&&(po.fromBufferAttribute(h,t),o?js.addScaledVector(po,u):js.addScaledVector(po.sub(e),u))}e.add(js)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Xs.copy(n.boundingSphere),Xs.applyMatrix4(r),jn.copy(t.ray).recast(t.near),!(Xs.containsPoint(jn.origin)===!1&&(jn.intersectSphere(Xs,Cl)===null||jn.origin.distanceToSquared(Cl)>(t.far-t.near)**2))&&(Rl.copy(r).invert(),jn.copy(t.ray).applyMatrix4(Rl),!(n.boundingBox!==null&&jn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,jn)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const m=d[g],p=o[m.materialIndex],S=Math.max(m.start,f.start),w=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let y=S,A=w;y<A;y+=3){const R=a.getX(y),P=a.getX(y+1),N=a.getX(y+2);s=Js(this,p,t,n,c,u,h,R,P,N),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let m=g,p=_;m<p;m+=3){const S=a.getX(m),w=a.getX(m+1),y=a.getX(m+2);s=Js(this,o,t,n,c,u,h,S,w,y),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const m=d[g],p=o[m.materialIndex],S=Math.max(m.start,f.start),w=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let y=S,A=w;y<A;y+=3){const R=y,P=y+1,N=y+2;s=Js(this,p,t,n,c,u,h,R,P,N),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let m=g,p=_;m<p;m+=3){const S=m,w=m+1,y=m+2;s=Js(this,o,t,n,c,u,h,S,w,y),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function vd(i,t,e,n,s,r,o,a){let l;if(t.side===Xe?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===In,a),l===null)return null;Ks.copy(a),Ks.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(Ks);return c<e.near||c>e.far?null:{distance:c,point:Ks.clone(),object:i}}function Js(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,$s),i.getVertexPosition(l,qs),i.getVertexPosition(c,Ys);const u=vd(i,t,e,n,$s,qs,Ys,Pl);if(u){const h=new z;nn.getBarycoord(Pl,$s,qs,Ys,h),s&&(u.uv=nn.getInterpolatedAttribute(s,a,l,c,h,new Jt)),r&&(u.uv1=nn.getInterpolatedAttribute(r,a,l,c,h,new Jt)),o&&(u.normal=nn.getInterpolatedAttribute(o,a,l,c,h,new z),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new z,materialIndex:0};nn.getNormal($s,qs,Ys,d.normal),u.face=d,u.barycoord=h}return u}class sn extends on{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],u=[],h=[];let d=0,f=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Pe(c,3)),this.setAttribute("normal",new Pe(u,3)),this.setAttribute("uv",new Pe(h,2));function g(_,m,p,S,w,y,A,R,P,N,b){const E=y/P,L=A/N,k=y/2,H=A/2,V=R/2,q=P+1,X=N+1;let et=0,G=0;const Z=new z;for(let ot=0;ot<X;ot++){const ft=ot*L-H;for(let Ct=0;Ct<q;Ct++){const jt=Ct*E-k;Z[_]=jt*S,Z[m]=ft*w,Z[p]=V,c.push(Z.x,Z.y,Z.z),Z[_]=0,Z[m]=0,Z[p]=R>0?1:-1,u.push(Z.x,Z.y,Z.z),h.push(Ct/P),h.push(1-ot/N),et+=1}}for(let ot=0;ot<N;ot++)for(let ft=0;ft<P;ft++){const Ct=d+ft+q*ot,jt=d+ft+q*(ot+1),Gt=d+(ft+1)+q*(ot+1),Xt=d+(ft+1)+q*ot;l.push(Ct,jt,Xt),l.push(jt,Gt,Xt),G+=6}a.addGroup(f,G,b),f+=G,d+=et}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new sn(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ji(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Fe(i){const t={};for(let e=0;e<i.length;e++){const n=ji(i[e]);for(const s in n)t[s]=n[s]}return t}function _d(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Jc(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Yt.workingColorSpace}const xd={clone:ji,merge:Fe};var yd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Md=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class En extends pi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=yd,this.fragmentShader=Md,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ji(t.uniforms),this.uniformsGroups=_d(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Zc extends be{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ae,this.projectionMatrix=new ae,this.projectionMatrixInverse=new ae,this.coordinateSystem=yn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const On=new z,Ll=new Jt,Dl=new Jt;class Je extends Zc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=xa*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(vr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return xa*2*Math.atan(Math.tan(vr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){On.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(On.x,On.y).multiplyScalar(-t/On.z),On.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(On.x,On.y).multiplyScalar(-t/On.z)}getViewSize(t,e){return this.getViewBounds(t,Ll,Dl),e.subVectors(Dl,Ll)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(vr*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Ri=-90,Ci=1;class Sd extends be{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Je(Ri,Ci,t,e);s.layers=this.layers,this.add(s);const r=new Je(Ri,Ci,t,e);r.layers=this.layers,this.add(r);const o=new Je(Ri,Ci,t,e);o.layers=this.layers,this.add(o);const a=new Je(Ri,Ci,t,e);a.layers=this.layers,this.add(a);const l=new Je(Ri,Ci,t,e);l.layers=this.layers,this.add(l);const c=new Je(Ri,Ci,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(const c of e)this.remove(c);if(t===yn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Tr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,s),t.render(e,u),t.setRenderTarget(h,d,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Qc extends Ne{constructor(t=[],e=$i,n,s,r,o,a,l,c,u){super(t,e,n,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class bd extends hi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Qc(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new sn(5,5,5),r=new En({name:"CubemapFromEquirect",uniforms:ji(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Xe,blending:Vn});r.uniforms.tEquirect.value=e;const o=new Se(s,r),a=e.minFilter;return e.minFilter===ri&&(e.minFilter=_n),new Sd(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}class vn extends be{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Ed={type:"move"};class mo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new vn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new vn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new vn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const _ of t.hand.values()){const m=e.getJointPose(_,n),p=this._getHandJoint(c,_);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Ed)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new vn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}class Ha{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new kt(t),this.near=e,this.far=n}clone(){return new Ha(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Il extends be{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new bn,this.environmentIntensity=1,this.environmentRotation=new bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class wd extends Ne{constructor(t=null,e=1,n=1,s,r,o,a,l,c=$e,u=$e,h,d){super(null,o,a,l,c,u,s,r,h,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ul extends rn{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Pi=new ae,Nl=new ae,Zs=[],kl=new di,Td=new ae,ls=new Se,cs=new fi;class Ad extends Se{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Ul(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Td)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new di),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Pi),kl.copy(t.boundingBox).applyMatrix4(Pi),this.boundingBox.union(kl)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new fi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Pi),cs.copy(t.boundingSphere).applyMatrix4(Pi),this.boundingSphere.union(cs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(ls.geometry=this.geometry,ls.material=this.material,ls.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),cs.copy(this.boundingSphere),cs.applyMatrix4(n),t.ray.intersectsSphere(cs)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Pi),Nl.multiplyMatrices(n,Pi),ls.matrixWorld=Nl,ls.raycast(t,Zs);for(let o=0,a=Zs.length;o<a;o++){const l=Zs[o];l.instanceId=r,l.object=this,e.push(l)}Zs.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Ul(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new wd(new Float32Array(s*this.count),s,this.count,Na,xn));const r=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const go=new z,Rd=new z,Cd=new zt;class Qn{constructor(t=new z(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=go.subVectors(n,e).cross(Rd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(go),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Cd.getNormalMatrix(t),s=this.coplanarPoint(go).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Kn=new fi,Pd=new Jt(.5,.5),Qs=new z;class Ga{constructor(t=new Qn,e=new Qn,n=new Qn,s=new Qn,r=new Qn,o=new Qn){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=yn,n=!1){const s=this.planes,r=t.elements,o=r[0],a=r[1],l=r[2],c=r[3],u=r[4],h=r[5],d=r[6],f=r[7],g=r[8],_=r[9],m=r[10],p=r[11],S=r[12],w=r[13],y=r[14],A=r[15];if(s[0].setComponents(c-o,f-u,p-g,A-S).normalize(),s[1].setComponents(c+o,f+u,p+g,A+S).normalize(),s[2].setComponents(c+a,f+h,p+_,A+w).normalize(),s[3].setComponents(c-a,f-h,p-_,A-w).normalize(),n)s[4].setComponents(l,d,m,y).normalize(),s[5].setComponents(c-l,f-d,p-m,A-y).normalize();else if(s[4].setComponents(c-l,f-d,p-m,A-y).normalize(),e===yn)s[5].setComponents(c+l,f+d,p+m,A+y).normalize();else if(e===Tr)s[5].setComponents(l,d,m,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Kn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Kn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Kn)}intersectsSprite(t){Kn.center.set(0,0,0);const e=Pd.distanceTo(t.center);return Kn.radius=.7071067811865476+e,Kn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Kn)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(Qs.x=s.normal.x>0?t.max.x:t.min.x,Qs.y=s.normal.y>0?t.max.y:t.min.y,Qs.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Qs)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class th extends pi{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new kt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Rr=new z,Cr=new z,Fl=new ae,hs=new Ba,tr=new fi,vo=new z,zl=new z;class Ld extends be{constructor(t=new on,e=new th){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Rr.fromBufferAttribute(e,s-1),Cr.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Rr.distanceTo(Cr);t.setAttribute("lineDistance",new Pe(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),tr.copy(n.boundingSphere),tr.applyMatrix4(s),tr.radius+=r,t.ray.intersectsSphere(tr)===!1)return;Fl.copy(s).invert(),hs.copy(t.ray).applyMatrix4(Fl);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){const f=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let _=f,m=g-1;_<m;_+=c){const p=u.getX(_),S=u.getX(_+1),w=er(this,t,hs,l,p,S,_);w&&e.push(w)}if(this.isLineLoop){const _=u.getX(g-1),m=u.getX(f),p=er(this,t,hs,l,_,m,g-1);p&&e.push(p)}}else{const f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let _=f,m=g-1;_<m;_+=c){const p=er(this,t,hs,l,_,_+1,_);p&&e.push(p)}if(this.isLineLoop){const _=er(this,t,hs,l,g-1,f,g-1);_&&e.push(_)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function er(i,t,e,n,s,r,o){const a=i.geometry.attributes.position;if(Rr.fromBufferAttribute(a,s),Cr.fromBufferAttribute(a,r),e.distanceSqToSegment(Rr,Cr,vo,zl)>n)return;vo.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(vo);if(!(c<t.near||c>t.far))return{distance:c,point:zl.clone().applyMatrix4(i.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:i}}const Ol=new z,Bl=new z;class Dd extends Ld{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Ol.fromBufferAttribute(e,s),Bl.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Ol.distanceTo(Bl);t.setAttribute("lineDistance",new Pe(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class eh extends pi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new kt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Hl=new ae,ya=new Ba,nr=new fi,ir=new z;class Id extends be{constructor(t=new on,e=new eh){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),nr.copy(n.boundingSphere),nr.applyMatrix4(s),nr.radius+=r,t.ray.intersectsSphere(nr)===!1)return;Hl.copy(s).invert(),ya.copy(t.ray).applyMatrix4(Hl);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,h=n.attributes.position;if(c!==null){const d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=d,_=f;g<_;g++){const m=c.getX(g);ir.fromBufferAttribute(h,m),Gl(ir,m,l,s,t,e,this)}}else{const d=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let g=d,_=f;g<_;g++)ir.fromBufferAttribute(h,g),Gl(ir,g,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function Gl(i,t,e,n,s,r,o){const a=ya.distanceSqToPoint(i);if(a<e){const l=new z;ya.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class Ud extends Ne{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class nh extends Ne{constructor(t,e,n=ci,s,r,o,a=$e,l=$e,c,u=ys,h=1){if(u!==ys&&u!==Ms)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:t,height:e,depth:h};super(d,s,r,o,a,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Oa(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class ih extends Ne{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}const sr=new z,rr=new z,_o=new z,or=new nn;class Nd extends on{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){const s=Math.pow(10,4),r=Math.cos(vr*e),o=t.getIndex(),a=t.getAttribute("position"),l=o?o.count:a.count,c=[0,0,0],u=["a","b","c"],h=new Array(3),d={},f=[];for(let g=0;g<l;g+=3){o?(c[0]=o.getX(g),c[1]=o.getX(g+1),c[2]=o.getX(g+2)):(c[0]=g,c[1]=g+1,c[2]=g+2);const{a:_,b:m,c:p}=or;if(_.fromBufferAttribute(a,c[0]),m.fromBufferAttribute(a,c[1]),p.fromBufferAttribute(a,c[2]),or.getNormal(_o),h[0]=`${Math.round(_.x*s)},${Math.round(_.y*s)},${Math.round(_.z*s)}`,h[1]=`${Math.round(m.x*s)},${Math.round(m.y*s)},${Math.round(m.z*s)}`,h[2]=`${Math.round(p.x*s)},${Math.round(p.y*s)},${Math.round(p.z*s)}`,!(h[0]===h[1]||h[1]===h[2]||h[2]===h[0]))for(let S=0;S<3;S++){const w=(S+1)%3,y=h[S],A=h[w],R=or[u[S]],P=or[u[w]],N=`${y}_${A}`,b=`${A}_${y}`;b in d&&d[b]?(_o.dot(d[b].normal)<=r&&(f.push(R.x,R.y,R.z),f.push(P.x,P.y,P.z)),d[b]=null):N in d||(d[N]={index0:c[S],index1:c[w],normal:_o.clone()})}}for(const g in d)if(d[g]){const{index0:_,index1:m}=d[g];sr.fromBufferAttribute(a,_),rr.fromBufferAttribute(a,m),f.push(sr.x,sr.y,sr.z),f.push(rr.x,rr.y,rr.z)}this.setAttribute("position",new Pe(f,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}}class Or extends on{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,u=l+1,h=t/a,d=e/l,f=[],g=[],_=[],m=[];for(let p=0;p<u;p++){const S=p*d-o;for(let w=0;w<c;w++){const y=w*h-r;g.push(y,-S,0),_.push(0,0,1),m.push(w/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let S=0;S<a;S++){const w=S+c*p,y=S+c*(p+1),A=S+1+c*(p+1),R=S+1+c*p;f.push(w,y,R),f.push(y,A,R)}this.setIndex(f),this.setAttribute("position",new Pe(g,3)),this.setAttribute("normal",new Pe(_,3)),this.setAttribute("uv",new Pe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Or(t.width,t.height,t.widthSegments,t.heightSegments)}}class kd extends pi{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new kt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new kt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Vc,this.normalScale=new Jt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=La,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Fd extends pi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Hu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class zd extends pi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class sh extends be{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new kt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Od extends sh{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(be.DEFAULT_UP),this.updateMatrix(),this.groundColor=new kt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const xo=new ae,Vl=new z,Wl=new z;class Bd{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Jt(512,512),this.mapType=Sn,this.map=null,this.mapPass=null,this.matrix=new ae,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ga,this._frameExtents=new Jt(1,1),this._viewportCount=1,this._viewports=[new ve(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Vl.setFromMatrixPosition(t.matrixWorld),e.position.copy(Vl),Wl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Wl),e.updateMatrixWorld(),xo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(xo,e.coordinateSystem,e.reversedDepth),e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(xo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class rh extends Zc{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class Hd extends Bd{constructor(){super(new rh(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Gd extends sh{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(be.DEFAULT_UP),this.updateMatrix(),this.target=new be,this.shadow=new Hd}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Vd extends Je{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}function Xl(i,t,e,n){const s=Wd(n);switch(e){case Bc:return i*t;case Na:return i*t/s.components*s.byteLength;case ka:return i*t/s.components*s.byteLength;case Gc:return i*t*2/s.components*s.byteLength;case Fa:return i*t*2/s.components*s.byteLength;case Hc:return i*t*3/s.components*s.byteLength;case hn:return i*t*4/s.components*s.byteLength;case za:return i*t*4/s.components*s.byteLength;case fr:case pr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case mr:case gr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case $o:case Yo:return Math.max(i,16)*Math.max(t,8)/4;case Xo:case qo:return Math.max(i,8)*Math.max(t,8)/2;case jo:case Ko:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Jo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Zo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Qo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ta:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ea:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case na:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case ia:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case sa:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ra:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case oa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case aa:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case la:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case ca:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ha:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case ua:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case da:case fa:case pa:return Math.ceil(i/4)*Math.ceil(t/4)*16;case ma:case ga:return Math.ceil(i/4)*Math.ceil(t/4)*8;case va:case _a:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Wd(i){switch(i){case Sn:case kc:return{byteLength:1,components:1};case _s:case Fc:case Ts:return{byteLength:2,components:1};case Ia:case Ua:return{byteLength:2,components:4};case ci:case Da:case xn:return{byteLength:4,components:1};case zc:case Oc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Pa}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Pa);/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function oh(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Xd(i){const t=new WeakMap;function e(a,l){const c=a.array,u=a.usage,h=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,u),a.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,l,c){const u=l.array,h=l.updateRanges;if(i.bindBuffer(c,a),h.length===0)i.bufferSubData(c,0,u);else{h.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<h.length;f++){const g=h[d],_=h[f];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++d,h[d]=_)}h.length=d+1;for(let f=0,g=h.length;f<g;f++){const _=h[f];i.bufferSubData(c,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var $d=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,qd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Yd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,jd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Kd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Jd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Zd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,tf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ef=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,nf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,sf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,rf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,of=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,af=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,lf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,cf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,hf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,uf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,df=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ff=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,pf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,mf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,gf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,vf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,_f=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,xf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,yf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Mf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Sf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,bf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ef=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,wf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Tf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Af=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Rf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Pf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Lf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Df=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,If=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Uf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Nf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,kf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ff=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Of=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Bf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Hf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Gf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Vf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Wf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Xf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,$f=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,qf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Yf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,jf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Kf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Jf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Qf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,tp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ep=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,np=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ip=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,sp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,rp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,op=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ap=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,cp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,up=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,dp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,pp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,mp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,gp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,vp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_p=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,xp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,yp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Mp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Sp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Ep=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Tp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ap=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Rp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Cp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Pp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Lp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Dp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ip=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Up=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Np=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,kp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Fp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,zp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Op=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Hp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Gp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Vp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Wp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Xp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const $p=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,qp=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,jp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Kp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Jp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Qp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,tm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,em=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,nm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,im=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,om=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,am=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,um=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,fm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,pm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,vm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_m=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ym=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Mm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Em=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Bt={alphahash_fragment:$d,alphahash_pars_fragment:qd,alphamap_fragment:Yd,alphamap_pars_fragment:jd,alphatest_fragment:Kd,alphatest_pars_fragment:Jd,aomap_fragment:Zd,aomap_pars_fragment:Qd,batching_pars_vertex:tf,batching_vertex:ef,begin_vertex:nf,beginnormal_vertex:sf,bsdfs:rf,iridescence_fragment:of,bumpmap_pars_fragment:af,clipping_planes_fragment:lf,clipping_planes_pars_fragment:cf,clipping_planes_pars_vertex:hf,clipping_planes_vertex:uf,color_fragment:df,color_pars_fragment:ff,color_pars_vertex:pf,color_vertex:mf,common:gf,cube_uv_reflection_fragment:vf,defaultnormal_vertex:_f,displacementmap_pars_vertex:xf,displacementmap_vertex:yf,emissivemap_fragment:Mf,emissivemap_pars_fragment:Sf,colorspace_fragment:bf,colorspace_pars_fragment:Ef,envmap_fragment:wf,envmap_common_pars_fragment:Tf,envmap_pars_fragment:Af,envmap_pars_vertex:Rf,envmap_physical_pars_fragment:Of,envmap_vertex:Cf,fog_vertex:Pf,fog_pars_vertex:Lf,fog_fragment:Df,fog_pars_fragment:If,gradientmap_pars_fragment:Uf,lightmap_pars_fragment:Nf,lights_lambert_fragment:kf,lights_lambert_pars_fragment:Ff,lights_pars_begin:zf,lights_toon_fragment:Bf,lights_toon_pars_fragment:Hf,lights_phong_fragment:Gf,lights_phong_pars_fragment:Vf,lights_physical_fragment:Wf,lights_physical_pars_fragment:Xf,lights_fragment_begin:$f,lights_fragment_maps:qf,lights_fragment_end:Yf,logdepthbuf_fragment:jf,logdepthbuf_pars_fragment:Kf,logdepthbuf_pars_vertex:Jf,logdepthbuf_vertex:Zf,map_fragment:Qf,map_pars_fragment:tp,map_particle_fragment:ep,map_particle_pars_fragment:np,metalnessmap_fragment:ip,metalnessmap_pars_fragment:sp,morphinstance_vertex:rp,morphcolor_vertex:op,morphnormal_vertex:ap,morphtarget_pars_vertex:lp,morphtarget_vertex:cp,normal_fragment_begin:hp,normal_fragment_maps:up,normal_pars_fragment:dp,normal_pars_vertex:fp,normal_vertex:pp,normalmap_pars_fragment:mp,clearcoat_normal_fragment_begin:gp,clearcoat_normal_fragment_maps:vp,clearcoat_pars_fragment:_p,iridescence_pars_fragment:xp,opaque_fragment:yp,packing:Mp,premultiplied_alpha_fragment:Sp,project_vertex:bp,dithering_fragment:Ep,dithering_pars_fragment:wp,roughnessmap_fragment:Tp,roughnessmap_pars_fragment:Ap,shadowmap_pars_fragment:Rp,shadowmap_pars_vertex:Cp,shadowmap_vertex:Pp,shadowmask_pars_fragment:Lp,skinbase_vertex:Dp,skinning_pars_vertex:Ip,skinning_vertex:Up,skinnormal_vertex:Np,specularmap_fragment:kp,specularmap_pars_fragment:Fp,tonemapping_fragment:zp,tonemapping_pars_fragment:Op,transmission_fragment:Bp,transmission_pars_fragment:Hp,uv_pars_fragment:Gp,uv_pars_vertex:Vp,uv_vertex:Wp,worldpos_vertex:Xp,background_vert:$p,background_frag:qp,backgroundCube_vert:Yp,backgroundCube_frag:jp,cube_vert:Kp,cube_frag:Jp,depth_vert:Zp,depth_frag:Qp,distanceRGBA_vert:tm,distanceRGBA_frag:em,equirect_vert:nm,equirect_frag:im,linedashed_vert:sm,linedashed_frag:rm,meshbasic_vert:om,meshbasic_frag:am,meshlambert_vert:lm,meshlambert_frag:cm,meshmatcap_vert:hm,meshmatcap_frag:um,meshnormal_vert:dm,meshnormal_frag:fm,meshphong_vert:pm,meshphong_frag:mm,meshphysical_vert:gm,meshphysical_frag:vm,meshtoon_vert:_m,meshtoon_frag:xm,points_vert:ym,points_frag:Mm,shadow_vert:Sm,shadow_frag:bm,sprite_vert:Em,sprite_frag:wm},at={common:{diffuse:{value:new kt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new zt},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new zt}},envmap:{envMap:{value:null},envMapRotation:{value:new zt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new zt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new zt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new zt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new zt},normalScale:{value:new Jt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new zt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new zt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new zt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new zt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new kt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new kt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0},uvTransform:{value:new zt}},sprite:{diffuse:{value:new kt(16777215)},opacity:{value:1},center:{value:new Jt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new zt},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0}}},mn={basic:{uniforms:Fe([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.fog]),vertexShader:Bt.meshbasic_vert,fragmentShader:Bt.meshbasic_frag},lambert:{uniforms:Fe([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new kt(0)}}]),vertexShader:Bt.meshlambert_vert,fragmentShader:Bt.meshlambert_frag},phong:{uniforms:Fe([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new kt(0)},specular:{value:new kt(1118481)},shininess:{value:30}}]),vertexShader:Bt.meshphong_vert,fragmentShader:Bt.meshphong_frag},standard:{uniforms:Fe([at.common,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.roughnessmap,at.metalnessmap,at.fog,at.lights,{emissive:{value:new kt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag},toon:{uniforms:Fe([at.common,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.gradientmap,at.fog,at.lights,{emissive:{value:new kt(0)}}]),vertexShader:Bt.meshtoon_vert,fragmentShader:Bt.meshtoon_frag},matcap:{uniforms:Fe([at.common,at.bumpmap,at.normalmap,at.displacementmap,at.fog,{matcap:{value:null}}]),vertexShader:Bt.meshmatcap_vert,fragmentShader:Bt.meshmatcap_frag},points:{uniforms:Fe([at.points,at.fog]),vertexShader:Bt.points_vert,fragmentShader:Bt.points_frag},dashed:{uniforms:Fe([at.common,at.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Bt.linedashed_vert,fragmentShader:Bt.linedashed_frag},depth:{uniforms:Fe([at.common,at.displacementmap]),vertexShader:Bt.depth_vert,fragmentShader:Bt.depth_frag},normal:{uniforms:Fe([at.common,at.bumpmap,at.normalmap,at.displacementmap,{opacity:{value:1}}]),vertexShader:Bt.meshnormal_vert,fragmentShader:Bt.meshnormal_frag},sprite:{uniforms:Fe([at.sprite,at.fog]),vertexShader:Bt.sprite_vert,fragmentShader:Bt.sprite_frag},background:{uniforms:{uvTransform:{value:new zt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Bt.background_vert,fragmentShader:Bt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new zt}},vertexShader:Bt.backgroundCube_vert,fragmentShader:Bt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Bt.cube_vert,fragmentShader:Bt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Bt.equirect_vert,fragmentShader:Bt.equirect_frag},distanceRGBA:{uniforms:Fe([at.common,at.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Bt.distanceRGBA_vert,fragmentShader:Bt.distanceRGBA_frag},shadow:{uniforms:Fe([at.lights,at.fog,{color:{value:new kt(0)},opacity:{value:1}}]),vertexShader:Bt.shadow_vert,fragmentShader:Bt.shadow_frag}};mn.physical={uniforms:Fe([mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new zt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new zt},clearcoatNormalScale:{value:new Jt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new zt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new zt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new zt},sheen:{value:0},sheenColor:{value:new kt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new zt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new zt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new zt},transmissionSamplerSize:{value:new Jt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new zt},attenuationDistance:{value:0},attenuationColor:{value:new kt(0)},specularColor:{value:new kt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new zt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new zt},anisotropyVector:{value:new Jt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new zt}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag};const ar={r:0,b:0,g:0},Jn=new bn,Tm=new ae;function Am(i,t,e,n,s,r,o){const a=new kt(0);let l=r===!0?0:1,c,u,h=null,d=0,f=null;function g(w){let y=w.isScene===!0?w.background:null;return y&&y.isTexture&&(y=(w.backgroundBlurriness>0?e:t).get(y)),y}function _(w){let y=!1;const A=g(w);A===null?p(a,l):A&&A.isColor&&(p(A,1),y=!0);const R=i.xr.getEnvironmentBlendMode();R==="additive"?n.buffers.color.setClear(0,0,0,1,o):R==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(w,y){const A=g(y);A&&(A.isCubeTexture||A.mapping===zr)?(u===void 0&&(u=new Se(new sn(1,1,1),new En({name:"BackgroundCubeMaterial",uniforms:ji(mn.backgroundCube.uniforms),vertexShader:mn.backgroundCube.vertexShader,fragmentShader:mn.backgroundCube.fragmentShader,side:Xe,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(R,P,N){this.matrixWorld.copyPosition(N.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),Jn.copy(y.backgroundRotation),Jn.x*=-1,Jn.y*=-1,Jn.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(Jn.y*=-1,Jn.z*=-1),u.material.uniforms.envMap.value=A,u.material.uniforms.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Tm.makeRotationFromEuler(Jn)),u.material.toneMapped=Yt.getTransfer(A.colorSpace)!==ee,(h!==A||d!==A.version||f!==i.toneMapping)&&(u.material.needsUpdate=!0,h=A,d=A.version,f=i.toneMapping),u.layers.enableAll(),w.unshift(u,u.geometry,u.material,0,0,null)):A&&A.isTexture&&(c===void 0&&(c=new Se(new Or(2,2),new En({name:"BackgroundMaterial",uniforms:ji(mn.background.uniforms),vertexShader:mn.background.vertexShader,fragmentShader:mn.background.fragmentShader,side:In,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=A,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Yt.getTransfer(A.colorSpace)!==ee,A.matrixAutoUpdate===!0&&A.updateMatrix(),c.material.uniforms.uvTransform.value.copy(A.matrix),(h!==A||d!==A.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,h=A,d=A.version,f=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null))}function p(w,y){w.getRGB(ar,Jc(i)),n.buffers.color.setClear(ar.r,ar.g,ar.b,y,o)}function S(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(w,y=1){a.set(w),l=y,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,p(a,l)},render:_,addToRenderList:m,dispose:S}}function Rm(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,o=!1;function a(E,L,k,H,V){let q=!1;const X=h(H,k,L);r!==X&&(r=X,c(r.object)),q=f(E,H,k,V),q&&g(E,H,k,V),V!==null&&t.update(V,i.ELEMENT_ARRAY_BUFFER),(q||o)&&(o=!1,y(E,L,k,H),V!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(V).buffer))}function l(){return i.createVertexArray()}function c(E){return i.bindVertexArray(E)}function u(E){return i.deleteVertexArray(E)}function h(E,L,k){const H=k.wireframe===!0;let V=n[E.id];V===void 0&&(V={},n[E.id]=V);let q=V[L.id];q===void 0&&(q={},V[L.id]=q);let X=q[H];return X===void 0&&(X=d(l()),q[H]=X),X}function d(E){const L=[],k=[],H=[];for(let V=0;V<e;V++)L[V]=0,k[V]=0,H[V]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:k,attributeDivisors:H,object:E,attributes:{},index:null}}function f(E,L,k,H){const V=r.attributes,q=L.attributes;let X=0;const et=k.getAttributes();for(const G in et)if(et[G].location>=0){const ot=V[G];let ft=q[G];if(ft===void 0&&(G==="instanceMatrix"&&E.instanceMatrix&&(ft=E.instanceMatrix),G==="instanceColor"&&E.instanceColor&&(ft=E.instanceColor)),ot===void 0||ot.attribute!==ft||ft&&ot.data!==ft.data)return!0;X++}return r.attributesNum!==X||r.index!==H}function g(E,L,k,H){const V={},q=L.attributes;let X=0;const et=k.getAttributes();for(const G in et)if(et[G].location>=0){let ot=q[G];ot===void 0&&(G==="instanceMatrix"&&E.instanceMatrix&&(ot=E.instanceMatrix),G==="instanceColor"&&E.instanceColor&&(ot=E.instanceColor));const ft={};ft.attribute=ot,ot&&ot.data&&(ft.data=ot.data),V[G]=ft,X++}r.attributes=V,r.attributesNum=X,r.index=H}function _(){const E=r.newAttributes;for(let L=0,k=E.length;L<k;L++)E[L]=0}function m(E){p(E,0)}function p(E,L){const k=r.newAttributes,H=r.enabledAttributes,V=r.attributeDivisors;k[E]=1,H[E]===0&&(i.enableVertexAttribArray(E),H[E]=1),V[E]!==L&&(i.vertexAttribDivisor(E,L),V[E]=L)}function S(){const E=r.newAttributes,L=r.enabledAttributes;for(let k=0,H=L.length;k<H;k++)L[k]!==E[k]&&(i.disableVertexAttribArray(k),L[k]=0)}function w(E,L,k,H,V,q,X){X===!0?i.vertexAttribIPointer(E,L,k,V,q):i.vertexAttribPointer(E,L,k,H,V,q)}function y(E,L,k,H){_();const V=H.attributes,q=k.getAttributes(),X=L.defaultAttributeValues;for(const et in q){const G=q[et];if(G.location>=0){let Z=V[et];if(Z===void 0&&(et==="instanceMatrix"&&E.instanceMatrix&&(Z=E.instanceMatrix),et==="instanceColor"&&E.instanceColor&&(Z=E.instanceColor)),Z!==void 0){const ot=Z.normalized,ft=Z.itemSize,Ct=t.get(Z);if(Ct===void 0)continue;const jt=Ct.buffer,Gt=Ct.type,Xt=Ct.bytesPerElement,Y=Gt===i.INT||Gt===i.UNSIGNED_INT||Z.gpuType===Da;if(Z.isInterleavedBufferAttribute){const K=Z.data,ut=K.stride,At=Z.offset;if(K.isInstancedInterleavedBuffer){for(let Mt=0;Mt<G.locationSize;Mt++)p(G.location+Mt,K.meshPerAttribute);E.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let Mt=0;Mt<G.locationSize;Mt++)m(G.location+Mt);i.bindBuffer(i.ARRAY_BUFFER,jt);for(let Mt=0;Mt<G.locationSize;Mt++)w(G.location+Mt,ft/G.locationSize,Gt,ot,ut*Xt,(At+ft/G.locationSize*Mt)*Xt,Y)}else{if(Z.isInstancedBufferAttribute){for(let K=0;K<G.locationSize;K++)p(G.location+K,Z.meshPerAttribute);E.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let K=0;K<G.locationSize;K++)m(G.location+K);i.bindBuffer(i.ARRAY_BUFFER,jt);for(let K=0;K<G.locationSize;K++)w(G.location+K,ft/G.locationSize,Gt,ot,ft*Xt,ft/G.locationSize*K*Xt,Y)}}else if(X!==void 0){const ot=X[et];if(ot!==void 0)switch(ot.length){case 2:i.vertexAttrib2fv(G.location,ot);break;case 3:i.vertexAttrib3fv(G.location,ot);break;case 4:i.vertexAttrib4fv(G.location,ot);break;default:i.vertexAttrib1fv(G.location,ot)}}}}S()}function A(){N();for(const E in n){const L=n[E];for(const k in L){const H=L[k];for(const V in H)u(H[V].object),delete H[V];delete L[k]}delete n[E]}}function R(E){if(n[E.id]===void 0)return;const L=n[E.id];for(const k in L){const H=L[k];for(const V in H)u(H[V].object),delete H[V];delete L[k]}delete n[E.id]}function P(E){for(const L in n){const k=n[L];if(k[E.id]===void 0)continue;const H=k[E.id];for(const V in H)u(H[V].object),delete H[V];delete k[E.id]}}function N(){b(),o=!0,r!==s&&(r=s,c(r.object))}function b(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:N,resetDefaultState:b,dispose:A,releaseStatesOfGeometry:R,releaseStatesOfProgram:P,initAttributes:_,enableAttribute:m,disableUnusedAttributes:S}}function Cm(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function o(c,u,h){h!==0&&(i.drawArraysInstanced(n,c,u,h),e.update(u,n,h))}function a(c,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let f=0;for(let g=0;g<h;g++)f+=u[g];e.update(f,n,1)}function l(c,u,h,d){if(h===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)o(c[g],u[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,h);let g=0;for(let _=0;_<h;_++)g+=u[_]*d[_];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Pm(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const P=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(P){return!(P!==hn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(P){const N=P===Ts&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(P!==Sn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==xn&&!N)}function l(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=e.logarithmicDepthBuffer===!0,d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),S=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),A=g>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:S,maxVaryings:w,maxFragmentUniforms:y,vertexTextures:A,maxSamples:R}}function Lm(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new Qn,a=new zt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const f=h.length!==0||d||n!==0||s;return s=d,n=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,f){const g=h.clippingPlanes,_=h.clipIntersection,m=h.clipShadows,p=i.get(h);if(!s||g===null||g.length===0||r&&!m)r?u(null):c();else{const S=r?0:n,w=S*4;let y=p.clippingState||null;l.value=y,y=u(g,d,w,f);for(let A=0;A!==w;++A)y[A]=e[A];p.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(h,d,f,g){const _=h!==null?h.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const p=f+_*4,S=d.matrixWorldInverse;a.getNormalMatrix(S),(m===null||m.length<p)&&(m=new Float32Array(p));for(let w=0,y=f;w!==_;++w,y+=4)o.copy(h[w]).applyMatrix4(S,a),o.normal.toArray(m,y),m[y+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}function Dm(i){let t=new WeakMap;function e(o,a){return a===Ho?o.mapping=$i:a===Go&&(o.mapping=qi),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Ho||a===Go)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new bd(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}const Fi=4,$l=[.125,.215,.35,.446,.526,.582],ni=20,yo=new rh,ql=new kt;let Mo=null,So=0,bo=0,Eo=!1;const ti=(1+Math.sqrt(5))/2,Li=1/ti,Yl=[new z(-ti,Li,0),new z(ti,Li,0),new z(-Li,0,ti),new z(Li,0,ti),new z(0,ti,-Li),new z(0,ti,Li),new z(-1,1,-1),new z(1,1,-1),new z(-1,1,1),new z(1,1,1)],Im=new z;class jl{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100,r={}){const{size:o=256,position:a=Im}=r;Mo=this._renderer.getRenderTarget(),So=this._renderer.getActiveCubeFace(),bo=this._renderer.getActiveMipmapLevel(),Eo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,a),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Zl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Jl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Mo,So,bo),this._renderer.xr.enabled=Eo,t.scissorTest=!1,lr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===$i||t.mapping===qi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Mo=this._renderer.getRenderTarget(),So=this._renderer.getActiveCubeFace(),bo=this._renderer.getActiveMipmapLevel(),Eo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:_n,minFilter:_n,generateMipmaps:!1,type:Ts,format:hn,colorSpace:Yi,depthBuffer:!1},s=Kl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Kl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Um(r)),this._blurMaterial=Nm(r,t,e)}return s}_compileMaterial(t){const e=new Se(this._lodPlanes[0],t);this._renderer.compile(e,yo)}_sceneToCubeUV(t,e,n,s,r){const l=new Je(90,1,e,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,f=h.toneMapping;h.getClearColor(ql),h.toneMapping=Wn,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(s),h.clearDepth(),h.setRenderTarget(null));const _=new Hn({name:"PMREM.Background",side:Xe,depthWrite:!1,depthTest:!1}),m=new Se(new sn,_);let p=!1;const S=t.background;S?S.isColor&&(_.color.copy(S),t.background=null,p=!0):(_.color.copy(ql),p=!0);for(let w=0;w<6;w++){const y=w%3;y===0?(l.up.set(0,c[w],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[w],r.y,r.z)):y===1?(l.up.set(0,0,c[w]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[w],r.z)):(l.up.set(0,c[w],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[w]));const A=this._cubeSize;lr(s,y*A,w>2?A:0,A,A),h.setRenderTarget(s),p&&h.render(m,l),h.render(t,l)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=f,h.autoClear=d,t.background=S}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===$i||t.mapping===qi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Zl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Jl());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new Se(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const l=this._cubeSize;lr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,yo)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Yl[(s-r-1)%Yl.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Se(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*ni-1),_=r/g,m=isFinite(r)?1+Math.floor(u*_):ni;m>ni&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${ni}`);const p=[];let S=0;for(let P=0;P<ni;++P){const N=P/_,b=Math.exp(-N*N/2);p.push(b),P===0?S+=b:P<m&&(S+=2*b)}for(let P=0;P<p.length;P++)p[P]=p[P]/S;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:w}=this;d.dTheta.value=g,d.mipInt.value=w-n;const y=this._sizeLods[s],A=3*y*(s>w-Fi?s-w+Fi:0),R=4*(this._cubeSize-y);lr(e,A,R,3*y,2*y),l.setRenderTarget(e),l.render(h,yo)}}function Um(i){const t=[],e=[],n=[];let s=i;const r=i-Fi+1+$l.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Fi?l=$l[o-i+Fi-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,_=3,m=2,p=1,S=new Float32Array(_*g*f),w=new Float32Array(m*g*f),y=new Float32Array(p*g*f);for(let R=0;R<f;R++){const P=R%3*2/3-1,N=R>2?0:-1,b=[P,N,0,P+2/3,N,0,P+2/3,N+1,0,P,N,0,P+2/3,N+1,0,P,N+1,0];S.set(b,_*g*R),w.set(d,m*g*R);const E=[R,R,R,R,R,R];y.set(E,p*g*R)}const A=new on;A.setAttribute("position",new rn(S,_)),A.setAttribute("uv",new rn(w,m)),A.setAttribute("faceIndex",new rn(y,p)),t.push(A),s>Fi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Kl(i,t,e){const n=new hi(i,t,e);return n.texture.mapping=zr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function lr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Nm(i,t,e){const n=new Float32Array(ni),s=new z(0,1,0);return new En({name:"SphericalGaussianBlur",defines:{n:ni,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Va(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Jl(){return new En({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Va(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Zl(){return new En({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Va(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Va(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function km(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Ho||l===Go,u=l===$i||l===qi;if(c||u){let h=t.get(a);const d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new jl(i)),h=c?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const f=a.image;return c&&f&&f.height>0||u&&f&&s(f)?(e===null&&(e=new jl(i)),h=c?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function Fm(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&Ss("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function zm(i,t,e,n){const s={},r=new WeakMap;function o(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete s[d.id];const f=r.get(d);f&&(t.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(h,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const f in d)t.update(d[f],i.ARRAY_BUFFER)}function c(h){const d=[],f=h.index,g=h.attributes.position;let _=0;if(f!==null){const S=f.array;_=f.version;for(let w=0,y=S.length;w<y;w+=3){const A=S[w+0],R=S[w+1],P=S[w+2];d.push(A,R,R,P,P,A)}}else if(g!==void 0){const S=g.array;_=g.version;for(let w=0,y=S.length/3-1;w<y;w+=3){const A=w+0,R=w+1,P=w+2;d.push(A,R,R,P,P,A)}}else return;const m=new(Xc(d)?Kc:jc)(d,1);m.version=_;const p=r.get(h);p&&t.remove(p),r.set(h,m)}function u(h){const d=r.get(h);if(d){const f=h.index;f!==null&&d.version<f.version&&c(h)}else c(h);return r.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function Om(i,t,e){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*o),e.update(f,n,1)}function c(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,d*o,g),e.update(f,n,g))}function u(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];e.update(m,n,1)}function h(d,f,g,_){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)c(d[p]/o,f[p],_[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,_,0,g);let p=0;for(let S=0;S<g;S++)p+=f[S]*_[S];e.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function Bm(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Hm(i,t,e){const n=new WeakMap,s=new ve;function r(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(a);if(d===void 0||d.count!==h){let b=function(){P.dispose(),n.delete(a),a.removeEventListener("dispose",b)};d!==void 0&&d.texture.dispose();const f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],S=a.morphAttributes.color||[];let w=0;f===!0&&(w=1),g===!0&&(w=2),_===!0&&(w=3);let y=a.attributes.position.count*w,A=1;y>t.maxTextureSize&&(A=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize);const R=new Float32Array(y*A*4*h),P=new $c(R,y,A,h);P.type=xn,P.needsUpdate=!0;const N=w*4;for(let E=0;E<h;E++){const L=m[E],k=p[E],H=S[E],V=y*A*4*E;for(let q=0;q<L.count;q++){const X=q*N;f===!0&&(s.fromBufferAttribute(L,q),R[V+X+0]=s.x,R[V+X+1]=s.y,R[V+X+2]=s.z,R[V+X+3]=0),g===!0&&(s.fromBufferAttribute(k,q),R[V+X+4]=s.x,R[V+X+5]=s.y,R[V+X+6]=s.z,R[V+X+7]=0),_===!0&&(s.fromBufferAttribute(H,q),R[V+X+8]=s.x,R[V+X+9]=s.y,R[V+X+10]=s.z,R[V+X+11]=H.itemSize===4?s.w:1)}}d={count:h,texture:P,size:new Jt(y,A)},n.set(a,d),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let f=0;for(let _=0;_<c.length;_++)f+=c[_];const g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function Gm(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,u=l.geometry,h=t.get(l,u);if(s.get(h)!==c&&(t.update(h),s.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return h}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}const ah=new Ne,Ql=new nh(1,1),lh=new $c,ch=new od,hh=new Qc,tc=[],ec=[],nc=new Float32Array(16),ic=new Float32Array(9),sc=new Float32Array(4);function Zi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=tc[s];if(r===void 0&&(r=new Float32Array(s),tc[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function we(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Te(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Br(i,t){let e=ec[t];e===void 0&&(e=new Int32Array(t),ec[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Vm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Wm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2fv(this.addr,t),Te(e,t)}}function Xm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(we(e,t))return;i.uniform3fv(this.addr,t),Te(e,t)}}function $m(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4fv(this.addr,t),Te(e,t)}}function qm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Te(e,t)}else{if(we(e,n))return;sc.set(n),i.uniformMatrix2fv(this.addr,!1,sc),Te(e,n)}}function Ym(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Te(e,t)}else{if(we(e,n))return;ic.set(n),i.uniformMatrix3fv(this.addr,!1,ic),Te(e,n)}}function jm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Te(e,t)}else{if(we(e,n))return;nc.set(n),i.uniformMatrix4fv(this.addr,!1,nc),Te(e,n)}}function Km(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Jm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2iv(this.addr,t),Te(e,t)}}function Zm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3iv(this.addr,t),Te(e,t)}}function Qm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4iv(this.addr,t),Te(e,t)}}function t0(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function e0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2uiv(this.addr,t),Te(e,t)}}function n0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3uiv(this.addr,t),Te(e,t)}}function i0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4uiv(this.addr,t),Te(e,t)}}function s0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ql.compareFunction=Wc,r=Ql):r=ah,e.setTexture2D(t||r,s)}function r0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||ch,s)}function o0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||hh,s)}function a0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||lh,s)}function l0(i){switch(i){case 5126:return Vm;case 35664:return Wm;case 35665:return Xm;case 35666:return $m;case 35674:return qm;case 35675:return Ym;case 35676:return jm;case 5124:case 35670:return Km;case 35667:case 35671:return Jm;case 35668:case 35672:return Zm;case 35669:case 35673:return Qm;case 5125:return t0;case 36294:return e0;case 36295:return n0;case 36296:return i0;case 35678:case 36198:case 36298:case 36306:case 35682:return s0;case 35679:case 36299:case 36307:return r0;case 35680:case 36300:case 36308:case 36293:return o0;case 36289:case 36303:case 36311:case 36292:return a0}}function c0(i,t){i.uniform1fv(this.addr,t)}function h0(i,t){const e=Zi(t,this.size,2);i.uniform2fv(this.addr,e)}function u0(i,t){const e=Zi(t,this.size,3);i.uniform3fv(this.addr,e)}function d0(i,t){const e=Zi(t,this.size,4);i.uniform4fv(this.addr,e)}function f0(i,t){const e=Zi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function p0(i,t){const e=Zi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function m0(i,t){const e=Zi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function g0(i,t){i.uniform1iv(this.addr,t)}function v0(i,t){i.uniform2iv(this.addr,t)}function _0(i,t){i.uniform3iv(this.addr,t)}function x0(i,t){i.uniform4iv(this.addr,t)}function y0(i,t){i.uniform1uiv(this.addr,t)}function M0(i,t){i.uniform2uiv(this.addr,t)}function S0(i,t){i.uniform3uiv(this.addr,t)}function b0(i,t){i.uniform4uiv(this.addr,t)}function E0(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||ah,r[o])}function w0(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||ch,r[o])}function T0(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||hh,r[o])}function A0(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||lh,r[o])}function R0(i){switch(i){case 5126:return c0;case 35664:return h0;case 35665:return u0;case 35666:return d0;case 35674:return f0;case 35675:return p0;case 35676:return m0;case 5124:case 35670:return g0;case 35667:case 35671:return v0;case 35668:case 35672:return _0;case 35669:case 35673:return x0;case 5125:return y0;case 36294:return M0;case 36295:return S0;case 36296:return b0;case 35678:case 36198:case 36298:case 36306:case 35682:return E0;case 35679:case 36299:case 36307:return w0;case 35680:case 36300:case 36308:case 36293:return T0;case 36289:case 36303:case 36311:case 36292:return A0}}class C0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=l0(e.type)}}class P0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=R0(e.type)}}class L0{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const wo=/(\w+)(\])?(\[|\.)?/g;function rc(i,t){i.seq.push(t),i.map[t.id]=t}function D0(i,t,e){const n=i.name,s=n.length;for(wo.lastIndex=0;;){const r=wo.exec(n),o=wo.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){rc(e,c===void 0?new C0(a,i,t):new P0(a,i,t));break}else{let h=e.map[a];h===void 0&&(h=new L0(a),rc(e,h)),e=h}}}class _r{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);D0(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function oc(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const I0=37297;let U0=0;function N0(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const ac=new zt;function k0(i){Yt._getMatrix(ac,Yt.workingColorSpace,i);const t=`mat3( ${ac.elements.map(e=>e.toFixed(4))} )`;switch(Yt.getTransfer(i)){case wr:return[t,"LinearTransferOETF"];case ee:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function lc(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";const o=/ERROR: 0:(\d+)/.exec(r);if(o){const a=parseInt(o[1]);return e.toUpperCase()+`

`+r+`

`+N0(i.getShaderSource(t),a)}else return r}function F0(i,t){const e=k0(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function z0(i,t){let e;switch(t){case Iu:e="Linear";break;case Uu:e="Reinhard";break;case Nu:e="Cineon";break;case ku:e="ACESFilmic";break;case zu:e="AgX";break;case Ou:e="Neutral";break;case Fu:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const cr=new z;function O0(){Yt.getLuminanceCoefficients(cr);const i=cr.x.toFixed(4),t=cr.y.toFixed(4),e=cr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function B0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(fs).join(`
`)}function H0(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function G0(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function fs(i){return i!==""}function cc(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function hc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const V0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ma(i){return i.replace(V0,X0)}const W0=new Map;function X0(i,t){let e=Bt[t];if(e===void 0){const n=W0.get(t);if(n!==void 0)e=Bt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Ma(e)}const $0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function uc(i){return i.replace($0,q0)}function q0(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function dc(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Y0(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Uc?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===du?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Ln&&(t="SHADOWMAP_TYPE_VSM"),t}function j0(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case $i:case qi:t="ENVMAP_TYPE_CUBE";break;case zr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function K0(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case qi:t="ENVMAP_MODE_REFRACTION";break}return t}function J0(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case La:t="ENVMAP_BLENDING_MULTIPLY";break;case Lu:t="ENVMAP_BLENDING_MIX";break;case Du:t="ENVMAP_BLENDING_ADD";break}return t}function Z0(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Q0(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=Y0(e),c=j0(e),u=K0(e),h=J0(e),d=Z0(e),f=B0(e),g=H0(r),_=s.createProgram();let m,p,S=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(fs).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(fs).join(`
`),p.length>0&&(p+=`
`)):(m=[dc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(fs).join(`
`),p=[dc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Wn?"#define TONE_MAPPING":"",e.toneMapping!==Wn?Bt.tonemapping_pars_fragment:"",e.toneMapping!==Wn?z0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Bt.colorspace_pars_fragment,F0("linearToOutputTexel",e.outputColorSpace),O0(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(fs).join(`
`)),o=Ma(o),o=cc(o,e),o=hc(o,e),a=Ma(a),a=cc(a,e),a=hc(a,e),o=uc(o),a=uc(a),e.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===ml?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===ml?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const w=S+m+o,y=S+p+a,A=oc(s,s.VERTEX_SHADER,w),R=oc(s,s.FRAGMENT_SHADER,y);s.attachShader(_,A),s.attachShader(_,R),e.index0AttributeName!==void 0?s.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function P(L){if(i.debug.checkShaderErrors){const k=s.getProgramInfoLog(_)||"",H=s.getShaderInfoLog(A)||"",V=s.getShaderInfoLog(R)||"",q=k.trim(),X=H.trim(),et=V.trim();let G=!0,Z=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(G=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,A,R);else{const ot=lc(s,A,"vertex"),ft=lc(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+q+`
`+ot+`
`+ft)}else q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",q):(X===""||et==="")&&(Z=!1);Z&&(L.diagnostics={runnable:G,programLog:q,vertexShader:{log:X,prefix:m},fragmentShader:{log:et,prefix:p}})}s.deleteShader(A),s.deleteShader(R),N=new _r(s,_),b=G0(s,_)}let N;this.getUniforms=function(){return N===void 0&&P(this),N};let b;this.getAttributes=function(){return b===void 0&&P(this),b};let E=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=s.getProgramParameter(_,I0)),E},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=U0++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=A,this.fragmentShader=R,this}let tg=0;class eg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new ng(t),e.set(t,n)),n}}class ng{constructor(t){this.id=tg++,this.code=t,this.usedTimes=0}}function ig(i,t,e,n,s,r,o){const a=new qc,l=new eg,c=new Set,u=[],h=s.logarithmicDepthBuffer,d=s.vertexTextures;let f=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(b){return c.add(b),b===0?"uv":`uv${b}`}function m(b,E,L,k,H){const V=k.fog,q=H.geometry,X=b.isMeshStandardMaterial?k.environment:null,et=(b.isMeshStandardMaterial?e:t).get(b.envMap||X),G=et&&et.mapping===zr?et.image.height:null,Z=g[b.type];b.precision!==null&&(f=s.getMaxPrecision(b.precision),f!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",f,"instead."));const ot=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ft=ot!==void 0?ot.length:0;let Ct=0;q.morphAttributes.position!==void 0&&(Ct=1),q.morphAttributes.normal!==void 0&&(Ct=2),q.morphAttributes.color!==void 0&&(Ct=3);let jt,Gt,Xt,Y;if(Z){const Zt=mn[Z];jt=Zt.vertexShader,Gt=Zt.fragmentShader}else jt=b.vertexShader,Gt=b.fragmentShader,l.update(b),Xt=l.getVertexShaderID(b),Y=l.getFragmentShaderID(b);const K=i.getRenderTarget(),ut=i.state.buffers.depth.getReversed(),At=H.isInstancedMesh===!0,Mt=H.isBatchedMesh===!0,Vt=!!b.map,Le=!!b.matcap,C=!!et,ce=!!b.aoMap,Nt=!!b.lightMap,Lt=!!b.bumpMap,vt=!!b.normalMap,he=!!b.displacementMap,_t=!!b.emissiveMap,Ot=!!b.metalnessMap,Ae=!!b.roughnessMap,_e=b.anisotropy>0,T=b.clearcoat>0,x=b.dispersion>0,F=b.iridescence>0,$=b.sheen>0,J=b.transmission>0,W=_e&&!!b.anisotropyMap,Et=T&&!!b.clearcoatMap,st=T&&!!b.clearcoatNormalMap,yt=T&&!!b.clearcoatRoughnessMap,St=F&&!!b.iridescenceMap,nt=F&&!!b.iridescenceThicknessMap,ht=$&&!!b.sheenColorMap,Pt=$&&!!b.sheenRoughnessMap,bt=!!b.specularMap,lt=!!b.specularColorMap,Ft=!!b.specularIntensityMap,D=J&&!!b.transmissionMap,it=J&&!!b.thicknessMap,rt=!!b.gradientMap,pt=!!b.alphaMap,Q=b.alphaTest>0,j=!!b.alphaHash,gt=!!b.extensions;let It=Wn;b.toneMapped&&(K===null||K.isXRRenderTarget===!0)&&(It=i.toneMapping);const re={shaderID:Z,shaderType:b.type,shaderName:b.name,vertexShader:jt,fragmentShader:Gt,defines:b.defines,customVertexShaderID:Xt,customFragmentShaderID:Y,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:f,batching:Mt,batchingColor:Mt&&H._colorsTexture!==null,instancing:At,instancingColor:At&&H.instanceColor!==null,instancingMorph:At&&H.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:K===null?i.outputColorSpace:K.isXRRenderTarget===!0?K.texture.colorSpace:Yi,alphaToCoverage:!!b.alphaToCoverage,map:Vt,matcap:Le,envMap:C,envMapMode:C&&et.mapping,envMapCubeUVHeight:G,aoMap:ce,lightMap:Nt,bumpMap:Lt,normalMap:vt,displacementMap:d&&he,emissiveMap:_t,normalMapObjectSpace:vt&&b.normalMapType===Vu,normalMapTangentSpace:vt&&b.normalMapType===Vc,metalnessMap:Ot,roughnessMap:Ae,anisotropy:_e,anisotropyMap:W,clearcoat:T,clearcoatMap:Et,clearcoatNormalMap:st,clearcoatRoughnessMap:yt,dispersion:x,iridescence:F,iridescenceMap:St,iridescenceThicknessMap:nt,sheen:$,sheenColorMap:ht,sheenRoughnessMap:Pt,specularMap:bt,specularColorMap:lt,specularIntensityMap:Ft,transmission:J,transmissionMap:D,thicknessMap:it,gradientMap:rt,opaque:b.transparent===!1&&b.blending===Vi&&b.alphaToCoverage===!1,alphaMap:pt,alphaTest:Q,alphaHash:j,combine:b.combine,mapUv:Vt&&_(b.map.channel),aoMapUv:ce&&_(b.aoMap.channel),lightMapUv:Nt&&_(b.lightMap.channel),bumpMapUv:Lt&&_(b.bumpMap.channel),normalMapUv:vt&&_(b.normalMap.channel),displacementMapUv:he&&_(b.displacementMap.channel),emissiveMapUv:_t&&_(b.emissiveMap.channel),metalnessMapUv:Ot&&_(b.metalnessMap.channel),roughnessMapUv:Ae&&_(b.roughnessMap.channel),anisotropyMapUv:W&&_(b.anisotropyMap.channel),clearcoatMapUv:Et&&_(b.clearcoatMap.channel),clearcoatNormalMapUv:st&&_(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:yt&&_(b.clearcoatRoughnessMap.channel),iridescenceMapUv:St&&_(b.iridescenceMap.channel),iridescenceThicknessMapUv:nt&&_(b.iridescenceThicknessMap.channel),sheenColorMapUv:ht&&_(b.sheenColorMap.channel),sheenRoughnessMapUv:Pt&&_(b.sheenRoughnessMap.channel),specularMapUv:bt&&_(b.specularMap.channel),specularColorMapUv:lt&&_(b.specularColorMap.channel),specularIntensityMapUv:Ft&&_(b.specularIntensityMap.channel),transmissionMapUv:D&&_(b.transmissionMap.channel),thicknessMapUv:it&&_(b.thicknessMap.channel),alphaMapUv:pt&&_(b.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(vt||_e),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!q.attributes.uv&&(Vt||pt),fog:!!V,useFog:b.fog===!0,fogExp2:!!V&&V.isFogExp2,flatShading:b.flatShading===!0&&b.wireframe===!1,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:ut,skinning:H.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:ft,morphTextureStride:Ct,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:It,decodeVideoTexture:Vt&&b.map.isVideoTexture===!0&&Yt.getTransfer(b.map.colorSpace)===ee,decodeVideoTextureEmissive:_t&&b.emissiveMap.isVideoTexture===!0&&Yt.getTransfer(b.emissiveMap.colorSpace)===ee,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===gn,flipSided:b.side===Xe,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:gt&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(gt&&b.extensions.multiDraw===!0||Mt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return re.vertexUv1s=c.has(1),re.vertexUv2s=c.has(2),re.vertexUv3s=c.has(3),c.clear(),re}function p(b){const E=[];if(b.shaderID?E.push(b.shaderID):(E.push(b.customVertexShaderID),E.push(b.customFragmentShaderID)),b.defines!==void 0)for(const L in b.defines)E.push(L),E.push(b.defines[L]);return b.isRawShaderMaterial===!1&&(S(E,b),w(E,b),E.push(i.outputColorSpace)),E.push(b.customProgramCacheKey),E.join()}function S(b,E){b.push(E.precision),b.push(E.outputColorSpace),b.push(E.envMapMode),b.push(E.envMapCubeUVHeight),b.push(E.mapUv),b.push(E.alphaMapUv),b.push(E.lightMapUv),b.push(E.aoMapUv),b.push(E.bumpMapUv),b.push(E.normalMapUv),b.push(E.displacementMapUv),b.push(E.emissiveMapUv),b.push(E.metalnessMapUv),b.push(E.roughnessMapUv),b.push(E.anisotropyMapUv),b.push(E.clearcoatMapUv),b.push(E.clearcoatNormalMapUv),b.push(E.clearcoatRoughnessMapUv),b.push(E.iridescenceMapUv),b.push(E.iridescenceThicknessMapUv),b.push(E.sheenColorMapUv),b.push(E.sheenRoughnessMapUv),b.push(E.specularMapUv),b.push(E.specularColorMapUv),b.push(E.specularIntensityMapUv),b.push(E.transmissionMapUv),b.push(E.thicknessMapUv),b.push(E.combine),b.push(E.fogExp2),b.push(E.sizeAttenuation),b.push(E.morphTargetsCount),b.push(E.morphAttributeCount),b.push(E.numDirLights),b.push(E.numPointLights),b.push(E.numSpotLights),b.push(E.numSpotLightMaps),b.push(E.numHemiLights),b.push(E.numRectAreaLights),b.push(E.numDirLightShadows),b.push(E.numPointLightShadows),b.push(E.numSpotLightShadows),b.push(E.numSpotLightShadowsWithMaps),b.push(E.numLightProbes),b.push(E.shadowMapType),b.push(E.toneMapping),b.push(E.numClippingPlanes),b.push(E.numClipIntersection),b.push(E.depthPacking)}function w(b,E){a.disableAll(),E.supportsVertexTextures&&a.enable(0),E.instancing&&a.enable(1),E.instancingColor&&a.enable(2),E.instancingMorph&&a.enable(3),E.matcap&&a.enable(4),E.envMap&&a.enable(5),E.normalMapObjectSpace&&a.enable(6),E.normalMapTangentSpace&&a.enable(7),E.clearcoat&&a.enable(8),E.iridescence&&a.enable(9),E.alphaTest&&a.enable(10),E.vertexColors&&a.enable(11),E.vertexAlphas&&a.enable(12),E.vertexUv1s&&a.enable(13),E.vertexUv2s&&a.enable(14),E.vertexUv3s&&a.enable(15),E.vertexTangents&&a.enable(16),E.anisotropy&&a.enable(17),E.alphaHash&&a.enable(18),E.batching&&a.enable(19),E.dispersion&&a.enable(20),E.batchingColor&&a.enable(21),E.gradientMap&&a.enable(22),b.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reversedDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),b.push(a.mask)}function y(b){const E=g[b.type];let L;if(E){const k=mn[E];L=xd.clone(k.uniforms)}else L=b.uniforms;return L}function A(b,E){let L;for(let k=0,H=u.length;k<H;k++){const V=u[k];if(V.cacheKey===E){L=V,++L.usedTimes;break}}return L===void 0&&(L=new Q0(i,E,b,r),u.push(L)),L}function R(b){if(--b.usedTimes===0){const E=u.indexOf(b);u[E]=u[u.length-1],u.pop(),b.destroy()}}function P(b){l.remove(b)}function N(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:y,acquireProgram:A,releaseProgram:R,releaseShaderCache:P,programs:u,dispose:N}}function sg(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function rg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function fc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function pc(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(h,d,f,g,_,m){let p=i[t];return p===void 0?(p={id:h.id,object:h,geometry:d,material:f,groupOrder:g,renderOrder:h.renderOrder,z:_,group:m},i[t]=p):(p.id=h.id,p.object=h,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=h.renderOrder,p.z=_,p.group=m),t++,p}function a(h,d,f,g,_,m){const p=o(h,d,f,g,_,m);f.transmission>0?n.push(p):f.transparent===!0?s.push(p):e.push(p)}function l(h,d,f,g,_,m){const p=o(h,d,f,g,_,m);f.transmission>0?n.unshift(p):f.transparent===!0?s.unshift(p):e.unshift(p)}function c(h,d){e.length>1&&e.sort(h||rg),n.length>1&&n.sort(d||fc),s.length>1&&s.sort(d||fc)}function u(){for(let h=t,d=i.length;h<d;h++){const f=i[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:u,sort:c}}function og(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new pc,i.set(n,[o])):s>=r.length?(o=new pc,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function ag(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new z,color:new kt};break;case"SpotLight":e={position:new z,direction:new z,color:new kt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new z,color:new kt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new z,skyColor:new kt,groundColor:new kt};break;case"RectAreaLight":e={color:new kt,position:new z,halfWidth:new z,halfHeight:new z};break}return i[t.id]=e,e}}}function lg(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Jt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Jt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Jt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let cg=0;function hg(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function ug(i){const t=new ag,e=lg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new z);const s=new z,r=new ae,o=new ae;function a(c){let u=0,h=0,d=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let f=0,g=0,_=0,m=0,p=0,S=0,w=0,y=0,A=0,R=0,P=0;c.sort(hg);for(let b=0,E=c.length;b<E;b++){const L=c[b],k=L.color,H=L.intensity,V=L.distance,q=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)u+=k.r*H,h+=k.g*H,d+=k.b*H;else if(L.isLightProbe){for(let X=0;X<9;X++)n.probe[X].addScaledVector(L.sh.coefficients[X],H);P++}else if(L.isDirectionalLight){const X=t.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const et=L.shadow,G=e.get(L);G.shadowIntensity=et.intensity,G.shadowBias=et.bias,G.shadowNormalBias=et.normalBias,G.shadowRadius=et.radius,G.shadowMapSize=et.mapSize,n.directionalShadow[f]=G,n.directionalShadowMap[f]=q,n.directionalShadowMatrix[f]=L.shadow.matrix,S++}n.directional[f]=X,f++}else if(L.isSpotLight){const X=t.get(L);X.position.setFromMatrixPosition(L.matrixWorld),X.color.copy(k).multiplyScalar(H),X.distance=V,X.coneCos=Math.cos(L.angle),X.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),X.decay=L.decay,n.spot[_]=X;const et=L.shadow;if(L.map&&(n.spotLightMap[A]=L.map,A++,et.updateMatrices(L),L.castShadow&&R++),n.spotLightMatrix[_]=et.matrix,L.castShadow){const G=e.get(L);G.shadowIntensity=et.intensity,G.shadowBias=et.bias,G.shadowNormalBias=et.normalBias,G.shadowRadius=et.radius,G.shadowMapSize=et.mapSize,n.spotShadow[_]=G,n.spotShadowMap[_]=q,y++}_++}else if(L.isRectAreaLight){const X=t.get(L);X.color.copy(k).multiplyScalar(H),X.halfWidth.set(L.width*.5,0,0),X.halfHeight.set(0,L.height*.5,0),n.rectArea[m]=X,m++}else if(L.isPointLight){const X=t.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity),X.distance=L.distance,X.decay=L.decay,L.castShadow){const et=L.shadow,G=e.get(L);G.shadowIntensity=et.intensity,G.shadowBias=et.bias,G.shadowNormalBias=et.normalBias,G.shadowRadius=et.radius,G.shadowMapSize=et.mapSize,G.shadowCameraNear=et.camera.near,G.shadowCameraFar=et.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=q,n.pointShadowMatrix[g]=L.shadow.matrix,w++}n.point[g]=X,g++}else if(L.isHemisphereLight){const X=t.get(L);X.skyColor.copy(L.color).multiplyScalar(H),X.groundColor.copy(L.groundColor).multiplyScalar(H),n.hemi[p]=X,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=at.LTC_FLOAT_1,n.rectAreaLTC2=at.LTC_FLOAT_2):(n.rectAreaLTC1=at.LTC_HALF_1,n.rectAreaLTC2=at.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const N=n.hash;(N.directionalLength!==f||N.pointLength!==g||N.spotLength!==_||N.rectAreaLength!==m||N.hemiLength!==p||N.numDirectionalShadows!==S||N.numPointShadows!==w||N.numSpotShadows!==y||N.numSpotMaps!==A||N.numLightProbes!==P)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=S,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=y+A-R,n.spotLightMap.length=A,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=P,N.directionalLength=f,N.pointLength=g,N.spotLength=_,N.rectAreaLength=m,N.hemiLength=p,N.numDirectionalShadows=S,N.numPointShadows=w,N.numSpotShadows=y,N.numSpotMaps=A,N.numLightProbes=P,n.version=cg++)}function l(c,u){let h=0,d=0,f=0,g=0,_=0;const m=u.matrixWorldInverse;for(let p=0,S=c.length;p<S;p++){const w=c[p];if(w.isDirectionalLight){const y=n.directional[h];y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),h++}else if(w.isSpotLight){const y=n.spot[f];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(m),y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),f++}else if(w.isRectAreaLight){const y=n.rectArea[g];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(m),o.identity(),r.copy(w.matrixWorld),r.premultiply(m),o.extractRotation(r),y.halfWidth.set(w.width*.5,0,0),y.halfHeight.set(0,w.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),g++}else if(w.isPointLight){const y=n.point[d];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(m),d++}else if(w.isHemisphereLight){const y=n.hemi[_];y.direction.setFromMatrixPosition(w.matrixWorld),y.direction.transformDirection(m),_++}}}return{setup:a,setupView:l,state:n}}function mc(i){const t=new ug(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function dg(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new mc(i),t.set(s,[a])):r>=o.length?(a=new mc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}const fg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,pg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function mg(i,t,e){let n=new Ga;const s=new Jt,r=new Jt,o=new ve,a=new Fd({depthPacking:Gu}),l=new zd,c={},u=e.maxTextureSize,h={[In]:Xe,[Xe]:In,[gn]:gn},d=new En({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Jt},radius:{value:4}},vertexShader:fg,fragmentShader:pg}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new on;g.setAttribute("position",new rn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Se(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Uc;let p=this.type;this.render=function(R,P,N){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;const b=i.getRenderTarget(),E=i.getActiveCubeFace(),L=i.getActiveMipmapLevel(),k=i.state;k.setBlending(Vn),k.buffers.depth.getReversed()===!0?k.buffers.color.setClear(0,0,0,0):k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);const H=p!==Ln&&this.type===Ln,V=p===Ln&&this.type!==Ln;for(let q=0,X=R.length;q<X;q++){const et=R[q],G=et.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",et,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);const Z=G.getFrameExtents();if(s.multiply(Z),r.copy(G.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/Z.x),s.x=r.x*Z.x,G.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/Z.y),s.y=r.y*Z.y,G.mapSize.y=r.y)),G.map===null||H===!0||V===!0){const ft=this.type!==Ln?{minFilter:$e,magFilter:$e}:{};G.map!==null&&G.map.dispose(),G.map=new hi(s.x,s.y,ft),G.map.texture.name=et.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();const ot=G.getViewportCount();for(let ft=0;ft<ot;ft++){const Ct=G.getViewport(ft);o.set(r.x*Ct.x,r.y*Ct.y,r.x*Ct.z,r.y*Ct.w),k.viewport(o),G.updateMatrices(et,ft),n=G.getFrustum(),y(P,N,G.camera,et,this.type)}G.isPointLightShadow!==!0&&this.type===Ln&&S(G,N),G.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(b,E,L)};function S(R,P){const N=t.update(_);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new hi(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(P,null,N,d,_,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(P,null,N,f,_,null)}function w(R,P,N,b){let E=null;const L=N.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(L!==void 0)E=L;else if(E=N.isPointLight===!0?l:a,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const k=E.uuid,H=P.uuid;let V=c[k];V===void 0&&(V={},c[k]=V);let q=V[H];q===void 0&&(q=E.clone(),V[H]=q,P.addEventListener("dispose",A)),E=q}if(E.visible=P.visible,E.wireframe=P.wireframe,b===Ln?E.side=P.shadowSide!==null?P.shadowSide:P.side:E.side=P.shadowSide!==null?P.shadowSide:h[P.side],E.alphaMap=P.alphaMap,E.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,E.map=P.map,E.clipShadows=P.clipShadows,E.clippingPlanes=P.clippingPlanes,E.clipIntersection=P.clipIntersection,E.displacementMap=P.displacementMap,E.displacementScale=P.displacementScale,E.displacementBias=P.displacementBias,E.wireframeLinewidth=P.wireframeLinewidth,E.linewidth=P.linewidth,N.isPointLight===!0&&E.isMeshDistanceMaterial===!0){const k=i.properties.get(E);k.light=N}return E}function y(R,P,N,b,E){if(R.visible===!1)return;if(R.layers.test(P.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&E===Ln)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,R.matrixWorld);const H=t.update(R),V=R.material;if(Array.isArray(V)){const q=H.groups;for(let X=0,et=q.length;X<et;X++){const G=q[X],Z=V[G.materialIndex];if(Z&&Z.visible){const ot=w(R,Z,b,E);R.onBeforeShadow(i,R,P,N,H,ot,G),i.renderBufferDirect(N,null,H,ot,R,G),R.onAfterShadow(i,R,P,N,H,ot,G)}}}else if(V.visible){const q=w(R,V,b,E);R.onBeforeShadow(i,R,P,N,H,q,null),i.renderBufferDirect(N,null,H,q,R,null),R.onAfterShadow(i,R,P,N,H,q,null)}}const k=R.children;for(let H=0,V=k.length;H<V;H++)y(k[H],P,N,b,E)}function A(R){R.target.removeEventListener("dispose",A);for(const N in c){const b=c[N],E=R.target.uuid;E in b&&(b[E].dispose(),delete b[E])}}}const gg={[Uo]:No,[ko]:Oo,[Fo]:Bo,[Xi]:zo,[No]:Uo,[Oo]:ko,[Bo]:Fo,[zo]:Xi};function vg(i,t){function e(){let D=!1;const it=new ve;let rt=null;const pt=new ve(0,0,0,0);return{setMask:function(Q){rt!==Q&&!D&&(i.colorMask(Q,Q,Q,Q),rt=Q)},setLocked:function(Q){D=Q},setClear:function(Q,j,gt,It,re){re===!0&&(Q*=It,j*=It,gt*=It),it.set(Q,j,gt,It),pt.equals(it)===!1&&(i.clearColor(Q,j,gt,It),pt.copy(it))},reset:function(){D=!1,rt=null,pt.set(-1,0,0,0)}}}function n(){let D=!1,it=!1,rt=null,pt=null,Q=null;return{setReversed:function(j){if(it!==j){const gt=t.get("EXT_clip_control");j?gt.clipControlEXT(gt.LOWER_LEFT_EXT,gt.ZERO_TO_ONE_EXT):gt.clipControlEXT(gt.LOWER_LEFT_EXT,gt.NEGATIVE_ONE_TO_ONE_EXT),it=j;const It=Q;Q=null,this.setClear(It)}},getReversed:function(){return it},setTest:function(j){j?K(i.DEPTH_TEST):ut(i.DEPTH_TEST)},setMask:function(j){rt!==j&&!D&&(i.depthMask(j),rt=j)},setFunc:function(j){if(it&&(j=gg[j]),pt!==j){switch(j){case Uo:i.depthFunc(i.NEVER);break;case No:i.depthFunc(i.ALWAYS);break;case ko:i.depthFunc(i.LESS);break;case Xi:i.depthFunc(i.LEQUAL);break;case Fo:i.depthFunc(i.EQUAL);break;case zo:i.depthFunc(i.GEQUAL);break;case Oo:i.depthFunc(i.GREATER);break;case Bo:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}pt=j}},setLocked:function(j){D=j},setClear:function(j){Q!==j&&(it&&(j=1-j),i.clearDepth(j),Q=j)},reset:function(){D=!1,rt=null,pt=null,Q=null,it=!1}}}function s(){let D=!1,it=null,rt=null,pt=null,Q=null,j=null,gt=null,It=null,re=null;return{setTest:function(Zt){D||(Zt?K(i.STENCIL_TEST):ut(i.STENCIL_TEST))},setMask:function(Zt){it!==Zt&&!D&&(i.stencilMask(Zt),it=Zt)},setFunc:function(Zt,wn,un){(rt!==Zt||pt!==wn||Q!==un)&&(i.stencilFunc(Zt,wn,un),rt=Zt,pt=wn,Q=un)},setOp:function(Zt,wn,un){(j!==Zt||gt!==wn||It!==un)&&(i.stencilOp(Zt,wn,un),j=Zt,gt=wn,It=un)},setLocked:function(Zt){D=Zt},setClear:function(Zt){re!==Zt&&(i.clearStencil(Zt),re=Zt)},reset:function(){D=!1,it=null,rt=null,pt=null,Q=null,j=null,gt=null,It=null,re=null}}}const r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,f=[],g=null,_=!1,m=null,p=null,S=null,w=null,y=null,A=null,R=null,P=new kt(0,0,0),N=0,b=!1,E=null,L=null,k=null,H=null,V=null;const q=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let X=!1,et=0;const G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(et=parseFloat(/^WebGL (\d)/.exec(G)[1]),X=et>=1):G.indexOf("OpenGL ES")!==-1&&(et=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),X=et>=2);let Z=null,ot={};const ft=i.getParameter(i.SCISSOR_BOX),Ct=i.getParameter(i.VIEWPORT),jt=new ve().fromArray(ft),Gt=new ve().fromArray(Ct);function Xt(D,it,rt,pt){const Q=new Uint8Array(4),j=i.createTexture();i.bindTexture(D,j),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let gt=0;gt<rt;gt++)D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY?i.texImage3D(it,0,i.RGBA,1,1,pt,0,i.RGBA,i.UNSIGNED_BYTE,Q):i.texImage2D(it+gt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Q);return j}const Y={};Y[i.TEXTURE_2D]=Xt(i.TEXTURE_2D,i.TEXTURE_2D,1),Y[i.TEXTURE_CUBE_MAP]=Xt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[i.TEXTURE_2D_ARRAY]=Xt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Y[i.TEXTURE_3D]=Xt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),K(i.DEPTH_TEST),o.setFunc(Xi),Lt(!1),vt(cl),K(i.CULL_FACE),ce(Vn);function K(D){u[D]!==!0&&(i.enable(D),u[D]=!0)}function ut(D){u[D]!==!1&&(i.disable(D),u[D]=!1)}function At(D,it){return h[D]!==it?(i.bindFramebuffer(D,it),h[D]=it,D===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=it),D===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=it),!0):!1}function Mt(D,it){let rt=f,pt=!1;if(D){rt=d.get(it),rt===void 0&&(rt=[],d.set(it,rt));const Q=D.textures;if(rt.length!==Q.length||rt[0]!==i.COLOR_ATTACHMENT0){for(let j=0,gt=Q.length;j<gt;j++)rt[j]=i.COLOR_ATTACHMENT0+j;rt.length=Q.length,pt=!0}}else rt[0]!==i.BACK&&(rt[0]=i.BACK,pt=!0);pt&&i.drawBuffers(rt)}function Vt(D){return g!==D?(i.useProgram(D),g=D,!0):!1}const Le={[ei]:i.FUNC_ADD,[pu]:i.FUNC_SUBTRACT,[mu]:i.FUNC_REVERSE_SUBTRACT};Le[gu]=i.MIN,Le[vu]=i.MAX;const C={[_u]:i.ZERO,[xu]:i.ONE,[yu]:i.SRC_COLOR,[Do]:i.SRC_ALPHA,[Tu]:i.SRC_ALPHA_SATURATE,[Eu]:i.DST_COLOR,[Su]:i.DST_ALPHA,[Mu]:i.ONE_MINUS_SRC_COLOR,[Io]:i.ONE_MINUS_SRC_ALPHA,[wu]:i.ONE_MINUS_DST_COLOR,[bu]:i.ONE_MINUS_DST_ALPHA,[Au]:i.CONSTANT_COLOR,[Ru]:i.ONE_MINUS_CONSTANT_COLOR,[Cu]:i.CONSTANT_ALPHA,[Pu]:i.ONE_MINUS_CONSTANT_ALPHA};function ce(D,it,rt,pt,Q,j,gt,It,re,Zt){if(D===Vn){_===!0&&(ut(i.BLEND),_=!1);return}if(_===!1&&(K(i.BLEND),_=!0),D!==fu){if(D!==m||Zt!==b){if((p!==ei||y!==ei)&&(i.blendEquation(i.FUNC_ADD),p=ei,y=ei),Zt)switch(D){case Vi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case hl:i.blendFunc(i.ONE,i.ONE);break;case ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case dl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case Vi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case hl:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case ul:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case dl:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}S=null,w=null,A=null,R=null,P.set(0,0,0),N=0,m=D,b=Zt}return}Q=Q||it,j=j||rt,gt=gt||pt,(it!==p||Q!==y)&&(i.blendEquationSeparate(Le[it],Le[Q]),p=it,y=Q),(rt!==S||pt!==w||j!==A||gt!==R)&&(i.blendFuncSeparate(C[rt],C[pt],C[j],C[gt]),S=rt,w=pt,A=j,R=gt),(It.equals(P)===!1||re!==N)&&(i.blendColor(It.r,It.g,It.b,re),P.copy(It),N=re),m=D,b=!1}function Nt(D,it){D.side===gn?ut(i.CULL_FACE):K(i.CULL_FACE);let rt=D.side===Xe;it&&(rt=!rt),Lt(rt),D.blending===Vi&&D.transparent===!1?ce(Vn):ce(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),r.setMask(D.colorWrite);const pt=D.stencilWrite;a.setTest(pt),pt&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),_t(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?K(i.SAMPLE_ALPHA_TO_COVERAGE):ut(i.SAMPLE_ALPHA_TO_COVERAGE)}function Lt(D){E!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),E=D)}function vt(D){D!==hu?(K(i.CULL_FACE),D!==L&&(D===cl?i.cullFace(i.BACK):D===uu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ut(i.CULL_FACE),L=D}function he(D){D!==k&&(X&&i.lineWidth(D),k=D)}function _t(D,it,rt){D?(K(i.POLYGON_OFFSET_FILL),(H!==it||V!==rt)&&(i.polygonOffset(it,rt),H=it,V=rt)):ut(i.POLYGON_OFFSET_FILL)}function Ot(D){D?K(i.SCISSOR_TEST):ut(i.SCISSOR_TEST)}function Ae(D){D===void 0&&(D=i.TEXTURE0+q-1),Z!==D&&(i.activeTexture(D),Z=D)}function _e(D,it,rt){rt===void 0&&(Z===null?rt=i.TEXTURE0+q-1:rt=Z);let pt=ot[rt];pt===void 0&&(pt={type:void 0,texture:void 0},ot[rt]=pt),(pt.type!==D||pt.texture!==it)&&(Z!==rt&&(i.activeTexture(rt),Z=rt),i.bindTexture(D,it||Y[D]),pt.type=D,pt.texture=it)}function T(){const D=ot[Z];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function x(){try{i.compressedTexImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function F(){try{i.compressedTexImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function $(){try{i.texSubImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function J(){try{i.texSubImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function W(){try{i.compressedTexSubImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Et(){try{i.compressedTexSubImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function st(){try{i.texStorage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function yt(){try{i.texStorage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function St(){try{i.texImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function nt(){try{i.texImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ht(D){jt.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),jt.copy(D))}function Pt(D){Gt.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),Gt.copy(D))}function bt(D,it){let rt=c.get(it);rt===void 0&&(rt=new WeakMap,c.set(it,rt));let pt=rt.get(D);pt===void 0&&(pt=i.getUniformBlockIndex(it,D.name),rt.set(D,pt))}function lt(D,it){const pt=c.get(it).get(D);l.get(it)!==pt&&(i.uniformBlockBinding(it,pt,D.__bindingPointIndex),l.set(it,pt))}function Ft(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},Z=null,ot={},h={},d=new WeakMap,f=[],g=null,_=!1,m=null,p=null,S=null,w=null,y=null,A=null,R=null,P=new kt(0,0,0),N=0,b=!1,E=null,L=null,k=null,H=null,V=null,jt.set(0,0,i.canvas.width,i.canvas.height),Gt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:K,disable:ut,bindFramebuffer:At,drawBuffers:Mt,useProgram:Vt,setBlending:ce,setMaterial:Nt,setFlipSided:Lt,setCullFace:vt,setLineWidth:he,setPolygonOffset:_t,setScissorTest:Ot,activeTexture:Ae,bindTexture:_e,unbindTexture:T,compressedTexImage2D:x,compressedTexImage3D:F,texImage2D:St,texImage3D:nt,updateUBOMapping:bt,uniformBlockBinding:lt,texStorage2D:st,texStorage3D:yt,texSubImage2D:$,texSubImage3D:J,compressedTexSubImage2D:W,compressedTexSubImage3D:Et,scissor:ht,viewport:Pt,reset:Ft}}function _g(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Jt,u=new WeakMap;let h;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,x){return f?new OffscreenCanvas(T,x):Ar("canvas")}function _(T,x,F){let $=1;const J=_e(T);if((J.width>F||J.height>F)&&($=F/Math.max(J.width,J.height)),$<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const W=Math.floor($*J.width),Et=Math.floor($*J.height);h===void 0&&(h=g(W,Et));const st=x?g(W,Et):h;return st.width=W,st.height=Et,st.getContext("2d").drawImage(T,0,0,W,Et),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+W+"x"+Et+")."),st}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),T;return T}function m(T){return T.generateMipmaps}function p(T){i.generateMipmap(T)}function S(T){return T.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?i.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(T,x,F,$,J=!1){if(T!==null){if(i[T]!==void 0)return i[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let W=x;if(x===i.RED&&(F===i.FLOAT&&(W=i.R32F),F===i.HALF_FLOAT&&(W=i.R16F),F===i.UNSIGNED_BYTE&&(W=i.R8)),x===i.RED_INTEGER&&(F===i.UNSIGNED_BYTE&&(W=i.R8UI),F===i.UNSIGNED_SHORT&&(W=i.R16UI),F===i.UNSIGNED_INT&&(W=i.R32UI),F===i.BYTE&&(W=i.R8I),F===i.SHORT&&(W=i.R16I),F===i.INT&&(W=i.R32I)),x===i.RG&&(F===i.FLOAT&&(W=i.RG32F),F===i.HALF_FLOAT&&(W=i.RG16F),F===i.UNSIGNED_BYTE&&(W=i.RG8)),x===i.RG_INTEGER&&(F===i.UNSIGNED_BYTE&&(W=i.RG8UI),F===i.UNSIGNED_SHORT&&(W=i.RG16UI),F===i.UNSIGNED_INT&&(W=i.RG32UI),F===i.BYTE&&(W=i.RG8I),F===i.SHORT&&(W=i.RG16I),F===i.INT&&(W=i.RG32I)),x===i.RGB_INTEGER&&(F===i.UNSIGNED_BYTE&&(W=i.RGB8UI),F===i.UNSIGNED_SHORT&&(W=i.RGB16UI),F===i.UNSIGNED_INT&&(W=i.RGB32UI),F===i.BYTE&&(W=i.RGB8I),F===i.SHORT&&(W=i.RGB16I),F===i.INT&&(W=i.RGB32I)),x===i.RGBA_INTEGER&&(F===i.UNSIGNED_BYTE&&(W=i.RGBA8UI),F===i.UNSIGNED_SHORT&&(W=i.RGBA16UI),F===i.UNSIGNED_INT&&(W=i.RGBA32UI),F===i.BYTE&&(W=i.RGBA8I),F===i.SHORT&&(W=i.RGBA16I),F===i.INT&&(W=i.RGBA32I)),x===i.RGB&&(F===i.UNSIGNED_INT_5_9_9_9_REV&&(W=i.RGB9_E5),F===i.UNSIGNED_INT_10F_11F_11F_REV&&(W=i.R11F_G11F_B10F)),x===i.RGBA){const Et=J?wr:Yt.getTransfer($);F===i.FLOAT&&(W=i.RGBA32F),F===i.HALF_FLOAT&&(W=i.RGBA16F),F===i.UNSIGNED_BYTE&&(W=Et===ee?i.SRGB8_ALPHA8:i.RGBA8),F===i.UNSIGNED_SHORT_4_4_4_4&&(W=i.RGBA4),F===i.UNSIGNED_SHORT_5_5_5_1&&(W=i.RGB5_A1)}return(W===i.R16F||W===i.R32F||W===i.RG16F||W===i.RG32F||W===i.RGBA16F||W===i.RGBA32F)&&t.get("EXT_color_buffer_float"),W}function y(T,x){let F;return T?x===null||x===ci||x===xs?F=i.DEPTH24_STENCIL8:x===xn?F=i.DEPTH32F_STENCIL8:x===_s&&(F=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===ci||x===xs?F=i.DEPTH_COMPONENT24:x===xn?F=i.DEPTH_COMPONENT32F:x===_s&&(F=i.DEPTH_COMPONENT16),F}function A(T,x){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==$e&&T.minFilter!==_n?Math.log2(Math.max(x.width,x.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?x.mipmaps.length:1}function R(T){const x=T.target;x.removeEventListener("dispose",R),N(x),x.isVideoTexture&&u.delete(x)}function P(T){const x=T.target;x.removeEventListener("dispose",P),E(x)}function N(T){const x=n.get(T);if(x.__webglInit===void 0)return;const F=T.source,$=d.get(F);if($){const J=$[x.__cacheKey];J.usedTimes--,J.usedTimes===0&&b(T),Object.keys($).length===0&&d.delete(F)}n.remove(T)}function b(T){const x=n.get(T);i.deleteTexture(x.__webglTexture);const F=T.source,$=d.get(F);delete $[x.__cacheKey],o.memory.textures--}function E(T){const x=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(x.__webglFramebuffer[$]))for(let J=0;J<x.__webglFramebuffer[$].length;J++)i.deleteFramebuffer(x.__webglFramebuffer[$][J]);else i.deleteFramebuffer(x.__webglFramebuffer[$]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[$])}else{if(Array.isArray(x.__webglFramebuffer))for(let $=0;$<x.__webglFramebuffer.length;$++)i.deleteFramebuffer(x.__webglFramebuffer[$]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let $=0;$<x.__webglColorRenderbuffer.length;$++)x.__webglColorRenderbuffer[$]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[$]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const F=T.textures;for(let $=0,J=F.length;$<J;$++){const W=n.get(F[$]);W.__webglTexture&&(i.deleteTexture(W.__webglTexture),o.memory.textures--),n.remove(F[$])}n.remove(T)}let L=0;function k(){L=0}function H(){const T=L;return T>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),L+=1,T}function V(T){const x=[];return x.push(T.wrapS),x.push(T.wrapT),x.push(T.wrapR||0),x.push(T.magFilter),x.push(T.minFilter),x.push(T.anisotropy),x.push(T.internalFormat),x.push(T.format),x.push(T.type),x.push(T.generateMipmaps),x.push(T.premultiplyAlpha),x.push(T.flipY),x.push(T.unpackAlignment),x.push(T.colorSpace),x.join()}function q(T,x){const F=n.get(T);if(T.isVideoTexture&&Ot(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&F.__version!==T.version){const $=T.image;if($===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Y(F,T,x);return}}else T.isExternalTexture&&(F.__webglTexture=T.sourceTexture?T.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,F.__webglTexture,i.TEXTURE0+x)}function X(T,x){const F=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&F.__version!==T.version){Y(F,T,x);return}e.bindTexture(i.TEXTURE_2D_ARRAY,F.__webglTexture,i.TEXTURE0+x)}function et(T,x){const F=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&F.__version!==T.version){Y(F,T,x);return}e.bindTexture(i.TEXTURE_3D,F.__webglTexture,i.TEXTURE0+x)}function G(T,x){const F=n.get(T);if(T.version>0&&F.__version!==T.version){K(F,T,x);return}e.bindTexture(i.TEXTURE_CUBE_MAP,F.__webglTexture,i.TEXTURE0+x)}const Z={[Vo]:i.REPEAT,[si]:i.CLAMP_TO_EDGE,[Wo]:i.MIRRORED_REPEAT},ot={[$e]:i.NEAREST,[Bu]:i.NEAREST_MIPMAP_NEAREST,[ds]:i.NEAREST_MIPMAP_LINEAR,[_n]:i.LINEAR,[$r]:i.LINEAR_MIPMAP_NEAREST,[ri]:i.LINEAR_MIPMAP_LINEAR},ft={[Wu]:i.NEVER,[Ku]:i.ALWAYS,[Xu]:i.LESS,[Wc]:i.LEQUAL,[$u]:i.EQUAL,[ju]:i.GEQUAL,[qu]:i.GREATER,[Yu]:i.NOTEQUAL};function Ct(T,x){if(x.type===xn&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===_n||x.magFilter===$r||x.magFilter===ds||x.magFilter===ri||x.minFilter===_n||x.minFilter===$r||x.minFilter===ds||x.minFilter===ri)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(T,i.TEXTURE_WRAP_S,Z[x.wrapS]),i.texParameteri(T,i.TEXTURE_WRAP_T,Z[x.wrapT]),(T===i.TEXTURE_3D||T===i.TEXTURE_2D_ARRAY)&&i.texParameteri(T,i.TEXTURE_WRAP_R,Z[x.wrapR]),i.texParameteri(T,i.TEXTURE_MAG_FILTER,ot[x.magFilter]),i.texParameteri(T,i.TEXTURE_MIN_FILTER,ot[x.minFilter]),x.compareFunction&&(i.texParameteri(T,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(T,i.TEXTURE_COMPARE_FUNC,ft[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===$e||x.minFilter!==ds&&x.minFilter!==ri||x.type===xn&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const F=t.get("EXT_texture_filter_anisotropic");i.texParameterf(T,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function jt(T,x){let F=!1;T.__webglInit===void 0&&(T.__webglInit=!0,x.addEventListener("dispose",R));const $=x.source;let J=d.get($);J===void 0&&(J={},d.set($,J));const W=V(x);if(W!==T.__cacheKey){J[W]===void 0&&(J[W]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,F=!0),J[W].usedTimes++;const Et=J[T.__cacheKey];Et!==void 0&&(J[T.__cacheKey].usedTimes--,Et.usedTimes===0&&b(x)),T.__cacheKey=W,T.__webglTexture=J[W].texture}return F}function Gt(T,x,F){return Math.floor(Math.floor(T/F)/x)}function Xt(T,x,F,$){const W=T.updateRanges;if(W.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,x.width,x.height,F,$,x.data);else{W.sort((nt,ht)=>nt.start-ht.start);let Et=0;for(let nt=1;nt<W.length;nt++){const ht=W[Et],Pt=W[nt],bt=ht.start+ht.count,lt=Gt(Pt.start,x.width,4),Ft=Gt(ht.start,x.width,4);Pt.start<=bt+1&&lt===Ft&&Gt(Pt.start+Pt.count-1,x.width,4)===lt?ht.count=Math.max(ht.count,Pt.start+Pt.count-ht.start):(++Et,W[Et]=Pt)}W.length=Et+1;const st=i.getParameter(i.UNPACK_ROW_LENGTH),yt=i.getParameter(i.UNPACK_SKIP_PIXELS),St=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,x.width);for(let nt=0,ht=W.length;nt<ht;nt++){const Pt=W[nt],bt=Math.floor(Pt.start/4),lt=Math.ceil(Pt.count/4),Ft=bt%x.width,D=Math.floor(bt/x.width),it=lt,rt=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,Ft),i.pixelStorei(i.UNPACK_SKIP_ROWS,D),e.texSubImage2D(i.TEXTURE_2D,0,Ft,D,it,rt,F,$,x.data)}T.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,st),i.pixelStorei(i.UNPACK_SKIP_PIXELS,yt),i.pixelStorei(i.UNPACK_SKIP_ROWS,St)}}function Y(T,x,F){let $=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&($=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&($=i.TEXTURE_3D);const J=jt(T,x),W=x.source;e.bindTexture($,T.__webglTexture,i.TEXTURE0+F);const Et=n.get(W);if(W.version!==Et.__version||J===!0){e.activeTexture(i.TEXTURE0+F);const st=Yt.getPrimaries(Yt.workingColorSpace),yt=x.colorSpace===Bn?null:Yt.getPrimaries(x.colorSpace),St=x.colorSpace===Bn||st===yt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,St);let nt=_(x.image,!1,s.maxTextureSize);nt=Ae(x,nt);const ht=r.convert(x.format,x.colorSpace),Pt=r.convert(x.type);let bt=w(x.internalFormat,ht,Pt,x.colorSpace,x.isVideoTexture);Ct($,x);let lt;const Ft=x.mipmaps,D=x.isVideoTexture!==!0,it=Et.__version===void 0||J===!0,rt=W.dataReady,pt=A(x,nt);if(x.isDepthTexture)bt=y(x.format===Ms,x.type),it&&(D?e.texStorage2D(i.TEXTURE_2D,1,bt,nt.width,nt.height):e.texImage2D(i.TEXTURE_2D,0,bt,nt.width,nt.height,0,ht,Pt,null));else if(x.isDataTexture)if(Ft.length>0){D&&it&&e.texStorage2D(i.TEXTURE_2D,pt,bt,Ft[0].width,Ft[0].height);for(let Q=0,j=Ft.length;Q<j;Q++)lt=Ft[Q],D?rt&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,lt.width,lt.height,ht,Pt,lt.data):e.texImage2D(i.TEXTURE_2D,Q,bt,lt.width,lt.height,0,ht,Pt,lt.data);x.generateMipmaps=!1}else D?(it&&e.texStorage2D(i.TEXTURE_2D,pt,bt,nt.width,nt.height),rt&&Xt(x,nt,ht,Pt)):e.texImage2D(i.TEXTURE_2D,0,bt,nt.width,nt.height,0,ht,Pt,nt.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){D&&it&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,bt,Ft[0].width,Ft[0].height,nt.depth);for(let Q=0,j=Ft.length;Q<j;Q++)if(lt=Ft[Q],x.format!==hn)if(ht!==null)if(D){if(rt)if(x.layerUpdates.size>0){const gt=Xl(lt.width,lt.height,x.format,x.type);for(const It of x.layerUpdates){const re=lt.data.subarray(It*gt/lt.data.BYTES_PER_ELEMENT,(It+1)*gt/lt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,It,lt.width,lt.height,1,ht,re)}x.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,lt.width,lt.height,nt.depth,ht,lt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Q,bt,lt.width,lt.height,nt.depth,0,lt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else D?rt&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,lt.width,lt.height,nt.depth,ht,Pt,lt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Q,bt,lt.width,lt.height,nt.depth,0,ht,Pt,lt.data)}else{D&&it&&e.texStorage2D(i.TEXTURE_2D,pt,bt,Ft[0].width,Ft[0].height);for(let Q=0,j=Ft.length;Q<j;Q++)lt=Ft[Q],x.format!==hn?ht!==null?D?rt&&e.compressedTexSubImage2D(i.TEXTURE_2D,Q,0,0,lt.width,lt.height,ht,lt.data):e.compressedTexImage2D(i.TEXTURE_2D,Q,bt,lt.width,lt.height,0,lt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):D?rt&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,lt.width,lt.height,ht,Pt,lt.data):e.texImage2D(i.TEXTURE_2D,Q,bt,lt.width,lt.height,0,ht,Pt,lt.data)}else if(x.isDataArrayTexture)if(D){if(it&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,bt,nt.width,nt.height,nt.depth),rt)if(x.layerUpdates.size>0){const Q=Xl(nt.width,nt.height,x.format,x.type);for(const j of x.layerUpdates){const gt=nt.data.subarray(j*Q/nt.data.BYTES_PER_ELEMENT,(j+1)*Q/nt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,j,nt.width,nt.height,1,ht,Pt,gt)}x.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,ht,Pt,nt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,bt,nt.width,nt.height,nt.depth,0,ht,Pt,nt.data);else if(x.isData3DTexture)D?(it&&e.texStorage3D(i.TEXTURE_3D,pt,bt,nt.width,nt.height,nt.depth),rt&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,ht,Pt,nt.data)):e.texImage3D(i.TEXTURE_3D,0,bt,nt.width,nt.height,nt.depth,0,ht,Pt,nt.data);else if(x.isFramebufferTexture){if(it)if(D)e.texStorage2D(i.TEXTURE_2D,pt,bt,nt.width,nt.height);else{let Q=nt.width,j=nt.height;for(let gt=0;gt<pt;gt++)e.texImage2D(i.TEXTURE_2D,gt,bt,Q,j,0,ht,Pt,null),Q>>=1,j>>=1}}else if(Ft.length>0){if(D&&it){const Q=_e(Ft[0]);e.texStorage2D(i.TEXTURE_2D,pt,bt,Q.width,Q.height)}for(let Q=0,j=Ft.length;Q<j;Q++)lt=Ft[Q],D?rt&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,ht,Pt,lt):e.texImage2D(i.TEXTURE_2D,Q,bt,ht,Pt,lt);x.generateMipmaps=!1}else if(D){if(it){const Q=_e(nt);e.texStorage2D(i.TEXTURE_2D,pt,bt,Q.width,Q.height)}rt&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ht,Pt,nt)}else e.texImage2D(i.TEXTURE_2D,0,bt,ht,Pt,nt);m(x)&&p($),Et.__version=W.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function K(T,x,F){if(x.image.length!==6)return;const $=jt(T,x),J=x.source;e.bindTexture(i.TEXTURE_CUBE_MAP,T.__webglTexture,i.TEXTURE0+F);const W=n.get(J);if(J.version!==W.__version||$===!0){e.activeTexture(i.TEXTURE0+F);const Et=Yt.getPrimaries(Yt.workingColorSpace),st=x.colorSpace===Bn?null:Yt.getPrimaries(x.colorSpace),yt=x.colorSpace===Bn||Et===st?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,yt);const St=x.isCompressedTexture||x.image[0].isCompressedTexture,nt=x.image[0]&&x.image[0].isDataTexture,ht=[];for(let j=0;j<6;j++)!St&&!nt?ht[j]=_(x.image[j],!0,s.maxCubemapSize):ht[j]=nt?x.image[j].image:x.image[j],ht[j]=Ae(x,ht[j]);const Pt=ht[0],bt=r.convert(x.format,x.colorSpace),lt=r.convert(x.type),Ft=w(x.internalFormat,bt,lt,x.colorSpace),D=x.isVideoTexture!==!0,it=W.__version===void 0||$===!0,rt=J.dataReady;let pt=A(x,Pt);Ct(i.TEXTURE_CUBE_MAP,x);let Q;if(St){D&&it&&e.texStorage2D(i.TEXTURE_CUBE_MAP,pt,Ft,Pt.width,Pt.height);for(let j=0;j<6;j++){Q=ht[j].mipmaps;for(let gt=0;gt<Q.length;gt++){const It=Q[gt];x.format!==hn?bt!==null?D?rt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt,0,0,It.width,It.height,bt,It.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt,Ft,It.width,It.height,0,It.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt,0,0,It.width,It.height,bt,lt,It.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt,Ft,It.width,It.height,0,bt,lt,It.data)}}}else{if(Q=x.mipmaps,D&&it){Q.length>0&&pt++;const j=_e(ht[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,pt,Ft,j.width,j.height)}for(let j=0;j<6;j++)if(nt){D?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,ht[j].width,ht[j].height,bt,lt,ht[j].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ft,ht[j].width,ht[j].height,0,bt,lt,ht[j].data);for(let gt=0;gt<Q.length;gt++){const re=Q[gt].image[j].image;D?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt+1,0,0,re.width,re.height,bt,lt,re.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt+1,Ft,re.width,re.height,0,bt,lt,re.data)}}else{D?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,bt,lt,ht[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ft,bt,lt,ht[j]);for(let gt=0;gt<Q.length;gt++){const It=Q[gt];D?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt+1,0,0,bt,lt,It.image[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,gt+1,Ft,bt,lt,It.image[j])}}}m(x)&&p(i.TEXTURE_CUBE_MAP),W.__version=J.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function ut(T,x,F,$,J,W){const Et=r.convert(F.format,F.colorSpace),st=r.convert(F.type),yt=w(F.internalFormat,Et,st,F.colorSpace),St=n.get(x),nt=n.get(F);if(nt.__renderTarget=x,!St.__hasExternalTextures){const ht=Math.max(1,x.width>>W),Pt=Math.max(1,x.height>>W);J===i.TEXTURE_3D||J===i.TEXTURE_2D_ARRAY?e.texImage3D(J,W,yt,ht,Pt,x.depth,0,Et,st,null):e.texImage2D(J,W,yt,ht,Pt,0,Et,st,null)}e.bindFramebuffer(i.FRAMEBUFFER,T),_t(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,$,J,nt.__webglTexture,0,he(x)):(J===i.TEXTURE_2D||J>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,$,J,nt.__webglTexture,W),e.bindFramebuffer(i.FRAMEBUFFER,null)}function At(T,x,F){if(i.bindRenderbuffer(i.RENDERBUFFER,T),x.depthBuffer){const $=x.depthTexture,J=$&&$.isDepthTexture?$.type:null,W=y(x.stencilBuffer,J),Et=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,st=he(x);_t(x)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,st,W,x.width,x.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,st,W,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,W,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Et,i.RENDERBUFFER,T)}else{const $=x.textures;for(let J=0;J<$.length;J++){const W=$[J],Et=r.convert(W.format,W.colorSpace),st=r.convert(W.type),yt=w(W.internalFormat,Et,st,W.colorSpace),St=he(x);F&&_t(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,St,yt,x.width,x.height):_t(x)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,St,yt,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,yt,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Mt(T,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,T),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const $=n.get(x.depthTexture);$.__renderTarget=x,(!$.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),q(x.depthTexture,0);const J=$.__webglTexture,W=he(x);if(x.depthTexture.format===ys)_t(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0,W):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0);else if(x.depthTexture.format===Ms)_t(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0,W):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function Vt(T){const x=n.get(T),F=T.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==T.depthTexture){const $=T.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),$){const J=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,$.removeEventListener("dispose",J)};$.addEventListener("dispose",J),x.__depthDisposeCallback=J}x.__boundDepthTexture=$}if(T.depthTexture&&!x.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");const $=T.texture.mipmaps;$&&$.length>0?Mt(x.__webglFramebuffer[0],T):Mt(x.__webglFramebuffer,T)}else if(F){x.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[$]),x.__webglDepthbuffer[$]===void 0)x.__webglDepthbuffer[$]=i.createRenderbuffer(),At(x.__webglDepthbuffer[$],T,!1);else{const J=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,W=x.__webglDepthbuffer[$];i.bindRenderbuffer(i.RENDERBUFFER,W),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,W)}}else{const $=T.texture.mipmaps;if($&&$.length>0?e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),At(x.__webglDepthbuffer,T,!1);else{const J=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,W=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,W),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,W)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Le(T,x,F){const $=n.get(T);x!==void 0&&ut($.__webglFramebuffer,T,T.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),F!==void 0&&Vt(T)}function C(T){const x=T.texture,F=n.get(T),$=n.get(x);T.addEventListener("dispose",P);const J=T.textures,W=T.isWebGLCubeRenderTarget===!0,Et=J.length>1;if(Et||($.__webglTexture===void 0&&($.__webglTexture=i.createTexture()),$.__version=x.version,o.memory.textures++),W){F.__webglFramebuffer=[];for(let st=0;st<6;st++)if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer[st]=[];for(let yt=0;yt<x.mipmaps.length;yt++)F.__webglFramebuffer[st][yt]=i.createFramebuffer()}else F.__webglFramebuffer[st]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer=[];for(let st=0;st<x.mipmaps.length;st++)F.__webglFramebuffer[st]=i.createFramebuffer()}else F.__webglFramebuffer=i.createFramebuffer();if(Et)for(let st=0,yt=J.length;st<yt;st++){const St=n.get(J[st]);St.__webglTexture===void 0&&(St.__webglTexture=i.createTexture(),o.memory.textures++)}if(T.samples>0&&_t(T)===!1){F.__webglMultisampledFramebuffer=i.createFramebuffer(),F.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let st=0;st<J.length;st++){const yt=J[st];F.__webglColorRenderbuffer[st]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,F.__webglColorRenderbuffer[st]);const St=r.convert(yt.format,yt.colorSpace),nt=r.convert(yt.type),ht=w(yt.internalFormat,St,nt,yt.colorSpace,T.isXRRenderTarget===!0),Pt=he(T);i.renderbufferStorageMultisample(i.RENDERBUFFER,Pt,ht,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+st,i.RENDERBUFFER,F.__webglColorRenderbuffer[st])}i.bindRenderbuffer(i.RENDERBUFFER,null),T.depthBuffer&&(F.__webglDepthRenderbuffer=i.createRenderbuffer(),At(F.__webglDepthRenderbuffer,T,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(W){e.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),Ct(i.TEXTURE_CUBE_MAP,x);for(let st=0;st<6;st++)if(x.mipmaps&&x.mipmaps.length>0)for(let yt=0;yt<x.mipmaps.length;yt++)ut(F.__webglFramebuffer[st][yt],T,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+st,yt);else ut(F.__webglFramebuffer[st],T,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0);m(x)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Et){for(let st=0,yt=J.length;st<yt;st++){const St=J[st],nt=n.get(St);let ht=i.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ht=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ht,nt.__webglTexture),Ct(ht,St),ut(F.__webglFramebuffer,T,St,i.COLOR_ATTACHMENT0+st,ht,0),m(St)&&p(ht)}e.unbindTexture()}else{let st=i.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(st=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(st,$.__webglTexture),Ct(st,x),x.mipmaps&&x.mipmaps.length>0)for(let yt=0;yt<x.mipmaps.length;yt++)ut(F.__webglFramebuffer[yt],T,x,i.COLOR_ATTACHMENT0,st,yt);else ut(F.__webglFramebuffer,T,x,i.COLOR_ATTACHMENT0,st,0);m(x)&&p(st),e.unbindTexture()}T.depthBuffer&&Vt(T)}function ce(T){const x=T.textures;for(let F=0,$=x.length;F<$;F++){const J=x[F];if(m(J)){const W=S(T),Et=n.get(J).__webglTexture;e.bindTexture(W,Et),p(W),e.unbindTexture()}}}const Nt=[],Lt=[];function vt(T){if(T.samples>0){if(_t(T)===!1){const x=T.textures,F=T.width,$=T.height;let J=i.COLOR_BUFFER_BIT;const W=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Et=n.get(T),st=x.length>1;if(st)for(let St=0;St<x.length;St++)e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Et.__webglMultisampledFramebuffer);const yt=T.texture.mipmaps;yt&&yt.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Et.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Et.__webglFramebuffer);for(let St=0;St<x.length;St++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(J|=i.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(J|=i.STENCIL_BUFFER_BIT)),st){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Et.__webglColorRenderbuffer[St]);const nt=n.get(x[St]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,nt,0)}i.blitFramebuffer(0,0,F,$,0,0,F,$,J,i.NEAREST),l===!0&&(Nt.length=0,Lt.length=0,Nt.push(i.COLOR_ATTACHMENT0+St),T.depthBuffer&&T.resolveDepthBuffer===!1&&(Nt.push(W),Lt.push(W),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Lt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Nt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),st)for(let St=0;St<x.length;St++){e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.RENDERBUFFER,Et.__webglColorRenderbuffer[St]);const nt=n.get(x[St]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.TEXTURE_2D,nt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Et.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){const x=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function he(T){return Math.min(s.maxSamples,T.samples)}function _t(T){const x=n.get(T);return T.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Ot(T){const x=o.render.frame;u.get(T)!==x&&(u.set(T,x),T.update())}function Ae(T,x){const F=T.colorSpace,$=T.format,J=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||F!==Yi&&F!==Bn&&(Yt.getTransfer(F)===ee?($!==hn||J!==Sn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),x}function _e(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=k,this.setTexture2D=q,this.setTexture2DArray=X,this.setTexture3D=et,this.setTextureCube=G,this.rebindTextures=Le,this.setupRenderTarget=C,this.updateRenderTargetMipmap=ce,this.updateMultisampleRenderTarget=vt,this.setupDepthRenderbuffer=Vt,this.setupFrameBufferTexture=ut,this.useMultisampledRTT=_t}function xg(i,t){function e(n,s=Bn){let r;const o=Yt.getTransfer(s);if(n===Sn)return i.UNSIGNED_BYTE;if(n===Ia)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ua)return i.UNSIGNED_SHORT_5_5_5_1;if(n===zc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Oc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===kc)return i.BYTE;if(n===Fc)return i.SHORT;if(n===_s)return i.UNSIGNED_SHORT;if(n===Da)return i.INT;if(n===ci)return i.UNSIGNED_INT;if(n===xn)return i.FLOAT;if(n===Ts)return i.HALF_FLOAT;if(n===Bc)return i.ALPHA;if(n===Hc)return i.RGB;if(n===hn)return i.RGBA;if(n===ys)return i.DEPTH_COMPONENT;if(n===Ms)return i.DEPTH_STENCIL;if(n===Na)return i.RED;if(n===ka)return i.RED_INTEGER;if(n===Gc)return i.RG;if(n===Fa)return i.RG_INTEGER;if(n===za)return i.RGBA_INTEGER;if(n===fr||n===pr||n===mr||n===gr)if(o===ee)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===fr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===gr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===fr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===mr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===gr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Xo||n===$o||n===qo||n===Yo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Xo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===$o)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===qo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Yo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===jo||n===Ko||n===Jo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===jo||n===Ko)return o===ee?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Jo)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Zo||n===Qo||n===ta||n===ea||n===na||n===ia||n===sa||n===ra||n===oa||n===aa||n===la||n===ca||n===ha||n===ua)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Zo)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Qo)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ta)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ea)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===na)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ia)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===sa)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ra)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===oa)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===aa)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===la)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ca)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ha)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ua)return o===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===da||n===fa||n===pa)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===da)return o===ee?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===fa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===pa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===ma||n===ga||n===va||n===_a)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===ma)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ga)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===va)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===_a)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===xs?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const yg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Mg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Sg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new ih(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new En({vertexShader:yg,fragmentShader:Mg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Se(new Or(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class bg extends Ji{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,f=null,g=null;const _=typeof XRWebGLBinding<"u",m=new Sg,p={},S=e.getContextAttributes();let w=null,y=null;const A=[],R=[],P=new Jt;let N=null;const b=new Je;b.viewport=new ve;const E=new Je;E.viewport=new ve;const L=[b,E],k=new Vd;let H=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let K=A[Y];return K===void 0&&(K=new mo,A[Y]=K),K.getTargetRaySpace()},this.getControllerGrip=function(Y){let K=A[Y];return K===void 0&&(K=new mo,A[Y]=K),K.getGripSpace()},this.getHand=function(Y){let K=A[Y];return K===void 0&&(K=new mo,A[Y]=K),K.getHandSpace()};function q(Y){const K=R.indexOf(Y.inputSource);if(K===-1)return;const ut=A[K];ut!==void 0&&(ut.update(Y.inputSource,Y.frame,c||o),ut.dispatchEvent({type:Y.type,data:Y.inputSource}))}function X(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",X),s.removeEventListener("inputsourceschange",et);for(let Y=0;Y<A.length;Y++){const K=R[Y];K!==null&&(R[Y]=null,A[Y].disconnect(K))}H=null,V=null,m.reset();for(const Y in p)delete p[Y];t.setRenderTarget(w),f=null,d=null,h=null,s=null,y=null,Xt.stop(),n.isPresenting=!1,t.setPixelRatio(N),t.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){a=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Y){c=Y},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h===null&&_&&(h=new XRWebGLBinding(s,e)),h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Y){if(s=Y,s!==null){if(w=t.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",X),s.addEventListener("inputsourceschange",et),S.xrCompatible!==!0&&await e.makeXRCompatible(),N=t.getPixelRatio(),t.getSize(P),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let ut=null,At=null,Mt=null;S.depth&&(Mt=S.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,ut=S.stencil?Ms:ys,At=S.stencil?xs:ci);const Vt={colorFormat:e.RGBA8,depthFormat:Mt,scaleFactor:r};h=this.getBinding(),d=h.createProjectionLayer(Vt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),y=new hi(d.textureWidth,d.textureHeight,{format:hn,type:Sn,depthTexture:new nh(d.textureWidth,d.textureHeight,At,void 0,void 0,void 0,void 0,void 0,void 0,ut),stencilBuffer:S.stencil,colorSpace:t.outputColorSpace,samples:S.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const ut={antialias:S.antialias,alpha:!0,depth:S.depth,stencil:S.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,ut),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new hi(f.framebufferWidth,f.framebufferHeight,{format:hn,type:Sn,colorSpace:t.outputColorSpace,stencilBuffer:S.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Xt.setContext(s),Xt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function et(Y){for(let K=0;K<Y.removed.length;K++){const ut=Y.removed[K],At=R.indexOf(ut);At>=0&&(R[At]=null,A[At].disconnect(ut))}for(let K=0;K<Y.added.length;K++){const ut=Y.added[K];let At=R.indexOf(ut);if(At===-1){for(let Vt=0;Vt<A.length;Vt++)if(Vt>=R.length){R.push(ut),At=Vt;break}else if(R[Vt]===null){R[Vt]=ut,At=Vt;break}if(At===-1)break}const Mt=A[At];Mt&&Mt.connect(ut)}}const G=new z,Z=new z;function ot(Y,K,ut){G.setFromMatrixPosition(K.matrixWorld),Z.setFromMatrixPosition(ut.matrixWorld);const At=G.distanceTo(Z),Mt=K.projectionMatrix.elements,Vt=ut.projectionMatrix.elements,Le=Mt[14]/(Mt[10]-1),C=Mt[14]/(Mt[10]+1),ce=(Mt[9]+1)/Mt[5],Nt=(Mt[9]-1)/Mt[5],Lt=(Mt[8]-1)/Mt[0],vt=(Vt[8]+1)/Vt[0],he=Le*Lt,_t=Le*vt,Ot=At/(-Lt+vt),Ae=Ot*-Lt;if(K.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(Ae),Y.translateZ(Ot),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Mt[10]===-1)Y.projectionMatrix.copy(K.projectionMatrix),Y.projectionMatrixInverse.copy(K.projectionMatrixInverse);else{const _e=Le+Ot,T=C+Ot,x=he-Ae,F=_t+(At-Ae),$=ce*C/T*_e,J=Nt*C/T*_e;Y.projectionMatrix.makePerspective(x,F,$,J,_e,T),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function ft(Y,K){K===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(K.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(s===null)return;let K=Y.near,ut=Y.far;m.texture!==null&&(m.depthNear>0&&(K=m.depthNear),m.depthFar>0&&(ut=m.depthFar)),k.near=E.near=b.near=K,k.far=E.far=b.far=ut,(H!==k.near||V!==k.far)&&(s.updateRenderState({depthNear:k.near,depthFar:k.far}),H=k.near,V=k.far),k.layers.mask=Y.layers.mask|6,b.layers.mask=k.layers.mask&3,E.layers.mask=k.layers.mask&5;const At=Y.parent,Mt=k.cameras;ft(k,At);for(let Vt=0;Vt<Mt.length;Vt++)ft(Mt[Vt],At);Mt.length===2?ot(k,b,E):k.projectionMatrix.copy(b.projectionMatrix),Ct(Y,k,At)};function Ct(Y,K,ut){ut===null?Y.matrix.copy(K.matrixWorld):(Y.matrix.copy(ut.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(K.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(K.projectionMatrix),Y.projectionMatrixInverse.copy(K.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=xa*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return k},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(Y){l=Y,d!==null&&(d.fixedFoveation=Y),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Y)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(k)},this.getCameraTexture=function(Y){return p[Y]};let jt=null;function Gt(Y,K){if(u=K.getViewerPose(c||o),g=K,u!==null){const ut=u.views;f!==null&&(t.setRenderTargetFramebuffer(y,f.framebuffer),t.setRenderTarget(y));let At=!1;ut.length!==k.cameras.length&&(k.cameras.length=0,At=!0);for(let C=0;C<ut.length;C++){const ce=ut[C];let Nt=null;if(f!==null)Nt=f.getViewport(ce);else{const vt=h.getViewSubImage(d,ce);Nt=vt.viewport,C===0&&(t.setRenderTargetTextures(y,vt.colorTexture,vt.depthStencilTexture),t.setRenderTarget(y))}let Lt=L[C];Lt===void 0&&(Lt=new Je,Lt.layers.enable(C),Lt.viewport=new ve,L[C]=Lt),Lt.matrix.fromArray(ce.transform.matrix),Lt.matrix.decompose(Lt.position,Lt.quaternion,Lt.scale),Lt.projectionMatrix.fromArray(ce.projectionMatrix),Lt.projectionMatrixInverse.copy(Lt.projectionMatrix).invert(),Lt.viewport.set(Nt.x,Nt.y,Nt.width,Nt.height),C===0&&(k.matrix.copy(Lt.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale)),At===!0&&k.cameras.push(Lt)}const Mt=s.enabledFeatures;if(Mt&&Mt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){h=n.getBinding();const C=h.getDepthInformation(ut[0]);C&&C.isValid&&C.texture&&m.init(C,s.renderState)}if(Mt&&Mt.includes("camera-access")&&_){t.state.unbindTexture(),h=n.getBinding();for(let C=0;C<ut.length;C++){const ce=ut[C].camera;if(ce){let Nt=p[ce];Nt||(Nt=new ih,p[ce]=Nt);const Lt=h.getCameraImage(ce);Nt.sourceTexture=Lt}}}}for(let ut=0;ut<A.length;ut++){const At=R[ut],Mt=A[ut];At!==null&&Mt!==void 0&&Mt.update(At,K,c||o)}jt&&jt(Y,K),K.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:K}),g=null}const Xt=new oh;Xt.setAnimationLoop(Gt),this.setAnimationLoop=function(Y){jt=Y},this.dispose=function(){}}}const Zn=new bn,Eg=new ae;function wg(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Jc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,S,w,y){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),h(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,y)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),_(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,S,w):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Xe&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Xe&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const S=t.get(p),w=S.envMap,y=S.envMapRotation;w&&(m.envMap.value=w,Zn.copy(y),Zn.x*=-1,Zn.y*=-1,Zn.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Zn.y*=-1,Zn.z*=-1),m.envMapRotation.value.setFromMatrix4(Eg.makeRotationFromEuler(Zn)),m.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,S,w){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*S,m.scale.value=w*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,S){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Xe&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=S.texture,m.transmissionSamplerSize.value.set(S.width,S.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){const S=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(S.matrixWorld),m.nearDistance.value=S.shadow.camera.near,m.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Tg(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(S,w){const y=w.program;n.uniformBlockBinding(S,y)}function c(S,w){let y=s[S.id];y===void 0&&(g(S),y=u(S),s[S.id]=y,S.addEventListener("dispose",m));const A=w.program;n.updateUBOMapping(S,A);const R=t.render.frame;r[S.id]!==R&&(d(S),r[S.id]=R)}function u(S){const w=h();S.__bindingPointIndex=w;const y=i.createBuffer(),A=S.__size,R=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,y),i.bufferData(i.UNIFORM_BUFFER,A,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,y),y}function h(){for(let S=0;S<a;S++)if(o.indexOf(S)===-1)return o.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(S){const w=s[S.id],y=S.uniforms,A=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let R=0,P=y.length;R<P;R++){const N=Array.isArray(y[R])?y[R]:[y[R]];for(let b=0,E=N.length;b<E;b++){const L=N[b];if(f(L,R,b,A)===!0){const k=L.__offset,H=Array.isArray(L.value)?L.value:[L.value];let V=0;for(let q=0;q<H.length;q++){const X=H[q],et=_(X);typeof X=="number"||typeof X=="boolean"?(L.__data[0]=X,i.bufferSubData(i.UNIFORM_BUFFER,k+V,L.__data)):X.isMatrix3?(L.__data[0]=X.elements[0],L.__data[1]=X.elements[1],L.__data[2]=X.elements[2],L.__data[3]=0,L.__data[4]=X.elements[3],L.__data[5]=X.elements[4],L.__data[6]=X.elements[5],L.__data[7]=0,L.__data[8]=X.elements[6],L.__data[9]=X.elements[7],L.__data[10]=X.elements[8],L.__data[11]=0):(X.toArray(L.__data,V),V+=et.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,k,L.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(S,w,y,A){const R=S.value,P=w+"_"+y;if(A[P]===void 0)return typeof R=="number"||typeof R=="boolean"?A[P]=R:A[P]=R.clone(),!0;{const N=A[P];if(typeof R=="number"||typeof R=="boolean"){if(N!==R)return A[P]=R,!0}else if(N.equals(R)===!1)return N.copy(R),!0}return!1}function g(S){const w=S.uniforms;let y=0;const A=16;for(let P=0,N=w.length;P<N;P++){const b=Array.isArray(w[P])?w[P]:[w[P]];for(let E=0,L=b.length;E<L;E++){const k=b[E],H=Array.isArray(k.value)?k.value:[k.value];for(let V=0,q=H.length;V<q;V++){const X=H[V],et=_(X),G=y%A,Z=G%et.boundary,ot=G+Z;y+=Z,ot!==0&&A-ot<et.storage&&(y+=A-ot),k.__data=new Float32Array(et.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=y,y+=et.storage}}}const R=y%A;return R>0&&(y+=A-R),S.__size=y,S.__cache={},this}function _(S){const w={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(w.boundary=4,w.storage=4):S.isVector2?(w.boundary=8,w.storage=8):S.isVector3||S.isColor?(w.boundary=16,w.storage=12):S.isVector4?(w.boundary=16,w.storage=16):S.isMatrix3?(w.boundary=48,w.storage=48):S.isMatrix4?(w.boundary=64,w.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),w}function m(S){const w=S.target;w.removeEventListener("dispose",m);const y=o.indexOf(w.__bindingPointIndex);o.splice(y,1),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function p(){for(const S in s)i.deleteBuffer(s[S]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}class Ag{constructor(t={}){const{canvas:e=Qu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;const g=new Uint32Array(4),_=new Int32Array(4);let m=null,p=null;const S=[],w=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Wn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const y=this;let A=!1;this._outputColorSpace=Ge;let R=0,P=0,N=null,b=-1,E=null;const L=new ve,k=new ve;let H=null;const V=new kt(0);let q=0,X=e.width,et=e.height,G=1,Z=null,ot=null;const ft=new ve(0,0,X,et),Ct=new ve(0,0,X,et);let jt=!1;const Gt=new Ga;let Xt=!1,Y=!1;const K=new ae,ut=new z,At=new ve,Mt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Vt=!1;function Le(){return N===null?G:1}let C=n;function ce(M,I){return e.getContext(M,I)}try{const M={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Pa}`),e.addEventListener("webglcontextlost",rt,!1),e.addEventListener("webglcontextrestored",pt,!1),e.addEventListener("webglcontextcreationerror",Q,!1),C===null){const I="webgl2";if(C=ce(I,M),C===null)throw ce(I)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let Nt,Lt,vt,he,_t,Ot,Ae,_e,T,x,F,$,J,W,Et,st,yt,St,nt,ht,Pt,bt,lt,Ft;function D(){Nt=new Fm(C),Nt.init(),bt=new xg(C,Nt),Lt=new Pm(C,Nt,t,bt),vt=new vg(C,Nt),Lt.reversedDepthBuffer&&d&&vt.buffers.depth.setReversed(!0),he=new Bm(C),_t=new sg,Ot=new _g(C,Nt,vt,_t,Lt,bt,he),Ae=new Dm(y),_e=new km(y),T=new Xd(C),lt=new Rm(C,T),x=new zm(C,T,he,lt),F=new Gm(C,x,T,he),nt=new Hm(C,Lt,Ot),st=new Lm(_t),$=new ig(y,Ae,_e,Nt,Lt,lt,st),J=new wg(y,_t),W=new og,Et=new dg(Nt),St=new Am(y,Ae,_e,vt,F,f,l),yt=new mg(y,F,Lt),Ft=new Tg(C,he,Lt,vt),ht=new Cm(C,Nt,he),Pt=new Om(C,Nt,he),he.programs=$.programs,y.capabilities=Lt,y.extensions=Nt,y.properties=_t,y.renderLists=W,y.shadowMap=yt,y.state=vt,y.info=he}D();const it=new bg(y,C);this.xr=it,this.getContext=function(){return C},this.getContextAttributes=function(){return C.getContextAttributes()},this.forceContextLoss=function(){const M=Nt.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Nt.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(M){M!==void 0&&(G=M,this.setSize(X,et,!1))},this.getSize=function(M){return M.set(X,et)},this.setSize=function(M,I,O=!0){if(it.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}X=M,et=I,e.width=Math.floor(M*G),e.height=Math.floor(I*G),O===!0&&(e.style.width=M+"px",e.style.height=I+"px"),this.setViewport(0,0,M,I)},this.getDrawingBufferSize=function(M){return M.set(X*G,et*G).floor()},this.setDrawingBufferSize=function(M,I,O){X=M,et=I,G=O,e.width=Math.floor(M*O),e.height=Math.floor(I*O),this.setViewport(0,0,M,I)},this.getCurrentViewport=function(M){return M.copy(L)},this.getViewport=function(M){return M.copy(ft)},this.setViewport=function(M,I,O,B){M.isVector4?ft.set(M.x,M.y,M.z,M.w):ft.set(M,I,O,B),vt.viewport(L.copy(ft).multiplyScalar(G).round())},this.getScissor=function(M){return M.copy(Ct)},this.setScissor=function(M,I,O,B){M.isVector4?Ct.set(M.x,M.y,M.z,M.w):Ct.set(M,I,O,B),vt.scissor(k.copy(Ct).multiplyScalar(G).round())},this.getScissorTest=function(){return jt},this.setScissorTest=function(M){vt.setScissorTest(jt=M)},this.setOpaqueSort=function(M){Z=M},this.setTransparentSort=function(M){ot=M},this.getClearColor=function(M){return M.copy(St.getClearColor())},this.setClearColor=function(){St.setClearColor(...arguments)},this.getClearAlpha=function(){return St.getClearAlpha()},this.setClearAlpha=function(){St.setClearAlpha(...arguments)},this.clear=function(M=!0,I=!0,O=!0){let B=0;if(M){let U=!1;if(N!==null){const tt=N.texture.format;U=tt===za||tt===Fa||tt===ka}if(U){const tt=N.texture.type,ct=tt===Sn||tt===ci||tt===_s||tt===xs||tt===Ia||tt===Ua,mt=St.getClearColor(),dt=St.getClearAlpha(),Rt=mt.r,Dt=mt.g,wt=mt.b;ct?(g[0]=Rt,g[1]=Dt,g[2]=wt,g[3]=dt,C.clearBufferuiv(C.COLOR,0,g)):(_[0]=Rt,_[1]=Dt,_[2]=wt,_[3]=dt,C.clearBufferiv(C.COLOR,0,_))}else B|=C.COLOR_BUFFER_BIT}I&&(B|=C.DEPTH_BUFFER_BIT),O&&(B|=C.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),C.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",rt,!1),e.removeEventListener("webglcontextrestored",pt,!1),e.removeEventListener("webglcontextcreationerror",Q,!1),St.dispose(),W.dispose(),Et.dispose(),_t.dispose(),Ae.dispose(),_e.dispose(),F.dispose(),lt.dispose(),Ft.dispose(),$.dispose(),it.dispose(),it.removeEventListener("sessionstart",un),it.removeEventListener("sessionend",qa),Xn.stop()};function rt(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),A=!0}function pt(){console.log("THREE.WebGLRenderer: Context Restored."),A=!1;const M=he.autoReset,I=yt.enabled,O=yt.autoUpdate,B=yt.needsUpdate,U=yt.type;D(),he.autoReset=M,yt.enabled=I,yt.autoUpdate=O,yt.needsUpdate=B,yt.type=U}function Q(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function j(M){const I=M.target;I.removeEventListener("dispose",j),gt(I)}function gt(M){It(M),_t.remove(M)}function It(M){const I=_t.get(M).programs;I!==void 0&&(I.forEach(function(O){$.releaseProgram(O)}),M.isShaderMaterial&&$.releaseShaderCache(M))}this.renderBufferDirect=function(M,I,O,B,U,tt){I===null&&(I=Mt);const ct=U.isMesh&&U.matrixWorld.determinant()<0,mt=yh(M,I,O,B,U);vt.setMaterial(B,ct);let dt=O.index,Rt=1;if(B.wireframe===!0){if(dt=x.getWireframeAttribute(O),dt===void 0)return;Rt=2}const Dt=O.drawRange,wt=O.attributes.position;let Wt=Dt.start*Rt,te=(Dt.start+Dt.count)*Rt;tt!==null&&(Wt=Math.max(Wt,tt.start*Rt),te=Math.min(te,(tt.start+tt.count)*Rt)),dt!==null?(Wt=Math.max(Wt,0),te=Math.min(te,dt.count)):wt!=null&&(Wt=Math.max(Wt,0),te=Math.min(te,wt.count));const pe=te-Wt;if(pe<0||pe===1/0)return;lt.setup(U,B,mt,O,dt);let le,se=ht;if(dt!==null&&(le=T.get(dt),se=Pt,se.setIndex(le)),U.isMesh)B.wireframe===!0?(vt.setLineWidth(B.wireframeLinewidth*Le()),se.setMode(C.LINES)):se.setMode(C.TRIANGLES);else if(U.isLine){let Tt=B.linewidth;Tt===void 0&&(Tt=1),vt.setLineWidth(Tt*Le()),U.isLineSegments?se.setMode(C.LINES):U.isLineLoop?se.setMode(C.LINE_LOOP):se.setMode(C.LINE_STRIP)}else U.isPoints?se.setMode(C.POINTS):U.isSprite&&se.setMode(C.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)Ss("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),se.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(Nt.get("WEBGL_multi_draw"))se.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const Tt=U._multiDrawStarts,de=U._multiDrawCounts,qt=U._multiDrawCount,qe=dt?T.get(dt).bytesPerElement:1,mi=_t.get(B).currentProgram.getUniforms();for(let Ye=0;Ye<qt;Ye++)mi.setValue(C,"_gl_DrawID",Ye),se.render(Tt[Ye]/qe,de[Ye])}else if(U.isInstancedMesh)se.renderInstances(Wt,pe,U.count);else if(O.isInstancedBufferGeometry){const Tt=O._maxInstanceCount!==void 0?O._maxInstanceCount:1/0,de=Math.min(O.instanceCount,Tt);se.renderInstances(Wt,pe,de)}else se.render(Wt,pe)};function re(M,I,O){M.transparent===!0&&M.side===gn&&M.forceSinglePass===!1?(M.side=Xe,M.needsUpdate=!0,Ds(M,I,O),M.side=In,M.needsUpdate=!0,Ds(M,I,O),M.side=gn):Ds(M,I,O)}this.compile=function(M,I,O=null){O===null&&(O=M),p=Et.get(O),p.init(I),w.push(p),O.traverseVisible(function(U){U.isLight&&U.layers.test(I.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),M!==O&&M.traverseVisible(function(U){U.isLight&&U.layers.test(I.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),p.setupLights();const B=new Set;return M.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const tt=U.material;if(tt)if(Array.isArray(tt))for(let ct=0;ct<tt.length;ct++){const mt=tt[ct];re(mt,O,U),B.add(mt)}else re(tt,O,U),B.add(tt)}),p=w.pop(),B},this.compileAsync=function(M,I,O=null){const B=this.compile(M,I,O);return new Promise(U=>{function tt(){if(B.forEach(function(ct){_t.get(ct).currentProgram.isReady()&&B.delete(ct)}),B.size===0){U(M);return}setTimeout(tt,10)}Nt.get("KHR_parallel_shader_compile")!==null?tt():setTimeout(tt,10)})};let Zt=null;function wn(M){Zt&&Zt(M)}function un(){Xn.stop()}function qa(){Xn.start()}const Xn=new oh;Xn.setAnimationLoop(wn),typeof self<"u"&&Xn.setContext(self),this.setAnimationLoop=function(M){Zt=M,it.setAnimationLoop(M),M===null?Xn.stop():Xn.start()},it.addEventListener("sessionstart",un),it.addEventListener("sessionend",qa),this.render=function(M,I){if(I!==void 0&&I.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),it.enabled===!0&&it.isPresenting===!0&&(it.cameraAutoUpdate===!0&&it.updateCamera(I),I=it.getCamera()),M.isScene===!0&&M.onBeforeRender(y,M,I,N),p=Et.get(M,w.length),p.init(I),w.push(p),K.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),Gt.setFromProjectionMatrix(K,yn,I.reversedDepth),Y=this.localClippingEnabled,Xt=st.init(this.clippingPlanes,Y),m=W.get(M,S.length),m.init(),S.push(m),it.enabled===!0&&it.isPresenting===!0){const tt=y.xr.getDepthSensingMesh();tt!==null&&Vr(tt,I,-1/0,y.sortObjects)}Vr(M,I,0,y.sortObjects),m.finish(),y.sortObjects===!0&&m.sort(Z,ot),Vt=it.enabled===!1||it.isPresenting===!1||it.hasDepthSensing()===!1,Vt&&St.addToRenderList(m,M),this.info.render.frame++,Xt===!0&&st.beginShadows();const O=p.state.shadowsArray;yt.render(O,M,I),Xt===!0&&st.endShadows(),this.info.autoReset===!0&&this.info.reset();const B=m.opaque,U=m.transmissive;if(p.setupLights(),I.isArrayCamera){const tt=I.cameras;if(U.length>0)for(let ct=0,mt=tt.length;ct<mt;ct++){const dt=tt[ct];ja(B,U,M,dt)}Vt&&St.render(M);for(let ct=0,mt=tt.length;ct<mt;ct++){const dt=tt[ct];Ya(m,M,dt,dt.viewport)}}else U.length>0&&ja(B,U,M,I),Vt&&St.render(M),Ya(m,M,I);N!==null&&P===0&&(Ot.updateMultisampleRenderTarget(N),Ot.updateRenderTargetMipmap(N)),M.isScene===!0&&M.onAfterRender(y,M,I),lt.resetDefaultState(),b=-1,E=null,w.pop(),w.length>0?(p=w[w.length-1],Xt===!0&&st.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,S.pop(),S.length>0?m=S[S.length-1]:m=null};function Vr(M,I,O,B){if(M.visible===!1)return;if(M.layers.test(I.layers)){if(M.isGroup)O=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(I);else if(M.isLight)p.pushLight(M),M.castShadow&&p.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Gt.intersectsSprite(M)){B&&At.setFromMatrixPosition(M.matrixWorld).applyMatrix4(K);const ct=F.update(M),mt=M.material;mt.visible&&m.push(M,ct,mt,O,At.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Gt.intersectsObject(M))){const ct=F.update(M),mt=M.material;if(B&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),At.copy(M.boundingSphere.center)):(ct.boundingSphere===null&&ct.computeBoundingSphere(),At.copy(ct.boundingSphere.center)),At.applyMatrix4(M.matrixWorld).applyMatrix4(K)),Array.isArray(mt)){const dt=ct.groups;for(let Rt=0,Dt=dt.length;Rt<Dt;Rt++){const wt=dt[Rt],Wt=mt[wt.materialIndex];Wt&&Wt.visible&&m.push(M,ct,Wt,O,At.z,wt)}}else mt.visible&&m.push(M,ct,mt,O,At.z,null)}}const tt=M.children;for(let ct=0,mt=tt.length;ct<mt;ct++)Vr(tt[ct],I,O,B)}function Ya(M,I,O,B){const U=M.opaque,tt=M.transmissive,ct=M.transparent;p.setupLightsView(O),Xt===!0&&st.setGlobalState(y.clippingPlanes,O),B&&vt.viewport(L.copy(B)),U.length>0&&Ls(U,I,O),tt.length>0&&Ls(tt,I,O),ct.length>0&&Ls(ct,I,O),vt.buffers.depth.setTest(!0),vt.buffers.depth.setMask(!0),vt.buffers.color.setMask(!0),vt.setPolygonOffset(!1)}function ja(M,I,O,B){if((O.isScene===!0?O.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[B.id]===void 0&&(p.state.transmissionRenderTarget[B.id]=new hi(1,1,{generateMipmaps:!0,type:Nt.has("EXT_color_buffer_half_float")||Nt.has("EXT_color_buffer_float")?Ts:Sn,minFilter:ri,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Yt.workingColorSpace}));const tt=p.state.transmissionRenderTarget[B.id],ct=B.viewport||L;tt.setSize(ct.z*y.transmissionResolutionScale,ct.w*y.transmissionResolutionScale);const mt=y.getRenderTarget(),dt=y.getActiveCubeFace(),Rt=y.getActiveMipmapLevel();y.setRenderTarget(tt),y.getClearColor(V),q=y.getClearAlpha(),q<1&&y.setClearColor(16777215,.5),y.clear(),Vt&&St.render(O);const Dt=y.toneMapping;y.toneMapping=Wn;const wt=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),p.setupLightsView(B),Xt===!0&&st.setGlobalState(y.clippingPlanes,B),Ls(M,O,B),Ot.updateMultisampleRenderTarget(tt),Ot.updateRenderTargetMipmap(tt),Nt.has("WEBGL_multisampled_render_to_texture")===!1){let Wt=!1;for(let te=0,pe=I.length;te<pe;te++){const le=I[te],se=le.object,Tt=le.geometry,de=le.material,qt=le.group;if(de.side===gn&&se.layers.test(B.layers)){const qe=de.side;de.side=Xe,de.needsUpdate=!0,Ka(se,O,B,Tt,de,qt),de.side=qe,de.needsUpdate=!0,Wt=!0}}Wt===!0&&(Ot.updateMultisampleRenderTarget(tt),Ot.updateRenderTargetMipmap(tt))}y.setRenderTarget(mt,dt,Rt),y.setClearColor(V,q),wt!==void 0&&(B.viewport=wt),y.toneMapping=Dt}function Ls(M,I,O){const B=I.isScene===!0?I.overrideMaterial:null;for(let U=0,tt=M.length;U<tt;U++){const ct=M[U],mt=ct.object,dt=ct.geometry,Rt=ct.group;let Dt=ct.material;Dt.allowOverride===!0&&B!==null&&(Dt=B),mt.layers.test(O.layers)&&Ka(mt,I,O,dt,Dt,Rt)}}function Ka(M,I,O,B,U,tt){M.onBeforeRender(y,I,O,B,U,tt),M.modelViewMatrix.multiplyMatrices(O.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),U.onBeforeRender(y,I,O,B,M,tt),U.transparent===!0&&U.side===gn&&U.forceSinglePass===!1?(U.side=Xe,U.needsUpdate=!0,y.renderBufferDirect(O,I,B,U,M,tt),U.side=In,U.needsUpdate=!0,y.renderBufferDirect(O,I,B,U,M,tt),U.side=gn):y.renderBufferDirect(O,I,B,U,M,tt),M.onAfterRender(y,I,O,B,U,tt)}function Ds(M,I,O){I.isScene!==!0&&(I=Mt);const B=_t.get(M),U=p.state.lights,tt=p.state.shadowsArray,ct=U.state.version,mt=$.getParameters(M,U.state,tt,I,O),dt=$.getProgramCacheKey(mt);let Rt=B.programs;B.environment=M.isMeshStandardMaterial?I.environment:null,B.fog=I.fog,B.envMap=(M.isMeshStandardMaterial?_e:Ae).get(M.envMap||B.environment),B.envMapRotation=B.environment!==null&&M.envMap===null?I.environmentRotation:M.envMapRotation,Rt===void 0&&(M.addEventListener("dispose",j),Rt=new Map,B.programs=Rt);let Dt=Rt.get(dt);if(Dt!==void 0){if(B.currentProgram===Dt&&B.lightsStateVersion===ct)return Za(M,mt),Dt}else mt.uniforms=$.getUniforms(M),M.onBeforeCompile(mt,y),Dt=$.acquireProgram(mt,dt),Rt.set(dt,Dt),B.uniforms=mt.uniforms;const wt=B.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(wt.clippingPlanes=st.uniform),Za(M,mt),B.needsLights=Sh(M),B.lightsStateVersion=ct,B.needsLights&&(wt.ambientLightColor.value=U.state.ambient,wt.lightProbe.value=U.state.probe,wt.directionalLights.value=U.state.directional,wt.directionalLightShadows.value=U.state.directionalShadow,wt.spotLights.value=U.state.spot,wt.spotLightShadows.value=U.state.spotShadow,wt.rectAreaLights.value=U.state.rectArea,wt.ltc_1.value=U.state.rectAreaLTC1,wt.ltc_2.value=U.state.rectAreaLTC2,wt.pointLights.value=U.state.point,wt.pointLightShadows.value=U.state.pointShadow,wt.hemisphereLights.value=U.state.hemi,wt.directionalShadowMap.value=U.state.directionalShadowMap,wt.directionalShadowMatrix.value=U.state.directionalShadowMatrix,wt.spotShadowMap.value=U.state.spotShadowMap,wt.spotLightMatrix.value=U.state.spotLightMatrix,wt.spotLightMap.value=U.state.spotLightMap,wt.pointShadowMap.value=U.state.pointShadowMap,wt.pointShadowMatrix.value=U.state.pointShadowMatrix),B.currentProgram=Dt,B.uniformsList=null,Dt}function Ja(M){if(M.uniformsList===null){const I=M.currentProgram.getUniforms();M.uniformsList=_r.seqWithValue(I.seq,M.uniforms)}return M.uniformsList}function Za(M,I){const O=_t.get(M);O.outputColorSpace=I.outputColorSpace,O.batching=I.batching,O.batchingColor=I.batchingColor,O.instancing=I.instancing,O.instancingColor=I.instancingColor,O.instancingMorph=I.instancingMorph,O.skinning=I.skinning,O.morphTargets=I.morphTargets,O.morphNormals=I.morphNormals,O.morphColors=I.morphColors,O.morphTargetsCount=I.morphTargetsCount,O.numClippingPlanes=I.numClippingPlanes,O.numIntersection=I.numClipIntersection,O.vertexAlphas=I.vertexAlphas,O.vertexTangents=I.vertexTangents,O.toneMapping=I.toneMapping}function yh(M,I,O,B,U){I.isScene!==!0&&(I=Mt),Ot.resetTextureUnits();const tt=I.fog,ct=B.isMeshStandardMaterial?I.environment:null,mt=N===null?y.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Yi,dt=(B.isMeshStandardMaterial?_e:Ae).get(B.envMap||ct),Rt=B.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,Dt=!!O.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),wt=!!O.morphAttributes.position,Wt=!!O.morphAttributes.normal,te=!!O.morphAttributes.color;let pe=Wn;B.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(pe=y.toneMapping);const le=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,se=le!==void 0?le.length:0,Tt=_t.get(B),de=p.state.lights;if(Xt===!0&&(Y===!0||M!==E)){const ke=M===E&&B.id===b;st.setState(B,M,ke)}let qt=!1;B.version===Tt.__version?(Tt.needsLights&&Tt.lightsStateVersion!==de.state.version||Tt.outputColorSpace!==mt||U.isBatchedMesh&&Tt.batching===!1||!U.isBatchedMesh&&Tt.batching===!0||U.isBatchedMesh&&Tt.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&Tt.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&Tt.instancing===!1||!U.isInstancedMesh&&Tt.instancing===!0||U.isSkinnedMesh&&Tt.skinning===!1||!U.isSkinnedMesh&&Tt.skinning===!0||U.isInstancedMesh&&Tt.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&Tt.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&Tt.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&Tt.instancingMorph===!1&&U.morphTexture!==null||Tt.envMap!==dt||B.fog===!0&&Tt.fog!==tt||Tt.numClippingPlanes!==void 0&&(Tt.numClippingPlanes!==st.numPlanes||Tt.numIntersection!==st.numIntersection)||Tt.vertexAlphas!==Rt||Tt.vertexTangents!==Dt||Tt.morphTargets!==wt||Tt.morphNormals!==Wt||Tt.morphColors!==te||Tt.toneMapping!==pe||Tt.morphTargetsCount!==se)&&(qt=!0):(qt=!0,Tt.__version=B.version);let qe=Tt.currentProgram;qt===!0&&(qe=Ds(B,I,U));let mi=!1,Ye=!1,Qi=!1;const fe=qe.getUniforms(),Ze=Tt.uniforms;if(vt.useProgram(qe.program)&&(mi=!0,Ye=!0,Qi=!0),B.id!==b&&(b=B.id,Ye=!0),mi||E!==M){vt.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),fe.setValue(C,"projectionMatrix",M.projectionMatrix),fe.setValue(C,"viewMatrix",M.matrixWorldInverse);const ze=fe.map.cameraPosition;ze!==void 0&&ze.setValue(C,ut.setFromMatrixPosition(M.matrixWorld)),Lt.logarithmicDepthBuffer&&fe.setValue(C,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&fe.setValue(C,"isOrthographic",M.isOrthographicCamera===!0),E!==M&&(E=M,Ye=!0,Qi=!0)}if(U.isSkinnedMesh){fe.setOptional(C,U,"bindMatrix"),fe.setOptional(C,U,"bindMatrixInverse");const ke=U.skeleton;ke&&(ke.boneTexture===null&&ke.computeBoneTexture(),fe.setValue(C,"boneTexture",ke.boneTexture,Ot))}U.isBatchedMesh&&(fe.setOptional(C,U,"batchingTexture"),fe.setValue(C,"batchingTexture",U._matricesTexture,Ot),fe.setOptional(C,U,"batchingIdTexture"),fe.setValue(C,"batchingIdTexture",U._indirectTexture,Ot),fe.setOptional(C,U,"batchingColorTexture"),U._colorsTexture!==null&&fe.setValue(C,"batchingColorTexture",U._colorsTexture,Ot));const Qe=O.morphAttributes;if((Qe.position!==void 0||Qe.normal!==void 0||Qe.color!==void 0)&&nt.update(U,O,qe),(Ye||Tt.receiveShadow!==U.receiveShadow)&&(Tt.receiveShadow=U.receiveShadow,fe.setValue(C,"receiveShadow",U.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(Ze.envMap.value=dt,Ze.flipEnvMap.value=dt.isCubeTexture&&dt.isRenderTargetTexture===!1?-1:1),B.isMeshStandardMaterial&&B.envMap===null&&I.environment!==null&&(Ze.envMapIntensity.value=I.environmentIntensity),Ye&&(fe.setValue(C,"toneMappingExposure",y.toneMappingExposure),Tt.needsLights&&Mh(Ze,Qi),tt&&B.fog===!0&&J.refreshFogUniforms(Ze,tt),J.refreshMaterialUniforms(Ze,B,G,et,p.state.transmissionRenderTarget[M.id]),_r.upload(C,Ja(Tt),Ze,Ot)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(_r.upload(C,Ja(Tt),Ze,Ot),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&fe.setValue(C,"center",U.center),fe.setValue(C,"modelViewMatrix",U.modelViewMatrix),fe.setValue(C,"normalMatrix",U.normalMatrix),fe.setValue(C,"modelMatrix",U.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const ke=B.uniformsGroups;for(let ze=0,Wr=ke.length;ze<Wr;ze++){const $n=ke[ze];Ft.update($n,qe),Ft.bind($n,qe)}}return qe}function Mh(M,I){M.ambientLightColor.needsUpdate=I,M.lightProbe.needsUpdate=I,M.directionalLights.needsUpdate=I,M.directionalLightShadows.needsUpdate=I,M.pointLights.needsUpdate=I,M.pointLightShadows.needsUpdate=I,M.spotLights.needsUpdate=I,M.spotLightShadows.needsUpdate=I,M.rectAreaLights.needsUpdate=I,M.hemisphereLights.needsUpdate=I}function Sh(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(M,I,O){const B=_t.get(M);B.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,B.__autoAllocateDepthBuffer===!1&&(B.__useRenderToTexture=!1),_t.get(M.texture).__webglTexture=I,_t.get(M.depthTexture).__webglTexture=B.__autoAllocateDepthBuffer?void 0:O,B.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,I){const O=_t.get(M);O.__webglFramebuffer=I,O.__useDefaultFramebuffer=I===void 0};const bh=C.createFramebuffer();this.setRenderTarget=function(M,I=0,O=0){N=M,R=I,P=O;let B=!0,U=null,tt=!1,ct=!1;if(M){const dt=_t.get(M);if(dt.__useDefaultFramebuffer!==void 0)vt.bindFramebuffer(C.FRAMEBUFFER,null),B=!1;else if(dt.__webglFramebuffer===void 0)Ot.setupRenderTarget(M);else if(dt.__hasExternalTextures)Ot.rebindTextures(M,_t.get(M.texture).__webglTexture,_t.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const wt=M.depthTexture;if(dt.__boundDepthTexture!==wt){if(wt!==null&&_t.has(wt)&&(M.width!==wt.image.width||M.height!==wt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ot.setupDepthRenderbuffer(M)}}const Rt=M.texture;(Rt.isData3DTexture||Rt.isDataArrayTexture||Rt.isCompressedArrayTexture)&&(ct=!0);const Dt=_t.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Dt[I])?U=Dt[I][O]:U=Dt[I],tt=!0):M.samples>0&&Ot.useMultisampledRTT(M)===!1?U=_t.get(M).__webglMultisampledFramebuffer:Array.isArray(Dt)?U=Dt[O]:U=Dt,L.copy(M.viewport),k.copy(M.scissor),H=M.scissorTest}else L.copy(ft).multiplyScalar(G).floor(),k.copy(Ct).multiplyScalar(G).floor(),H=jt;if(O!==0&&(U=bh),vt.bindFramebuffer(C.FRAMEBUFFER,U)&&B&&vt.drawBuffers(M,U),vt.viewport(L),vt.scissor(k),vt.setScissorTest(H),tt){const dt=_t.get(M.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_CUBE_MAP_POSITIVE_X+I,dt.__webglTexture,O)}else if(ct){const dt=I;for(let Rt=0;Rt<M.textures.length;Rt++){const Dt=_t.get(M.textures[Rt]);C.framebufferTextureLayer(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0+Rt,Dt.__webglTexture,O,dt)}}else if(M!==null&&O!==0){const dt=_t.get(M.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,dt.__webglTexture,O)}b=-1},this.readRenderTargetPixels=function(M,I,O,B,U,tt,ct,mt=0){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let dt=_t.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ct!==void 0&&(dt=dt[ct]),dt){vt.bindFramebuffer(C.FRAMEBUFFER,dt);try{const Rt=M.textures[mt],Dt=Rt.format,wt=Rt.type;if(!Lt.textureFormatReadable(Dt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Lt.textureTypeReadable(wt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=M.width-B&&O>=0&&O<=M.height-U&&(M.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+mt),C.readPixels(I,O,B,U,bt.convert(Dt),bt.convert(wt),tt))}finally{const Rt=N!==null?_t.get(N).__webglFramebuffer:null;vt.bindFramebuffer(C.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(M,I,O,B,U,tt,ct,mt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let dt=_t.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ct!==void 0&&(dt=dt[ct]),dt)if(I>=0&&I<=M.width-B&&O>=0&&O<=M.height-U){vt.bindFramebuffer(C.FRAMEBUFFER,dt);const Rt=M.textures[mt],Dt=Rt.format,wt=Rt.type;if(!Lt.textureFormatReadable(Dt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Lt.textureTypeReadable(wt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Wt=C.createBuffer();C.bindBuffer(C.PIXEL_PACK_BUFFER,Wt),C.bufferData(C.PIXEL_PACK_BUFFER,tt.byteLength,C.STREAM_READ),M.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+mt),C.readPixels(I,O,B,U,bt.convert(Dt),bt.convert(wt),0);const te=N!==null?_t.get(N).__webglFramebuffer:null;vt.bindFramebuffer(C.FRAMEBUFFER,te);const pe=C.fenceSync(C.SYNC_GPU_COMMANDS_COMPLETE,0);return C.flush(),await td(C,pe,4),C.bindBuffer(C.PIXEL_PACK_BUFFER,Wt),C.getBufferSubData(C.PIXEL_PACK_BUFFER,0,tt),C.deleteBuffer(Wt),C.deleteSync(pe),tt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,I=null,O=0){const B=Math.pow(2,-O),U=Math.floor(M.image.width*B),tt=Math.floor(M.image.height*B),ct=I!==null?I.x:0,mt=I!==null?I.y:0;Ot.setTexture2D(M,0),C.copyTexSubImage2D(C.TEXTURE_2D,O,0,0,ct,mt,U,tt),vt.unbindTexture()};const Eh=C.createFramebuffer(),wh=C.createFramebuffer();this.copyTextureToTexture=function(M,I,O=null,B=null,U=0,tt=null){tt===null&&(U!==0?(Ss("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),tt=U,U=0):tt=0);let ct,mt,dt,Rt,Dt,wt,Wt,te,pe;const le=M.isCompressedTexture?M.mipmaps[tt]:M.image;if(O!==null)ct=O.max.x-O.min.x,mt=O.max.y-O.min.y,dt=O.isBox3?O.max.z-O.min.z:1,Rt=O.min.x,Dt=O.min.y,wt=O.isBox3?O.min.z:0;else{const Qe=Math.pow(2,-U);ct=Math.floor(le.width*Qe),mt=Math.floor(le.height*Qe),M.isDataArrayTexture?dt=le.depth:M.isData3DTexture?dt=Math.floor(le.depth*Qe):dt=1,Rt=0,Dt=0,wt=0}B!==null?(Wt=B.x,te=B.y,pe=B.z):(Wt=0,te=0,pe=0);const se=bt.convert(I.format),Tt=bt.convert(I.type);let de;I.isData3DTexture?(Ot.setTexture3D(I,0),de=C.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(Ot.setTexture2DArray(I,0),de=C.TEXTURE_2D_ARRAY):(Ot.setTexture2D(I,0),de=C.TEXTURE_2D),C.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,I.flipY),C.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),C.pixelStorei(C.UNPACK_ALIGNMENT,I.unpackAlignment);const qt=C.getParameter(C.UNPACK_ROW_LENGTH),qe=C.getParameter(C.UNPACK_IMAGE_HEIGHT),mi=C.getParameter(C.UNPACK_SKIP_PIXELS),Ye=C.getParameter(C.UNPACK_SKIP_ROWS),Qi=C.getParameter(C.UNPACK_SKIP_IMAGES);C.pixelStorei(C.UNPACK_ROW_LENGTH,le.width),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,le.height),C.pixelStorei(C.UNPACK_SKIP_PIXELS,Rt),C.pixelStorei(C.UNPACK_SKIP_ROWS,Dt),C.pixelStorei(C.UNPACK_SKIP_IMAGES,wt);const fe=M.isDataArrayTexture||M.isData3DTexture,Ze=I.isDataArrayTexture||I.isData3DTexture;if(M.isDepthTexture){const Qe=_t.get(M),ke=_t.get(I),ze=_t.get(Qe.__renderTarget),Wr=_t.get(ke.__renderTarget);vt.bindFramebuffer(C.READ_FRAMEBUFFER,ze.__webglFramebuffer),vt.bindFramebuffer(C.DRAW_FRAMEBUFFER,Wr.__webglFramebuffer);for(let $n=0;$n<dt;$n++)fe&&(C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,_t.get(M).__webglTexture,U,wt+$n),C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,_t.get(I).__webglTexture,tt,pe+$n)),C.blitFramebuffer(Rt,Dt,ct,mt,Wt,te,ct,mt,C.DEPTH_BUFFER_BIT,C.NEAREST);vt.bindFramebuffer(C.READ_FRAMEBUFFER,null),vt.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else if(U!==0||M.isRenderTargetTexture||_t.has(M)){const Qe=_t.get(M),ke=_t.get(I);vt.bindFramebuffer(C.READ_FRAMEBUFFER,Eh),vt.bindFramebuffer(C.DRAW_FRAMEBUFFER,wh);for(let ze=0;ze<dt;ze++)fe?C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,Qe.__webglTexture,U,wt+ze):C.framebufferTexture2D(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,Qe.__webglTexture,U),Ze?C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,ke.__webglTexture,tt,pe+ze):C.framebufferTexture2D(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,ke.__webglTexture,tt),U!==0?C.blitFramebuffer(Rt,Dt,ct,mt,Wt,te,ct,mt,C.COLOR_BUFFER_BIT,C.NEAREST):Ze?C.copyTexSubImage3D(de,tt,Wt,te,pe+ze,Rt,Dt,ct,mt):C.copyTexSubImage2D(de,tt,Wt,te,Rt,Dt,ct,mt);vt.bindFramebuffer(C.READ_FRAMEBUFFER,null),vt.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else Ze?M.isDataTexture||M.isData3DTexture?C.texSubImage3D(de,tt,Wt,te,pe,ct,mt,dt,se,Tt,le.data):I.isCompressedArrayTexture?C.compressedTexSubImage3D(de,tt,Wt,te,pe,ct,mt,dt,se,le.data):C.texSubImage3D(de,tt,Wt,te,pe,ct,mt,dt,se,Tt,le):M.isDataTexture?C.texSubImage2D(C.TEXTURE_2D,tt,Wt,te,ct,mt,se,Tt,le.data):M.isCompressedTexture?C.compressedTexSubImage2D(C.TEXTURE_2D,tt,Wt,te,le.width,le.height,se,le.data):C.texSubImage2D(C.TEXTURE_2D,tt,Wt,te,ct,mt,se,Tt,le);C.pixelStorei(C.UNPACK_ROW_LENGTH,qt),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,qe),C.pixelStorei(C.UNPACK_SKIP_PIXELS,mi),C.pixelStorei(C.UNPACK_SKIP_ROWS,Ye),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Qi),tt===0&&I.generateMipmaps&&C.generateMipmap(de),vt.unbindTexture()},this.initRenderTarget=function(M){_t.get(M).__webglFramebuffer===void 0&&Ot.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Ot.setTextureCube(M,0):M.isData3DTexture?Ot.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Ot.setTexture2DArray(M,0):Ot.setTexture2D(M,0),vt.unbindTexture()},this.resetState=function(){R=0,P=0,N=null,vt.reset(),lt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return yn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Yt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Yt._getUnpackColorSpace()}}function gc(i,t=!1){return new En({transparent:t,depthWrite:!t,side:t?gn:In,vertexColors:!0,uniforms:{map:{value:i},daylight:{value:1},fogColor:{value:new kt("#bad5ce")},fogNear:{value:60},fogFar:{value:140},opacity:{value:t?.72:1}},vertexShader:`attribute float sky; attribute float blockLight; varying vec2 vUv; varying vec3 vColor; varying float vSky; varying float vLight; varying float vDepth;
void main(){vUv=uv;vColor=color;vSky=sky;vLight=blockLight;vec4 mv=modelViewMatrix*vec4(position,1.0);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform sampler2D map; uniform float daylight; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; uniform float opacity; varying vec2 vUv; varying vec3 vColor; varying float vSky; varying float vLight; varying float vDepth;
void main(){vec4 tex=texture2D(map,vUv);vec3 ambient=vec3(0.065)+vec3(0.92,0.97,0.88)*vSky*(0.12+0.88*daylight);vec3 warm=vec3(1.0,0.57,0.22)*vLight*1.2;vec3 c=tex.rgb*vColor*(ambient+warm);float fog=smoothstep(fogNear,fogFar,vDepth);gl_FragColor=vec4(mix(c,fogColor,fog),opacity);
#include <colorspace_fragment>
}`})}const Di=16,Pr=16,Rg=256;function Cg(){const i=document.createElement("canvas");i.width=i.height=Rg;const t=i.getContext("2d");for(const n of Mr)for(let s=0;s<3;s++){const r=n.id*3+s,o=r%Pr*Di,a=Math.floor(r/Pr)*Di;t.fillStyle=n.color,t.fillRect(o,a,Di,Di);for(let c=0;c<Di;c++)for(let u=0;u<Di;u++){const h=ne(u+n.id*27,c,891+s);t.fillStyle=h>.5?`rgba(255,255,235,${(h-.5)*.2})`:`rgba(20,32,26,${(.5-h)*.23})`,t.fillRect(o+u,a+c,1,1)}const l=(c,u,h,d,f)=>{t.fillStyle=f,t.fillRect(o+c,a+u,h,d)};if(n.id===v.Hopper&&(l(2,2,12,12,"#304f49"),l(4,4,8,8,"#789e8c"),l(6,6,4,4,"#172f2d")),n.id===v.Timer&&(l(3,2,10,12,"#e3d4a1"),l(7,4,2,5,"#476a5a"),l(7,8,4,2,"#476a5a")),n.id===v.Plate&&(l(0,0,16,2,"#d9c999"),l(0,14,16,2,"#655d43"),l(6,4,4,8,"#746c50")),n.id===v.Enchanter&&(l(1,1,14,2,"#dcca89"),l(1,13,14,2,"#dcca89"),s===0?(l(3,4,10,7,"#e8dbc3"),l(7,4,1,7,"#456a5a"),l(4,6,2,1,"#456a5a"),l(9,8,3,1,"#456a5a")):(l(5,5,6,6,"#284e45"),l(7,6,2,4,"#c4d0a2"))),n.id===v.Apothecary&&(l(2,3,12,10,"#54493f"),l(4,4,8,8,s===0?"#91b9a2":"#d0af77"),l(6,5,4,1,"#e2d5ab"),l(1,13,14,2,"#735037")),n.id===v.Anvil&&(l(1,2,14,4,"#b5bcad"),l(5,6,6,7,"#3e4c50"),l(2,13,12,2,"#c3b27a")),[v.Planks,v.Log,v.Red,v.Chest,v.Workbench].includes(n.id))for(let c=3;c<16;c+=4)l(n.id===v.Log?c:0,n.id===v.Log?0:c,n.id===v.Log?1:16,n.id===v.Log?16:1,"#00000022");if([v.Roof,v.JadeRoof,v.Stairs,v.RubyRoof,v.BrownRoof].includes(n.id)){for(let c=0;c<16;c+=4)l(c,0,1,16,"#ffffff26"),l(c+3,0,1,16,"#00000025");l(0,14,16,2,"#142b3344")}if([v.Paving,v.Brick,v.Marble,v.Furnace].includes(n.id)&&(l(0,0,16,1,"#1d302e44"),l(0,8,16,1,"#1d302e44"),l(8,0,1,8,"#1d302e44"),l(0,8,1,8,"#1d302e44")),n.id===v.Grass&&s!==0){l(0,4,16,12,"#82684c");for(let c=0;c<16;c++)l(c,3,1,Math.floor(ne(c,0,2)*4),"#81985a")}if([v.Coal,v.Iron,v.Jade,v.Gold].includes(n.id)){const c=n.id===v.Coal?"#3d4543":n.id===v.Iron?"#d9af87":n.id===v.Jade?"#84e0b9":"#f1cf67";for(let u=0;u<7;u++)l(Math.floor(ne(u,1,3)*13),Math.floor(ne(u,2,4)*13),3,2,c)}if(n.id===v.Glass&&(l(0,0,16,2,"#775b40"),l(0,0,2,16,"#775b40"),l(7,0,2,16,"#846144"),l(0,7,16,2,"#846144")),n.id===v.Lantern){l(0,0,16,3,"#795135"),l(0,13,16,3,"#795135");for(let c=3;c<16;c+=4)l(c,3,1,10,"#ffda8066");l(6,6,4,4,"#ffdc91")}if(n.id===v.Chest&&(l(0,6,16,2,"#4a3829"),l(7,6,2,4,"#ebcb75")),n.id===v.Workbench&&(l(3,3,10,10,"#543c2e"),l(4,4,8,8,"#b49466"),l(7,4,1,8,"#4e4737"),l(4,7,8,1,"#4e4737")),n.id===v.Furnace&&(l(3,9,10,5,"#2d3634"),l(4,3,8,3,"#49514b")),n.id===v.Door&&(l(1,1,14,1,"#d7a565"),l(1,1,1,14,"#d7a565"),l(11,9,2,2,"#edc978")),[v.TeaSign,v.MarketSign,v.NoodleSign,v.PandaSign,v.Banner].includes(n.id)){l(0,0,16,1,"#e8c875"),l(0,15,16,1,"#e8c875"),l(0,0,1,16,"#e8c875"),l(15,0,1,16,"#e8c875");const c={[v.TeaSign]:["00100000100","11111111111","00100000100","00000100000","00001010000","00110001100","01000100010","01111111110","00000100000","00110101100","01000100010"],[v.MarketSign]:["00000100000","00000000000","11111111111","00000100000","01111111110","01000100010","01000100010","01000100010","01000100110","00000100000","00000100000"],[v.NoodleSign]:["11111111111","00000100000","00001000000","11111111111","10010001001","10011111001","10010001001","10011111001","10010001001","10010001001","11111111111"],[v.PandaSign]:["01000010010","10111010100","11111010010","10001011110","11111010010","10001010100","11111011110","10001000000","10011000000","00000000000","10101010100"],[v.Banner]:["01000111111","11110000000","00100111111","01010100001","11010111111","01000000000","01000111111","01000100101","01000111111","01000100101","01000111111"]};for(const[u,h]of c[n.id].entries())for(let d=0;d<h.length;d++)h[d]==="1"&&l(d+2,u+2,1,1,"#f4df9e")}n.id===v.PandaEye&&(l(3,3,4,4,"#ecebd9"),l(10,10,2,2,"#687974")),n.id===v.PandaMouth&&(l(7,0,2,8,"#28302c"),l(4,7,7,2,"#28302c"),l(3,5,2,3,"#28302c"),l(10,5,2,3,"#28302c")),n.id===v.Crate&&(l(1,0,2,16,"#554630"),l(13,0,2,16,"#554630"),l(0,6,16,2,"#6b5238")),n.id===v.GoldTrim&&(l(1,1,14,1,"#f8db8a"),l(1,14,14,1,"#876c32")),n.id===v.Paper&&(l(0,0,16,1,"#65523b"),l(0,0,1,16,"#65523b"))}const e=new Ud(i);return e.magFilter=$e,e.minFilter=ds,e.colorSpace=Ge,e.generateMipmaps=!0,{texture:e,canvas:i}}function Pg(i,t){const e=i*3+(t===2?0:t===3?2:1),n=e%Pr,s=Math.floor(e/Pr);return[(n*16+.1)/256,1-((s+1)*16-.1)/256,((n+1)*16-.1)/256,1-(s*16+.1)/256]}const To=()=>({positions:[],normals:[],uvs:[],colors:[],indices:[],sky:[],lights:[]}),Lg=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],Dg=[[1,5,7,3],[4,0,2,6],[2,3,7,6],[4,5,1,0],[5,4,6,7],[0,1,3,2]];function Ig(i,t,e,n){const s=[To(),To(),To()],r=[];for(let a=-1;a<=1;a++)for(let l=-1;l<=1;l++)r.push(i.chunks.get(`${t.cx+l},${t.cz+a}`)?.blocks);const o=(a,l,c)=>{if(l<ie)return v.Obsidian;if(l>ge)return 0;const u=a<0?-1:a>15?1:0,h=c<0?-1:c>15?1:0;return r[(h+1)*3+u+1]?.get((a+16)%16,l,(c+16)%16)??0};for(const a of n===void 0?[...t.blocks.sections.keys()]:[n]){const l=t.blocks.sections.get(a);if(!l||l.nonAir===0)continue;const c=l.values;for(let u=0;u<16;u++)for(let h=0;h<16;h++)for(let d=0;d<16;d++){const f=a*16+u,g=d+16*(h+16*u),_=typeof c=="number"?c:c[g],m=xt(_);if(!m)continue;const p=ue(_);if(p.opaque&&p.shape==="cube"&&d>0&&d<15&&h>0&&h<15&&u>0&&u<15&&(typeof c=="number"||ue(c[g-1]).opaque&&ue(c[g+1]).opaque&&ue(c[g-16]).opaque&&ue(c[g+16]).opaque&&ue(c[g-256]).opaque&&ue(c[g+256]).opaque))continue;const S=t.cx*16+d,w=t.cz*16+h,y=m===v.Water||m===v.Glass||m===v.Ice,A=s[bc(_)>0?2:y?1:0];for(const R of Dr(_)){const[P,N,b,E,L,k]=R,H=[[P,N,b],[E,N,b],[P,L,b],[E,L,b],[P,N,k],[E,N,k],[P,L,k],[E,L,k]];for(let V=0;V<6;V++){const q=Lg[V],X=o(d+q[0],f+q[1],h+q[2]),et=ue(X),G=p.shape==="cube";if(G&&(et.opaque||y&&xt(X)===m))continue;const[Z,ot,ft,Ct]=Pg(m,V),jt=[[Z,ot],[ft,ot],[ft,Ct],[Z,Ct]],Gt=A.positions.length/3;let Xt=[.77,.7,1,.52,.88,.67][V];m===v.Wire&&Kt(_)>0&&(Xt=1.5);const Y=e?.sample(S+q[0],f+q[1],w+q[2])??[1,0];for(let K=0;K<4;K++){const ut=H[Dg[V][K]];A.positions.push(d+ut[0],f-(n===void 0?0:n*16)+ut[1],h+ut[2]),A.normals.push(...q),A.uvs.push(...jt[K]);let At=1;if(G&&V===2){const Mt=ut[0]===0?-1:1,Vt=ut[2]===0?-1:1;At-=.1*(Number(ue(o(d+Mt,f+1,h)).opaque)+Number(ue(o(d,f+1,h+Vt)).opaque))}A.colors.push(Xt*At,Xt*At,Xt*At),A.sky.push(Y[0]),A.lights.push(Y[1])}A.indices.push(Gt,Gt+2,Gt+1,Gt,Gt+3,Gt+2)}}}}return s}class Ug{samples=new Map;add(t,e){if(!Number.isFinite(e)||e<0)return;const n=this.samples.get(t)??[];n.length===240&&n.shift(),n.push(e),this.samples.set(t,n)}summary(t){const e=[...this.samples.get(t)??[]].sort((n,s)=>n-s);return{count:e.length,p50:e[Math.floor(e.length*.5)]??0,p95:e[Math.min(e.length-1,Math.floor(e.length*.95))]??0}}snapshot(){return Object.fromEntries([...this.samples.keys()].map(t=>[t,this.summary(t)]))}}class Ng{constructor(t){this.canvas=t,this.renderer=new Ag({canvas:t,antialias:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)),this.renderer.setSize(innerWidth,innerHeight),this.renderer.outputColorSpace=Ge,this.scene.background=new kt("#bad5ce"),this.scene.fog=new Ha("#bad5ce",55,155),this.materials=[gc(this.atlas.texture),gc(this.atlas.texture,!0),new Hn({map:this.atlas.texture,vertexColors:!0})],this.ambient=new Od("#eaf5e3","#697560",2.2),this.scene.add(this.ambient),this.sun=new Gd("#fff1c4",2.4),this.sun.position.set(-45,100,30),this.scene.add(this.sun),this.outline=new Dd(new Nd(new sn(1.008,1.008,1.008)),new th({color:"#fff4c9",transparent:!0,opacity:.85})),this.outline.visible=!1,this.scene.add(this.outline);const e=new Hn({color:"#f4eee0",transparent:!0,opacity:.65}),n=new sn(1,1,1);for(let r=0;r<28;r++){const o=new Se(n,e);o.position.set(r%7*38-114,68+r%3*3,Math.floor(r/7)*52-100),o.scale.set(18+r%4*5,2,8+r%3*4),this.clouds.add(o)}this.scene.add(this.clouds);const s=(r,o,a,l,c)=>{const u=new Se(new sn(...r),new Hn({color:o}));u.position.set(a,l,c),this.hand.add(u)};s([.24,.43,.24],"#335951",.085,-.24,.045),s([.255,.075,.255],"#263d39",.085,-.018,.045),s([.215,.205,.21],"#cfa880",.06,.08,.012),s([.065,.135,.105],"#bb936f",-.064,.118,.125),this.heldModel.position.set(.025,.13,-.075),this.hand.add(this.heldModel),this.hand.position.set(.51,-.64,-1.15),this.hand.rotation.set(-.12,-.2,-.26),this.viewmodelScene.add(this.hand),this.renderer.autoClear=!1,t.addEventListener("webglcontextlost",r=>{r.preventDefault(),this.contextLost=!0,this.onContext?.(!0)}),t.addEventListener("webglcontextrestored",()=>{this.contextLost=!1,this.clear();for(const r of this.lighting?.world.chunks.values()??[])this.lighting.world.markDirty(r.cx,r.cz);this.onContext?.(!1)}),addEventListener("resize",()=>this.resize())}renderer;scene=new Il;camera=new Je(75,innerWidth/innerHeight,.06,320);groups=new Map;sections=new Map;deferred=new Set;verticalRadius=64;lastSectionY=1/0;darkSky=new kt("#102a3d");clearSky=new kt("#b9d7d1");rainSky=new kt("#8ba5a2");currentSky=new kt;lighting;metrics=new Ug;contextLost=!1;onContext;atlas=Cg();materials;sun;ambient;outline;clouds=new vn;hand=new vn;viewmodelScene=new Il;viewmodelCamera=new Je(56,innerWidth/innerHeight,.02,8);heldModel=new vn;lastHeldItem=void 0;setHeldItem(t){if(t===this.lastHeldItem)return;this.lastHeldItem=t;for(const r of[...this.heldModel.children])if(this.heldModel.remove(r),r instanceof Se){r.geometry.dispose();for(const o of Array.isArray(r.material)?r.material:[r.material])o.dispose()}if(this.heldModel.rotation.set(0,0,0),t===null)return;const e=Ut(t);if(!e)return;if(e.tool){const r={sword:[-.73,.24,.34],pickaxe:[-.67,.48,.27],axe:[-.66,.43,.32],hoe:[-.72,.52,.27],shovel:[-.75,.32,.29]},[o,a,l]=r[e.tool]??[-.69,.38,.28];this.heldModel.rotation.set(o,a,l,"XYZ")}else e.block!==void 0?this.heldModel.rotation.set(-.12,-.18,-.1,"XYZ"):this.heldModel.rotation.set(-.19,.11,.08,"XYZ");const n=(r,o,a,l,c,u=0)=>{const h=new sn(...r),d=[];for(const g of[.87,.96,1,.67,.91,.78])for(let _=0;_<4;_++)d.push(g,g,g);h.setAttribute("color",new Pe(d,3));const f=new Se(h,new Hn({color:o,vertexColors:!0}));f.position.set(a,l,c),f.rotation.z=u,this.heldModel.add(f)},s=e.color;if(e.tool)if(e.tool==="sword")n([.145,.09,.13],"#9d8051",0,-.005,0),n([.105,.315,.105],"#815e3f",0,.175,0),n([.37,.09,.14],"#d8b76c",0,.34,0),n([.17,.48,.11],s,0,.575,0),n([.1,.14,.095],s,0,.865,0),n([.045,.4,.116],"#e2e4d7",.038,.57,.003);else switch(n([.105,.675,.105],"#906943",0,.29,0,-.11),n([.112,.125,.113],"#b88a56",-.034,.56,0,-.11),e.tool){case"pickaxe":n([.5,.13,.14],s,-.035,.625,0,-.08),n([.12,.17,.145],s,-.055,.55,0),n([.11,.12,.13],s,-.315,.57,0),n([.11,.12,.13],s,.24,.57,0);break;case"axe":n([.15,.15,.14],s,-.04,.625,0),n([.255,.355,.135],s,-.17,.625,0),n([.085,.28,.125],"#e4dcc5",-.328,.625,0);break;case"shovel":n([.125,.11,.12],s,-.055,.64,0),n([.245,.285,.14],s,-.055,.79,0),n([.14,.095,.135],s,-.055,.972,0);break;case"hoe":n([.345,.12,.14],s,-.135,.635,0,-.07),n([.18,.205,.125],s,-.25,.565,0),n([.1,.12,.13],"#d7dccd",-.29,.465,0);break;default:n([.19,.22,.14],s,-.04,.69,0)}else if(e.block!==void 0){const r=new sn(.32,.32,.32),o=r.getAttribute("uv");for(let l=0;l<6;l++){const c=e.block*3+(l===2?0:l===3?2:1),u=c%16,h=Math.floor(c/16),d=(u*16+.1)/256,f=((u+1)*16-.1)/256,g=1-((h+1)*16-.1)/256,_=1-(h*16+.1)/256,m=[[f,_],[d,_],[f,g],[d,g]];for(let p=0;p<4;p++)o.setXY(l*4+p,m[p][0],m[p][1])}o.needsUpdate=!0;const a=new Se(r,new Hn({map:this.atlas.texture}));a.position.set(-.025,.195,-.015),a.rotation.z=-.12,this.heldModel.add(a)}else e.category==="Materials"?(n([.17,.23,.14],s,-.02,.15,.005,-.32),n([.095,.095,.105],"#d3dfcd",.06,.23,.035,-.32)):e.category==="Food"||e.category==="Brewing"?(n([.22,.18,.22],s,-.015,.14,0),n([.155,.065,.155],"#e7dcc5",-.015,.265,0)):n([.205,.215,.185],s,-.015,.15,0,-.17)}resize(){this.camera.aspect=innerWidth/innerHeight,this.camera.updateProjectionMatrix(),this.viewmodelCamera.aspect=innerWidth/innerHeight,this.viewmodelCamera.updateProjectionMatrix(),this.renderer.setSize(innerWidth,innerHeight)}rebuild(t,e=2){const n=Math.floor(this.camera.position.y/16);if(n!==this.lastSectionY){this.lastSectionY=n;for(const c of this.deferred){const[,u]=c.split(",").map(Number);Math.abs(u-n)<=Math.ceil(this.verticalRadius/16)&&(t.dirty.add(c),this.deferred.delete(c))}for(const c of this.sections.keys()){const[,u]=c.split(",").map(Number);Math.abs(u-n)>Math.ceil(this.verticalRadius/16)&&(this.removeSection(c),this.deferred.add(c))}}let s=0;const r=performance.now(),o=[],a=Math.max(1,Math.floor(e)),l=Math.ceil(this.verticalRadius/16);for(const c of t.dirty){const[u,h,d]=c.split(",").map(Number),f=`${u},${d}`;if(!t.chunks.has(f)){t.dirty.delete(c);continue}if(Math.abs(h-n)>l){t.dirty.delete(c),this.deferred.add(c);continue}const g=u*16+8-this.camera.position.x,_=h*16+8-this.camera.position.y,m=d*16+8-this.camera.position.z,p=g*g+_*_+m*m;let S=o.length;for(;S>0&&o[S-1].distance>p;)S--;S>=a||(o.splice(S,0,{key:c,cx:u,sy:h,cz:d,distance:p}),o.length>a&&o.pop())}for(const{key:c,cx:u,sy:h,cz:d}of o){t.dirty.delete(c);const f=`${u},${d}`,g=t.chunks.get(f);if(!g)continue;const _=performance.now();this.removeSection(c);const m=Ig(t,g,this.lighting,h);if(!m.some(w=>w.indices.length>0)){if(this.metrics.add("mesh",performance.now()-_),++s>=e||performance.now()-r>7)break;continue}let p=this.groups.get(f);p||(p=new vn,p.position.set(u*16,0,d*16),this.groups.set(f,p),this.scene.add(p));const S=new vn;S.position.set(0,h*16,0);for(const[w,y]of m.entries()){if(!y.indices.length)continue;const A=new on;A.setAttribute("position",new Pe(y.positions,3)),A.setAttribute("normal",new Pe(y.normals,3)),A.setAttribute("uv",new Pe(y.uvs,2)),A.setAttribute("color",new Pe(y.colors,3)),A.setAttribute("sky",new Pe(y.sky,1)),A.setAttribute("blockLight",new Pe(y.lights,1)),A.setIndex(y.indices),A.computeBoundingSphere(),S.add(new Se(A,this.materials[w]))}if(this.sections.set(c,S),p.add(S),this.metrics.add("mesh",performance.now()-_),++s>=e||performance.now()-r>7)break}}removeSection(t){const e=this.sections.get(t);e&&(e.traverse(n=>{n instanceof Se&&n.geometry.dispose()}),e.removeFromParent(),this.sections.delete(t))}remove(t){const[e,n]=t.split(",").map(Number);for(const s of this.sections.keys()){const[r,,o]=s.split(",").map(Number);r===e&&o===n&&this.removeSection(s)}for(const s of this.deferred){const[r,,o]=s.split(",").map(Number);r===e&&o===n&&this.deferred.delete(s)}this.groups.get(t)?.removeFromParent(),this.groups.delete(t)}clear(){for(const t of this.groups.keys())this.remove(t)}environment(t,e=!1,n=!1){const s=Math.max(.06,Math.sin(t*Math.PI*2)),r=this.currentSky.copy(this.darkSky).lerp(e?this.rainSky:this.clearSky,pn(s*1.8,0,1));this.scene.background=r,this.scene.fog.color.copy(r),this.ambient.intensity=n?2.05:.35+s*1.7,this.sun.intensity=.12+s*2.1,this.sun.position.set(Math.cos(t*Math.PI*2)*80,Math.sin(t*Math.PI*2)*100,30),this.clouds.position.x=t*30%30;for(const o of this.materials)o instanceof En&&(o.uniforms.daylight.value=n?1:pn(s*1.8,0,1),o.uniforms.fogColor.value.copy(r),o.uniforms.fogNear.value=this.scene.fog.near,o.uniforms.fogFar.value=this.scene.fog.far)}target(t){this.outline.visible=!!t,t&&this.outline.position.set(t.x+.5,t.y+.5,t.z+.5)}render(){this.contextLost||(this.renderer.clear(),this.renderer.render(this.scene,this.camera),this.hand.visible&&(this.renderer.clearDepth(),this.renderer.render(this.viewmodelScene,this.viewmodelCamera)))}}class kg{constructor(t){this.canvas=t,document.addEventListener("pointerlockchange",()=>{const e=this.locked;if(this.locked=document.pointerLockElement===t,this.locked){this.pendingIntentionalUnlock=!1,this.suppressUnexpectedUnlock=!1,this.lockAcquiredAt=performance.now();return}if(this.clear(),this.pendingIntentionalUnlock){this.pendingIntentionalUnlock=!1;return}this.suppressUnexpectedUnlock||performance.now()-this.lockAcquiredAt<450||e&&(this.cancelExternalUnlock(),this.externalUnlockTimer=setTimeout(()=>{this.externalUnlockTimer=null,!this.locked&&!this.suppressUnexpectedUnlock&&(this.ignoreNativeEscapeUntil=performance.now()+250,this.onUnlock?.())},80))}),document.addEventListener("mousemove",e=>{this.locked&&this.onLook?.(e.movementX,e.movementY)}),document.addEventListener("keydown",e=>{if(e.code==="Escape"){if(performance.now()<this.ignoreNativeEscapeUntil){e.preventDefault();return}this.cancelExternalUnlock(),e.preventDefault(),e.repeat||this.onKey?.("Escape");return}e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement||(["Space","Tab","F3","F5"].includes(e.code)&&e.preventDefault(),e.repeat||this.onKey?.(e.code),this.locked&&this.keys.add(e.code))}),document.addEventListener("keyup",e=>this.keys.delete(e.code)),t.addEventListener("mousedown",e=>{this.locked&&(e.button===0&&(this.left=!0,this.leftPressed=!0),e.button===2&&(this.right=!0,this.onUse?.()))}),document.addEventListener("mouseup",e=>{e.button===0&&(this.left=!1),e.button===2&&(this.right=!1)}),t.addEventListener("contextmenu",e=>e.preventDefault()),t.addEventListener("wheel",e=>{e.preventDefault(),this.locked&&this.onWheel?.(Math.sign(e.deltaY))},{passive:!1}),addEventListener("blur",()=>this.clear())}keys=new Set;left=!1;right=!1;leftPressed=!1;locked=!1;pendingIntentionalUnlock=!1;lockRequestNumber=0;externalUnlockTimer=null;suppressUnexpectedUnlock=!1;ignoreNativeEscapeUntil=0;lockAcquiredAt=0;onLook;onKey;onWheel;onUnlock;onUse;cancelExternalUnlock(){this.externalUnlockTimer!==null&&(clearTimeout(this.externalUnlockTimer),this.externalUnlockTimer=null)}prepareResume(){this.cancelExternalUnlock(),this.suppressUnexpectedUnlock=!0}async lock(){this.prepareResume();const t=++this.lockRequestNumber;try{await this.canvas.requestPointerLock(),t===this.lockRequestNumber&&document.pointerLockElement===this.canvas&&(this.locked=!0,this.pendingIntentionalUnlock=!1,this.suppressUnexpectedUnlock=!1,this.lockAcquiredAt=performance.now())}catch{}}unlock(){this.cancelExternalUnlock(),++this.lockRequestNumber,(document.pointerLockElement===this.canvas||this.locked)&&(this.pendingIntentionalUnlock=!0,document.exitPointerLock()),this.clear()}clear(){this.keys.clear(),this.left=this.right=this.leftPressed=!1}}function Fg(i,t,e,n,s){return{crouching:!e&&(i||n&&s),verticalIntent:e?Number(t)-Number(i):0}}function zg(i,t,e){return i!=="spectator"&&t<e-4}function uh(i,t,e,n=6,s=!1){let r=Math.floor(t.x),o=Math.floor(t.y),a=Math.floor(t.z),l={x:0,y:0,z:0},c=0;const u=Math.sign(e.x),h=Math.sign(e.y),d=Math.sign(e.z),f=e.x?Math.abs(1/e.x):1/0,g=e.y?Math.abs(1/e.y):1/0,_=e.z?Math.abs(1/e.z):1/0;let m=e.x?(u>0?r+1-t.x:t.x-r)*f:1/0,p=e.y?(h>0?o+1-t.y:t.y-o)*g:1/0,S=e.z?(d>0?a+1-t.z:t.z-a)*_:1/0;for(let w=0;w<256&&c<=n;w++){const y=i(r,o,a);if(xt(y)!==v.Air&&(s||xt(y)!==v.Water))return{x:r,y:o,z:a,normal:l,distance:c,value:y};m<=p&&m<=S?(c=m,m+=f,r+=u,l={x:-u,y:0,z:0}):p<=S?(c=p,p+=g,o+=h,l={x:0,y:-h,z:0}):(c=S,S+=_,a+=d,l={x:0,y:0,z:-d})}return null}const Wa=[{name:"Cedar planks",pattern:["L"],keys:{L:6},output:[8,4]},{name:"Cedar sticks",pattern:["P","P"],keys:{P:8},output:[104,4]},{name:"Crafting bench",pattern:["PP","PP"],keys:{P:8},output:[23,1]},{name:"Cedar chest",pattern:["PPP","P P","PPP"],keys:{P:8},output:[25,1]},{name:"Kiln furnace",pattern:["SSS","S S","SSS"],keys:{S:3},output:[24,1]}];for(let i=0;i<4;i++)for(let t=0;t<5;t++){const e=[["MMM"," S "," S "],["MM","MS"," S"],["M","S","S"],["MM"," S"," S"],["M","M","S"]];Wa.push({name:["Wooden","Stone","Iron","Jade"][i]+" "+["pickaxe","axe","shovel","hoe","sword"][t],pattern:e[t],keys:{M:[8,3,102,103][i],S:104},output:[120+i*5+t,1]})}for(let i=0;i<2;i++)for(let t=0;t<4;t++)Wa.push({name:`${i?"Jade":"Iron"} armor`,pattern:[["MMM","M M"],["M M","MMM","MMM"],["MMM","M M","M M"],["M M","M M"]][t],keys:{M:i?103:102},output:[150+i*4+t,1]});function dh(i,t){let e=t,n=t,s=-1,r=-1;for(let l=0;l<t*t;l++)i[l]&&(e=Math.min(e,l%t),s=Math.max(s,l%t),n=Math.min(n,Math.floor(l/t)),r=Math.max(r,Math.floor(l/t)));if(s<0)return null;const o=s-e+1,a=r-n+1;for(const l of Wa)if(!(l.pattern.length!==a||l.pattern[0].length!==o))for(const c of[!1,!0]){let u=!0;for(let h=0;h<a;h++)for(let d=0;d<o;d++){const f=l.pattern[h][c?o-1-d:d],g=l.keys[f]??0;(i[(n+h)*t+e+d]?.id??0)!==g&&(u=!1)}if(u)return l}return null}function Og(i,t,e){const n=dh(i,t);if(!n)return!1;const s=new We(e.slots);if(s.add(...n.output))return!1;for(let r=0;r<t*t;r++)i[r]&&--i[r].count===0&&(i[r]=null);return e.slots=s.slots,!0}const Ii=i=>`${Math.floor(i.x)},${Math.round(i.y*2)},${Math.floor(i.z)}`;function li(i,t,e,n,s=!0,r=1.75){if(!i.loaded(t,e))return null;const o={get:(l,c,u)=>{const h=i.get(l,c,u);return s&&xt(h)===v.Door?0:h}},a=[];for(let l=Math.floor(n)-2;l<=Math.floor(n)+1;l++)for(let c=Math.floor(t-.27);c<=Math.floor(t+.27);c++)for(let u=Math.floor(e-.27);u<=Math.floor(e+.27);u++){const h=i.get(c,l,u);if(!(!ue(h).solid||xt(h)===v.Door)){for(const[d,,f,g,_,m]of Dr(h))if(t+.27>c+d&&t-.27<c+g&&e+.27>u+f&&e-.27<u+m){const p=l+_;p<=n+1.01&&p>=n-1.01&&p>ie&&p<ge&&a.push(p)}}}a.sort((l,c)=>Math.abs(l-n)-Math.abs(c-n));for(const l of a){const c={x:t,y:l+.002,z:e};if(en(o,c,r,.27))continue;let u=!1;for(const h of[-.1,.4,1])for(const[d,f]of[[0,0],[.3,0],[-.3,0],[0,.3],[0,-.3]]){const g=xt(i.get(t+d,c.y+h,e+f));(g===v.Lava||g===v.Water)&&(u=!0)}if(!u)return c}return null}function Hr(i,t,e,n=!0,s=1.75){let r=t;for(let o=1;o<=4;o++){const a=li(i,t.x+(e.x-t.x)*o/4,t.z+(e.z-t.z)*o/4,r.y,n,s);if(!a||a.y-r.y>.51||r.y-a.y>1.01)return!1;r=a}return Math.abs(r.y-e.y)<.1}class Bg{a=[];push(t){let e=this.a.length;for(this.a.push(t);e;){const n=e-1>>1;if(this.a[n].f<=t.f)break;this.a[e]=this.a[n],e=n}this.a[e]=t}pop(){const t=this.a[0],e=this.a.pop();if(this.a.length&&e){let n=0;for(;n*2+1<this.a.length;){let s=n*2+1;if(s+1<this.a.length&&this.a[s+1].f<this.a[s].f&&s++,this.a[s].f>=e.f)break;this.a[n]=this.a[s],n=s}this.a[n]=e}return t}}class Hg{constructor(t,e,n,s=!0,r=1.75,o=2400){if(this.world=t,this.doors=s,this.height=r,this.limit=o,this.goal=n,!t.loaded(n.x,n.z)){this.status="unloaded";return}const a=li(t,Math.floor(e.x)+.5,Math.floor(e.z)+.5,e.y,s,r),l=li(t,Math.floor(n.x)+.5,Math.floor(n.z)+.5,n.y,s,r);if(!a||!l){this.status="blocked";return}this.goal=l;const c={...a,g:0,f:this.h(a)};this.open.push(c),this.costs.set(Ii(c),0)}status="searching";path=[];expanded=0;open=new Bg;costs=new Map;goal;h(t){return Math.abs(t.x-this.goal.x)+Math.abs(t.z-this.goal.z)+Math.abs(t.y-this.goal.y)*.5}step(t=64){for(let e=0;e<t&&this.status==="searching";e++){const n=this.open.pop();if(!n||++this.expanded>this.limit){this.status="blocked";break}if(n.g===(this.costs.get(Ii(n))??1/0)){if(Ii(n)===Ii(this.goal)){const s=[];let r=n;for(;r;)s.push({x:r.x,y:r.y,z:r.z}),r=r.parent;this.path=s.reverse(),this.status="ready";break}for(const[s,r]of[[1,0],[-1,0],[0,1],[0,-1]]){const o=li(this.world,n.x+s,n.z+r,n.y,this.doors,this.height);if(!o||!Hr(this.world,n,o,this.doors,this.height))continue;const a=n.g+1+Math.abs(n.y-o.y)*.4,l=Ii(o);a>128||a>=(this.costs.get(l)??1/0)||(this.costs.set(l,a),this.open.push({...o,g:a,f:a+this.h(o),parent:n}))}}}return this.status}}class Gg{constructor(t){this.world=t}agents=new Map;expandedLastTick=0;cursor=0;removeMissing(t){for(const e of this.agents.keys())t.has(e)||this.agents.delete(e)}steer(t,e,n,s,r=!0,o=1.75){let a=this.agents.get(t);a||(a={path:[],index:0,target:"",retry:0,status:"searching",revision:0,stuck:0},this.agents.set(t,a)),a.retry-=s;const l=Ii(n);if(l!==a.target&&(a.path=[],a.search=void 0,a.target=l,a.retry=0),a.path.length&&a.revision!==this.world.navRevision){const u=a.path[a.index];u&&!Hr(this.world,e,u,r,o)&&(a.path=[],a.retry=0),a.revision=this.world.navRevision}for(;a.index<a.path.length&&Math.hypot(a.path[a.index].x-e.x,a.path[a.index].z-e.z)<.16&&Math.abs(a.path[a.index].y-e.y)<.3;)a.index++;if(a.path.length&&a.index>=a.path.length)return a.status="arrived",null;!a.path.length&&!a.search&&a.retry<=0&&(a.search=new Hg(this.world,e,n,r,o),a.status=a.search.status,a.retry=3);const c=a.path[a.index];return c?(a.last&&Math.hypot(a.last.x-e.x,a.last.z-e.z)<.008?a.stuck+=s:a.stuck=0,a.last={...e},a.stuck>2?(a.path=[],a.search=void 0,a.retry=1,a.status="blocked",a.stuck=0,null):c):null}tick(t=96,e=2){this.expandedLastTick=0;const n=[...this.agents.values()].filter(r=>r.search),s=performance.now()+e;for(let r=0;r<n.length&&this.expandedLastTick<t&&performance.now()<s;r++){const o=n[(r+this.cursor)%n.length],a=o.search,l=a.expanded;a.step(Math.min(24,t-this.expandedLastTick)),this.expandedLastTick+=a.expanded-l,a.status!=="searching"&&(o.status=a.status,o.path=a.path,o.index=0,o.revision=this.world.navRevision,o.search=void 0)}this.cursor++}}const Gr={merchant:{label:"Merchant",offers:[0,1,2,3,4],color:"#a85843"},farmer:{label:"Farmer",offers:[0,2],color:"#9b905b"},fisherman:{label:"Fisherman",offers:[0,2],color:"#547f8d"},chef:{label:"Tea-house keeper",offers:[2,5],color:"#b68f63"},carpenter:{label:"Carpenter",offers:[6,7],color:"#93724c"},blacksmith:{label:"Blacksmith",offers:[1,4],color:"#526a66"},potter:{label:"Pottery artisan",offers:[8],color:"#ae745b"},lantern_maker:{label:"Lantern maker",offers:[3],color:"#b45d42"},guard:{label:"Guard",offers:[],color:"#58676b"},resident:{label:"Resident",offers:[0],color:"#9b907c"}};function vc(i,t){const e=i.facing%2?i.z2-i.z1+1:i.x2-i.x1+1,n=Math.floor(e/2),[s,r]=i.facing===0?[i.x1+n,i.z1+t]:i.facing===1?[i.x2-t,i.z1+n]:i.facing===2?[i.x2-n,i.z2-t]:[i.x1+t,i.z2-n];return{x:s+.5,y:21.002,z:r+.5}}function Vg(i){const e=Hi(0,0,Aa(i)).structures.filter(a=>["home","shop","shophouse","merchant","workshop","teahouse","canal-house"].includes(a.kind)),n=new Set,s=[[0,24],[25,-16],[-25,48],[144,-80],[-175,-144],[-144,144],[-185,170],[64,50],[0,10],[64,130]],r=["Mei","Wen","Qing","Bo","Lian","Jun","Tao","Yan","Shan","Yu"];return["merchant","blacksmith","farmer","fisherman","chef","carpenter","potter","lantern_maker","guard","resident"].map((a,l)=>{const[c,u]=s[l],d=[...e].sort((_,m)=>Math.hypot(_.x1-c,_.z1-u)-Math.hypot(m.x1-c,m.z1-u)).find(_=>!n.has(_.id));n.add(d.id);const f=vc(d,1),g=e.filter(_=>_.id!==d.id).sort((_,m)=>Math.hypot(_.x1-f.x,_.z1-f.z)-Math.hypot(m.x1-f.x,m.z1-f.z))[0];return{id:`resident:${i}:${l}`,name:`${r[l]} · ${Gr[a].label}`,profession:a,home:f,workplace:vc(g,2)}})}function Wg(i,t,e,n){let s=0,r=Number.POSITIVE_INFINITY;for(const o of["x","y","z"]){const a=i[o],l=t[o];if(Math.abs(l)<1e-9){if(a<e[o]||a>n[o])return null;continue}const c=(e[o]-a)/l,u=(n[o]-a)/l;if(s=Math.max(s,Math.min(c,u)),r=Math.min(r,Math.max(c,u)),s>r)return null}return r>=0?s:null}function Xg(i,t,e){const n=e.x-t.x,s=e.y-t.y,r=e.z-t.z,o=Math.hypot(n,s,r);if(o<1e-6)return!0;const a={x:n/o,y:s/o,z:r/o};return uh((c,u,h)=>{const d=i.get(c,u,h);return ue(d).solid?d:v.Air},t,a,Math.max(0,o-.06))===null}function Sa(i,t,e,n=1.4,s=1){return Xg(i,{x:t.x,y:t.y+n,z:t.z},{x:e.x,y:e.y+s,z:e.z})}const Xa=[{cost:[[108,8]],output:[111,1],label:"Sell harvested rice"},{cost:[[103,1]],output:[111,4],label:"Sell a jade shard"},{cost:[[111,1]],output:[105,3],label:"Steamed dumplings"},{cost:[[111,2]],output:[14,6],label:"Festival lanterns"},{cost:[[111,4]],output:[130,1],label:"Iron pickaxe"}];Xa.push({cost:[[111,1]],output:[112,3],label:"Jasmine tea"},{cost:[[111,1]],output:[8,16],label:"Cedar planks"},{cost:[[111,1]],output:[23,1],label:"Crafting bench"},{cost:[[111,1]],output:[58,4],label:"Glazed pottery"});function _c(i){const t=i.profession?Gr[i.profession].offers:null;return Xa.map((e,n)=>({offer:e,id:n})).filter(({id:e})=>!t||t.includes(e))}function Ao(i,t,e=i){return{id:crypto.randomUUID(),kind:i,name:e,body:{position:{...t},velocity:{x:0,y:0,z:0},grounded:!1,flying:!1,fallStart:t.y},health:i==="spirit"?16:20,home:{...t},goal:{...t},timer:0,cooldown:0,yaw:0,state:"idle",trades:0}}function $g(i,t,e){const n=new Set([v.Roof,v.JadeRoof,v.RubyRoof,v.BrownRoof,v.Farmland,v.Lava,v.Water,v.Lantern]),s=16;for(let r=0;r<s;r++){const o=e*.763+r*Math.PI*(3-Math.sqrt(5)),a=12+r%4*2.5,l=Math.floor(t.x+Math.cos(o)*a)+.5,c=Math.floor(t.z+Math.sin(o)*a)+.5;if(!i.loaded(l,c))continue;const u=li(i,l,c,t.y,!1);if(!u||Math.abs(u.y-t.y)>7)continue;const h=xt(i.get(u.x,u.y-.08,u.z));if(!n.has(h)&&!(Be(u,t)<10||Be(u,t)>25)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([d,f])=>{const g=li(i,l+d,c+f,u.y,!1);return g&&Hr(i,u,g,!1)}))return u}return null}class xc{constructor(t,e){this.world=t,this.navigation=new Gg(t),Array.isArray(e?.entities)?this.list=e.entities:this.list=[...Vg(t.seed).map(n=>({...Ao("villager",n.home,n.name),...n})),Ao("panda",{x:14,y:21.1,z:-35},"Bamboo panda")],Array.isArray(e?.drops)&&(this.drops=e.drops)}list=[];drops=[];radius=64;elapsed=0;spawnClock=0;wasNight=!1;navigation;interactingId="";drop(t,e){return this.dropMany([t],e)}dropMany(t,e){const n=this.drops.map(s=>({...s,stack:Ce(s.stack)}));for(const s of t){if(!s)continue;const r=Ut(s.id)?.stack;if(!r||!Number.isInteger(s.count)||s.count<=0)return!1;let o=s.count;for(const a of n)if(us(a.stack,s)&&Be(a.position,e)<2){const l=Math.min(o,r-a.stack.count);a.stack.count+=l,o-=l,l&&(a.age=0)}for(;o>0;){if(n.length>=256)return!1;const a=Math.min(r,o);o-=a,n.push({id:crypto.randomUUID(),stack:{...Ce(s),count:a},position:{...e},velocity:{x:0,y:2,z:0},age:0})}}return this.drops=n,!0}tick(t,e,n,s,r,o,a,l=!0){this.elapsed+=t,this.spawnClock+=t;for(const h of this.drops){if(h.age+=t,!this.world.loaded(h.position.x,h.position.z))continue;h.velocity.y=Math.max(-10,h.velocity.y-10*t);const d=h.position.y+h.velocity.y*t;if(ue(this.world.get(h.position.x,d-.15,h.position.z)).solid?h.velocity.y=0:h.position.y=d,l&&h.age>.5&&Be(h.position,{...e,y:e.y+.7})<2){const f=n.addStack(h.stack);f!==h.stack.count&&a(),h.stack.count=f}}this.drops=this.drops.filter(h=>h.stack.count>0&&h.age<600);const c=s>.52;if(this.wasNight&&!c)for(const h of this.list)h.trades=0;this.wasNight=c,this.list=this.list.filter(h=>h.kind!=="spirit"||h.health>0&&Be(h.body.position,e)<=this.radius+20&&(c||Be(h.body.position,e)<=30));const u=this.list.filter(h=>h.kind==="spirit"&&h.health>0&&Be(h.body.position,e)<=this.radius).length;if(r&&c&&this.spawnClock>=8&&u<5){this.spawnClock=0;const h=$g(this.world,e,this.elapsed);h&&this.list.push(Ao("spirit",h,"Wandering spirit"))}for(const h of this.list){if(h.health<=0)continue;const d=h.body.position,f=h.body.velocity;if(!this.world.loaded(d.x,d.z)||Be(d,e)>this.radius||(h.cooldown=Math.max(0,h.cooldown-t),h.timer-=t,h.kind==="spirit"&&!c&&(h.health-=t*3,h.health<=0)))continue;const g=h.profession==="guard"?this.list.find(R=>R.kind==="spirit"&&R.health>0&&Be(d,R.body.position)<12):void 0;h.kind==="villager"&&h.workplace&&(h.goal={...c?h.home:h.workplace},h.state=c?"returning home":"going to work",g&&(h.goal={...g.body.position},h.state="patrolling",Be(d,g.body.position)<1.8&&h.cooldown<=0&&Sa(this.world,d,g.body.position)&&(this.applyHit(g,4,{x:g.body.position.x-d.x,y:0,z:g.body.position.z-d.z}),h.cooldown=1.2)));const _=h.kind==="spirit"&&r&&Be(d,e)<20,m=l&&h.kind==="panda"&&n.held?.id===v.Bamboo&&Be(d,e)<10;if(_||m)h.goal={...e},h.state=_?"chase":"follow";else if(h.timer<=0&&!(h.kind==="villager"&&h.workplace)){h.timer=3+ne(h.id.length,Math.floor(this.elapsed),71)*5;const R=h.kind==="villager"?6:5;h.goal={x:h.home.x+(ne(Math.floor(this.elapsed),h.home.z,21)-.5)*R,y:h.home.y,z:h.home.z+(ne(h.home.x,Math.floor(this.elapsed),77)-.5)*R},h.state=c&&h.kind==="villager"?"return":"wander",h.state==="return"&&(h.goal={...h.home})}let p=this.navigation.steer(h.id,d,h.goal,t,h.kind==="villager",h.kind==="panda"?.9:1.75);if(_&&Be(d,e)>=1.5){const R=e.x-d.x,P=e.z-d.z,N=Math.hypot(R,P);if(N>1e-5){const b=Math.min(.9,N),E=li(this.world,d.x+R/N*b,d.z+P/N*b,d.y,!1,1.75);E&&Hr(this.world,d,E,!1,1.75)&&(p=E)}}h.navStatus=this.navigation.agents.get(h.id)?.status;const S=(p?.x??d.x)-d.x,w=(p?.z??d.z)-d.z,y=Math.hypot(S,w),A=_?2.4:m?1.9:h.kind==="panda"?.65:1.5;if(_&&Be(d,e)<1.5?(f.x=f.z=0,h.state="attack",h.cooldown<=0&&Sa(this.world,d,e,1.4,1.1)&&(o(3),h.cooldown=1.2)):p&&y>.05&&this.interactingId!==h.id?(f.x=S/y*A,f.z=w/y*A,h.yaw=Math.atan2(S,w),this.list.some(P=>P!==h&&P.id<h.id&&Math.hypot(P.body.position.x-(d.x+f.x*.4),P.body.position.z-(d.z+f.z*.4))<.55&&Math.abs(P.body.position.y-d.y)<1)&&(f.x*=.1,f.z*=.1),h.kind==="villager"&&this.openNearbyDoors(d,p)):(f.x=f.z=0,h.navStatus==="arrived"&&(h.state=c?"sleeping":h.profession==="guard"?"on watch":"working"),(h.navStatus==="blocked"||h.navStatus==="unloaded")&&(h.state="waiting for route")),h.knockback){f.x+=h.knockback.x,f.z+=h.knockback.z;const R=Math.exp(-10*t);h.knockback.x*=R,h.knockback.z*=R,Math.hypot(h.knockback.x,h.knockback.z)<.02&&(h.knockback=void 0)}f.y=Math.max(-20,f.y-20*t),Rc(this.world,h.body,t,!1,h.kind==="panda"?.9:1.75)}this.list=this.list.filter(h=>h.health>0),this.navigation.removeMissing(new Set(this.list.map(h=>h.id))),this.navigation.tick()}openNearbyDoors(t,e){for(let n=Math.floor(t.y);n<=Math.floor(t.y)+1;n++)for(let s=Math.floor(e.z)-1;s<=Math.floor(e.z)+1;s++)for(let r=Math.floor(e.x)-1;r<=Math.floor(e.x)+1;r++){const o=this.world.get(r,n,s),a=Kt(o);if(xt(o)!==v.Door||a&4||Math.hypot(t.x-r-.5,t.z-s-.5)>1.6)continue;this.world.set(r,n,s,oe(v.Door,a|4));const l=n+(a&8?-1:1),c=this.world.get(r,l,s);xt(c)===v.Door&&this.world.set(r,l,s,oe(v.Door,Kt(c)|4))}}target(t,e,n=4){let s=null,r=n;for(const o of this.list){if(o.health<=0||!this.world.loaded(o.body.position.x,o.body.position.z))continue;const a=o.body.position,l=o.kind==="panda"?.47:.36,c=o.kind==="panda"?1.23:1.76,u=Wg(t,e,{x:a.x-l,y:a.y,z:a.z-l},{x:a.x+l,y:a.y+c,z:a.z+l});u!==null&&u<=r&&(s=o,r=u)}return s}applyHit(t,e,n){if(!this.list.includes(t)||t.health<=0||!Number.isFinite(e)||e<=0)return{status:"invalid",damage:0};const s=Math.min(t.health,e),r=e>=t.health;if(r&&!this.drop({id:t.kind==="spirit"?103:108,count:t.kind==="spirit"?1:2},{...t.body.position,y:t.body.position.y+.5}))return{status:"blocked",damage:0};t.health=Math.max(0,t.health-e);const o=Math.hypot(n.x,n.z);if(o>1e-5){const l=n.x/o*3,c=n.z/o*3;t.knockback={x:l,y:0,z:c},t.body.velocity.x+=l,t.body.velocity.z+=c}return t.body.velocity.y=Math.max(t.body.velocity.y,2.5),{status:r?"killed":"hit",damage:s}}attack(t,e,n){return this.applyHit(t,e,n).status==="killed"}serialize(){return{entities:structuredClone(this.list),drops:structuredClone(this.drops)}}}class qg{constructor(t){this.scene=t}models=new Map;drops=new Map;geometry=new sn(1,1,1);materials=new Map;material(t){return this.materials.has(t)||this.materials.set(t,new kd({color:t})),this.materials.get(t)}box(t,e,n,s,r,o,a,l){const c=new Se(this.geometry,this.material(e));return c.position.set(n,s,r),c.scale.set(o,a,l),t.add(c),c}create(t){const e=new vn;if(t.kind==="panda"){this.box(e,"#e1e1cf",0,.48,0,.75,.65,1),this.box(e,"#dedfcb",0,.78,.5,.68,.55,.5);for(const n of[-.25,.25]){this.box(e,"#323d38",n,.88,.76,.19,.2,.04),this.box(e,"#253b34",n,1.08,.5,.22,.23,.22);for(const s of[-.32,.32])this.box(e,"#303b37",n,.18,s,.22,.38,.26)}this.box(e,"#2b3c36",0,.7,.78,.15,.12,.06)}else{const n=t.kind==="spirit"?"#607b8b":t.profession?Gr[t.profession].color:t.name.startsWith("Mei")?"#a85843":t.name.startsWith("Wen")?"#526a66":"#9b905b";this.box(e,n,0,.86,0,.55,.68,.32),this.box(e,t.kind==="spirit"?"#8da7aa":"#c8aa7e",0,1.43,0,.46,.46,.44),this.box(e,"#3e4539",0,1.68,0,.51,.12,.49);for(const s of[-.12,.12])this.box(e,t.kind==="spirit"?"#e5ba7e":"#2b3e35",s,1.46,.225,.045,.05,.025);this.box(e,"#ceae6b",0,.64,.17,.56,.06,.03);for(const s of[-.36,.36]){const r=this.box(e,n,s,.85,0,.16,.6,.2);r.userData.limb=s>0?1:-1}for(const s of[-.16,.16]){const r=this.box(e,"#475549",s,.28,0,.2,.56,.23);r.userData.limb=s>0?-1:1}}return this.scene.add(e),this.models.set(t.id,e),e}update(t,e){const n=new Set(t.list.map(r=>r.id));for(const[r,o]of this.models)n.has(r)||(this.scene.remove(o),this.models.delete(r));for(const r of t.list){const o=this.models.get(r.id)??this.create(r);o.position.set(r.body.position.x,r.body.position.y,r.body.position.z),o.rotation.y=r.yaw;for(const a of o.children)a.userData.limb&&(a.rotation.x=Math.abs(r.body.velocity.x)+Math.abs(r.body.velocity.z)>.2?Math.sin(e*7)*.35*a.userData.limb:0)}const s=new Set(t.drops.map(r=>r.id));for(const[r,o]of this.drops)s.has(r)||(this.scene.remove(o),this.drops.delete(r));for(const r of t.drops){let o=this.drops.get(r.id);o||(o=new Se(this.geometry,this.material(Ut(r.stack.id)?.color??"#e1ce9d")),o.scale.setScalar(.2),this.scene.add(o),this.drops.set(r.id,o)),o.position.set(r.position.x,r.position.y+Math.sin(e*3)*.04,r.position.z),o.rotation.y=e*1.4}}clear(){for(const t of this.models.values())this.scene.remove(t);for(const t of this.drops.values())this.scene.remove(t);this.models.clear(),this.drops.clear()}}class Yg{constructor(t){this.scene=t,this.mesh=new Ad(new sn(.09,.09,.09),new Hn({color:16777215}),128),this.mesh.instanceMatrix.setUsage(Ju),this.mesh.frustumCulled=!1,this.mesh.count=0,t.add(this.mesh);const e=new on;e.setAttribute("position",new rn(this.rainData,3)),this.rain=new Id(e,new eh({color:"#b9cecf",size:.055,transparent:!0,opacity:.6})),this.rain.frustumCulled=!1,t.add(this.rain)}particles=[];mesh;rain;rainData=new Float32Array(900);dummy=new be;burst(t,e){for(let n=0;n<10&&this.particles.length<128;n++)this.particles.push({p:new z(t.x+.5,t.y+.5,t.z+.5),v:new z((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),age:0,color:new kt(e)})}update(t,e,n,s){if(this.particles=this.particles.filter(r=>r.age<.7),this.particles.forEach((r,o)=>{r.age+=t,r.v.y-=10*t,r.p.addScaledVector(r.v,t),this.dummy.position.copy(r.p),this.dummy.scale.setScalar(1-r.age/.8),this.dummy.updateMatrix(),this.mesh.setMatrixAt(o,this.dummy.matrix),this.mesh.setColorAt(o,r.color)}),this.mesh.count=this.particles.length,this.mesh.instanceMatrix.needsUpdate=!0,this.mesh.instanceColor&&(this.mesh.instanceColor.needsUpdate=!0),this.rain.visible=n,n){for(let r=0;r<300;r++)this.rainData[r*3]=e.x+r*13.371%26-13,this.rainData[r*3+1]=e.y+((r*.317-s*8)%16+16)%16,this.rainData[r*3+2]=e.z+r*7.137%26-13;this.rain.geometry.attributes.position.needsUpdate=!0}}}class yc{constructor(t){this.world=t}blockLight=new Map;sky=new Map;signature=-1;job;worldSignature(){return this.world.navRevision}rebuild(){this.job=void 0;const t=this.compute();let e=t.next();for(;!e.done;)e=t.next();return e.value}update(t=4){this.job||(this.job=this.compute());const e=performance.now()+t;do{const n=this.job.next();if(n.done)return this.job=void 0,n.value}while(performance.now()<e);return!1}get pending(){return!!this.job}*compute(){const t=this.worldSignature();if(t===this.signature)return!1;const e=this.blockLight,n=this.sky,s=new Map,r=new Map,o=new Set,a=[];for(const[c,u]of this.world.chunks){const h=new Int16Array(256).fill(ie-1);for(const[d,f]of[...u.blocks.sections].sort((g,_)=>_[0]-g[0])){for(let g=15;g>=0;g--)for(let _=0;_<16;_++)for(let m=0;m<16;m++){const p=d*16+g,S=f.get(ms(m,g,_));ue(S).opaque&&h[m+_*16]<p&&(h[m+_*16]=p);const w=bc(S);if(w){const y=u.cx*16+m,A=u.cz*16+_;s.set(Ve(y,p,A),w),a.push([y,p,A,w])}}yield}r.set(c,h),yield}for(let c=0;c<a.length&&c<25e4;c++){c%256===0&&(yield);const[u,h,d,f]=a[c];if(!(f<=1))for(const[g,_,m]of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const p=u+g,S=h+_,w=d+m;if(S<ie||S>ge||!this.world.loaded(p,w)||ue(this.world.get(p,S,w)).opaque)continue;const y=Ve(p,S,w);(s.get(y)??0)>=f-1||(s.set(y,f-1),a.push([p,S,w,f-1]))}}for(const[c,u]of r){const h=n.get(c);if(!h||u.some((d,f)=>d!==h[f])){const d=this.world.chunks.get(c);if(!d)return!1;for(const f of d.blocks.sections.keys())o.add(fn(d.cx,f,d.cz))}yield}let l=0;for(const[c,u]of s)if(++l%512===0&&(yield),e.get(c)!==u){const[h,d,f]=c.split(",").map(Number);o.add(fn(Ht(h),Ht(d),Ht(f)))}for(const c of e.keys())if(++l%512===0&&(yield),!s.has(c)){const[u,h,d]=c.split(",").map(Number);o.add(fn(Ht(u),Ht(h),Ht(d)))}if(this.worldSignature()!==t)return!1;this.signature=t,this.blockLight=s,this.sky=r;for(const c of o){const[u,,h]=c.split(",").map(Number);this.world.chunks.has(dn(u,h))&&this.world.dirty.add(c)}return!0}sample(t,e,n){if(e>ge)return[1,0];if(e<ie)return[0,0];const s=this.sky.get(dn(Ht(t),Ht(n)))?.[me(t)+me(n)*16];return[s===void 0||e>=s?1:0,(this.blockLight.get(Ve(t,e,n))??0)/15]}}class jg{context;volume=.3;play(t){if(!this.volume)return;this.context??=new AudioContext,this.context.state==="suspended"&&this.context.resume();const e=this.context,n=e.createOscillator(),s=e.createGain();n.connect(s).connect(e.destination);const r=e.currentTime,o={break:120,place:180,craft:660,hurt:80,step:90,eat:240,pickup:880,click:440}[t];n.type=t==="craft"||t==="pickup"?"sine":"triangle",n.frequency.setValueAtTime(o,r),n.frequency.exponentialRampToValueAtTime(o*.45,r+.14),s.gain.setValueAtTime(this.volume*(t==="step"?.12:.3),r),s.gain.exponentialRampToValueAtTime(.001,r+.16),n.start(r),n.stop(r+.17)}}const Kg="jade-harbor-engine-v1",Jg=1,Ki=["players","blockEntities","entities","worldSimulation"],$a=["worlds","chunks",...Ki,"checkpoints"],Zg=new Set(["format","version","generator","revision","id","name","seed","mode","created","updated","time","weather","edits","player","simulation","achievements"]),Qg=new Set(["position","yaw","pitch","health","hunger","xp","effects","saturation","exhaustion","breath","slots","selected","armor","cursor","grid","spawn","dead","flying"]),tv=new Set(["containers","furnaces","brewers","hoppers","entities","drops","elapsed","tickNo","cropTimer","pendingTicks","weather","weatherTimer","hardcoreEnded"]),ev=new Set(["id","kind","name","body","health","home","goal","timer","cooldown","yaw","state","trades","profession","workplace","navStatus","knockback"]),nv=new Set(["position","velocity","grounded","flying","fallStart"]),iv=new Set(["id","stack","position","velocity","age"]),ba=new Set(["x","y","z"]),sv=new Set(["id","count","durability","enchants","wearCounter"]),rv=new Set(["id","remaining","pulse"]),ov=new Set(["slots","burn","progress","recipe"]),av=new Set(["slots","fuel","progress","recipe"]),lv=new Set(["slots","cooldown"]),fh=new Set(["format","version","generator","revision","id","name","seed","mode","created","updated"]),cv=new Set(["worldId","revision","schema","committedAt","chunks","metadata"]),hv=new Set(["worldId","revision","data"]),uv=new Set(["worldId","key","entries","revision","version"]),hr=16384,dv=256,fv=5e5;function Lr(i){let t=2166136261;const e=new WeakSet,n=(r,o=0)=>{if(o>96)throw new Error("Save state is too deeply nested.");if(r!==null&&typeof r=="object"){if(e.has(r))throw new Error("Cyclic save state cannot be checksummed.");if(e.add(r),Array.isArray(r)||ArrayBuffer.isView(r)){s("[");for(const a of r)n(a,o+1);s("]")}else{s("{");for(const a of Object.keys(r).sort())s(JSON.stringify(a)),n(r[a],o+1);s("}")}e.delete(r)}else s(JSON.stringify(r)??"undefined")},s=r=>{for(let o=0;o<r.length;o++)t=Math.imul(t^r.charCodeAt(o),16777619)};return n(i),t>>>0}function Me(i){if(!i||typeof i!="object"||Array.isArray(i))return!1;const t=Object.getPrototypeOf(i);return t===Object.prototype||t===null}function Ee(i,t){return Object.keys(i).every(e=>t.has(e))}function bs(i){return typeof i=="number"&&Number.isFinite(i)&&i>=0&&i<=1e15}function Mc(i){return Number.isInteger(i)&&Number(i)>=0&&Number(i)<=4294967295}function ph(i){const t=i.split(",").map(Number);return t.length===3&&t.every(Number.isInteger)&&Math.abs(t[0])<=625e3&&Math.abs(t[2])<=625e3&&t[1]>=Ui&&t[1]<=Ni}function mh(i){return Number.isInteger(i)&&Number(i)>=0&&Number(i)<=65535&&ue(Number(i)).id===(Number(i)&255)&&((Number(i)&255)!==v.Air||Number(i)===v.Air)}function gh(i){if(!i||typeof i.key!="string"||!ph(i.key)||!(i.entries instanceof Uint16Array)||i.entries.length%2||i.entries.length>8192)throw new Error("Damaged chunk record. Import a known-good backup or reset this world.");const t=new Set;for(let e=0;e<i.entries.length;e+=2){const n=i.entries[e],s=i.entries[e+1];if(n>=4096||t.has(n)||!mh(s))throw new Error("Invalid or duplicate chunk entry.");t.add(n)}}function pv(i){gh(i);const t=[];for(let n=0;n<i.entries.length;n+=2)t.push([i.entries[n],i.entries[n+1]]);t.sort((n,s)=>n[0]-s[0]);const e=new Uint16Array(i.entries.length);for(let n=0;n<t.length;n++)e[n*2]=t[n][0],e[n*2+1]=t[n][1];return{key:i.key,entries:e}}function vh(i,t){const e=i;if(!Me(e)||!Ee(e,cv)||e.worldId!==t||e.schema!==1||!Number.isSafeInteger(e.revision)||e.revision<1||!bs(e.committedAt)||!Me(e.chunks)||Object.keys(e.chunks).length>fv||!Mc(e.metadata))throw new Error("Invalid save checkpoint.");for(const[n,s]of Object.entries(e.chunks))if(!ph(n)||!Mc(s))throw new Error("Invalid save checkpoint.");return e}function mv(i,t,e){const n=i;if(gh(n),!Me(n)||!Ee(n,uv)||n.worldId!==t||n.version!==1||!Number.isSafeInteger(n.revision)||n.revision<1||n.revision>e)throw new Error("Invalid chunk metadata.");return n}function gv(i,t){const{edits:e,player:n,simulation:s={},time:r,weather:o,achievements:a,...l}=i,{containers:c={},furnaces:u={},brewers:h={},hoppers:d={},entities:f=[],drops:g=[],..._}=s;return{meta:{...l,revision:t},parts:{players:n,blockEntities:{containers:c,furnaces:u,brewers:h,hoppers:d},entities:{entities:f,drops:g},worldSimulation:{..._,time:r,weather:o,achievements:a}}}}function _h(i,t,e,n=crypto.randomUUID()){const s=e==="creative"?We.creative():new We;return e!=="creative"&&(s.add(105,4),s.add(107,5)),{format:"jade-harbor-engine",version:1,generator:Fr,revision:0,id:n,name:i,seed:t,mode:e,created:Date.now(),updated:Date.now(),time:.24,weather:"clear",edits:{},player:{position:{...sl},spawn:{...sl},yaw:0,pitch:0,health:20,hunger:20,xp:0,slots:s.slots,selected:0,armor:[null,null,null,null],grid:Array(9).fill(null),cursor:null,dead:!1,flying:e==="spectator"},achievements:[]}}async function Cs(){return new Promise((i,t)=>{let e=!1,n;try{n=indexedDB.open(Kg,Jg)}catch(s){t(s);return}n.onupgradeneeded=()=>{const s=n.result,r=n.transaction,o=(l,c)=>s.objectStoreNames.contains(l)?r.objectStore(l):s.createObjectStore(l,c);o("worlds",{keyPath:"id"});for(const l of[...Ki,"checkpoints"])o(l,{keyPath:"worldId"});const a=o("chunks",{keyPath:["worldId","key"]});a.indexNames.contains("worldId")||a.createIndex("worldId","worldId")},n.onerror=()=>t(n.error??new Error("Could not open browser storage.")),n.onblocked=()=>{e=!0,t(new Error("Close other Jade Harbor tabs to access storage."))},n.onsuccess=()=>{if(e){n.result.close();return}n.result.onversionchange=()=>n.result.close(),i(n.result)}})}function Ps(i,t,e,n=()=>t.error){return new Promise((s,r)=>{t.oncomplete=()=>{i.close();try{s(e())}catch(o){r(o)}},t.onabort=t.onerror=()=>{i.close(),r(n()??new Error("Save transaction aborted."))}})}async function vv(){const i=await Cs(),t=i.transaction("worlds","readonly"),e=t.objectStore("worlds").getAll();return Ps(i,t,()=>e.result.map(n=>({id:n.id,name:n.name,seed:n.seed,mode:n.mode,created:n.created,updated:n.updated})))}function _v(i){const t=new Map;for(const[e,n]of Object.entries(i)){const[s,r,o]=e.split(",").map(Number),a=fn(Ht(s),Ht(r),Ht(o)),l=t.get(a)??[];l.push([ms(me(s),me(r),me(o)),n]),t.set(a,l)}return[...t].sort(([e],[n])=>e.localeCompare(n)).map(([e,n])=>{n.sort((r,o)=>r[0]-o[0]);const s=new Uint16Array(n.length*2);for(let r=0;r<n.length;r++)s[r*2]=n[r][0],s[r*2+1]=n[r][1];return{key:e,entries:s}})}async function xr(i){const t=await Cs(),e=t.transaction($a,"readonly"),n=e.objectStore("worlds").get(i),s=e.objectStore("chunks").index("worldId").getAll(i),r=e.objectStore("checkpoints").get(i),o=Ki.map(p=>e.objectStore(p).get(i));if(await Ps(t,e,()=>{}),!n.result)throw new Error("This world is no longer available.");const a=()=>new Error("Incomplete or damaged save. Existing data was kept. Import a backup or reset this world.");let l,c,u;try{if(l=vh(r.result,i),c=n.result,!Me(c)||!Ee(c,fh)||c.id!==i||c.revision!==l.revision||o.some(p=>!Me(p.result)||!Ee(p.result,hv)||p.result.worldId!==i||p.result.revision!==l.revision))throw a();u=s.result.map(p=>mv(p,i,l.revision))}catch{throw a()}const h=Object.fromEntries(Ki.map((p,S)=>[p,o[S].result.data]));try{const{time:p,weather:S,achievements:w,...y}=h.worldSimulation;Es({...c,player:h.players,time:p,weather:S,achievements:w,edits:{},simulation:{...y,weather:S,...h.blockEntities,...h.entities}})}catch{throw a()}try{if(Lr({meta:c,parts:h})!==l.metadata)throw a()}catch{throw a()}if(u.length!==Object.keys(l.chunks).length)throw a();const d={};for(const p of u){if(!Object.hasOwn(l.chunks,p.key)||Lr(p.entries)!==l.chunks[p.key])throw a();const[S,w,y]=p.key.split(",").map(Number);for(let A=0;A<p.entries.length;A+=2){const R=p.entries[A];d[`${S*16+R%16},${w*16+Math.floor(R/256)},${y*16+Math.floor(R%256/16)}`]=p.entries[A+1]}}const{time:f,weather:g,achievements:_,...m}=h.worldSimulation;return Es({...c,player:h.players,time:f,weather:g,achievements:_,edits:d,simulation:{...m,weather:g,...h.blockEntities,...h.entities}})}async function xh(i,t,e,n=!1){if(i=Es(i),n&&t!==void 0)throw new Error("Recovery writes must replace the complete save.");const s=(t??_v(i.edits)).map(pv);if(new Set(s.map(g=>g.key)).size!==s.length)throw new Error("Duplicate chunk delta.");const r=await Cs(),o=r.transaction($a,"readwrite"),a=o.objectStore("worlds"),l=o.objectStore("chunks");let c=0,u;const h=Ps(r,o,()=>c,()=>u??o.error),d=a.get(i.id),f=o.objectStore("checkpoints").get(i.id);return f.onsuccess=()=>{try{const g=d.result;if(e!==void 0&&(g?.revision??0)!==e)throw new Error("Another tab saved a newer copy. Export a backup, then close this tab and reopen the world.");if(g&&!f.result&&!n)throw new Error("Missing save checkpoint. Export your work and create a new world.");if(g&&(!Number.isSafeInteger(g.revision)||g.revision<0||g.revision>=Number.MAX_SAFE_INTEGER))throw new Error("Invalid save revision. Reset this world or import a known-good backup.");c=(g?.revision??0)+1;const _=gv(i,c);let m={};t&&(m={...vh(f.result,i.id).chunks});const p=()=>{try{a.put(_.meta);for(const S of Ki)o.objectStore(S).put({worldId:i.id,revision:c,data:_.parts[S]});for(const S of s)l.put({worldId:i.id,key:S.key,entries:S.entries,revision:c,version:1}),m[S.key]=Lr(S.entries);o.objectStore("checkpoints").put({worldId:i.id,revision:c,schema:1,committedAt:Date.now(),chunks:m,metadata:Lr(_)})}catch(S){u=S,o.abort()}};if(t)p();else{const S=l.index("worldId").openKeyCursor(i.id);S.onsuccess=()=>{S.result?(l.delete(S.result.primaryKey),S.result.continue()):p()}}}catch(g){u=g,o.abort()}},h}async function yr(i,t,e){return xh(i,t,e,!1)}async function xv(i){const t=await Cs(),e=t.transaction("worlds","readonly"),n=e.objectStore("worlds").get(i);await Ps(t,e,()=>{});const s=n.result;if(!s)throw new Error("This world is no longer available.");if(!Me(s)||!Ee(s,fh)||s.id!==i||s.format!=="jade-harbor-engine"||s.version!==1||s.generator!==Fr||typeof s.name!="string"||typeof s.seed!="string"||!["creative","survival","hardcore","adventure","spectator"].includes(s.mode)||!bs(s.created)||!bs(s.updated)||!Number.isSafeInteger(s.revision)||s.revision<1||s.revision>=Number.MAX_SAFE_INTEGER)throw new Error("World metadata is damaged. Import a known-good backup or delete this world.");return s}async function yv(i){const t=await Cs(),e=t.transaction($a,"readwrite");e.objectStore("worlds").delete(i);for(const r of[...Ki,"checkpoints"])e.objectStore(r).delete(i);const n=e.objectStore("chunks"),s=n.index("worldId").openKeyCursor(i);return s.onsuccess=()=>{s.result&&(n.delete(s.result.primaryKey),s.result.continue())},Ps(t,e,()=>{})}async function Mv(i,t){const e=await xr(i);if(e.name=t.trim().slice(0,64),!e.name)throw new Error("Give your world a name.");return e.updated=Date.now(),yr(e,[],e.revision)}async function Sv(i){const t=await xv(i),e=_h(t.name,t.seed,t.mode,i);return e.revision=await xh(e,void 0,t.revision,!0),e}function Es(i){let t;try{t=structuredClone(i)}catch{throw new Error("Unsupported or damaged Jade Harbor save.")}if(!Me(t)||!Ee(t,Zg)||t.version!==1||t.format!=="jade-harbor-engine"||t.generator!==Fr||typeof t.id!="string"||!t.id||t.id.length>160||typeof t.seed!="string"||typeof t.name!="string"||!["creative","survival","hardcore","adventure","spectator"].includes(t.mode)||!Me(t.player)||!Ee(t.player,Qg)||!t.edits||typeof t.edits!="object"||Array.isArray(t.edits)||!Array.isArray(t.achievements)||t.achievements.length>dv||new Set(t.achievements).size!==t.achievements.length||t.achievements.some(n=>typeof n!="string"||n.length>120)||!bs(t.created)||!bs(t.updated)||!["clear","rain"].includes(t.weather)||t.revision!==void 0&&(!Number.isSafeInteger(t.revision)||t.revision<0))throw new Error("Unsupported or damaged Jade Harbor save.");const e=t.player;for(const n of[e.position,e.spawn])if(!Me(n)||!Ee(n,ba)||![n.x,n.y,n.z].every(Number.isFinite)||Math.abs(n.x)>1e7||Math.abs(n.z)>1e7||n.y<ie-4||n.y>ge+64)throw new Error("Invalid player position.");if(![e.yaw,e.pitch,e.health,e.hunger,e.xp,t.time].every(Number.isFinite)||t.time<0||t.time>=1||e.xp<0||e.xp>1e9||Math.abs(e.pitch)>Math.PI/2||Math.abs(e.yaw)>1e6||e.health<0||e.health>20||e.hunger<0||e.hunger>20||e.flying!==void 0&&typeof e.flying!="boolean"||e.dead!==void 0&&typeof e.dead!="boolean"||!Number.isInteger(e.selected)||e.selected<0||e.selected>8)throw new Error("Invalid player status.");if(e.effects!==void 0&&(!Array.isArray(e.effects)||e.effects.some(n=>!Me(n)||!Ee(n,rv))||!Lh(e.effects))||[e.saturation,e.exhaustion,e.breath].some(n=>n!==void 0&&(!Number.isFinite(n)||n<0))||(e.saturation??0)>20||(e.exhaustion??0)>=4||(e.breath??0)>10)throw new Error("Invalid survival state.");if(!Array.isArray(e.slots)||e.slots.length!==36)throw new Error("Invalid inventory.");if(e.grid!==void 0&&(!Array.isArray(e.grid)||e.grid.length!==9))throw new Error("Invalid crafting grid.");if(e.armor!==void 0&&(!Array.isArray(e.armor)||e.armor.length!==4||e.armor.some((n,s)=>n&&Ut(n.id)?.armorSlot!==ki[s])))throw new Error("Invalid armor equipment.");for(const n of[...e.slots,e.cursor??null,...e.grid??[],...e.armor??[]])if(!Ea(n))throw new Error("Invalid item stack.");if(Object.keys(t.edits).length>5e5)throw new Error("World edit limit exceeded.");for(const[n,s]of Object.entries(t.edits)){const r=n.split(",").map(Number);if(r.length!==3||!r.every(Number.isInteger)||Math.abs(r[0])>1e7||Math.abs(r[2])>1e7||r[1]<=ie||r[1]>ge||!mh(s))throw new Error("Invalid world block.")}return bv(t.simulation),t.name=t.name.slice(0,64),t.seed=t.seed.slice(0,100),t}function Sc(i){const t=new Blob([JSON.stringify(i)],{type:"application/json"}),e=URL.createObjectURL(t),n=document.createElement("a");n.href=e,n.download=`${i.name.replace(/[^a-z0-9_-]/gi,"-")}.jadeharbor.json`,n.click(),setTimeout(()=>URL.revokeObjectURL(e),1e3)}function bv(i){if(i===void 0)return;const t=()=>{throw new Error("Invalid world simulation data.")};(!Me(i)||!Ee(i,tv))&&t();const e=a=>typeof a=="number"&&Number.isFinite(a),n=a=>{const l=a;return Me(l)&&Ee(l,ba)&&[l.x,l.y,l.z].every(e)&&Math.abs(l.x)<=1e7&&Math.abs(l.z)<=1e7&&l.y>=-100&&l.y<=1e3},s=(a,l)=>{const c=a;return Me(c)&&Ee(c,ba)&&[c.x,c.y,c.z].every(e)&&[c.x,c.y,c.z].every(u=>Math.abs(u)<=l)},r=(a,l)=>Array.isArray(a)&&a.length===l&&a.every(Ea),o=a=>{const l=a.split(",").map(Number);return l.length===3&&l.every(Number.isInteger)&&l[1]>ie&&l[1]<=ge&&Math.abs(l[0])<=1e7&&Math.abs(l[2])<=1e7};if(i.containers!==void 0){(!i.containers||typeof i.containers!="object"||Array.isArray(i.containers))&&t();const a=Object.entries(i.containers);a.length>hr&&t();for(const[l,c]of a)(!o(l)||!r(c,27))&&t()}if(i.furnaces!==void 0){(!i.furnaces||typeof i.furnaces!="object"||Array.isArray(i.furnaces))&&t();const a=Object.entries(i.furnaces);a.length>hr&&t();for(const[l,c]of a){const u=c;(!o(l)||!Me(u)||!Ee(u,ov)||!r(u.slots,3)||!e(u.burn)||u.burn<0||u.burn>32||!e(u.progress)||u.progress<0||u.progress>4||!Number.isInteger(u.recipe)||u.recipe<0||u.recipe>255)&&t()}}if(i.brewers!==void 0){(!i.brewers||typeof i.brewers!="object"||Array.isArray(i.brewers))&&t();const a=Object.entries(i.brewers);a.length>hr&&t();for(const[l,c]of a){const u=c;(!o(l)||!Me(u)||!Ee(u,av)||!r(u.slots,4)||!e(u.fuel)||u.fuel<0||u.fuel>12||!e(u.progress)||u.progress<0||u.progress>=6||u.recipe!==0&&!Object.hasOwn(Bi,u.recipe)||u.slots[0]&&u.slots[0].id!==160||u.slots[1]&&!Bi[u.slots[1].id]||u.slots[2]&&u.slots[2].id!==16||u.slots[3]&&!Object.values(Bi).includes(u.slots[3].id))&&t()}}if(i.pendingTicks!==void 0&&(!Array.isArray(i.pendingTicks)||i.pendingTicks.length>2e5||i.pendingTicks.some(a=>typeof a!="string"||!/^[-]?\d+,[-]?\d+,[-]?\d+$/.test(a)||!o(a)))&&t(),i.hoppers!==void 0){(!i.hoppers||typeof i.hoppers!="object"||Array.isArray(i.hoppers))&&t();const a=Object.entries(i.hoppers);a.length>hr&&t();for(const[l,c]of a){const u=c;(!o(l)||!Me(u)||!Ee(u,lv)||!r(u.slots,5)||!e(u.cooldown)||u.cooldown<0||u.cooldown>.4)&&t()}}if(i.elapsed!==void 0&&(!e(i.elapsed)||Number(i.elapsed)<0||Number(i.elapsed)>1e12)&&t(),i.tickNo!==void 0&&(!Number.isSafeInteger(i.tickNo)||Number(i.tickNo)<0||Number(i.tickNo)>1e12)&&t(),i.cropTimer!==void 0&&(!e(i.cropTimer)||Number(i.cropTimer)<0||Number(i.cropTimer)>12)&&t(),i.entities!==void 0){(!Array.isArray(i.entities)||i.entities.length>256)&&t();const a=new Set;for(const l of i.entities){const c=l;(!Me(c)||!Ee(c,ev)||typeof c.id!="string"||!c.id||c.id.length>160||a.has(c.id)||typeof c.name!="string"||c.name.length>100||typeof c.state!="string"||c.state.length>120||c.navStatus!==void 0&&(typeof c.navStatus!="string"||c.navStatus.length>80)||!["villager","panda","spirit"].includes(c.kind)||!Me(c.body)||!Ee(c.body,nv)||typeof c.body.grounded!="boolean"||typeof c.body.flying!="boolean"||!n(c.body.position)||!s(c.body.velocity,128)||!n(c.goal)||!n(c.home)||c.workplace!==void 0&&!n(c.workplace)||c.knockback!==void 0&&!s(c.knockback,32)||c.profession!==void 0&&!Object.hasOwn(Gr,c.profession)||![c.health,c.timer,c.cooldown,c.yaw,c.trades,c.body.fallStart].every(e)||c.health<0||c.health>100||Math.abs(c.timer)>1e12||c.cooldown<0||c.cooldown>60||Math.abs(c.yaw)>1e6||Math.abs(c.body.fallStart)>1e7||!Number.isInteger(c.trades)||c.trades<0||c.trades>12)&&t(),a.add(c.id)}}if(i.drops!==void 0){(!Array.isArray(i.drops)||i.drops.length>256)&&t();const a=new Set;for(const l of i.drops){const c=l;(!Me(c)||!Ee(c,iv)||typeof c.id!="string"||!c.id||c.id.length>160||a.has(c.id)||c.stack===null||!Ea(c.stack)||!n(c.position)||!s(c.velocity,128)||!e(c.age)||c.age<0||c.age>600)&&t(),a.add(c.id)}}i.weather!==void 0&&!["clear","rain"].includes(String(i.weather))&&t(),i.weatherTimer!==void 0&&(!e(i.weatherTimer)||Number(i.weatherTimer)<0||Number(i.weatherTimer)>1e3)&&t(),i.hardcoreEnded!==void 0&&typeof i.hardcoreEnded!="boolean"&&t()}function Ea(i){if(i===null)return!0;const t=i,e=Me(t)&&Ee(t,sv)?Ut(t.id):void 0;return!!e&&Ph(t)&&Number.isInteger(t.count)&&t.count>0&&t.count<=e.stack&&(e.durability?Number.isFinite(t.durability)&&t.durability>0&&t.durability<=e.durability:t.durability===void 0)}class Ev{ui;view;input;audio=new jg;world;inventory=We.creative();mode="creative";body={position:{x:.5,y:21.1,z:22.5},velocity:{x:0,y:0,z:0},grounded:!1,flying:!1,fallStart:21.1};previous={...this.body.position};yaw=0;pitch=0;time=.24;health=20;hunger=20;xp=0;status=new Is;saturation=5;exhaustion=0;spawn={x:.5,y:21.1,z:22.5};active=!1;dead=!1;meta={id:"",name:"",seed:"jade-harbor",created:0};saves=[];saveRevision=0;saveTask=null;saveAgain=!1;saveActivityVersion=0;achievements=new Set;settings={fov:75,sensitivity:4,distance:5,simulationDistance:4,volume:30};hit=null;mineProgress=0;mineKey="";cooldown=0;debug=!1;fps=0;frameCount=0;fpsTime=0;tickCount=0;craftingGrid=Array(9).fill(null);category="All";query="";lastJump=0;crouching=!1;jumpRequest=!1;useRequest=!1;saveTimer=0;evictionSave=!1;lastAuto=0;lastHud=0;lastStep=0;damageCooldown=0;hungerClock=0;lastTime=0;accumulator=0;simulation;entities;entityView;effects;lighting;lastLighting=0;entityHit=null;hitFlash=0;hitMessage="";attackCooldown=0;tradeEntity=null;breath=10;hardcoreEnded=!1;containerKey="";containers={};returnScreen="menu";constructor(t){this.ui=new qh(t),this.view=new Ng(t.querySelector("canvas"));try{this.ui.root.style.setProperty("--item-atlas-url",`url("${this.view.atlas.canvas.toDataURL("image/png")}")`)}catch{}this.input=new kg(this.view.canvas),this.world=new ll("jade-harbor"),this.simulation=new el(this.world),this.entities=new xc(this.world),this.entityView=new qg(this.view.scene),this.effects=new Yg(this.view.scene),this.lighting=new yc(this.world),this.view.lighting=this.lighting;try{this.settings={...this.settings,...JSON.parse(localStorage.getItem("jade-harbor-settings")??"{}")}}catch{}this.applySettings(),this.view.onContext=e=>{e?(this.active&&this.pause(),this.ui.toast("Graphics paused. Your world is kept in memory while we save it.")):this.ui.toast("Graphics restored. Return to your world when ready.")},this.bind(),this.loadPreview(),this.refreshSaves(),requestAnimationFrame(e=>this.frame(e)),document.addEventListener("visibilitychange",()=>{document.hidden&&this.active&&(this.save(),this.ui.screen==="none"&&this.pause())}),addEventListener("pagehide",()=>{this.active&&this.save()})}bind(){this.view.canvas.addEventListener("click",()=>{this.active&&this.ui.screen==="none"&&!this.input.locked&&this.input.lock()}),this.input.onLook=(t,e)=>{this.yaw-=t*5e-4*this.settings.sensitivity,this.pitch=pn(this.pitch-e*5e-4*this.settings.sensitivity,-1.54,1.54)},this.input.onUse=()=>{this.active&&this.ui.screen==="none"&&(this.useRequest=!0)},this.input.onUnlock=()=>{this.useRequest=!1,this.active&&this.ui.screen==="none"&&this.pause()},this.input.onWheel=t=>{!this.active||this.ui.screen!=="none"||(this.inventory.selected=(this.inventory.selected+t+9)%9,this.scheduleSave())},this.input.onKey=t=>this.key(t),this.ui.onMove=(t,e,n,s)=>{if(!this.active||this.ui.screen!=="inventory"&&this.ui.screen!=="chest")return;const r=c=>c==="slot"||c==="hotbar-select"||c==="container-slot"&&this.ui.screen==="chest";if(!r(t)||!r(n))return;const o=this.containers[this.containerKey],a=t==="container-slot"?o:this.inventory.slots,l=n==="container-slot"?o:this.inventory.slots;!a||!l||!this.inventory.move(e,s,a,l)||(this.ui.screen==="chest"?this.ui.container(this.inventory,o):this.ui.inventory(this.inventory,this.mode==="creative",this.category,this.query),this.scheduleSave())},this.ui.onAction=(t,e,n)=>{this.action(t,e,n).catch(s=>this.ui.toast(s instanceof Error?s.message:"Action failed."))},this.ui.onSearch=()=>{this.query=document.querySelector("#search").value,document.querySelector("#catalog").innerHTML=this.ui.catalog(this.category,this.query)},this.ui.onChange=t=>{if(t.id==="change-mode"){if(this.hardcoreEnded)return;const e=this.mode;if(this.mode=t.value,this.body.flying=this.mode==="spectator",this.crouching=!1,this.jumpRequest=!1,this.body.velocity={x:0,y:0,z:0},this.body.grounded=!1,e==="spectator"&&this.mode!=="spectator"){const n=Hh(this.world,this.body.position);n?(this.body.position=n,this.previous={...n}):this.safeSpawn()}this.body.fallStart=this.body.position.y,this.view.hand.visible=this.mode!=="spectator",this.ui.pause(this.meta.name,this.mode,this.hardcoreEnded),this.save();return}if(t.id in this.settings){this.settings[t.id]=Number(t.value),this.applySettings();const e=t.parentElement?.querySelector("output");e&&(e.textContent=t.value+(t.id==="fov"?"°":t.id==="volume"?"%":t.id==="distance"||t.id==="simulationDistance"?" chunks":""))}}}applySettings(){const t=(e,n)=>typeof e=="number"&&Number.isFinite(e)?e:n;this.settings.fov=pn(t(this.settings.fov,75),55,105),this.settings.distance=Math.round(pn(t(this.settings.distance,5),3,8)),this.settings.simulationDistance=Math.round(pn(t(this.settings.simulationDistance,4),2,6)),this.settings.sensitivity=pn(t(this.settings.sensitivity,4),1,12),this.settings.volume=pn(t(this.settings.volume,30),0,100),this.view.camera.fov=this.settings.fov,this.view.camera.updateProjectionMatrix(),this.view.scene.fog.near=this.settings.distance*10,this.view.scene.fog.far=this.settings.distance*24,this.audio.volume=this.settings.volume/100;try{localStorage.setItem("jade-harbor-settings",JSON.stringify(this.settings))}catch{}}loadPreview(){for(let t=-2;t<=2;t++)for(let e=-2;e<=2;e++)this.world.ensure(e,t,!0);this.view.camera.position.set(46,62,54),this.view.camera.lookAt(0,28,-43),this.view.hand.visible=!1}async refreshSaves(){try{this.saves=await vv(),this.active||this.ui.menu(this.saves)}catch{this.ui.menu([]),this.ui.toast("Device storage is unavailable. Enable browser storage to save worlds.")}}async start(t,e="My Jade Harbor",n="jade-harbor",s="creative"){if(this.active&&!await this.save())throw new Error("Save the current world before opening another.");clearTimeout(this.saveTimer),t=t?Es(t):_h(e,n,s),this.saveRevision=t.revision??0,this.world.dispose(),this.view.clear(),this.mode=t?.mode??s,this.meta={id:t?.id??crypto.randomUUID(),name:t?.name??e,seed:t?.seed??n,created:t?.created??Date.now()},this.world=new ll(this.meta.seed,t?.edits??{}),this.simulation=new el(this.world,t?.simulation),this.entities=new xc(this.world,t?.simulation),this.entityView.clear(),this.lighting=new yc(this.world),this.view.lighting=this.lighting,this.lastLighting=0,this.hardcoreEnded=!!t?.simulation?.hardcoreEnded,this.hardcoreEnded&&(this.mode="spectator"),this.inventory=t?new We(t.player.slots):this.mode==="creative"?We.creative():new We,!t&&this.mode!=="creative"&&(this.inventory.add(105,4),this.inventory.add(107,5)),this.inventory.equipment=new Co(t?.player.armor),this.inventory.selected=t?.player.selected??0,this.inventory.cursor=t?.player.cursor??null,this.craftingGrid=t?.player.grid??Array(9).fill(null),this.body.position={...t?.player.position??{x:.5,y:21.1,z:22.5}},this.body.velocity={x:0,y:0,z:0},this.previous={...this.body.position},this.body.flying=this.mode==="spectator"||this.mode==="creative"&&t.player.flying===!0,this.body.fallStart=this.body.position.y,this.spawn={...t?.player.spawn??{x:.5,y:21.1,z:22.5}},this.yaw=t?.player.yaw??0,this.pitch=t?.player.pitch??0,this.health=t?.player.health??20,this.hunger=t?.player.hunger??20,this.xp=t?.player.xp??0,this.status=new Is(t.player.effects),this.saturation=t.player.saturation??5,this.exhaustion=t.player.exhaustion??0,this.time=t?.time??.24,this.dead=t?.player.dead??!1,this.achievements=new Set(t?.achievements??[]),this.containers=t?.simulation?.containers??{};const r=Math.floor(this.body.position.x/16),o=Math.floor(this.body.position.z/16);for(let a=o-1;a<=o+1;a++)for(let l=r-1;l<=r+1;l++)this.world.ensure(l,a,!0);en(this.world,this.body.position)&&this.mode!=="spectator"&&this.safeSpawn(),this.world.onChange=(a,l,c)=>{this.scheduleSave(),this.simulation.changed(a,l,c)},this.world.onGeneration=a=>this.view.metrics.add("generation",a),this.world.onEvictionPending=()=>{this.evictionSave||(this.evictionSave=!0,this.save().finally(()=>{window.setTimeout(()=>this.evictionSave=!1,2e3)}))},this.active=!0,this.tickCount=0,this.cooldown=this.damageCooldown=this.attackCooldown=this.hungerClock=0,this.breath=t.player.breath??10,this.crouching=!1,this.jumpRequest=!1,this.mineProgress=0,this.accumulator=0,this.lastAuto=performance.now(),this.view.hand.visible=this.mode!=="spectator",this.ui.show("pause"),this.resume(),this.unlockAchievement("First lantern","Welcome to Jade Harbor. Every block has a story."),await this.save()}safeSpawn(){const t=Math.floor(this.spawn.x/16),e=Math.floor(this.spawn.z/16);for(let r=e-1;r<=e+1;r++)for(let o=t-1;o<=t+1;o++)this.world.ensure(o,r,!0);for(let r=0;r<=3;r++)for(let o=-r;o<=r;o++)for(let a=-r;a<=r;a++)for(let l=0;l<18;l++)for(const c of[1,-1]){const u={x:this.spawn.x+o,y:this.spawn.y+l*c,z:this.spawn.z+a};if(!(u.y<=ie||u.y>ge||en(this.world,u)||!en(this.world,{...u,y:u.y-.15})||[v.Water,v.Lava].includes(xt(this.world.get(u.x,u.y,u.z)))||[v.Water,v.Lava].includes(xt(this.world.get(u.x,u.y+1,u.z))))){this.body.position=u,this.body.velocity={x:0,y:0,z:0},this.previous={...u};return}}const n=Math.floor(this.spawn.x),s=Math.floor(this.spawn.z);for(let r=ge-1;r>ie;r--)if(!en(this.world,{x:n+.5,y:r+.01,z:s+.5})&&ue(this.world.get(n,r-1,s)).solid&&![v.Water,v.Lava].includes(xt(this.world.get(n,r,s)))&&![v.Water,v.Lava].includes(xt(this.world.get(n,r+1,s)))){this.body.position={x:n+.5,y:r+.01,z:s+.5},this.body.velocity={x:0,y:0,z:0},this.previous={...this.body.position};return}}snapshot(t=!0){return{version:1,generator:Fr,format:"jade-harbor-engine",revision:this.saveRevision,...this.meta,updated:Date.now(),mode:this.mode,time:this.time,weather:this.simulation.weather,edits:t?Object.fromEntries(this.world.edits):{},player:{position:{...this.body.position},yaw:this.yaw,pitch:this.pitch,health:this.health,hunger:this.hunger,xp:this.xp,effects:this.status.list.map(e=>({...e})),saturation:this.saturation,exhaustion:this.exhaustion,breath:this.breath,slots:this.inventory.slots.map(Ce),selected:this.inventory.selected,armor:this.inventory.equipment.slots.map(Ce),cursor:Ce(this.inventory.cursor),grid:this.craftingGrid.map(Ce),spawn:{...this.spawn},dead:this.dead,flying:this.mode==="spectator"||this.mode==="creative"&&this.body.flying},simulation:{...this.simulation.serialize(),...this.entities.serialize(),containers:structuredClone(this.containers),hardcoreEnded:this.hardcoreEnded},achievements:[...this.achievements]}}scheduleSave(){this.saveActivityVersion++,clearTimeout(this.saveTimer),this.saveTimer=window.setTimeout(()=>void this.save(),650)}async save(){if(!this.active)return!1;if(this.saveTask)return this.saveAgain=!0,this.saveTask;const t=this.world,e=this.meta.id,n=async()=>{if(this.world!==t||this.meta.id!==e)return!1;try{this.ui.saveStatus("Saving…");const o=performance.now(),a=t.captureChanges(),l=this.saveActivityVersion,c=this.snapshot(!1),u=await yr(c,a.chunks,this.saveRevision);return t.acknowledgeChanges(a.revisions),this.view.metrics.add("save",performance.now()-o),this.saveRevision=u,this.ui.saveStatus(t.dirtyEdits.size||this.saveActivityVersion!==l?"Saved · newer changes pending":"✓ All changes saved"),!0}catch(o){return this.ui.saveStatus("Save failed · changes still in memory"),this.ui.toast(o instanceof Error?o.message:"Could not save. Export a backup from Pause."),!1}},r=(async()=>{do if(this.saveAgain=!1,!await n())return!1;while(this.saveAgain);return!0})();this.saveTask=r;try{return await r}finally{this.saveTask=null,this.saveAgain&&this.active&&this.save()}}resume(t=!0){if(!this.active){this.ui.menu(this.saves);return}if(this.dead){this.showDeath();return}if(!this.inventory.settleCursor()){this.ui.toast("Make room for the stack you are holding.");return}this.ui.show("none"),this.input.prepareResume(),t?this.input.lock():this.ui.toast("Click the game to capture your mouse.")}backToPreviousScreen(){!this.active||this.returnScreen==="menu"?this.ui.menu(this.saves):this.returnScreen==="create"?this.ui.create():this.ui.pause(this.meta.name,this.mode,this.hardcoreEnded)}pause(){!this.active||this.dead||(this.ui.pause(this.meta.name,this.mode,this.hardcoreEnded),this.input.unlock(),this.save())}open(t){this.input.unlock(),t==="inventory"&&this.ui.inventory(this.inventory,this.mode==="creative",this.category,this.query),t==="craft"&&this.showCraft()}key(t){if(/^Digit[1-9]$/.test(t)&&this.active&&(this.ui.screen==="none"||this.ui.screen==="inventory")){this.inventory.selected=Number(t.slice(-1))-1,this.active&&this.ui.screen==="inventory"&&this.ui.inventory(this.inventory,this.mode==="creative",this.category,this.query),this.active&&this.scheduleSave();return}if(t==="F3"){this.debug=!this.debug;return}if(t==="Escape"){this.active?this.dead?this.showDeath():this.ui.screen==="none"?this.pause():this.ui.screen==="settings"||this.ui.screen==="controls"?this.backToPreviousScreen():this.resume(!1):this.ui.screen!=="menu"&&this.ui.menu(this.saves);return}if(this.active){if(t==="KeyE"){this.ui.screen==="inventory"||this.ui.screen==="craft"?this.resume():this.ui.screen==="none"&&this.open("inventory");return}if(this.ui.screen==="none"){if(t==="Space"){this.jumpRequest=!0;const e=performance.now();e-this.lastJump<280&&this.mode==="creative"&&(this.body.flying=!this.body.flying,this.scheduleSave()),this.lastJump=e}if(t==="KeyG"&&this.mode==="creative"&&(this.body.flying=!this.body.flying,this.scheduleSave()),t==="KeyF"&&(this.useRequest=!0),t==="KeyQ"&&this.inventory.held&&this.mode!=="spectator"){const e=this.direction(),n=this.body.position;this.entities.drop({...this.inventory.held,count:1},{x:n.x+e.x,y:n.y+1,z:n.z+e.z})&&(this.mode!=="creative"&&this.inventory.consumeHeld(),this.scheduleSave())}}}}async action(t,e,n){this.audio.play("click");const s=e.dataset.id;if(t==="new"){this.ui.create();return}if(t==="create"){const r=document.querySelector("#world-name").value.trim()||"Untitled world",o=document.querySelector("#world-seed").value.trim()||crypto.randomUUID().slice(0,8),a=document.querySelector("#world-mode").value;await this.start(void 0,r,o,a);return}if(t==="load"){const r=this.saves.find(o=>o.id===s);r&&await this.start(await xr(r.id));return}if(t==="menu"){if(this.active){if(!this.inventory.settleCursor()){this.ui.toast("Make room for the held stack first.");return}if(!await this.save())return;this.active=!1,this.input.unlock()}await this.refreshSaves(),this.view.hand.visible=!1,this.view.camera.position.set(46,62,54),this.view.camera.lookAt(0,28,-43);return}if(t==="rename"){const r=this.saves.find(o=>o.id===s);if(r){const o=prompt("World name",r.name);o?.trim()&&(await Mv(r.id,o),await this.refreshSaves())}return}if(t==="delete"){const r=this.saves.find(o=>o.id===s);if(r&&confirm(`Delete “${r.name}”? This cannot be undone. Export it first if you want a backup.`)){this.ui.worldProcessing(r.id,"Deleting world…");try{await yv(r.id),await this.refreshSaves()}catch(o){throw this.ui.worldProcessing(r.id,null),o}}return}if(t==="reset"){const r=this.saves.find(o=>o.id===s);r&&confirm(`Reset “${r.name}” to its original seed? This erases its buildings, inventory and progress.`)&&(await Sv(r.id),await this.refreshSaves(),this.ui.toast("World reset. The city and Panda Plaza are ready again."));return}if(t==="duplicate"){const r=this.saves.find(o=>o.id===s);if(r){this.ui.worldProcessing(r.id,"Duplicating world…");try{const o=await xr(r.id);o.id=crypto.randomUUID(),o.name=`${o.name} (copy)`,o.updated=Date.now(),await yr(o),await this.refreshSaves()}catch(o){throw this.ui.worldProcessing(r.id,null),o}}return}if(t==="export-world"){const r=this.saves.find(o=>o.id===s);r&&Sc(await xr(r.id));return}if(t==="import"){const r=document.createElement("input");r.type="file",r.accept=".json",r.onchange=async()=>{try{const o=r.files?.[0];if(!o)return;if(o.size>32*1024*1024)throw new Error("Save exceeds 32 MB.");const a=Es(JSON.parse(await o.text()));a.id=crypto.randomUUID(),a.updated=Date.now(),await yr(a),await this.refreshSaves(),this.ui.toast("World imported.")}catch(o){this.ui.toast(o instanceof Error?o.message:"Import failed.")}},r.click();return}if(t==="back"){this.backToPreviousScreen();return}if(t==="resume"){this.resume();return}if(t==="save"){await this.save()&&this.ui.toast("Your world is saved.");return}if(t==="export"){Sc(this.snapshot());return}if(t==="settings"){this.returnScreen=this.ui.screen,this.ui.settings(this.settings);return}if(t==="controls"){this.returnScreen=this.ui.screen,this.ui.controls();return}if(t==="fullscreen"){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();return}if(t==="reset-settings"){this.settings={fov:75,sensitivity:4,distance:5,simulationDistance:4,volume:30},this.applySettings(),this.ui.settings(this.settings),this.ui.toast("Settings reset to defaults.");return}if(t==="inventory"||t==="craft"){this.open(t);return}if(t==="category"){this.category=e.dataset.category,this.ui.inventory(this.inventory,this.mode==="creative",this.category,this.query);return}if(t==="hotbar-select"&&this.ui.screen==="inventory"&&this.mode==="creative"){const r=Number(e.dataset.index);if(!Number.isInteger(r)||r<0||r>8)return;this.inventory.selected=r,this.ui.inventory(this.inventory,!0,this.category,this.query),this.scheduleSave();return}if(t==="choose"&&this.mode==="creative"){this.inventory.insertHeld(Number(s)),this.ui.inventory(this.inventory,!0,this.category,this.query),this.scheduleSave();return}if(t==="armor-slot"){this.inventory.equipment.click(Number(e.dataset.index),this.inventory)||this.ui.toast("That item does not fit this equipment slot."),this.ui.inventory(this.inventory,this.mode==="creative",this.category,this.query),this.scheduleSave();return}if(t==="grid-slot"){this.inventory.click(Number(e.dataset.index),n.button===2,this.craftingGrid),this.showCraft(),this.scheduleSave();return}if(t==="grid-output"){const r=this.near(v.Workbench),o=r||this.craftingGrid.slice(4).some(Boolean)?3:2;if(o===3&&!r){this.ui.toast("Stand near a crafting bench.");return}Og(this.craftingGrid,o,this.inventory)&&(this.audio.play("craft"),this.unlockAchievement("Handcrafted","Crafted your first item.")),this.showCraft(),this.scheduleSave();return}if(t==="furnace-slot"){this.furnaceClick(Number(e.dataset.index),n.button===2);return}if(t==="hopper-slot"&&this.stationInReach(v.Hopper)){this.inventory.click(Number(e.dataset.index),n.button===2,this.simulation.automation.hopper(this.containerKey).slots),this.showHopper(),this.scheduleSave();return}if(t==="hopper-direction"&&this.stationInReach(v.Hopper)){const[r,o,a]=this.containerKey.split(",").map(Number),l=this.world.get(r,o,a);this.world.set(r,o,a,oe(v.Hopper,(Kt(l)+1)%5)),this.showHopper();return}if(t==="brew-slot"){this.brewerClick(Number(e.dataset.index),n.button===2);return}if(t==="station-select"&&["enchant","anvil"].includes(this.ui.screen)){const r=Number(e.dataset.index);if(!Number.isInteger(r)||r<0||r>8)return;this.inventory.selected=r,this.showToolStation(this.ui.screen);return}if(t==="enchant"||t==="repair"){const r=t==="enchant"?v.Enchanter:v.Anvil;if(!this.stationInReach(r)){this.ui.toast("Stand within reach of the workstation.");return}const o=t==="enchant"?Rh(this.inventory,this.xp,s):Ch(this.inventory,this.xp);o.ok?(this.xp=o.xp,this.audio.play("craft"),this.scheduleSave()):this.ui.toast("Check the selected item, materials, XP and inscription compatibility."),this.showToolStation(t==="enchant"?"enchant":"anvil");return}if(t==="trade"){const r=Xa[Number(s)];this.tradeEntity&&this.tradeEntity.trades<12&&Math.hypot(this.body.position.x-this.tradeEntity.body.position.x,this.body.position.y-this.tradeEntity.body.position.y,this.body.position.z-this.tradeEntity.body.position.z)<5&&_c(this.tradeEntity).some(o=>o.id===Number(s))&&r&&this.inventory.transaction(r.cost,r.output)?(this.tradeEntity.trades++,this.audio.play("craft"),this.unlockAchievement("A fair exchange","Completed your first trade."),this.scheduleSave()):this.ui.toast("Check your items, inventory space, and daily trade limit."),this.showTrade();return}if(t==="slot"||t==="container-slot"){const r=t==="container-slot"?this.containers[this.containerKey]:void 0,o=Number(e.dataset.index);if(n.shiftKey&&this.ui.screen==="chest"){const a=r??this.inventory.slots,l=r?this.inventory.slots:this.containers[this.containerKey],c=a[o];if(c){const u=new We(l,l.length),h=u.addStack(c);r?this.inventory.slots=u.slots:this.containers[this.containerKey]=u.slots,c.count=h,h||(a[o]=null)}}else this.inventory.click(o,n.button===2,r);this.ui.screen==="craft"?this.showCraft():this.ui.screen==="furnace"?this.showFurnace():this.ui.screen==="brew"?this.showBrewer():this.ui.screen==="hopper"?this.showHopper():this.ui.screen==="chest"?this.ui.container(this.inventory,this.containers[this.containerKey]):this.ui.inventory(this.inventory,this.mode==="creative",this.category,this.query),this.scheduleSave();return}if(t==="make"){const r=Ir.find(o=>o.id===s);r&&(!r.station||this.near(v.Workbench))&&((this.mode==="creative"?this.inventory.add(...r.output)===0:this.inventory.transaction(r.cost,r.output))?(this.audio.play("craft"),this.unlockAchievement("Handcrafted","Crafted your first item."),this.scheduleSave()):this.ui.toast("Not enough ingredients or inventory space."),this.showCraft());return}t==="respawn"&&(this.dead=!1,this.health=this.hunger=20,this.saturation=5,this.exhaustion=0,this.breath=10,this.status=new Is,this.safeSpawn(),this.resume(),this.save())}near(t){const e=this.body.position;for(let n=Math.floor(e.y)-2;n<Math.floor(e.y)+3;n++)for(let s=Math.floor(e.z)-4;s<=Math.floor(e.z)+4;s++)for(let r=Math.floor(e.x)-4;r<=Math.floor(e.x)+4;r++)if(xt(this.world.get(r,n,s))===t&&Math.hypot(r-e.x,s-e.z)<5)return!0;return!1}direction(){return{x:-Math.sin(this.yaw)*Math.cos(this.pitch),y:Math.sin(this.pitch),z:-Math.cos(this.yaw)*Math.cos(this.pitch)}}target(){const t=this.body.position;return this.hit=uh(this.world.get.bind(this.world),{x:t.x,y:t.y+1.61,z:t.z},this.direction(),this.mode==="creative"?7:5,this.inventory.held?.id===v.Water||this.inventory.held?.id===168),this.hit}use(){if(this.cooldown>0||this.mode==="spectator")return;this.cooldown=.22;const t=this.target(),e=this.inventory.held,n=e?Ut(e.id):void 0,s=this.input.keys.has("ControlLeft")||this.input.keys.has("KeyC"),r=this.entities.target({x:this.body.position.x,y:this.body.position.y+1.61,z:this.body.position.z},this.direction(),Math.min(4,t?.distance??4));if(r?.kind==="villager"&&!s){this.tradeEntity=r,this.input.unlock(),this.showTrade();return}if(t&&[168,169,170].includes(e?.id??0)&&this.mode!=="adventure"&&Gh(this.world,this.inventory,t,this.body.position,this.mode==="creative")){this.audio.play("place"),this.scheduleSave();return}if(t&&!s){const h=xt(t.value),d=Ve(t.x,t.y,t.z);if([v.Enchanter,v.Anvil,v.Apothecary].includes(h)){this.containerKey=d,this.input.unlock(),h===v.Apothecary?this.showBrewer():this.showToolStation(h===v.Enchanter?"enchant":"anvil");return}if(h===v.Hopper){this.containerKey=d,this.input.unlock(),this.showHopper();return}if(h===v.Timer){this.world.set(t.x,t.y,t.z,oe(h,Kt(t.value)^2));return}if(h===v.Furnace){this.containerKey=d,this.input.unlock(),this.showFurnace();return}if(h===v.Workbench){this.open("craft");return}if(h===v.Chest){this.containerKey=d,Ro(this.world,d,this.containers),this.input.unlock(),this.ui.container(this.inventory,this.containers[d]);return}if(h===v.Door){const f=Kt(t.value),g=t.y+(f&8?-1:1),_=this.world.get(t.x,g,t.z);this.world.set(t.x,t.y,t.z,oe(h,f^4)),xt(_)===v.Door&&this.world.set(t.x,g,t.z,oe(h,Kt(_)^4)),this.audio.play("place");return}if(h===v.Bed){this.spawn={x:t.x+1.5,y:t.y+.1,z:t.z+.5},this.time>.5?(this.time=.18,this.health=Math.min(20,this.health+4),this.ui.toast("A new morning in Jade Harbor.")):this.ui.toast("Respawn point set. Return at night to sleep."),this.scheduleSave();return}if(h===v.Switch){this.world.set(t.x,t.y,t.z,oe(h,Kt(t.value)^1));return}}if(n?.armorSlot){this.inventory.equipment.equipHeld(this.inventory),this.audio.play("place"),this.scheduleSave();return}if(e&&Qa[e.id]){let h=!1;if(this.mode!=="creative"){const f=new We(this.inventory.slots);if(f.selected=this.inventory.selected,f.consumeHeld(),h=f.add(160)!==0,h&&!this.entities.drop({id:160,count:1},{...this.body.position,y:this.body.position.y+.8})){this.ui.toast("Make room for the empty flask first.");return}}const d=Qa[e.id];if(d==="healing"?this.health=Math.min(20,this.health+6):this.status.apply(d),this.mode!=="creative"&&(this.inventory.consumeHeld(),!h&&this.inventory.add(160)))throw new Error("Reserved flask slot became unavailable.");this.audio.play("eat"),this.scheduleSave();return}if(n?.food&&this.hunger<20){this.hunger=Math.min(20,this.hunger+n.food),this.saturation=Math.min(20,this.saturation+n.food*.6),this.mode!=="creative"&&this.inventory.consumeHeld(),this.audio.play("eat"),this.scheduleSave();return}if(!t||this.mode==="adventure")return;if(n?.tool==="hoe"&&[v.Grass,v.Dirt].includes(xt(t.value))){if(!this.world.set(t.x,t.y,t.z,v.Farmland))return;this.mode!=="creative"&&this.inventory.wear(),this.audio.play("place");return}if(e?.id===107&&xt(t.value)===v.Farmland&&this.world.get(t.x,t.y+1,t.z)===0){if(!this.world.set(t.x,t.y+1,t.z,v.Rice))return;this.mode!=="creative"&&this.inventory.consumeHeld();return}if(!n?.block)return;if(n.block===v.Slab&&xt(t.value)===v.Slab&&!(Kt(t.value)&1)){if(ur(this.body.position,t.x,t.y,t.z,oe(v.Slab,1))||!this.world.set(t.x,t.y,t.z,oe(v.Slab,1)))return;this.mode!=="creative"&&this.inventory.consumeHeld();return}const o=t.x+t.normal.x,a=t.y+t.normal.y,l=t.z+t.normal.z,c=Math.round(this.yaw/(Math.PI/2))&3,u=n.block===v.Stairs||n.block===v.Door?c:n.block===v.Timer?6:0;if(!(a<=ie||a>ge||ur(this.body.position,o,a,l,oe(n.block,u))||this.world.get(o,a,l)!==0&&xt(this.world.get(o,a,l))!==v.Water)&&!(n.block===v.Door&&(a>=ge||this.world.get(o,a+1,l)!==0||ur(this.body.position,o,a+1,l,oe(v.Door,c|8))||!this.world.set(o,a+1,l,oe(v.Door,c|8))))){if(!this.world.set(o,a,l,oe(n.block,u))){n.block===v.Door&&this.world.set(o,a+1,l,v.Air);return}this.mode!=="creative"&&this.inventory.consumeHeld(),this.audio.play("place"),this.unlockAchievement("A place of your own","Placed your first building block.")}}mine(t){if(this.mode==="adventure"||this.mode==="spectator"||!this.hit||!this.input.left){this.mineProgress=0;return}const e=this.hit;if(e.y===ie)return;const n=Ve(e.x,e.y,e.z);n!==this.mineKey&&(this.mineKey=n,this.mineProgress=0);const s=ue(e.value);if([v.Water,v.Lava].includes(s.id)){this.mineProgress=0;return}const r=Ut(this.inventory.held?.id??0),o=r?.tool===s.tool,a=this.mode==="creative"?.12:Math.max(.18,s.hardness*(o?1/((r?.tier??1)*(1+.4*Ue(this.inventory.held,"efficiency"))):1.5));if(this.mineProgress+=t/a,this.mineProgress<1)return;this.mineProgress=0;const l=[],c=this.mode!=="creative"&&(!s.tier||o&&(r?.tier??0)>=s.tier);if(c){const u=Ue(this.inventory.held,"silk"),h=[v.Coal,v.Jade].includes(s.id),d=s.id===v.Rice?Kt(e.value)>=3?108:107:u?s.id:s.drop??s.id;l.push({id:d,count:h&&!u?1+Ue(this.inventory.held,"fortune"):1}),s.id===v.Rice&&Kt(e.value)>=3&&l.push({id:107,count:2})}if(!this.breakContents(e.x,e.y,e.z,l)){this.ui.toast("Nearby item storage is full. Collect some dropped items first.");return}this.world.set(e.x,e.y,e.z,0),this.effects.burst(e,s.color),c&&!Ue(this.inventory.held,"silk")&&[v.Coal,v.Jade].includes(s.id)&&this.xp++,this.mode!=="creative"&&r?.tool&&this.inventory.wear(),this.audio.play("break"),this.unlockAchievement("Groundbreaker","Mined your first block.")}showCraft(){const t=this.near(v.Workbench),e=t||this.craftingGrid.slice(4).some(Boolean)?3:2;this.ui.craft(this.inventory,t,this.mode==="creative",this.craftingGrid,e,dh(this.craftingGrid,e)?.output??null)}stationInReach(t){const[e,n,s]=this.containerKey.split(",").map(Number),r=this.body.position;return[e,n,s].every(Number.isFinite)&&this.world.loaded(e,s)&&xt(this.world.get(e,n,s))===t&&Math.hypot(e+.5-r.x,n+.5-r.y,s+.5-r.z)<5}showToolStation(t){Yh(this.ui,this.inventory,this.xp,t)}showHopper(){const[t,e,n]=this.containerKey.split(",").map(Number),s=this.simulation.automation.hopper(this.containerKey),r=Fh[Kt(this.world.get(t,e,n))%5],o=this.simulation.powered(t,e,n)?"Paused by signal.":"Ready to transfer.",a=this.inventory.cursor?`Holding ${Qt(Ut(this.inventory.cursor.id)?.name)} ×${this.inventory.cursor.count}`:"";this.ui.panel("hopper","A steady flow of supplies.","Pulls from above; pushes one item every 0.4s. A powered neighbor pauses it.",`<button data-action="hopper-direction">Output: ${r} ↻</button><div class="station-slots">${s.slots.map((l,c)=>He(l,c,"hopper-slot")).join("")}</div><p class="form-note">Feed kiln ore from above and fuel from a side. A hopper below collects finished goods. ${o}</p><div class="section-label">YOUR INVENTORY <span>${a}</span></div><div class="slots">${this.inventory.slots.map((l,c)=>He(l,c)).join("")}</div>`)}showBrewer(){const[t,e,n]=this.containerKey.split(",").map(Number);jh(this.ui,this.inventory,this.simulation.brewer(this.containerKey),Ac(this.world,t,e,n))}brewerClick(t,e){if(!this.stationInReach(v.Apothecary)||!Number.isInteger(t)||t<0||t>3)return;const n=this.inventory.cursor;if(n&&(t===0&&n.id!==160||t===1&&!Bi[n.id]||t===2&&n.id!==v.Bamboo||t===3)){this.ui.toast("That item does not belong in this slot.");return}this.inventory.click(t,e,this.simulation.brewer(this.containerKey).slots),this.showBrewer(),this.scheduleSave()}showFurnace(){const t=this.simulation.furnace(this.containerKey);this.ui.panel("furnace","A little heat. A new possibility.","Input on the left · fuel below · collect output on the right",`<div class="station-slots">${t.slots.map((e,n)=>`<div>${He(e,n,"furnace-slot")}<div class="station-slot-label">${["Input","Fuel","Output"][n]}</div></div>`).join("")}</div><div class="station-progress"><div style="width:${t.progress/4*100}%"></div></div><p class="form-note">${t.burn>0?`Burning · ${Math.ceil(t.burn)}s of fuel left`:"Add coal, logs, planks or bamboo for fuel."} · Iron, gold, rice, sand and earth can be processed.</p><div class="section-label">YOUR INVENTORY <span>${this.inventory.cursor?`Holding ${Qt(Ut(this.inventory.cursor.id)?.name)} ×${this.inventory.cursor.count}`:""}</span></div><div class="slots">${this.inventory.slots.map((e,n)=>He(e,n)).join("")}</div>`)}furnaceClick(t,e){if(!this.stationInReach(v.Furnace))return;const n=this.simulation.furnace(this.containerKey),s=this.inventory.cursor;if(s&&(t===0&&!Ra[s.id]||t===1&&!Sr[s.id]||t===2)){this.ui.toast("That item cannot go in this slot.");return}const r=n.slots[2]?.count??0;this.inventory.click(t,e,n.slots),t===2&&(this.xp+=Math.max(0,r-(n.slots[2]?.count??0))),this.showFurnace(),this.scheduleSave()}showTrade(){const t=this.tradeEntity;t&&this.ui.panel("trade",Qt(t.name),`Trade locally grown goods for jade tokens. ${Qt(t.state)} · Offers restock at dawn.`,`<div class="trade-list">${_c(t).map(({offer:e,id:n})=>`<button data-action="trade" data-id="${n}" ${t.trades>=12?"disabled":""}>${ii(e.output[0])}<span>${e.label}</span><span>${e.cost.map(([s,r])=>`${r} ${Ut(s)?.name}`).join(" + ")} → ${e.output[1]}</span></button>`).join("")}</div><p class="form-note">${12-t.trades} trades remaining today · You have ${this.inventory.count(111)} jade tokens.</p>`)}breakContents(t,e,n,s=[]){const r=this.world.get(t,e,n),o=Ve(t,e,n),l=[...xt(r)===v.Chest?Ro(this.world,o,this.containers):this.containers[o]??[],...this.simulation.furnaces[o]?.slots??[],...this.simulation.brewers[o]?.slots??[],...this.simulation.automation.hoppers[o]?.slots??[],...s];if(!this.entities.dropMany(l,{x:t+.5,y:e+.8,z:n+.5}))return!1;if(xt(r)===v.Door){const c=e+(Kt(r)&8?-1:1);xt(this.world.get(t,c,n))===v.Door&&this.world.set(t,c,n,0)}return delete this.containers[o],delete this.simulation.furnaces[o],delete this.simulation.brewers[o],delete this.simulation.automation.hoppers[o],!0}unlockAchievement(t,e){this.achievements.has(t)||(this.achievements.add(t),this.ui.toast(e))}damage(t,e=!1,n=!1){if(!(n&&this.status.has("fire_resistance"))&&!(["creative","spectator"].includes(this.mode)||this.damageCooldown>0||this.dead)){if(e&&(t=this.inventory.equipment.absorb(t,n)),this.health=Math.max(0,this.health-t),this.damageCooldown=.8,this.audio.play("hurt"),this.health<=0)if(this.dead=!0,this.status=new Is,this.mode==="hardcore")this.hardcoreEnded=!0,this.mode="spectator",this.dead=!1,this.body.flying=!0,this.health=20,this.ui.toast("Your one life has ended. This world is now spectator-only.");else{const s=[...this.inventory.slots,...this.inventory.equipment.slots,...this.craftingGrid,this.inventory.cursor];this.entities.dropMany(s,{...this.body.position,y:this.body.position.y+.7})?(this.inventory.slots=Array(36).fill(null),this.inventory.cursor=null,this.inventory.equipment=new Co,this.craftingGrid=Array(9).fill(null)):this.ui.toast("Dropped-item limit reached; your possessions were kept for respawn."),this.xp=Math.floor(this.xp/2),this.showDeath()}this.scheduleSave()}}showDeath(){this.input.unlock(),this.ui.panel("death","Your journey continues.","Return to your resting place. Recover your dropped items where you fell; drops remain for 10 active minutes.",'<button class="primary full" data-action="respawn">Return to Jade Harbor <span>↗</span></button>')}tick(t){this.tickCount++,this.previous={...this.body.position},this.cooldown=Math.max(0,this.cooldown-t),this.damageCooldown=Math.max(0,this.damageCooldown-t),this.attackCooldown=Math.max(0,this.attackCooldown-t),this.hitFlash=Math.max(0,this.hitFlash-t),this.time=(this.time+t/1200)%1;const e=this.input.keys,n=this.body.position,s=this.body.velocity,r=Bh(this.world,n),o=this.mode==="spectator",a=this.body.flying||o;let l=Number(e.has("KeyW"))-Number(e.has("KeyS")),c=Number(e.has("KeyD"))-Number(e.has("KeyA"));const u=Math.hypot(l,c)||1;l/=u,c/=u;const h=e.has("ControlLeft")||e.has("KeyC"),d=Fg(h,e.has("Space"),a,this.crouching,!a&&this.crouching&&en(this.world,n,1.75));this.crouching=d.crouching;const f=this.crouching,g=e.has("ShiftLeft")&&(a||this.hunger>4);let _=a?9:f?2:r?2.6:g?7:4.4;a&&g&&(_=18),this.status.has("speed")&&!a&&(_*=1.25);const m=(-Math.sin(this.yaw)*l+Math.cos(this.yaw)*c)*_,p=(-Math.cos(this.yaw)*l-Math.sin(this.yaw)*c)*_;s.x+=(m-s.x)*Math.min(1,t*12),s.z+=(p-s.z)*Math.min(1,t*12);const S=xt(this.world.get(n.x,n.y,n.z))===v.Ladder;if(a?s.y=d.verticalIntent*_:S?s.y=e.has("Space")||l>0?3:f?0:-1:(s.y=Math.max(r?-4:-38,s.y-(r?5:24)*t),this.jumpRequest&&this.body.grounded&&(s.y=8.2),r&&e.has("Space")&&(s.y=4)),this.jumpRequest=!1,f&&this.body.grounded&&!a)for(const y of["x","z"]){const A={...n,y:n.y-.55};A[y]+=s[y]*t,en(this.world,A,1.45)||(s[y]=0)}const w=Rc(this.world,this.body,t,o,f?1.45:1.75);if(n.y>ge+2&&(n.y=ge+2,s.y=0),o&&n.y<ie+1&&(n.y=ie+1,s.y=0),w>3&&!r&&!a&&this.damage(Math.floor(w-3)),zg(this.mode,n.y,ie)&&(this.damage(20),this.safeSpawn()),xt(this.world.get(n.x,n.y,n.z))===v.Lava&&this.damage(4,!0,!0),this.target(),this.entityHit=this.entities.target({x:n.x,y:n.y+1.61,z:n.z},this.direction(),Math.min(4,this.hit?.distance??4)),(this.input.right||this.useRequest)&&this.cooldown<=0&&(this.useRequest=!1,this.use()),(this.input.left||this.input.leftPressed)&&this.entityHit&&this.mode!=="spectator"){if(this.attackCooldown<=0){const y=Ut(this.inventory.held?.id??0),A=this.entityHit,R=(y?.damage??1)+Ue(this.inventory.held,"sharpness")+(this.status.has("strength")?3:0),P=this.body.position;if(Sa(this.world,P,A.body.position,1.61,A.kind==="panda"?.75:1.15)){const b=this.entities.applyHit(A,R,this.direction());b.status==="killed"?(this.xp+=3,this.hitMessage=`${A.name} defeated · +3 XP`):b.status==="hit"?this.hitMessage=`${A.name} · −${b.damage} HP`:b.status==="blocked"&&this.ui.toast("Dropped-item limit reached. Collect nearby loot first."),(b.status==="hit"||b.status==="killed")&&(this.hitFlash=.42,this.mode!=="creative"&&this.inventory.wear()&&(this.ui.toast(`${y?.name??"Item"} broke.`),this.audio.play("break")),this.audio.play("hurt"),this.scheduleSave())}this.attackCooldown=.5}}else this.mine(t);if(this.input.leftPressed=!1,this.simulation.radius=this.settings.simulationDistance*16,this.entities.radius=this.settings.simulationDistance*16,this.simulation.automation.containers=this.containers,this.simulation.automation.drops=this.entities.drops,this.simulation.occupants=[...this.entities.list.filter(y=>y.health>0).map(y=>y.body.position),...this.entities.drops.map(y=>y.position)],this.simulation.tick(t,n,this.mode!=="spectator"),this.entities.interactingId=this.ui.screen==="trade"?this.tradeEntity?.id??"":"",this.entities.tick(t,n,this.inventory,this.time,!["creative","spectator"].includes(this.mode),y=>this.damage(y,!0),()=>{this.audio.play("pickup"),this.scheduleSave()},this.mode!=="spectator"),this.ui.screen==="brew"&&this.tickCount%10===0&&this.showBrewer(),this.ui.screen==="hopper"&&this.tickCount%10===0&&this.showHopper(),this.health=this.status.tick(t,this.health,["creative","spectator"].includes(this.mode)),this.ui.screen==="furnace"&&this.tickCount%10===0&&this.showFurnace(),xt(this.world.get(n.x,n.y+1.6,n.z))===v.Water?(this.breath=Math.max(0,this.breath-t),this.breath<=0&&this.damage(2)):this.breath=10,(l||c)&&this.body.grounded&&(this.lastStep+=t,this.lastStep>.4&&(this.audio.play("step"),this.lastStep=0)),!["creative","spectator"].includes(this.mode)){for(this.exhaustion+=t*(l||c?g?.4:.2:.05);this.exhaustion>=4;)this.exhaustion-=4,this.saturation>0?this.saturation=Math.max(0,this.saturation-1):this.hunger=Math.max(0,this.hunger-1);this.tickCount%80===0&&(this.hunger>=16&&this.health<20&&(this.health=Math.min(20,this.health+1),this.exhaustion=Math.min(3.99,this.exhaustion+1)),this.hunger<=0&&this.damage(1))}}frame(t){const e=this.lastTime?t-this.lastTime:0;e&&this.view.metrics.add("frame",e);const n=Math.min(.2,e/1e3);this.lastTime=t,this.frameCount++,t-this.fpsTime>1e3&&(this.fps=Math.round(this.frameCount*1e3/(t-this.fpsTime)),this.frameCount=0,this.fpsTime=t);const s=this.body.position;for(const r of this.world.stream(this.active?s.x:0,this.active?s.z:0,this.settings.distance,this.yaw))this.view.remove(r);if(this.view.rebuild(this.world,6),this.active&&["none","inventory","craft","chest","furnace","trade","enchant","brew","anvil","hopper"].includes(this.ui.screen)&&!this.dead){for(this.accumulator+=n;this.accumulator>=.05;){const o=performance.now();this.tick(.05),this.view.metrics.add("tick",performance.now()-o),this.accumulator-=.05}const r=this.accumulator/.05;this.view.camera.position.set(this.previous.x+(s.x-this.previous.x)*r,this.previous.y+(s.y-this.previous.y)*r+(this.crouching?1.27:1.61),this.previous.z+(s.z-this.previous.z)*r),this.view.camera.rotation.set(this.pitch,this.yaw,0,"YXZ")}else this.accumulator=0;if(this.active){this.view.target(this.ui.screen==="none"?this.hit:null),this.view.setHeldItem(this.inventory.held?.id??null),this.view.hand.visible=this.ui.screen==="none"&&this.mode!=="spectator";const r=Math.sin(t*.0027),o=this.input.left?Math.sin(t*.022)*.18:0;if(this.view.hand.rotation.x=-.12-o+r*.012,this.view.hand.rotation.z=-.26+Math.sin(t*.0021)*.01,this.view.hand.position.y=-.64+r*.005,this.view.environment(this.time,this.simulation.weather==="rain",this.status.has("night_vision")),this.entityView.update(this.entities,t/1e3),this.effects.update(n,s,this.simulation.weather==="rain",t/1e3),this.lighting.pending||t-this.lastLighting>1200&&this.world.pending.size===0){this.lighting.pending||(this.lastLighting=t);const a=performance.now();this.lighting.update(4),this.view.metrics.add("lighting",performance.now()-a)}if(t-this.lastHud>120){this.lastHud=t;const a=Math.floor((this.time*24+6)%24),l=Math.floor(this.time*1440%60);this.ui.updateHUD(this.inventory,{name:this.meta.name,mode:this.mode,biome:Lo(s.x,s.z,Aa(this.meta.seed)),x:Math.floor(s.x),y:Math.floor(s.y),z:Math.floor(s.z),time:`${a.toString().padStart(2,"0")}:${l.toString().padStart(2,"0")}`,target:this.entityHit?`${this.entityHit.name} · ${Math.max(0,Math.ceil(this.entityHit.health))} / ${this.entityHit.kind==="spirit"?16:20} HP`:this.hit?ue(this.hit.value).name:"",health:this.health,hunger:this.hunger,xp:this.xp,breath:this.breath,effects:this.status.list.map(c=>`${gs[c.id].name} ${Math.ceil(c.remaining)}s`).join(" · "),flying:this.body.flying,progress:this.mineProgress,hitFlash:this.hitFlash>0,hitMessage:this.hitFlash>0?this.hitMessage:"",debug:this.debug?`${this.fps} FPS · target 20 TPS
Frame p50/p95 ${this.view.metrics.summary("frame").p50.toFixed(1)}/${this.view.metrics.summary("frame").p95.toFixed(1)} ms · tick p95 ${this.view.metrics.summary("tick").p95.toFixed(1)} ms
${this.world.chunks.size} chunks · ${this.world.pending.size} generating · ${this.world.dirty.size} mesh queue
${this.view.renderer.info.render.triangles} triangles · ${this.view.renderer.info.render.calls} draws · ${this.view.renderer.info.memory.geometries} geometries
${this.entities.list.length} entities · ${this.world.evictionBlocked} pinned unsaved chunks
CPU block arrays ~${([...this.world.chunks.values()].reduce((c,u)=>c+u.blocks.byteLength,0)/1048576).toFixed(1)} MiB (excludes GPU/heap)
${this.world.edits.size} edits · save rev ${this.saveRevision} · ${this.meta.seed}`:""})}t-this.lastAuto>8e3&&(this.lastAuto=t,this.save())}else if(this.view.target(null),this.view.environment(.23),this.entityView.update(this.entities,t/1e3),this.lighting.pending||t-this.lastLighting>2e3&&this.world.pending.size===0){this.lighting.pending||(this.lastLighting=t);const r=performance.now();this.lighting.update(4),this.view.metrics.add("lighting",performance.now()-r)}this.view.render(),requestAnimationFrame(r=>this.frame(r))}}const wa=document.querySelector("#app");if(!wa)throw new Error("Jade Harbor root element #app is missing.");try{const i=new Ev(wa)}catch(i){wa.innerHTML='<main class="fatal-error"><h1>Jade Harbor needs WebGL 2.</h1><p>Enable graphics acceleration in your browser, then reload. Try a recent Chrome, Edge or Firefox on a desktop computer.</p></main>',console.error(i)}
