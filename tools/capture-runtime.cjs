#!/usr/bin/env node
// Optional Playwright-based capture; run from the repository root after making the probe.
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
let chromium;
try { ({chromium}=require('playwright')); }
catch { console.error('Install Playwright separately to use this optional capture tool.'); process.exit(1); }
const output=process.argv[2];
if(!output){console.error('Usage: node tools/capture-runtime.cjs OUTPUT.json');process.exit(1);}
const root=process.cwd();
const timeoutMs=Number(process.env.FEUDALISM_CAPTURE_TIMEOUT_MS||180000);
if(!Number.isFinite(timeoutMs)||timeoutMs<1000||timeoutMs>3600000){console.error('Invalid FEUDALISM_CAPTURE_TIMEOUT_MS (1000–3600000)');process.exit(1);}
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',file.endsWith('.wasm')?'application/wasm':file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');
  fs.createReadStream(file).on('error',()=>{if(!res.headersSent)res.writeHead(404);res.end();}).pipe(res);
 });
 let browser;
 try {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const options={headless:true,timeout:20000,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
  if(process.env.FEUDALISM_BROWSER_PATH)options.executablePath=process.env.FEUDALISM_BROWSER_PATH;
  browser=await chromium.launch(options);
  const page=await browser.newPage({locale:'en-US'});
  page.on('pageerror',error=>console.error('Page error:',error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/reference/replay/index.html`,{timeout:15000});
  await page.click('#start',{timeout:15000});
  await page.waitForFunction(()=>lines.some(line=>line.startsWith('DONE|')),null,{timeout:timeoutMs});
  const result=await page.evaluate(()=>({runtime:'Ruffle 0.7.1',lines:lines.slice()}));
  fs.writeFileSync(output,JSON.stringify(result,null,2));
  console.log(`Saved ${result.lines.length} trace lines to ${output}`);
 } catch(error){console.error('Capture failed:',error.message);process.exitCode=1;}
 finally {if(browser)await browser.close();server.close();}
})();
