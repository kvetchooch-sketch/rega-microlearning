// Generates the app's simple geometric brand mark, not a raster illustration.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PNG}=require('pngjs');
for(const size of [192,512]){
 const p=new PNG({width:size,height:size});
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,d=Math.hypot(u-.5,v-.5),dot=Math.hypot(u-.66,v-.34);
  const color=dot<.075?[202,250,121]:(d>.19&&d<.26)?[255,255,255]:[81,57,223];
  const i=(y*size+x)*4;p.data[i]=color[0];p.data[i+1]=color[1];p.data[i+2]=color[2];p.data[i+3]=255;
 }
 await fs.writeFile(new URL('../dist/icon-'+size+'.png',import.meta.url),PNG.sync.write(p));
}
console.log('Created home-screen app icons (192px and 512px).');
