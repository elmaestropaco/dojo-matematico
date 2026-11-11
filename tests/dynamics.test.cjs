const assert=require('node:assert/strict');
const dyn=require('../dinamica.js');
assert.equal(dyn.options().progressiveEnabled,false);assert.equal(dyn.options().teamsEnabled,false);
assert.deepEqual(Array.from({length:12},(_,i)=>dyn.indexTier(i)),[1,1,1,1,1,2,2,2,2,2,3,3]);
const p={};for(let i=0;i<3;i++)dyn.outcome(p,'correct');assert.equal(p.progressLevel,2);
dyn.outcome(p,'correct',true);assert.equal(p.progressClean,0);dyn.outcome(p,'wrong');dyn.outcome(p,'wrong');assert.equal(p.progressLevel,1);
for(let i=0;i<30;i++)dyn.outcome(p,'correct');assert.equal(p.progressLevel,3);for(let i=0;i<30;i++)dyn.outcome(p,'wrong');assert.equal(p.progressLevel,1);
const cfg={enabled:true,digits:2,spaceUnit:0};assert.deepEqual(dyn.calculation(cfg,3,{digits:3}),{settings:{enabled:true,digits:3,spaceUnit:0},tier:2});assert.equal(cfg.digits,2);
assert.equal(dyn.calculation({digits:9},3,{digits:9}).tier,1);assert.equal(dyn.calculation({angleType:1},3).tier,1);
assert.deepEqual(dyn.problem({_family:'fracciones',_fractionNumerator:1,_fractionDenominator:2},3),{settings:{_family:'fracciones',_fractionNumerator:3,_fractionDenominator:3},tier:3});
const ranges={_family:'enteros',suma:{enabled:true,minDigits:1,maxDigits:2},resta:{enabled:false,minDigits:1,maxDigits:1}};const advanced=dyn.problem(ranges,3);assert.equal(advanced.settings.suma.minDigits,3);assert.equal(advanced.settings.suma.maxDigits,4);assert.equal(advanced.settings.resta.minDigits,1);
for(const family of ['horarios','datos','estadistica','investigacion'])assert.equal(dyn.problem({_family:family,_literacyLevel:2},3).tier,2);
assert.equal(dyn.elapsed({startedAt:1000,pausedAt:6000,pausedTotal:2000},100000),3000);
assert.equal(dyn.elapsed({startedAt:1000,pausedTotal:5000},12000),6000);
assert.equal(dyn.elapsed({startedAt:12000},1000),0);
for(let size=0;size<=100;size++)for(let count=2;count<=4;count++){
  const players=Object.fromEntries(Array.from({length:size},(_,i)=>['p'+i,{name:'Ninja '+i,isConnected:true}]));
  const assignments=dyn.assign(players,count),sizes=Array(count).fill(0);Object.values(assignments).forEach(i=>sizes[i]++);assert.ok(Math.max(...sizes)-Math.min(...sizes)<=1);
  assert.deepEqual(dyn.assign(players,count,assignments),assignments);
  players.late={name:'Ultimo',isConnected:true};const next=dyn.assign(players,count,assignments);for(const [id,team]of Object.entries(assignments))assert.equal(next[id],team);
}
const room={players:{a:{name:'Ana 🥷',score:100,correctCount:10},b:{name:'B',score:50,correctCount:5},c:{name:'C',score:50,correctCount:5},d:{name:'Fuera',isConnected:false,score:0}}};
const teams=dyn.standings(room,{teamsEnabled:true,teamCount:2,teamAssignments:{a:0,b:1,c:1,d:0}});assert.equal(teams[0].id,0);assert.equal(teams[0].average,100);assert.equal(teams[1].average,50);assert.equal(teams[0].members.length,1);assert.equal(teams[0].members[0].name,'Ana 🥷');
room.players.b.isConnected=false;assert.equal(dyn.standings(room,{teamCount:2,teamAssignments:{a:0,b:1,c:1}})[1].total,100);
console.log('OK: adaptive levels, common competition tiers, ceilings, settings immutability, pause arithmetic, balanced teams up to 100 players, late joins and fair average rankings.');
