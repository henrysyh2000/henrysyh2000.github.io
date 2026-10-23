// Prepare the website's English-only UI; preserve every SVG path and model value.
// The Obsidian bilingual original and bilingual source runtime stay unchanged.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const file=process.argv[2] || 'assets/gti/ea888-pistons.html';
const original=readFileSync(file,'utf8');
if(original.includes('data-public-language="en"')){console.log('Public figure is already English-only.');process.exit(0)}
const live=readFileSync(fileURLToPath(new URL('./live.js',import.meta.url)),'utf8');
const dictionary=live.split('\n').find(line=>line.startsWith('const text='));
assert.ok(dictionary && original.includes(dictionary));
const english=vm.runInNewContext(dictionary+';text.en',Object.create(null),{timeout:1000});
const selector="lang=query.get('lang')==='en'?'en':'zh'";
assert.ok(original.includes(selector));
let output=original.replace(dictionary,'const text={en:'+JSON.stringify(english)+'};').replace(selector,"lang='en'");
output=output.replace('<html lang="zh-CN">','<html lang="en" data-public-language="en">').replace('<a data-lang>','<a data-lang hidden aria-hidden="true">');
const substitutions={
 'EA888 · 活塞与曲柄连杆机构':'EA888 · Pistons and slider-crank mechanism',
 '往复与旋转之间':english.title,
 '活塞 · 连杆 · 曲轴':english.sub,
 '剖层 / Section':'Section',
 '01 · 活塞':'01 · Piston','02 · 环组':'02 · Rings','03 · 活塞销':'03 · Wrist pin','04 · 连杆':'04 · Rod','05 · 曲轴':'05 · Crankshaft',
};
for(const [from,to] of Object.entries(substitutions))output=output.split(from).join(to);
const svgs=s=>[...s.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(m=>m[0]);
assert.deepEqual(svgs(original),svgs(output),'Language preparation must not change artwork or geometry');
assert.ok(output.includes('data-public-language="en"') && output.includes("lang='en'"));
writeFileSync(file,output);
console.log('Prepared English-only website figure; '+svgs(output).length+' SVG drawings unchanged.');
