(() => {
  let memory = [], failed = false;
  const valid = raw => Array.isArray(raw) ? raw.filter(x => x && typeof x.name === 'string' && Number.isFinite(x.price) && x.price >= 0 && Number.isInteger(x.qty) && x.qty > 0).map(x => ({...x,qty:Math.min(x.qty,99)})) : [];
  function read() {
    if(failed) return memory.map(x=>({...x}));
    try {memory=valid(JSON.parse(localStorage.getItem('puc-cart') || '[]'));}
    catch {failed=true;}
    return memory.map(x=>({...x}));
  }
  function write(items) {
    memory=valid(items);
    try {localStorage.setItem('puc-cart',JSON.stringify(memory));} catch {failed=true;}
    window.dispatchEvent(new CustomEvent('puc-cart-changed'));
  }
  window.PUCCart={read,write,get persistent(){return !failed;}};
})();