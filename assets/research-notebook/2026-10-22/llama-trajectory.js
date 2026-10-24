(() => {
  'use strict';
  const sample=window.HenryLlamaExample,plot=document.getElementById('llama-plot');
  const layerSelect=document.getElementById('llama-layer'),stepSelect=document.getElementById('llama-step'),status=document.getElementById('llama-status');
  if(!plot)return;
  if(!sample||!window.Plotly){status.textContent='The figure could not load. Please reload this page.';return;}
  const tokens=sample.tokens,data=sample.data,layout=sample.layout,base=12+4*tokens.length;
  let layer=-1,step=9,busy=false,queued=null;
  function option(select,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;select.append(o);}
  layerSelect.replaceChildren();option(layerSelect,-1,'Summary paths');
  for(let i=0;i<sample.layers;i++)option(layerSelect,i,'Layer '+i);
  stepSelect.replaceChildren();tokens.forEach((token,i)=>option(stepSelect,i+1,(i+1)+' · '+token));
  layerSelect.value=String(layer);stepSelect.value=String(step);
  function dimensions(){const narrow=plot.clientWidth<550;return {height:narrow?1350:1450,width:plot.clientWidth};}
  Object.assign(layout,dimensions(),{autosize:true,paper_bgcolor:'#fbfcfe',plot_bgcolor:'#fbfcfe',title:{text:''},margin:{l:58,r:18,t:45,b:55},font:{family:'system-ui, -apple-system, sans-serif',color:'#263449',size:11},uirevision:'llama-single-sample'});
  layout.scene.uirevision='llama-single-sample';
  for(const [key,axis] of Object.entries(layout))if(/^[xy]axis\d*$/.test(key)){axis.gridcolor='#dce3eb';axis.zerolinecolor='#ccd7e4';axis.tickfont={size:10};if(axis.title)axis.title.font={size:12};}
  for(const axis of ['xaxis','yaxis','zaxis']){layout.scene[axis].tickfont={size:10};layout.scene[axis].title.font={size:12};layout.scene[axis].backgroundcolor='#f3f6fa';}
  layout.annotations[0].text='3D · every layer at each generated token';layout.annotations[1].text='2D · analogy and literal trajectories';
  layout.annotations.forEach(a=>a.font={size:12});
  function applySelection(){
    for(let i=base;i<data.length;i++)data[i].visible=false;
    for(const i of [4,5,8,9])data[i].visible=layer<0;
    if(layer>=0)for(let i=0;i<4;i++)data[base+4*layer+i].visible=true;
    for(let i=12;i<base;i++)data[i].visible=false;
    for(let i=0;i<4;i++)data[12+4*(step-1)+i].visible=true;
    layout.annotations[2].text='Slice · token '+step+" ('"+tokens[step-1]+"') · all layers; red diamond = literal";
    layerSelect.value=String(layer);stepSelect.value=String(step);
    status.textContent=(layer<0?'Summary paths':'Layer '+layer)+' · token '+step+' / '+tokens.length+' · '+tokens[step-1];
  }
  function update(nextLayer,nextStep){
    if(busy){queued=[nextLayer,nextStep];return;}
    if(Number.isInteger(nextLayer)&&nextLayer>=-1&&nextLayer<sample.layers)layer=nextLayer;
    if(Number.isInteger(nextStep)&&nextStep>=1&&nextStep<=tokens.length)step=nextStep;
    applySelection();busy=true;
    Plotly.react(plot,data,layout).finally(()=>{busy=false;if(queued){const next=queued;queued=null;update(...next);}});
  }
  applySelection();
  Plotly.newPlot(plot,data,layout,{...sample.config,displaylogo:false,scrollZoom:false}).then(()=>{
    layerSelect.disabled=false;stepSelect.disabled=false;status.dataset.ready='true';
    const fromSelectors=()=>update(Number(layerSelect.value),Number(stepSelect.value));
    layerSelect.addEventListener('change',fromSelectors);
    stepSelect.addEventListener('change',fromSelectors);
    plot.on('plotly_click',event=>{const p=event.points[0];if(p&&Array.isArray(p.customdata)&&p.customdata.length>=2)update(p.customdata[0]>=0?p.customdata[0]:layer,p.customdata[1]);});
    let width=plot.clientWidth,timer;
    new ResizeObserver(()=>{if(Math.abs(plot.clientWidth-width)<2)return;width=plot.clientWidth;clearTimeout(timer);timer=setTimeout(()=>Plotly.relayout(plot,dimensions()),100);}).observe(plot);
  }).catch(()=>{status.textContent='The interactive plot could not initialize. Please reload the page.';});
})();
