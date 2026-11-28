/* Insert Agentic motion library. Dependency-free Web Animations API.
   Timings in milliseconds. Targets: stage, shell, layers[], focus, overlay, nodes[], beam, waveform[].
   Original reference is one six-second loop; A01-A03 and A06-A09 derive from the reference; A04/A05 and B-series are new proposals. */
(function(root){
const E='cubic-bezier(.22,.8,.25,1)', IO='cubic-bezier(.65,0,.35,1)';
const flat='rotateX(0deg) rotateY(0deg) rotateZ(0deg)', tilt='rotateX(55deg) rotateY(0deg) rotateZ(0deg)', iso='rotateX(55deg) rotateY(-42deg) rotateZ(0deg)', drift='rotateX(55deg) rotateY(-36deg) rotateZ(0deg)';
const z=n=>`translateZ(${n}px)`, xyz=(x,y,d)=>`translate3d(${x}px,${y}px,${d}px)`;
const defs=[
['A01','Backward tilt','Reference','Whole interface tilts from front-on to 55° backward.',1600],
['A02','Isometric rotation','Reference','Already tilted stage turns sideways to −42°.',1600],
['A03','Exploded layers','Reference','All layers rise simultaneously to distinct depths.',1800],
['A04','Staggered side-entry','Extension','Flat dashboard cards enter from alternating sides, one at a time. No Z-axis lift.',2400],
['A05','3D card flip','Extension','One agent card flips 180 degrees to reveal its reverse side and details.',2200],
['A06','Camera drift','Reference','Hold separated layers while rotating from −42° to −36°.',2700],
['A07','Layer collapse','Reference','Reassemble from bottom to top with 60 ms stagger.',1500],
['A08','Flat restoration','Reference','Reassembled stage turns from perspective to front-on.',1500],
['A09','Full cinematic loop','Reference reconstruction','Six-second combination of tilt, lift, drift, collapse and return.',6000],
['B01','Hero card lift','Extension','One primary card rises; surrounding UI stays grounded.',1800],
['B02','Card fly-in','Extension','A new card travels in from the right, decelerating into its slot.',1700],
['B03','Depth carousel','Extension','Cards fan laterally with distinct rotation and depth.',2200],
['B04','Conversation cascade','Extension','Message bubbles appear in a sequential chat exchange.',2300],
['B05','Voice waveform','Extension','A sequence of bars pulses to suggest an active call.',2200],
['B06','Booking confirmation','Extension','Confirmation card rises and a check appears.',1900],
['B07','Job status transfer','Extension','One card travels between two workflow columns.',2200],
['B08','Metric count-up','Extension','An illustrative counter increases from 0 to 24.',1800],
['B09','Content fan-out','Extension','Three content tiles spread from a common centre.',2100],
['B10','Agent network activation','Extension','A hub and three nodes activate with connecting lines.',2500],
['B11','Scan and highlight','Extension','A scan beam sweeps across the interface and highlights one card.',2200],
['B12','CTA reveal','Extension','The stage recedes while a call-to-action appears.',2000]
].map(([id,name,source,description,duration])=>({id,name,source,description,duration}));
function createMotion(id,t){
const def=defs.find(a=>a.id===id); if(!def)throw Error('Unknown motion '+id);
const animations=[], D=def.duration, layers=t.layers||[], depth=[46,92,138,184,230];
const track=(el,frames,opts={})=>{if(!el)return; const a=el.animate(frames,{duration:D,fill:'both',easing:'linear',...opts});a.pause();a.currentTime=0;animations.push(a);};
const tr=(el,values,opts={})=>track(el,values.map(v=>typeof v==='string'?{transform:v}:v),opts);
const stage=(a,b,opts={})=>tr(t.stage,[a,b],{easing:IO,...opts});
const stack=()=>stage(iso,iso);
const layer=(i,a,b,opts={})=>tr(layers[i],[a,b],{easing:E,...opts});
const reveal=(el,delay=0,duration=650)=>track(el,[{opacity:0,transform:'translateY(16px) scale(.92)'},{opacity:1,transform:'translateY(0) scale(1)'}],{delay,duration,easing:E});
let tick=()=>{};
switch(id){
case 'A01':stage(flat,tilt);break;
case 'A02':stage(tilt,iso);break;
case 'A03':stack();layers.forEach((_,i)=>layer(i,z(0),z(depth[i]||230),{duration:1300}));break;
case 'A04':stage(flat,flat);[...layers].reverse().forEach((el,i)=>tr(el,[{opacity:0,transform:xyz(i%2?110:-110,0,0)},{opacity:1,transform:xyz(0,0,0)}],{delay:i*340,duration:700,easing:E}));break;
case 'A05':stage(flat,flat);tr(t.focus,[{transform:'rotateY(0deg)',offset:0},{transform:'rotateY(0deg)',offset:.18,easing:IO},{transform:'rotateY(180deg)',offset:.82},{transform:'rotateY(180deg)',offset:1}]);break;
case 'A06':stage(iso,drift);layers.forEach((_,i)=>layer(i,z(depth[i]||230),z(depth[i]||230)));break;
case 'A07':stack();layers.forEach((_,i)=>layer(i,z(depth[i]||230),z(0),{delay:i*60,duration:900,easing:IO}));break;
case 'A08':stage(iso,flat);break;
case 'A09':
tr(t.stage,[{transform:flat,offset:0},{transform:flat,offset:.1,easing:IO},{transform:iso,offset:.3},{transform:drift,offset:.75,easing:IO},{transform:flat,offset:.95},{transform:flat,offset:1}]);
layers.forEach((_,i)=>{const start=(1150+i*70)/6000,end=(1950+i*70)/6000,down=(3750+i*60)/6000,finish=(4650+i*60)/6000;tr(layers[i],[{transform:z(0),offset:0},{transform:z(0),offset:start,easing:E},{transform:z(depth[i]||230),offset:end},{transform:z(depth[i]||230),offset:down,easing:IO},{transform:z(0),offset:finish},{transform:z(0),offset:1}]);});break;
case 'B01':stage('rotateX(12deg) rotateY(-13deg)','rotateX(12deg) rotateY(-13deg)');tr(t.focus,[z(0),z(125)+' scale(1.06)'],{duration:1050,easing:E});break;
case 'B02':tr(t.focus,[{opacity:0,transform:xyz(210,0,70)+' rotateY(-24deg)'},{opacity:1,transform:xyz(0,0,0)+' rotateY(0deg)'}],{duration:1100,easing:E});break;
case 'B03':stage('rotateX(18deg) rotateY(0deg)','rotateX(18deg) rotateY(0deg)');[0,1,2].forEach((i)=>tr(t.nodes?.[i],[xyz(0,0,0),xyz((i-1)*140,Math.abs(i-1)*18,i===1?105:35)+` rotateY(${(i-1)*-28}deg)`],{duration:1400,easing:E}));break;
case 'B04':(t.nodes||[]).forEach((el,i)=>reveal(el,i*420,550));break;
case 'B05':(t.waveform||[]).forEach((el,i)=>track(el,[{transform:'scaleY(.25)'},{transform:`scaleY(${.5+(i%5)*.19})`},{transform:'scaleY(.3)'},{transform:`scaleY(${.45+((i+2)%5)*.17})`},{transform:'scaleY(.25)'}],{duration:850,delay:i*30,iterations:2,easing:IO}));break;
case 'B06':reveal(t.focus,200,700);reveal(t.overlay,900,500);break;
case 'B07':tr(t.focus,[{transform:xyz(0,0,0),offset:0},{transform:xyz(0,-20,75),offset:.3},{transform:xyz(165,-20,75),offset:.75},{transform:xyz(165,0,0),offset:1}],{duration:1800,easing:IO});reveal(t.overlay,1550,500);break;
case 'B08':tick=ms=>{if(t.counter)t.counter.textContent=Math.round(24*(1-Math.pow(1-Math.min(1,ms/1450),3)));};break;
case 'B09':(t.nodes||[]).forEach((el,i)=>tr(el,[{opacity:i===1?1:0,transform:xyz(0,0,0)},{opacity:1,transform:xyz((i-1)*128,Math.abs(i-1)*25,Math.abs(i-1)*25)+` rotateZ(${(i-1)*12}deg)`}],{delay:i*100,duration:1200,easing:E}));break;
case 'B10':reveal(t.focus,0,450);track(t.beam,[{opacity:0,transform:'scale(.2)'},{opacity:1,transform:'scale(1)'}],{delay:400,duration:800,easing:E});(t.nodes||[]).forEach((el,i)=>reveal(el,650+i*300,550));break;
case 'B11':tr(t.beam,[{opacity:0,transform:'translateY(0)'},{opacity:1,transform:'translateY(0)'},{opacity:1,transform:'translateY(210px)'},{opacity:0,transform:'translateY(210px)'}],{duration:1500});track(t.focus,[{boxShadow:'0 0 0 0 #8b5cf600'},{boxShadow:'0 0 0 4px #8b5cf660,0 0 40px #8b5cf655'}],{delay:1000,duration:700});break;
case 'B12':track(t.stage,[{opacity:1,transform:flat},{opacity:.14,transform:'translateZ(-180px) scale(.8) rotateX(15deg)'}],{duration:1000,easing:IO});reveal(t.overlay,700,700);break;
}
return {duration:D,animations,seek(ms){ms=Math.max(0,Math.min(D,ms));animations.forEach(a=>a.currentTime=ms);tick(ms)},destroy(){animations.forEach(a=>a.cancel())}};
}
root.InsertMotion={definitions:defs,createMotion};
})(typeof window!=='undefined'?window:globalThis);

