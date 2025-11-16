let userObjects=[];

function updateFilters(){
    const typeSet = new Set(userObjects.map(o=>o.Objekttyp).filter(v=>v)); 
    const materialSet = new Set(userObjects.map(o=>o.Material).filter(v=>v));
    const typeSel=document.getElementById("filter-type");
    const materialSel=document.getElementById("filter-material");
    typeSel.innerHTML='<option value="">Alle</option>'+[...typeSet].map(v=>`<option value="${v}">${v}</option>`).join('');
    materialSel.innerHTML='<option value="">Alle</option>'+[...materialSet].map(v=>`<option value="${v}">${v}</option>`).join('');
}

function displayObjects(){
    const container=document.getElementById("object-list");
    container.innerHTML="";
    const typeFilter=document.getElementById("filter-type").value;
    const materialFilter=document.getElementById("filter-material").value;
    userObjects.filter(o=>(typeFilter===""||o.Objekttyp===typeFilter)&&(materialFilter===""||o.Material===materialFilter))
    .forEach(o=>{
        const div=document.createElement("div");
        div.className="object-card";
        div.innerHTML=`
        <h3>${o.Objekttitel}</h3>
        <p><strong>Inventarnummer:</strong> ${o.Inventarnummer}</p>
        <p><strong>Objekttyp:</strong> ${o.Objekttyp}</p>
        <p><strong>Beschreibung:</strong> ${o.Objektbeschreibung}</p>
        <p><strong>Datierung:</strong> ${o.Datierung_Anfang} - ${o.Datierung_Ende}</p>
        <p><strong>Material:</strong> ${o.Material}</p>
        <p><strong>Maße:</strong> ${o.Maße}</p>
        <p><strong>Ereignis:</strong> ${o.Ereignis_Objektgeschichte}</p>
        <p><strong>Inhaltsschlagwort:</strong> ${o.Inhaltsschlagwort}</p>
        <p><strong>Mediendatei:</strong> ${o.Mediendatei}</p>
        <p><strong>Bemerkungen:</strong> ${o.Bemerkungen}</p>`;
        container.appendChild(div);
    });
    updateFilters();
}

document.getElementById("object-form").addEventListener("submit",e=>{
    e.preventDefault();
    const newObj={id:Date.now()};
    ["Inventarnummer","Objekttitel","Objekttyp","Objektbeschreibung","Datierung_Anfang","Datierung_Ende",
     "Material","Maße","Ereignis_Objektgeschichte","Inhaltsschlagwort","Mediendatei","Bemerkungen"]
    .forEach(f=>newObj[f]=document.getElementById(f).value);
    userObjects.push(newObj);
    localStorage.setItem("userObjects",JSON.stringify(userObjects));
    document.getElementById("object-form").reset();
    displayObjects();
});

document.getElementById("export-btn").addEventListener("click",()=>{
    if(userObjects.length===0)return;
    const headers=Object.keys(userObjects[0]);
    const csvRows=[];
    csvRows.push(headers.join(","));
    userObjects.forEach(obj=>{
        const row=headers.map(h=>`"${(obj[h]||"").replace(/"/g,'""')}"`).join(",");
        csvRows.push(row);
    });
    const blob=new Blob([csvRows.join("\n")],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="museum-daten-export.csv";
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById("csv-input").addEventListener("change",async e=>{
    const file=e.target.files[0];
    if(!file)return;
    const text=await file.text();
    const rows=text.split("\n").map(r=>r.trim()).filter(r=>r.length>0);
    const headers=rows[0].split(",").map(h=>h.trim());
    for(let i=1;i<rows.length;i++){
        const values=rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(v=>v.replace(/^"|"$/g,'').replace(/""/g,'"'));
        const obj={id:Date.now()+i};
        headers.forEach((h,idx)=>obj[h]=values[idx]||"");
        userObjects.push(obj);
    }
    localStorage.setItem("userObjects",JSON.stringify(userObjects));
    displayObjects();
});

const stored=localStorage.getItem("userObjects");
if(stored)userObjects=JSON.parse(stored);
displayObjects();

document.getElementById("filter-type").addEventListener("change",displayObjects);
document.getElementById("filter-material").addEventListener("change",displayObjects);
