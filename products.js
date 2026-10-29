const PRODUCTS = [{"id": "tram", "title": "HK Tram Clicker Blind Box", "variants": [{"label": "Single(random)", "price": 94.46, "usd": 12.11, "available": true}, {"label": "Full Set(4 boxes)", "price": 377.68, "usd": 48.42, "available": true}], "image": "assets/tram.jpg", "url": "https://www.prettyuseless.club/products/my-emotional-support-hk-tram-clicker-blind-box-香港電車-clicker-盲盒"}, {"id": "workcat", "title": "Working Cat Blind Box", "variants": [{"label": "Single(Random)", "price": 62.4, "usd": 8.0, "available": true}, {"label": "Full set(8 toys)", "price": 499.2, "usd": 64.0, "available": true}], "image": "assets/workcat.jpg", "url": "https://www.prettyuseless.club/products/my-emotional-support-working-cat-blind-box"}, {"id": "snack", "title": "HK Snack Clicker Blind Box", "variants": [{"label": "Single (Random)", "price": 66.3, "usd": 8.5, "available": true}, {"label": "Full Set (6 Toy)", "price": 374.4, "usd": 48.0, "available": true}], "image": "assets/snack.jpg", "url": "https://www.prettyuseless.club/products/emotional-support-hk-snack-clicker-blindbox"}, {"id": "clicker", "title": "Hong Kong and Macau Clicker", "variants": [{"label": "香港・燒賣 (Hong Kong · Siu Mai)", "price": 66.3, "usd": 8.5, "available": true}, {"label": "開心・咖喱魚蛋 (Happy · Curry Fish Balls)", "price": 66.3, "usd": 8.5, "available": true}, {"label": "九龍・菠蘿油(Kowloon · Pineapple Bun with Butter)", "price": 66.3, "usd": 8.5, "available": true}, {"label": "香港・雞蛋仔 (Hong Kong · Egg Waffle)", "price": 66.3, "usd": 8.5, "available": true}, {"label": "澳門・葡撻 (Macau · Portuguese Egg Tart)", "price": 66.3, "usd": 8.5, "available": true}, {"label": "澳門・777(Macau · 777)", "price": 66.3, "usd": 8.5, "available": true}, {"label": "澳門・發達啦(Macau · Get Rich!)", "price": 66.3, "usd": 8.5, "available": true}], "image": "assets/clicker.jpg", "url": "https://www.prettyuseless.club/products/emotional-support-hongkong-macau-clicker-香港-澳門特色解壓按鈕"}];
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const money = n => 'HK$' + n.toFixed(2);
  const key = 'puc-cart';
  function load() { return window.PUCCart.read(); }
  function save(items) { window.PUCCart.write(items); refresh(); }
  let timer;
  function announce(message) {
    $('#announcement').textContent = message;
    $('#announcement').classList.add('shown');
    clearTimeout(timer); timer = setTimeout(() => $('#announcement').classList.remove('shown'), 4200);
  }
  function refresh() {
    const items = load();
    const count = items.reduce((s,x) => s+x.qty,0);
    $('#cartCount').textContent = count;
    $('#cartCount').classList.toggle('visible', count > 0);
    $('#cartTotal').textContent = money(items.reduce((s,x) => s+x.price*x.qty,0));
    const container = $('#cartItems'); container.replaceChildren();
    if (!items.length) { const p = document.createElement('p'); p.textContent = 'Your bag is waiting for a little company.'; container.append(p); }
    items.forEach((item,index) => {
      const row = document.createElement('div'); row.className = 'cart-row';
      const name = document.createElement('p'); name.textContent = item.name;
      const amount = document.createElement('p'); amount.textContent = `${item.qty} × ${money(item.price)} = ${money(item.qty*item.price)}`;
      row.append(name,amount);
      [['−',-1],['+',1],['Remove',0]].forEach(([label,delta]) => {
        const button=document.createElement('button'); button.type='button'; button.textContent=label;
        button.setAttribute('aria-label',`${delta === 0 ? 'Remove' : delta > 0 ? 'Increase quantity of' : 'Decrease quantity of'} ${item.name}`);
        button.disabled=delta === 1 && item.qty >= 99;
        button.onclick=() => {
          const updated=load();
          if (!updated[index]) return;
          if (delta === 0 || updated[index].qty+delta < 1) updated.splice(index,1);
          else updated[index].qty += delta;
          save(updated);
          const next=$('#cartItems button'); if(next) next.focus(); else $('#closeCart').focus();
        };
        row.append(button);
      });
      container.append(row);
    });
  }
  document.querySelectorAll('.shop-add').forEach(button => button.onclick = () => {
    const p=PRODUCTS.find(p=>p.id===button.dataset.id);
    const v=p.variants[Number($('#variant-'+p.id).value)];
    if (!v || !v.available) return;
    const name=p.title+' — '+v.label;
    const items=load(), existing=items.find(x=>x.name===name);
    if (existing && existing.qty>=99) { announce('Maximum quantity is 99 for this option.'); return; }
    if (existing) { existing.qty++; existing.price=v.price; }
    else items.push({name,price:v.price,qty:1,id:p.id,image:p.image,currency:'HKD'});
    save(items);
    announce(window.PUCCart.persistent ? p.title+' added to your demo cart.' : 'Added for this visit. Browser storage is unavailable, so your cart cannot be saved.');
  });
  let filter='all';
  const cards=[...document.querySelectorAll('.shop-card')];
  function apply() {
    const query=$('#search').value.trim().toLowerCase(); let count=0;
    cards.forEach(c=> { c.hidden=!( (filter==='all'||c.dataset.category.includes(filter)) && c.dataset.search.toLowerCase().includes(query)); if(!c.hidden) count++; });
    $('#resultCount').textContent=`${count} companion${count===1?'':'s'} to meet`;
    $('#empty').hidden=count!==0;
    const selectedPrice=c=>PRODUCTS.find(p=>p.id===c.dataset.product).variants[Number($('#variant-'+c.dataset.product).value)].price;
    const sorted=[...cards];
    if($('#sort').value!=='featured') sorted.sort((a,b)=> ($('#sort').value==='low'?1:-1)*(selectedPrice(a)-selectedPrice(b)));
    sorted.forEach(c=>$('#productGrid').append(c));
  }
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=> {
    filter=b.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); apply();
  });
  PRODUCTS.forEach(p=>$('#variant-'+p.id).onchange=()=>{
    const v=p.variants[Number($('#variant-'+p.id).value)];
    const price=$('#price-'+p.id); price.firstChild.textContent=money(v.price);
    apply();
  });
  $('#search').oninput=apply; $('#sort').onchange=apply;
  $('#reset').onclick=()=> { $('#search').value=''; $('[data-filter="all"]').click(); $('#search').focus(); };
  $('#cartBtn').onclick=()=>{refresh();$('#cartDialog').showModal();};
  $('#closeCart').onclick=()=>$('#cartDialog').close();
  $('#navToggle').onclick=()=>{const open=$('#navLinks').classList.toggle('open');$('#navToggle').setAttribute('aria-expanded',String(open));};
  window.addEventListener('storage',e=>{if(e.key===key)refresh();});
  window.addEventListener('puc-cart-changed',refresh);
  window.addEventListener('scroll',()=>$('#navbar').classList.toggle('scrolled',window.scrollY>30),{passive:true});
  $('#navbar').classList.toggle('scrolled',window.scrollY>30);
  refresh(); apply();

  // Deep-link: scroll to + highlight a product card via URL hash (e.g. #product-tram)
  if(location.hash){
    const target=document.querySelector(location.hash);
    if(target && target.classList.contains('shop-card')){
      requestAnimationFrame(()=>{
        target.scrollIntoView({behavior:'smooth',block:'center'});
        target.classList.add('shop-card--highlight');
        setTimeout(()=>target.classList.remove('shop-card--highlight'),3400);
      });
    }
  }
})();
