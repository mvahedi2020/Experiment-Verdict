import {test,expect} from '@playwright/test';
type DocumentEntry={tables?:number;source:string;label:string;href:string;title:string;headings:{level:number;title:string;id:string}[]};
type Manifest={repo:string;title:string;documents:DocumentEntry[]};
const appRoutes:Record<string,string>={'Asana-Agent':'#case-study','Metric-Dashboard':'#case-study','Resource-Radar':'#about','Launch-Control':'#about','Feedback-Nexus':'#method'};

test('app documentation opens a readable page and returns to the demo',async({page})=>{
 const response=await page.request.get('docs/reader-manifest.json');expect(response.ok()).toBe(true);const manifest=await response.json() as Manifest;
 await page.goto('./'+(appRoutes[manifest.repo]??''));
 const link=page.locator('a[href*="docs/"][href$=".html"]').first();await expect(link).toBeVisible();await link.click();
 await expect(page.locator('article.prose h1')).toBeVisible();await expect(page.locator('body > pre')).toHaveCount(0);
 await page.locator('.document-menu summary').click();
 await page.getByRole('navigation',{name:'Project documents',exact:true}).getByRole('link',{name:'Sample walkthrough',exact:true}).click();
 await expect(page.locator('article.prose h1')).toBeVisible();
 const walkthrough=manifest.documents.find(d=>d.label==='Sample walkthrough')!;expect(new URL(page.url()).pathname).toBe(new URL(walkthrough.href,page.url()).pathname);
 await expect(page.getByRole('link',{name:'← Back to demo',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'← Back to demo',exact:true}).click();
 expect(new URL(page.url()).pathname).toBe('/'+manifest.repo+'/');await expect(page.locator('main')).toBeVisible();
});

test('every generated document and internal reader link resolves with its section anchors',async({page})=>{
 const response=await page.request.get('docs/reader-manifest.json');const manifest=await response.json() as Manifest;expect(manifest.documents.length).toBeGreaterThanOrEqual(7);
 await page.goto('docs/index.html');const htmlByPath:Record<string,string>={};
 for(const doc of manifest.documents){const r=await page.request.get(doc.href);expect(r.status(),doc.href).toBe(200);expect(r.headers()['content-type']).toContain('text/html');htmlByPath[new URL(doc.href,page.url()).pathname]=await r.text();}
 const result=await page.evaluate(({docs,htmlByPath,base})=>{
  const errors:string[]=[];const parsed:Record<string,Document>={};for(const [path,html] of Object.entries(htmlByPath))parsed[path]=new DOMParser().parseFromString(html,'text/html');
  for(const entry of docs){const u=new URL(entry.href,base),dom=parsed[u.pathname];if(dom.querySelectorAll('article.prose h1').length!==1)errors.push(entry.source+': missing unique article title');
   if(!dom.querySelector('link[href$="reader.css"]'))errors.push(entry.source+': no reading style');
   if(dom.querySelector('[style]'))errors.push(entry.source+': inline style incompatible with reader security policy');
   for(const a of dom.querySelectorAll('a[href]')){const url=new URL(a.getAttribute('href')!,u);if(url.origin!==u.origin)continue;
    if(url.pathname.endsWith('.md'))errors.push(entry.source+': raw internal Markdown link '+url.pathname);
    const target=parsed[url.pathname];if(url.pathname.endsWith('.html')&&!target&&!url.pathname.endsWith('/docs/index.html'))errors.push(entry.source+': missing internal reader '+url.pathname);
    if(target&&url.hash&&!target.getElementById(decodeURIComponent(url.hash.slice(1))))errors.push(entry.source+': missing anchor '+url.hash);
   }
  }return errors;
 },{docs:manifest.documents,htmlByPath,base:page.url()});
 expect(result).toEqual([]);
});

for(const width of [320,1280])test(`case study and walkthrough remain readable at ${width}px`,async({page})=>{
 const faults:string[]=[];page.on('pageerror',e=>faults.push(e.message));page.on('console',m=>{if(m.type()==='error')faults.push(m.text())});
 await page.setViewportSize({width,height:800});const manifest=await (await page.request.get('docs/reader-manifest.json')).json() as Manifest;
 for(const label of ['Product case study','Sample walkthrough']){const doc=manifest.documents.find(d=>d.label===label);expect(doc).toBeTruthy();await page.goto(doc!.href);await expect(page.locator('article.prose h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const typography=await page.locator('.prose').evaluate(el=>{const css=getComputedStyle(el);return {size:parseFloat(css.fontSize),line:parseFloat(css.lineHeight),font:css.fontFamily,scheme:getComputedStyle(document.documentElement).colorScheme};});
  expect(typography.size).toBeGreaterThanOrEqual(16);expect(typography.line/typography.size).toBeGreaterThanOrEqual(1.5);expect(typography.scheme).toBe('light');expect(typography.font).not.toContain('monospace');
  await page.getByRole('link',{name:'← Back to demo',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeVisible();
 }
 const tableDoc=manifest.documents.find(d=>(d.tables??0)>0);
 if(tableDoc){await page.goto(tableDoc.href);const region=page.locator('.table-scroll').first();await expect(region).toBeVisible();await region.focus();
  const bounds=await region.evaluate(el=>({available:el.clientWidth,content:el.scrollWidth}));expect(bounds.available).toBeLessThanOrEqual(width);if(width===320)expect(bounds.content).toBeGreaterThan(bounds.available);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 }
 expect(faults).toEqual([]);
});
