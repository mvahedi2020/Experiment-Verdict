/* global process, console */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, URL } from 'node:url';
import MarkdownIt from 'markdown-it';
import GithubSlugger from 'github-slugger';

const projects = new Set(['First-Mile','Program-Atlas','Relevance-Studio','Review-Room','Findability-Lab','Package-Forge','Return-Path','Renewal-Compass','Experiment-Verdict','Outcome-Ledger','Asana-Agent','Feedback-Nexus','Metric-Dashboard','Resource-Radar','Launch-Control']);
const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const urlPath = value => value.split('/').map(encodeURIComponent).join('/');
const labels = {'Case_Study':'Product case study','Sample_Walkthrough':'Sample walkthrough','Sample Walkthrough':'Sample walkthrough','Product_Brief':'Product brief','PRD':'Requirements','Decisions_and_Risks':'Decisions and risks','Validation':'Evidence and limits','Discovery_Plan':'Discovery plan','Discovery Plan':'Discovery plan','Product_Decisions':'Product decisions','Product Decisions':'Product decisions','Product_Risks':'Product risks','Product Risks':'Product risks','GTM_Strategy':'Commercial hypotheses','AI_Evaluation':'AI evaluation','Measures':'Measures','Measurement_Plan':'Measurement plan','Measurement Plan':'Measurement plan','Sprint_Backlog':'Product backlog','Control_Matrix':'Control matrix'};
export const documentLabel = rel => labels[path.posix.basename(rel,'.md')] ?? path.posix.basename(rel,'.md').replaceAll('_',' ');

