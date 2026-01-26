export function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display='block';
  setTimeout(()=>t.style.display='none',2000);
}

