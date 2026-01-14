// ✅ Mantém a tua estrutura que funciona: wordcloud em localhost:3900
const params = new URLSearchParams(window.location.search);

const domain = params.get("domain") || "http://localhost:3900";

const title = params.get("title") || "Pergunta";
const opt = {
  a: params.get("a") || "Opção A",
  b: params.get("b") || "Opção B",
  c: params.get("c") || "Opção C",
  d: params.get("d") || "Opção D",
};

const rightAnswer = (params.get("rightAnswer") || "").toLowerCase().trim(); // a|b|c|d
const reveal = (params.get("reveal") || "0") === "1"; // reveal=1 para mostrar a correta

document.getElementById("title").textContent = title;

const $status = document.getElementById("status");
const $options = document.getElementById("options");

function norm(s){
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function makeOption(k){
  const el = document.createElement("div");
  el.className = "option";
  el.dataset.k = k;

  el.innerHTML = `
    <div class="correct">✅ Correta</div>

    <div class="option-top">
      <div class="badge">
        <div class="letter">${k.toUpperCase()}</div>
        <div class="text" id="text_${k}"></div>
      </div>
      <div class="count" id="count_${k}">0</div>
    </div>

    <div class="bar">
      <div class="fill" id="fill_${k}"></div>
    </div>
  `;

  el.querySelector(`#text_${k}`)?.replaceWith(); // noop, só para evitar warnings
  return el;
}

const order = ["a","b","c","d"];
const nodes = {};
order.forEach(k => {
  const node = makeOption(k);
  node.querySelector(`#text_${k}`); // may be null because id inside template; we’ll set text by querySelector below
  node.querySelector(".text").textContent = opt[k];
  nodes[k] = node;
  $options.appendChild(node);
});

// Aplica reveal
if (reveal){
  order.forEach(k => nodes[k].classList.add("reveal"));
  if (rightAnswer && nodes[rightAnswer]){
    nodes[rightAnswer].classList.add("correct-on");
  }
}

// Limpa chat para começar “limpo”
fetch(`${domain}/clear-chat?words=a,b,c,d`)
  .then(()=> setTimeout(fetchData, 500))
  .catch(()=>{ /* ignora */ });

function updateUI(counts){
  const total = order.reduce((s,k)=> s + (counts[k] || 0), 0) || 1;

  order.forEach(k => {
    const c = counts[k] || 0;
    nodes[k].querySelector(".count").textContent = c;

    const pct = (c / total) * 100;
    nodes[k].querySelector(".fill").style.width = `${pct}%`;
  });

  $status.textContent = `Votos: ${total === 1 && order.every(k => (counts[k]||0)===0) ? 0 : (order.reduce((s,k)=>s+(counts[k]||0),0))}`;
}

async function fetchData(){
  try{
    const res = await fetch(`${domain}/wordcloud`, { cache: "no-store" });
    const data = await res.json();

    const raw = (data.wordcloud || "");
    const arr = raw.split(",").map(norm).filter(Boolean);

    const counts = { a:0, b:0, c:0, d:0 };

    // Conta A/B/C/D
    arr.forEach(w=>{
      if (w === "a" || w === "b" || w === "c" || w === "d"){
        counts[w]++;
      }
    });

    updateUI(counts);
  } catch (e){
    $status.textContent = "Erro a ler wordcloud…";
  }
}

setInterval(fetchData, 1000);
