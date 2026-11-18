'use strict';

const $ = selector => document.querySelector(selector);
const svg = (content,box='0 0 64 64') => `<svg viewBox="${box}" aria-hidden="true" focusable="false">${content}</svg>`;
const gameArt = {
  chess:'<path d="M12 54h40v7H12zM15 54l4-8h26l4 8zM20 46q-2-9 7-15l-8 2-7-7L29 8l1-6 10 5q16 8 10 39z" fill="#faf0ff"/><circle cx="33" cy="17" r="2" fill="currentColor" stroke="none"/>',
  sudoku:'<rect x="7" y="7" width="50" height="50" rx="8" fill="#fff8e9"/><path d="M24 7v50M40 7v50M7 24h50M7 40h50" fill="none"/><path d="M8 25h15v14H8zM41 8h15v15H41zM25 41h14v15H25z" fill="#ff9270" stroke="none"/><path d="M13 31h4m-2-2v6m31-21h4v4h-4m-16 29h4v4h-4" fill="none"/>',
  memory:'<rect x="8" y="9" width="33" height="45" rx="7" transform="rotate(-12 25 30)" fill="#fff0ff"/><rect x="26" y="11" width="31" height="44" rx="7" transform="rotate(14 42 33)" fill="#9d76ed"/><path d="m42 22 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff2ff"/>',
  slide:'<rect x="7" y="7" width="50" height="50" rx="10" fill="#f7ffd8"/><rect x="13" y="13" width="15" height="15" rx="4" fill="#a9ce55"/><rect x="35" y="13" width="15" height="15" rx="4" fill="#a9ce55"/><rect x="13" y="35" width="15" height="15" rx="4" fill="#a9ce55"/><path d="M33 43h16m-5-5 5 5-5 5" fill="none"/>',
  lights:'<path d="M19 8v9M8 19h9m31 32h8m-4-4v8" fill="none"/><path d="M40 4 16 36h15l-6 24 24-32H34z" fill="#fff5bd"/>',
  ttt:'<path d="M24 6v52M41 6v52M6 24h52M6 41h52" fill="none" opacity=".55"/><path d="m10 10 10 10m0-10L10 20m35 24 10 10m0-10L45 54" fill="none" stroke-width="4"/><circle cx="32.5" cy="32.5" r="5" fill="#fff2ef"/>',
  word:'<rect x="5" y="13" width="29" height="35" rx="6" fill="#e9fffc" transform="rotate(-10 19 30)"/><rect x="29" y="19" width="30" height="35" rx="6" fill="#6fdbcb" transform="rotate(13 44 36)"/><path d="m12 38 7-16 7 16m-11-5h8m14 10 1-15 10 15 1-15" fill="none"/>',
  connect:'<rect x="5" y="10" width="54" height="44" rx="8" fill="#fff4d8"/><g fill="#f09770"><circle cx="17" cy="22" r="5"/><circle cx="32" cy="35" r="5"/><circle cx="47" cy="47" r="5"/></g><g fill="#d3e47a"><circle cx="17" cy="47" r="5"/><circle cx="32" cy="47" r="5"/><circle cx="47" cy="35" r="5"/></g>'
};
const games = [
  {id:'chess',title:'Catur',group:'Strategi',color:'#d9c5fc',ink:'#3e255d',desc:'Tantang bot atau teman di satu perangkat.',help:'Pilih bidak untuk melihat langkah legal. Putih bergerak lebih dulu.',run:chessGame},
  {id:'sudoku',title:'Sudoku',group:'Logika',color:'#ffd3bb',ink:'#6a332a',desc:'Lengkapi angka dalam kisi 9 × 9.',help:'Isi 1–9 tanpa mengulang angka di baris, kolom, dan kotak 3 × 3.',run:sudokuGame},
  {id:'memory',title:'Kartu Kembar',group:'Memori',color:'#e0cffb',ink:'#4b3077',desc:'Balik kartu dan cari simbol yang berpasangan.',help:'Balik dua kartu setiap giliran. Ingat letak simbol untuk menemukan semua pasangan.',run:memoryGame},
  {id:'slide',title:'Geser Angka',group:'Logika',color:'#e0efae',ink:'#394f25',desc:'Geser ubin dan urutkan angka 1 sampai 8.',help:'Geser ubin yang berbatasan dengan ruang kosong. Susun 1–8 dari kiri atas, dengan ruang kosong di kanan bawah.',run:slideGame},
  {id:'lights',title:'Padamkan Lampu',group:'Logika',color:'#fae4a0',ink:'#6b451d',desc:'Satu ketukan mengubah lampu dan tetangganya.',help:'Ketuk lampu untuk membalik keadaannya dan tetangga atas, bawah, kiri, serta kanan. Padamkan semuanya.',run:lightsGame},
  {id:'ttt',title:'Tiga Segaris',group:'Strategi',color:'#ffcbdc',ink:'#73314e',desc:'Susun tiga simbol segaris sebelum lawan.',help:'Bergantian menaruh X dan O. Buat tiga segaris secara mendatar, tegak, atau diagonal.',run:tttGame},
  {id:'word',title:'Acak Kata',group:'Kata',color:'#b8eddf',ink:'#1e544e',desc:'Susun huruf acak menjadi kata bahasa Indonesia.',help:'Gunakan semua huruf untuk membentuk kata yang cocok dengan petunjuk.',run:wordGame},
  {id:'connect',title:'Empat Segaris',group:'Strategi',color:'#ffe0ab',ink:'#684329',desc:'Jatuhkan keping dan buat empat segaris.',help:'Ketuk kolom untuk menjatuhkan keping ke ruang kosong terbawah. Susun empat keping segaris.',run:connectGame}
];

