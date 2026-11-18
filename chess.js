'use strict';

const Chess = (() => {
  const rook = [[0,1],[0,-1],[1,0],[-1,0]];
  const bishop = [[1,1],[1,-1],[-1,1],[-1,-1]];
  const king = [...rook,...bishop];
  const knight = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  const dirs = {r:rook,b:bishop,q:king,k:king,n:knight};
  const promote = ['q','r','b','n'];
  const back = [...'rnbqkbnr'];
  const values = {p:100,n:305,b:325,r:500,q:900,k:0};
  const other = side => side === 'w' ? 'b' : 'w';
  const inside = (r,c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const row = i => i >> 3;
  const col = i => i % 8;
  const name = i => 'abcdefgh'[col(i)] + (8 - row(i));

  function start() {
    return {board:[...back.map(p=>'b'+p),...Array(8).fill('bp'),...Array(32).fill(null),...Array(8).fill('wp'),...back.map(p=>'w'+p)], turn:'w', rights:'KQkq', ep:-1, half:0};
  }

  function attacked(board, square, by) {
    const r = row(square), c = col(square);
    const pawnRow = r + (by === 'w' ? 1 : -1);
    if ([-1,1].some(dc => inside(pawnRow,c+dc) && board[pawnRow*8+c+dc] === by+'p')) return true;
    if (knight.some(([dr,dc]) => inside(r+dr,c+dc) && board[(r+dr)*8+c+dc] === by+'n')) return true;
    return king.some(([dr,dc], i) => {
      for (let distance=1;distance<8;distance++) {
        const nr=r+dr*distance, nc=c+dc*distance;
        if (!inside(nr,nc)) break;
        const piece=board[nr*8+nc];
        if (!piece) continue;
        return piece[0]===by && (piece[1]==='q' || piece[1]===(i<4?'r':'b') || (distance===1 && piece[1]==='k'));
      }
      return false;
    });
  }

  function check(state, side=state.turn) {
    return attacked(state.board,state.board.indexOf(side+'k'),other(side));
  }

  function candidates(state) {
    const {board,turn,rights,ep}=state;
    const result=[];
    board.forEach((piece,from) => {
      if (piece?.[0]!==turn) return;
      const type=piece[1], r=row(from), c=col(from);
      const add=(to, flags={}) => {
        if (type==='p' && (row(to)===0 || row(to)===7)) {
          promote.forEach(promotion=>result.push({from,to,promotion,...flags}));
        } else result.push({from,to,...flags});
      };
      if (type==='p') {
        const step=turn==='w'?-1:1;
        const next=from+8*step;
        if (!board[next]) {
          add(next);
          if (r===(turn==='w'?6:1) && !board[next+8*step]) add(next+8*step,{double:true});
        }
        for (const dc of [-1,1]) {
          if (!inside(r+step,c+dc)) continue;
          const to=next+dc;
          if (board[to]?.[0]===other(turn) && board[to][1]!=='k') add(to);
          if (to===ep) add(to,{ep:true});
        }
        return;
      }
      for (const [dr,dc] of dirs[type]) {
        const reach=type==='n'||type==='k'?1:7;
        for (let d=1;d<=reach;d++) {
          const nr=r+dr*d,nc=c+dc*d;
          if (!inside(nr,nc)) break;
          const to=nr*8+nc, target=board[to];
          if (target?.[0]!==turn && target?.[1]!=='k') add(to);
          if (target) break;
        }
      }
      if(type!=='k' || from!==(turn==='w'?60:4) || check(state)) return;
      for (const direction of [1,-1]) {
        const short=direction===1;
        const right=turn==='w'?(short?'K':'Q'):(short?'k':'q');
        const corner=from+(short?3:-4);
        const path=short?[1,2]:[-1,-2,-3];
        if (!rights.includes(right) || board[corner]!==turn+'r' || path.some(offset=>board[from+offset])) continue;
        const transit=board.slice();
        transit[from]=null;
        transit[from+direction]=piece;
        if (!attacked(transit,from+direction,other(turn))) add(from+direction*2,{castle:corner});
      }
    });
    return result;
  }

  function play(state,move) {
    const {from,to,promotion,ep,castle,double}=move;
    const board=state.board.slice(), piece=board[from], taken=board[to];
    const side=piece[0];
    board[from]=null;
    board[to]=promotion?side+promotion:piece;
    if (ep) board[row(from)*8+col(to)]=null;
    if (castle!==undefined) {
      board[(from+to)/2]=board[castle];
      board[castle]=null;
    }
    const corners={0:'q',7:'k',56:'Q',63:'K'};
    let rights=state.rights;
    if (piece[1]==='k') rights=rights.replace(side==='w'?/[KQ]/g:/[kq]/g,'');
    for (const square of [from,to]) if(corners[square]) rights=rights.replace(corners[square],'');
    return {board,turn:other(state.turn),rights,ep:double?(from+to)/2:-1,half:piece[1]==='p'||taken?0:state.half+1};
  }

  function legal(state) {
    return candidates(state).filter(move=>!check(play(state,move),state.turn));
  }

  function key(state,moves=legal(state)) {
    return [state.board.map(piece=>piece||'--').join(''),state.turn,state.rights,moves.some(move=>move.ep)?state.ep:-1].join('/');
  }

  function insufficient(state) {
    const pieces=state.board.flatMap((p,i)=>p && p[1]!=='k' ? [[p[1],(row(i)+col(i))%2]] : []);
    return !pieces.length || (pieces.length===1 && ['b','n'].includes(pieces[0][0])) ||
      pieces.every(([p,color])=>p==='b' && color===pieces[0][1]);
  }

  function value(state) {
    return state.board.reduce((sum,p,i) => {
      if (!p) return sum;
      const center=(7-Math.abs(row(i)-3.5)-Math.abs(col(i)-3.5))*3;
      const bonus=p[1]==='k'?0:center;
      return sum+(p[0]==='b'?1:-1)*(values[p[1]]+bonus);
    },0);
  }

  function bot(state,moves) {
    let best=-Infinity, chosen=moves[0];
    for (const move of moves) {
      const next=play(state,move), replies=legal(next);
      let score=check(next)?100000:0;
      if (replies.length) {
        score=Infinity;
        for (const reply of replies) {
          score=Math.min(score,value(play(next,reply)));
          if (score<best) break;
        }
      }
      score+=Math.random()*2;
      if (score>best) {best=score;chosen=move;}
    }
    return chosen;
  }
  return {start,play,legal,check,key,insufficient,bot,name};
})();
