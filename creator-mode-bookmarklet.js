/**
 * Creator Mode - Bookmarklet Version
 * 
 * To use on ANY website (including ceruleancircle.com):
 * 
 * 1. Create a new bookmark in your browser
 * 2. Name it: "Creator Mode Grid"
 * 3. Set the URL to the minified version below (or use the full script)
 * 4. Click the bookmark on any page to enable the grid
 * 
 * MINIFIED BOOKMARKLET (copy this entire line as bookmark URL):
 */

javascript:(function(){'use strict';if(window.creatorMode&&window.creatorMode.isEnabled)return;let e=!1,t=null,n=100,o=12,r=20;function a(){if(t)return t;const e=document.createElement('div');e.id='creator-grid-overlay',e.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;display:none;';for(let l=0;l<r;l++)for(let s=0;s<o;s++){const i=document.createElement('div'),c=String.fromCharCode(65+s),d=l.toString(),u=`${c}${d}`;i.className='grid-cell',i.dataset.coord=u,i.style.cssText=`position:absolute;top:${l*n}px;left:${s*n}px;width:${n}px;height:${n}px;border:1px solid rgba(5,181,250,0.3);box-sizing:border-box;display:flex;align-items:flex-start;justify-content:flex-start;padding:2px;`;const m=document.createElement('span');m.textContent=u,m.style.cssText='font-size:10px;color:rgba(5,181,250,0.6);background:rgba(255,255,255,0.8);padding:1px 3px;border-radius:2px;font-family:monospace;font-weight:bold;',i.appendChild(m),e.appendChild(i)}return document.body.appendChild(e),t=e}function l(){const e=document.getElementById('creator-mode-toggle');e&&e.remove();const t=document.createElement('button');t.id='creator-mode-toggle',t.textContent='G',t.title='Toggle Creator Mode Grid (Press G)',t.style.cssText='position:fixed;bottom:20px;right:20px;width:50px;height:50px;border-radius:50%;background:rgb(5,181,250);color:white;border:2px solid white;font-size:20px;font-weight:bold;cursor:pointer;z-index:1000000;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:all 0.2s;',t.addEventListener('mouseenter',()=>{t.style.transform='scale(1.1)',t.style.boxShadow='0 6px 16px rgba(0,0,0,0.4)'}),t.addEventListener('mouseleave',()=>{t.style.transform='scale(1)',t.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'}),t.addEventListener('click',s),document.body.appendChild(t)}function s(){e=!e;const n=a(),o=document.getElementById('creator-mode-toggle');e?(n.style.display='block',o.style.background='rgb(5,237,152)',o.textContent='G✓',console.log('✅ Creator Mode: GRID ENABLED'),console.log('📋 Use coordinates like: A2, B3, C0-D5')):(n.style.display='none',o.style.background='rgb(5,181,250)',o.textContent='G',console.log('Creator Mode: Grid disabled'))}function i(){const e=[{selector:'nav',coord:'A0-B0',name:'Navigation'},{selector:'.intro',coord:'A1-E3',name:'Hero Banner'},{selector:'.highlights',coord:'A4-E6',name:'Highlights (Meta Structures)'},{selector:'.about',coord:'A7-E8',name:'About Section'},{selector:'.transformations',coord:'A9-E10',name:'Transformations'},{selector:'.methods',coord:'A11-E14',name:'Methods'},{selector:'.technology',coord:'A15-E18',name:'Technology Stack'}];e.forEach(({selector:e,coord:t,name:n})=>{const o=document.querySelector(e);o&&(o.dataset.coord=t,o.dataset.sectionName=n)})}function c(e){const t=document.querySelector(`[data-coord="${e}"]`);if(t){const e=t.getBoundingClientRect(),n=e.left+e.width/2,o=e.top+e.height/2;return document.elementFromPoint(n,o)}return null}function d(){l(),i(),document.addEventListener('keydown',(t)=>{if('g'===t.key||'G'===t.key){if(!t.ctrlKey&&!t.metaKey&&!t.altKey){t.preventDefault(),s()}}}),window.creatorMode={toggle:s,enable:()=>{e||s()},disable:()=>{e&&s()},getElementAt:c,isEnabled:()=>e},console.log('🎨 Creator Mode loaded! Press G to toggle grid.'),console.log('📋 Use: window.creatorMode.getElementAt("A2") to find elements')}'loading'===document.readyState?document.addEventListener('DOMContentLoaded',d):d()})();

/**
 * READABLE VERSION (for development/debugging):
 * 
 * Copy the content from creator-mode-standalone.js and paste into browser console
 */