const dialog = $('#dialog');
const body = $('#dialog-body');
let currentGame = null;
let screen = 0;
let returnFocus = null;
const records = readStorage('grekludo-records', {});
let sound = readStorage('grekludo-sound', false);
let audio;

function readStorage(key,fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function saveStorage(key,value) {
  try { localStorage.setItem(key,JSON.stringify(value)); }
  catch { /* Storage can be disabled in private browsing. */ }
}

function shuffle(items) {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

function beep(win=false) {
  if (!sound || !window.AudioContext) return;
  try {
    audio ??= new AudioContext();
    if(audio.state==='suspended') audio.resume().catch(()=>{});
    (win?[440,554,659]:[320]).forEach((freq,i)=>{
      const start=audio.currentTime+i*.09;
      const osc=audio.createOscillator(), gain=audio.createGain();
      osc.frequency.value=freq;
      gain.gain.setValueAtTime(.075,start);
      gain.gain.exponentialRampToValueAtTime(.001,start+.12);
      osc.connect(gain);gain.connect(audio.destination);osc.start(start);osc.stop(start+.13);
    });
  } catch { /* Audio is optional. */ }
}

function updateSound() {
  const button=$('#sound');
  button.setAttribute('aria-pressed',String(sound));
  button.setAttribute('aria-label',sound?'Matikan suara':'Aktifkan suara');
  button.innerHTML=svg(`<path d="M10 25h10l13-10v34L20 39H10z${sound?'M40 24a11 11 0 0 1 0 16m6-22a19 19 0 0 1 0 28':'M42 27l10 10m0-10L42 37'}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`);
}
$('#sound').onclick=()=>{sound=!sound;saveStorage('grekludo-sound',sound);updateSound();beep();};
updateSound();

function catalog(group='Semua') {
  const groups=['Semua','Strategi','Logika','Memori','Kata'];
  $('#filters').innerHTML=groups.map(name=>`<button class="filter" data-group="${name}" aria-pressed="${name===group}">${name}</button>`).join('');
  const shown=games.filter(game=>group==='Semua'||game.group===group);
  $('#game-count').textContent=shown.length+' permainan';
  $('#catalog').innerHTML=shown.map((game,index)=>`<button data-game="${game.id}" class="game-card" style="--art-bg:${game.color};--art-ink:${game.ink};animation-delay:${index*32}ms">
    <span class="card-art">${svg(`<g stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round">${gameArt[game.id]}</g>`)}</span>
    <span class="card-copy"><span class="category">${game.group}</span><strong>${game.title}</strong><small>${game.desc}</small></span>
    <span class="card-bottom">Main <b aria-hidden="true">${svg('<path d="M20 44 44 20m-19 0h19v19" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')}</b></span></button>`).join('');
}
catalog();
$('#filters').onclick=e=>{
  const target=e.target.closest('[data-group]');
  if(!target) return;
  catalog(target.dataset.group);
  $('#filters').querySelector('[aria-pressed=true]').focus();
};
$('#catalog').onclick=e=>{
  const target=e.target.closest('[data-game]');
  if(target) openGame(games.find(game=>game.id===target.dataset.game));
};
$('#random').onclick=()=>openGame(games[Math.floor(Math.random()*games.length)]);
$('#close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog) dialog.close();});
dialog.addEventListener('close',()=>{
  screen++;
  currentGame=null;
  body.onkeydown=null;
  body.replaceChildren();
  returnFocus?.focus({preventScroll:true});
});
$('#guide').onclick=()=>openPanel('Panduan','Cara main',`<p class="instructions">Pilih permainan di arena. Petunjuk muncul saat papan dibuka. Gunakan tombol Ulang untuk memulai ronde baru.</p><div class="progress-panel">${games.map(game=>`<div class="progress-row"><strong>${game.title}</strong><span>${game.group}</span></div>`).join('')}</div>`);
$('#profile').onclick=()=>openPanel('Progres lokal','Progres pemain',`<p class="instructions">Total ronde selesai di browser ini. Kemenangan puzzle dan kemenanganmu atas bot juga dicatat.</p><div class="progress-panel">${games.map(game=>`<div class="progress-row"><strong>${game.title}</strong><span>${records[game.id]?.rounds||0} selesai · ${records[game.id]?.wins||0} menang</span></div>`).join('')}</div>`);

function openPanel(tag,title,markup='') {
  screen++;
  returnFocus=document.activeElement;
  $('#dialog-tag').textContent=tag;
  $('#dialog-title').textContent=title;
  body.innerHTML=markup;
  dialog.showModal();
}
function openGame(game) {
  openPanel(game.group,game.title);
  currentGame=game;
  game.run();
}
function finish(won=true) {
  const entry=records[currentGame.id] ??= {rounds:0,wins:0};
  entry.rounds++;
  if(won) entry.wins++;
  saveStorage('grekludo-records',records);
  beep(won);
  $('#announcement').textContent=won?'Tantangan berhasil!':'Ronde selesai.';
}
function render(message,content,{modes='',reset,action,actionText='Ulang'}={}) {
  const focused=body.contains(document.activeElement)?document.activeElement.dataset.focus:null;
  body.innerHTML=`<p class="instructions">${currentGame.help}</p>${modes}
    <div class="game-bar"><p role="status">${message}</p>${action||''}${reset?'<button data-focus="reset" class="small-button" id="reset">'+actionText+'</button>':''}</div>${content}`;
  if(reset) $('#reset').onclick=reset;
  if(focused) body.querySelector(`[data-focus="${focused}"]`)?.focus({preventScroll:true});
}
function board(n,content,extra='') {
  return `<div class="board ${extra}" style="--n:${n}">${content}</div>`;
}
function tile(index,content='',classes='',label='',inactive=false) {
  return `<button class="tile ${classes}" type="button" data-i="${index}" data-focus="tile-${index}" aria-label="${label}"${inactive?' disabled':''}>${content}</button>`;
}
function tiles(click) {
  body.querySelector('.board').onclick=e=>{
    const button=e.target.closest('[data-i]');
    if(button && !button.disabled) click(Number(button.dataset.i));
  };
}
function modes(options,active) {
  return '<div class="mode-row">'+options.map(([id,label])=>`<button class="mode" data-mode="${id}" data-focus="mode-${id}" aria-pressed="${id===active}">${label}</button>`).join('')+'</div>';
}
function bindModes(change) {
  body.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
    if(button.getAttribute('aria-pressed')==='false') change(button.dataset.mode);
  });
}
const versus=[['bot','Lawan bot'],['local','2 pemain']];
const later = (run,ms) => {const marker=screen;setTimeout(()=>{if(marker===screen && dialog.open) run();},ms);};

const pieceNames={k:'Raja',q:'Ratu',r:'Benteng',b:'Gajah',n:'Kuda',p:'Pion'};
const pieceArt={
  k:'<path d="M32 5v17m-7-11h14" fill="none" stroke-width="4"/><path d="M20 49 21 39Q5 27 16 20q8-4 16 8 8-12 16-8 11 7-5 19l1 10z"/><path d="M22 39h20" fill="none"/>',
  q:'<path d="m15 18 9 12 8-15 8 15 9-12-6 31H21z"/><circle cx="14" cy="15" r="4"/><circle cx="32" cy="11" r="4"/><circle cx="50" cy="15" r="4"/><path d="M20 42h24" fill="none"/>',
  r:'<path d="M14 12h10v8h4v-8h8v8h4v-8h10v17l-8 6 2 14H20l2-14-8-6z"/><path d="M15 29h34M22 35h20" fill="none"/>',
  b:'<path d="M24 49q6-9 1-15-11-4-3-15l10-12 10 12q8 11-3 15-5 6 1 15z"/><path d="m35 14-8 10m-2 10h14" fill="none"/>',
  n:'<path d="M18 49q-2-12 9-21l-9 4-8-8L27 8l2-4 9 5q16 10 10 40z"/><circle cx="29" cy="17" r="1.5"/>',
  p:'<path d="M22 49q7-6 6-17-9-4-7-11 2-6 11-6t11 6q2 7-7 11-1 11 6 17z"/><path d="M23 34h18" fill="none"/>'
};
function pieceSVG(piece) {
  const white=piece[0]==='w';
  return svg(`<g fill="${white?'#fff6e8':'#392750'}" stroke="${white?'#3b294e':'#f0caf8'}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${pieceArt[piece[1]]}<path d="M19 48h26l4 8H15z"/></g>`);
}

function chessGame() {
  let mode='bot',state,moves,repeats,selected,recent,promotion,result;
  function reset() {
    screen++;
    state=Chess.start();moves=Chess.legal(state);repeats=new Map([[Chess.key(state,moves),1]]);
    selected=-1;recent=null;promotion=null;result='';
    draw();
  }
  function commit(move) {
    const played=state.turn;
    state=Chess.play(state,move);
    moves=Chess.legal(state);
    recent=move;selected=-1;promotion=null;
    const key=Chess.key(state,moves);
    const times=(repeats.get(key)||0)+1;
    repeats.set(key,times);
    const mate=!moves.length && Chess.check(state);
    if(mate) result='Skakmat! '+(played==='w'?'Putih':'Hitam')+' menang.';
    else if(!moves.length) result='Remis · Pat';
    else if(Chess.insufficient(state)) result='Remis · Material tidak cukup';
    else if(times>=3) result='Remis · Posisi berulang tiga kali';
    else if(state.half>=100) result='Remis · Aturan 50 langkah';
    if(result) finish(mate && mode==='bot' && played==='w');
    else beep();
    draw();
    if(!result && mode==='bot' && state.turn==='b') later(()=>commit(Chess.bot(state,moves)),240);
  }
  function choose(i) {
    if(result||promotion||(mode==='bot'&&state.turn==='b')) return;
    const options=moves.filter(move=>move.from===selected && move.to===i);
    if(options.length===1){commit(options[0]);return;}
    if(options.length){promotion=options;draw();body.querySelector('[data-promotion]').focus();return;}
    selected=state.board[i]?.[0]===state.turn && selected!==i?i:-1;
    draw();
  }
  function draw() {
    const thinking=mode==='bot'&&state.turn==='b';
    const player=state.turn==='w'?'Putih':'Hitam';
    const message=result||(promotion?'Pilih bidak promosi':thinking?'Bot berpikir…':'Giliran '+player+(Chess.check(state)?' · Skak!':''));
    const allowed=new Set(moves.filter(move=>move.from===selected).map(move=>move.to));
    const cells=state.board.map((p,i)=>{
      const classes=[(Math.floor(i/8)+i%8)%2?'dark':'light',selected===i?'selected':'',recent && (recent.from===i||recent.to===i)?'recent':'',allowed.has(i)?'legal':''].join(' ');
      const square=Chess.name(i);
      const coord=i%8===0||i>=56?`<span aria-hidden="true" class="coordinate">${i%8===0?square[1]:''}${i>=56?square[0]:''}</span>`:'';
      return tile(i,coord+(p?pieceSVG(p):''),classes,square+(p?' '+pieceNames[p[1]]+' '+(p[0]==='w'?'putih':'hitam'):'')+(allowed.has(i)?', langkah legal':''));
    }).join('');
    const choices=promotion?`<div class="promotion">${promotion.map(move=>`<button class="small-button" data-promotion="${move.promotion}">${pieceNames[move.promotion]}</button>`).join('')}</div>`:'';
    render(message,board(8,cells,'chess')+choices,{modes:modes(versus,mode),reset});
    tiles(choose);
    bindModes(next=>{mode=next;reset();});
    body.querySelectorAll('[data-promotion]').forEach(button=>button.onclick=()=>commit(promotion.find(move=>move.promotion===button.dataset.promotion)));
  }
  reset();
}

function sudokuGame() {
  const seed=[...'530070000600195000098000060800060003400803001700020006060000280000419005000080079'].map(Number);
  const solution=[...'534678912672195348198342567859761423426853791713924856961537284287419635345286179'].map(Number);
  let values,answers,givens,selected,done;
  function reset(){
    const digits=[0,...shuffle([1,2,3,4,5,6,7,8,9])];
    const transpose=Math.random()<.5;
    const transform=arr=>arr.map((_,i)=>digits[arr[transpose?(i%9)*9+Math.floor(i/9):i]]);
    values=transform(seed);answers=transform(solution);givens=[...values];
    selected=values.indexOf(0);done=false;draw();
  }
  function enter(value){
    if(done || givens[selected]) return;
    values[selected]=value;
    done=values.every((v,i)=>v===answers[i]);
    if(done) finish();
    else beep();
    draw();
  }
  function draw(){
    const blank=values.filter(v=>!v).length;
    const wrong=values.filter((v,i)=>v&&v!==answers[i]).length;
    const cells=values.map((v,i)=>tile(i,v||'',`${givens[i]?'fixed':''} ${selected===i?'active':''} ${v&&v!==answers[i]?'wrong':''}`,`Baris ${Math.floor(i/9)+1}, kolom ${i%9+1}, ${v||'kosong'}`)).join('');
    const keypad='<div class="keypad">'+[1,2,3,4,5,6,7,8,9,0].map(v=>`<button class="small-button" data-value="${v}" data-focus="value-${v}"${done?' disabled':''}>${v||'Hapus'}</button>`).join('')+'</div>';
    render(done?'Sudoku selesai!':`${blank} kosong${wrong?' · '+wrong+' angka keliru':''}`,board(9,cells,'sudoku')+keypad,{reset,actionText:'Acak ulang'});
    tiles(i=>{if(!done&&!givens[i]){selected=i;draw();}});
    body.querySelectorAll('[data-value]').forEach(button=>button.onclick=()=>enter(Number(button.dataset.value)));
    body.onkeydown=e=>{
      if(currentGame?.id!=='sudoku') return;
      if(/^[1-9]$/.test(e.key)){e.preventDefault();enter(Number(e.key));}
      else if(['Backspace','Delete','0'].includes(e.key)){e.preventDefault();enter(0);}
    };
  }
  reset();
}

function memoryGame() {
  const symbols=['chess','sudoku','memory','slide','lights','ttt','word','connect'];
  let cards,matched,shown,turns;
  function reset(){
    screen++;cards=shuffle([...symbols,...symbols]);matched=new Set();shown=[];turns=0;draw();
  }
  function draw(){
    const won=matched.size===cards.length;
    const cells=cards.map((v,i)=>{
      const visible=matched.has(i)||shown.includes(i);
      return tile(i,visible?svg(`<g stroke="currentColor" stroke-width="3" stroke-linejoin="round">${gameArt[v]}</g>`):'?',matched.has(i)?'win':visible?'active':'',`Kartu ${i+1}${visible?', '+games.find(game=>game.id===v).title:''}${matched.has(i)?', cocok':''}`,matched.has(i));
    }).join('');
    render(won?`Semua kartu cocok dalam ${turns} giliran!`:`${matched.size/2}/8 pasangan · ${turns} giliran`,board(4,cells),{reset});
    tiles(i=>{
      if(shown.length===2||shown.includes(i)) return;
      shown.push(i);beep();
      if(shown.length===2){
        turns++;
        if(cards[shown[0]]===cards[shown[1]]){
          shown.forEach(index=>matched.add(index));shown=[];
          if(matched.size===cards.length) finish();
        }else later(()=>{shown=[];draw();},710);
      }
      draw();
    });
  }
  reset();
}

function adjacent(index,size) {
  const row=Math.floor(index/size),col=index%size,result=[];
  if(row>0) result.push(index-size);
  if(row<size-1) result.push(index+size);
  if(col>0) result.push(index-1);
  if(col<size-1) result.push(index+1);
  return result;
}

function slideGame() {
  const target=[1,2,3,4,5,6,7,8,0];
  let values,empty,steps,done;
  const solved=()=>values.every((v,i)=>v===target[i]);
  function swap(i){[values[i],values[empty]]=[values[empty],values[i]];empty=i;}
  function reset(){
    do {
      values=[...target];empty=8;
      let previous=-1;
      for(let n=0;n<38;n++){
        const moves=adjacent(empty,3).filter(i=>i!==previous);
        previous=empty;swap(shuffle(moves)[0]);
      }
    } while(solved());
    steps=0;done=false;draw();
  }
  function draw(){
    render(done?`Urutan benar dalam ${steps} langkah!`:`${steps} langkah`,board(3,values.map((v,i)=>tile(i,v||'',v?'':'empty',v?'Ubin '+v:'Ruang kosong',!v)).join(''),'board-small'),{reset});
    tiles(i=>{
      if(done||!adjacent(empty,3).includes(i)) return;
      swap(i);steps++;done=solved();
      if(done) finish();
      else beep();
      draw();
    });
  }
  reset();
}

function lightsGame() {
  let lights,steps,done;
  function flip(i){[i,...adjacent(i,5)].forEach(index=>lights[index]=!lights[index]);}
  function reset(){
    do {
      lights=Array(25).fill(false);
      shuffle([...lights.keys()]).slice(0,8).forEach(flip);
    }while(!lights.some(Boolean));
    steps=0;done=false;draw();
  }
  function draw(){
    const bolt=svg('<path d="M37 5 15 37h15l-4 22 24-32H35z" fill="currentColor"/>');
    render(done?`Semua padam dalam ${steps} langkah!`:`${lights.filter(Boolean).length} menyala · ${steps} langkah`,board(5,lights.map((on,i)=>tile(i,bolt,on?'active':'',`Lampu ${i+1}, ${on?'menyala':'padam'}`)).join('')),{reset});
    tiles(i=>{
      if(done)return;
      flip(i);steps++;done=!lights.some(Boolean);
      if(done) finish();
      else beep();
      draw();
    });
  }
  reset();
}

function tttGame() {
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const winning=grid=>lines.find(line=>grid[line[0]]&&line.every(i=>grid[i]===grid[line[0]]));
  let mode='bot',grid,turn,win,message;
  function reset(){
    screen++;grid=Array(9).fill('');turn='X';win=null;message='';draw();
  }
  function pick(i){
    grid[i]=turn;win=winning(grid);
    if(win) message=turn+' menang!';
    else if(grid.every(Boolean)) message='Seri!';
    else turn=turn==='X'?'O':'X';
    if(message)finish(Boolean(win)&&mode==='bot'&&turn==='X');
    else beep();
    draw();
    if(!message&&turn==='O'&&mode==='bot') later(bot,250);
  }
  function bot(){
    const free=shuffle(grid.flatMap((value,i)=>value?[]:[i]));
    function match(mark){
      return free.find(i=>{
        const copy=[...grid];copy[i]=mark;
        return winning(copy);
      });
    }
    pick(match('O')??match('X')??(grid[4]?free[0]:4));
  }
  function draw(){
    const cells=grid.map((mark,i)=>tile(i,mark,`${mark?'mark-'+mark.toLowerCase():''} ${win?.includes(i)?'win':''}`,`Kotak ${i+1}, ${mark||'kosong'}`)).join('');
    render(message||(turn==='O'&&mode==='bot'?'Bot berpikir…':'Giliran '+turn),board(3,cells,'board-small'),{modes:modes(versus,mode),reset});
    tiles(i=>{if(!grid[i]&&!message&&(mode==='local'||turn==='X'))pick(i);});
    bindModes(next=>{mode=next;reset();});
  }
  reset();
}

function wordGame() {
  const words=[
    ['bukit','Dataran tinggi yang lebih rendah daripada gunung.'],
    ['kucing','Hewan peliharaan yang suka mengeong.'],
    ['jangkar','Alat yang menahan kapal agar tidak hanyut.'],
    ['gerhana','Peristiwa ketika cahaya benda langit terhalang benda lain.'],
    ['puzzle','Kata serapan untuk permainan menyusun potongan gambar.'],
    ['samudra','Lautan yang sangat luas.'],
    ['angklung','Alat musik bambu yang dimainkan dengan digoyangkan.'],
    ['jembatan','Bangunan untuk menyeberangi sungai atau jalan.'],
    ['pion','Bidak catur yang memulai permainan di baris depan.'],
    ['kompas','Alat penunjuk arah mata angin.'],
    ['teleskop','Alat untuk mengamati benda yang sangat jauh seperti bintang.'],
    ['kristal','Padatan dengan susunan partikel teratur, seperti kuarsa.'],
    ['cakrawala','Garis yang mempertemukan langit dan bumi dalam pandangan.'],
    ['wayang','Boneka yang dimainkan oleh dalang.']
  ];
  let queue=shuffle(words),word,clue,letters,tries,done;
  function reset(){
    if(!queue.length) queue=shuffle(words.filter(entry=>entry[0]!==word));
    [word,clue]=queue.pop();tries=0;done=false;
    do {letters=shuffle(word);}while(letters.join('')===word);
    draw();
  }
  function draw(){
    const clueLine=`<p class="instructions">${clue}</p><div class="word-letters" aria-label="Huruf acak ${letters.join(' ')}">${letters.map(c=>'<span aria-hidden="true">'+c.toUpperCase()+'</span>').join('')}</div>`;
    const form=done?'':`<form class="word-form"><input data-focus="word" name="word" aria-label="Jawaban" placeholder="Ketik jawaban" autocomplete="off" maxlength="${word.length}" required><button class="small-button" type="submit">Cek</button></form>`;
    render(done?'Benar! Jawabannya '+word.toUpperCase():tries?`Belum tepat · ${tries} percobaan`:'Kata apa ini?',clueLine+form,{reset,actionText:'Kata baru'});
    const field=body.querySelector('form');
    if(field) field.onsubmit=e=>{
      e.preventDefault();
      const answer=field.elements.word.value.trim().toLowerCase();
      if(!answer) return;
      tries++;done=answer===word;
      if(done) finish();
      else beep();
      draw();
      body.querySelector(done?'#reset':'input')?.focus();
    };
  }
  reset();
}

function connectGame() {
  let grid,turn,win,message,last;
  const names={red:'Jingga',green:'Hijau'};
  function reset(){grid=Array(42).fill('');turn='red';win=null;message='';last=-1;draw();}
  function lineFrom(index){
    const row=Math.floor(index/7),col=index%7;
    for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){
      const line=[index];
      for(const sign of [1,-1]){
        for(let step=1;step<=3;step++){
          const r=row+dr*step*sign,c=col+dc*step*sign;
          if(r<0||r>=6||c<0||c>=7||grid[r*7+c]!==turn)break;
          line.push(r*7+c);
        }
      }
      if(line.length>=4)return line;
    }
    return null;
  }
  function drop(col){
    if(message||grid[col])return;
    let i=35+col;
    while(grid[i])i-=7;
    grid[i]=turn;last=i;win=lineFrom(i);
    if(win)message=names[turn]+' menang!';
    else if(grid.every(Boolean))message='Seri!';
    else turn=turn==='red'?'green':'red';
    if(message)finish(false);
    else beep();
    draw();
  }
  function draw(){
    const cells=grid.map((value,i)=>tile(i,'',`${value} ${win?.includes(i)?'win':''} ${i===last?'recent':''}`,`Kolom ${i%7+1}, baris ${Math.floor(i/7)+1}, ${names[value]||'kosong'}`)).join('');
    render(message||'Giliran '+names[turn],board(7,cells,'connect'),{reset});
    tiles(i=>drop(i%7));
  }
  reset();
}