export function readingLink(href, current, repo) {
  if (!href || href.startsWith('#') || /^(mailto:|tel:)/i.test(href)) return href;
  const github = href.match(/^https:\/\/github\.com\/mvahedi2020\/([^/]+)\/blob\/main\/(docs\/[^?#]+\.md)([?#].*)?$/i);
  if (github && (github[1] === repo || projects.has(github[1]))) return `${github[1] === repo ? '' : 'https://mvahedi2020.github.io'}/${github[1]}/${github[2].replace(/\.md$/i,'.html')}${github[3] ?? ''}`;
  const base = `https://mvahedi2020.github.io/${repo}/`;
  let url;
  try { url = new URL(href, base + urlPath(current)); } catch { return href; }
  if (!url.href.startsWith(base) || !/\.md$/i.test(url.pathname)) return href;
  const rel = decodeURIComponent(url.pathname.slice(new URL(base).pathname.length));
  if (rel.startsWith('docs/')) return `/${repo}/` + urlPath(rel.replace(/\.md$/i,'.html')) + url.search + url.hash;
  return `https://github.com/mvahedi2020/${repo}/blob/main/${urlPath(rel)}${url.search}${url.hash}`;
}

export function renderMarkdown(source, current, repo) {
  const md = new MarkdownIt({html:false,linkify:true,typographer:false});
  const tokens = md.parse(source,{}), slugger = new GithubSlugger(), headings = [];
  const plain = token => (token.children ?? []).map(child => ['text','code_inline','image'].includes(child.type) ? child.content : ['softbreak','hardbreak'].includes(child.type) ? ' ' : '').join('');
  let hasTitle=false, sectionOffset=0;
  for (let i=0; i<tokens.length; i++) {
    if (tokens[i].type === 'heading_open') {
      const title=plain(tokens[i+1]), id=slugger.slug(title);
      const originalLevel=Number(tokens[i].tag.slice(1));
      if (originalLevel===1) { if (hasTitle) sectionOffset=1; else hasTitle=true; }
      const level=Math.min(6,originalLevel+sectionOffset);
      tokens[i].tag=`h${level}`;if(tokens[i+2]?.type==='heading_close')tokens[i+2].tag=`h${level}`;
      tokens[i].attrSet('id',id);headings.push({level,title,id});
    }
  }
  const rewrite = list => { for (const token of list) {
    const alignment=token.attrGet('style')?.match(/^text-align:\s*(left|center|right);?$/);
    if(alignment){token.attrJoin('class',`align-${alignment[1]}`);token.attrs=token.attrs.filter(([name])=>name!=='style');}
    if (token.type==='link_open') token.attrSet('href',readingLink(token.attrGet('href'),current,repo));
    if (token.children) rewrite(token.children);
  }};
  rewrite(tokens);
  md.renderer.rules.table_open=()=>'<div class="table-scroll" role="region" aria-label="Scrollable table" tabindex="0"><table>\n';
  md.renderer.rules.table_close=()=>'</table></div>\n';
  return {html:md.renderer.render(tokens,md.options,{}),headings,title:headings.find(h=>h.level===1)?.title ?? documentLabel(current)};
}

export function pageHtml({repo,title,rel,rendered,documents,index=false}) {
  const base=`/${repo}/`, thisUrl=base+urlPath(rel.replace(/\.md$/,'.html'));
  const menu=documents.map(doc=>`<a href="${escape(doc.href)}"${doc.href===thisUrl?' aria-current="page"':''}>${escape(doc.label)}</a>`).join('');
  const outline=rendered.headings.filter(h=>h.level===2||h.level===3).map(h=>`<li class="level-${h.level}"><a href="#${escape(h.id)}">${escape(h.title)}</a></li>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'"><title>${escape(rendered.title)} · ${escape(title)}</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2324518a'/%3E%3Cpath d='M9 23L23 9M10 9h13v13' stroke='white' stroke-width='3' fill='none'/%3E%3C/svg%3E"><link rel="stylesheet" href="${base}docs/reader.css"><script src="${base}docs/reader.js" defer></script></head>
<body><a class="skip" href="#document">Skip to document</a><header class="reader-header"><a class="project" href="${base}docs/index.html"><span class="project-mark" aria-hidden="true">↗</span>${escape(title)}</a><a class="back" href="${base}">← Back to demo</a></header>
<div class="reader-layout"><aside class="reader-sidebar"><p class="eyebrow">Product / Program Management</p><details class="document-menu"><summary>Project documents</summary><nav aria-label="Project documents">${menu}</nav></details>${outline?`<details class="contents" open><summary>On this page</summary><nav aria-label="On this page"><ol>${outline}</ol></nav></details>`:''}<p class="boundary">Fictional portfolio sample.<br>Evidence and research limits are stated in each document.</p></aside>
<main id="document" class="paper"><div class="document-meta"><span>${escape(index?'Project reading guide':documentLabel(rel))}</span><span>${escape(title)}</span></div><article class="prose">${rendered.html}</article><footer class="reader-footer"><a href="${base}">← Try the interactive demo</a><a href="https://github.com/mvahedi2020/${repo}${index?'':`/blob/main/${urlPath(rel)}`}">View ${index?'project':'document'} source on GitHub ↗</a></footer></main></div></body></html>\n`;
}

export function buildDocs(root=process.cwd()) {
  const {repo,title}=JSON.parse(fs.readFileSync(path.join(root,'docs-reader.config.json'),'utf8'));
  if (!/^[A-Za-z0-9-]+$/.test(repo) || typeof title!=='string' || !title.trim()) throw Error('Invalid document reader configuration');
  const docs=path.join(root,'docs'),output=path.join(root,'dist');
  if (!fs.existsSync(output)) throw Error('Build the app before building its document pages');
  const collect=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?collect(path.join(dir,entry.name)):entry.isFile()&&entry.name.endsWith('.md')?[path.join(dir,entry.name)]:[]);
  const files=collect(docs).sort();if (!files.length) throw Error('No product documents found');
  fs.cpSync(docs,path.join(output,'docs'),{recursive:true});
  const priority=['Product case study','Sample walkthrough','Requirements','Product brief','Decisions and risks','Evidence and limits'];
  const documents=files.map(file=>{const rel=path.relative(root,file).split(path.sep).join('/');const rendered=renderMarkdown(fs.readFileSync(file,'utf8'),rel,repo);return {rel,label:documentLabel(rel),href:`/${repo}/${urlPath(rel.replace(/\.md$/,'.html'))}`,rendered};}).sort((a,b)=>(priority.indexOf(a.label)<0?99:priority.indexOf(a.label))-(priority.indexOf(b.label)<0?99:priority.indexOf(b.label))||a.label.localeCompare(b.label));
  for (const doc of documents) fs.writeFileSync(path.join(output,doc.rel.replace(/\.md$/,'.html')),pageHtml({repo,title,rel:doc.rel,rendered:doc.rendered,documents}));
  const intro=`<h1 id="product-decisions-and-evidence">Product decisions and evidence</h1><p class="lead">Explore the thinking behind ${escape(title)}. Start with the product case, then follow the sample walkthrough to try the decisions yourself.</p><div class="reading-cards">${documents.map(doc=>`<a href="${escape(doc.href)}"><strong>${escape(doc.label)}</strong><span>${escape(doc.rendered.title)}</span><span class="read-label">Read document →</span></a>`).join('')}</div>`;
  fs.writeFileSync(path.join(output,'docs/index.html'),pageHtml({repo,title,rel:'docs/index.md',rendered:{title:`${title} · Product reading guide`,html:intro,headings:[]},documents,index:true}));
  fs.copyFileSync(path.join(root,'scripts/docs-reader.css'),path.join(output,'docs/reader.css'));
  fs.writeFileSync(path.join(output,'docs/reader.js'),"const contents = document.querySelector('.contents');\nif (contents && window.matchMedia('(max-width: 900px)').matches) contents.open = false;\n");
  const manifest={repo,title,documents:documents.map(doc=>({source:doc.rel,label:doc.label,href:doc.href,title:doc.rendered.title,headings:doc.rendered.headings,tables:(doc.rendered.html.match(/<table>/g)??[]).length}))};
  fs.writeFileSync(path.join(output,'docs/reader-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) console.log(`Built ${buildDocs().documents.length} readable product documents.`);
