// Pixel avatar algorithm — kept byte-for-byte identical to the spec (Part
// B.6) so the same agent name always renders the same face everywhere.
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function avatar(seed,px){
  let h=hash(seed),cells=[];
  for(let x=0;x<3;x++)for(let y=0;y<5;y++){h=Math.imul(h,1664525)+1013904223>>>0;cells.push([x,y,(h>>>13)%100<52])}
  let r='';
  cells.forEach(function(c){
    if(!c[2])return;
    r+='<rect x="'+(c[0]*px)+'" y="'+(c[1]*px)+'" width="'+px+'" height="'+px+'" fill="#EDEDED"/>';
    if(c[0]<2)r+='<rect x="'+((4-c[0])*px)+'" y="'+(c[1]*px)+'" width="'+px+'" height="'+px+'" fill="#EDEDED"/>';
  });
  return '<svg viewBox="0 0 '+(5*px)+' '+(5*px)+'" shape-rendering="crispEdges">'+r+'</svg>';
}

// Tiny fetch helper shared by every page that talks to the API.
async function api(path, opts){
  const res = await fetch(path, opts);
  if(!res.ok){
    let msg = 'Request failed';
    try{ const j = await res.json(); msg = j.error || msg; }catch(e){}
    throw new Error(msg);
  }
  return res.json();
}
