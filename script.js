const header=document.querySelector('[data-header]');
const menuButton=document.querySelector('[data-menu-button]');
const menu=document.querySelector('[data-mobile-menu]');
const application=document.querySelector('[data-application]');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

const setHeader=()=>header.classList.toggle('scrolled',scrollY>80&&!header.classList.contains('menu-active'));
addEventListener('scroll',setHeader,{passive:true});setHeader();

let menuReturn=null;
function focusables(root){return [...root.querySelectorAll('a[href],button:not([disabled]),input,textarea')];}
function setMenu(open){menuReturn=open?document.activeElement:menuReturn;menu.classList.toggle('open',open);menu.setAttribute('aria-hidden',String(!open));menuButton.setAttribute('aria-expanded',String(open));menuButton.querySelector('span').textContent=open?'Close':'Menu';header.classList.toggle('menu-active',open);document.body.classList.toggle('locked',open);if(open)setTimeout(()=>focusables(menu)[0]?.focus(),0);else menuReturn?.focus();}
menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open'))setMenu(false);if(e.key==='Tab'&&menu.classList.contains('open')){const els=[menuButton,...focusables(menu)],first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});

document.querySelectorAll('[data-apply]').forEach(button=>button.addEventListener('click',()=>{if(menu.classList.contains('open'))setMenu(false);application.showModal()}));
document.querySelector('[data-close]').addEventListener('click',()=>application.close());
application.addEventListener('click',e=>{if(e.target===application)application.close()});

const track=document.querySelector('[data-house-track]');
const cards=[...track.children];
function currentCard(){const left=track.scrollLeft;return cards.reduce((best,card,i)=>Math.abs(card.offsetLeft-left)<Math.abs(cards[best].offsetLeft-left)?i:best,0)}
function scrollHouse(delta){const next=Math.max(0,Math.min(cards.length-1,currentCard()+delta));cards[next].scrollIntoView({behavior:reduced?'auto':'smooth',block:'nearest',inline:'start'})}
document.querySelector('[data-house-prev]').addEventListener('click',()=>scrollHouse(-1));
document.querySelector('[data-house-next]').addEventListener('click',()=>scrollHouse(1));
track.addEventListener('scroll',()=>{document.querySelector('[data-house-current]').textContent=String(currentCard()+1).padStart(2,'0')},{passive:true});

const stayImage=document.querySelector('[data-stay-image]');
const chapters=[...document.querySelectorAll('.chapter')];
if('IntersectionObserver' in window){const chapterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){chapters.forEach(c=>c.classList.remove('active'));entry.target.classList.add('active');if(!reduced){stayImage.style.opacity='.12';setTimeout(()=>{stayImage.src=`assets/${entry.target.dataset.scene}`;stayImage.alt=entry.target.querySelector('h3').textContent+' at Aster House';stayImage.style.opacity='1'},160)}}}),{rootMargin:'-38% 0px -38%',threshold:0});chapters.forEach(c=>chapterObserver.observe(c))}

const revealElements=document.querySelectorAll('.reveal');
if(reduced||!('IntersectionObserver' in window)){revealElements.forEach(el=>el.classList.add('in-view'))}else{const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target)}}),{threshold:.1});revealElements.forEach(el=>revealObserver.observe(el))}

function time(){const value=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());document.querySelectorAll('[data-local-time]').forEach(el=>el.textContent=`${value} LONDON`)}time();setInterval(time,30000);

document.querySelector('[data-newsletter]').addEventListener('submit',e=>{e.preventDefault();const input=e.currentTarget.email,message=e.currentTarget.querySelector('.form-message');if(!input.validity.valid){message.textContent='Please enter a valid email address.';input.focus();return}message.textContent='You’re on the list. The next letter will arrive quietly.';input.value=''});

document.querySelector('[data-application-form]').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;let valid=true;form.querySelectorAll('[required]').forEach(field=>{const error=field.parentElement.querySelector('.error');if(!field.validity.valid){error.textContent=field.type==='email'?'Enter a valid email address.':'This field is required.';valid=false}else error.textContent=''});if(!valid){form.querySelector(':invalid').focus();return}form.querySelector('.form-message').textContent='Application received. We’ll reply personally within three working days.';form.querySelector('button[type=submit]').disabled=true});
