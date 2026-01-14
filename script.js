const params = new URLSearchParams(window.location.search);

const domain = params.get("domain") || "http://localhost:3900";

const title = params.get("title") || "Pergunta";
const aText = params.get("a") || "Opção A";
const bText = params.get("b") || "Opção B";
const cText = params.get("c") || "Opção C";
const dText = params.get("d") || "Opção D";

const rightAnswer = (params.get("rightAnswer") || "").toLowerCase().trim(); // a|b|c|d
const reveal = (params.get("reveal") || "0") === "1";

function norm(s){
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Render imediato (como o original)
document.getElementById("title").textContent = title;
document.getElementById("text_a").textContent = aText;
document.getElementById("text_b").textContent = bText;
document.getElementById("text_c").textContent = cText;
document.getElementById("text_d").textContent = dText;

const statusEl = document.getElementById("status");

// Revelar correta (controlado por URL)
function applyReveal(){
  ["a","b","c","d"].forEach(k => {
    const el = document.getElementById(`opt_${k}`);
    el.classList.remove("correct");
  });

  if (reveal && rightAnswer && ["a","b","c","d"].includes(rightAnswer)){
    document.getElementById(`opt_${rightAnswer}`).classList.add("correct");
  }
}
applyReveal();

// Atualiza UI
function updateUI(counts){
  const total = (counts.a + counts.b + counts.c + counts.d) || 1;

  const set = (k) => {
    document.getElementById(`count_${k}`).textContent = counts[k];
    document.getElementById(`fill_${k}`).style.width = `${(counts[k]/total)*100}%`;
  };

  set("a"); set("b"); set("c"); set("d");

  const realTotal = counts.a + counts.b + counts.c + counts.d;
  statusEl.textContent = `Votos: ${realTotal}`;
}

// Limpa chat no arranque (igual ao teu exemplo)
fetch(`${domain}/clear-chat?words=a,b,c,d`)
  .then(() => setTimeout(fetchData, 500))
  .catch(() => { statusEl.textContent = "Sem ligação ao servidor"; });

async function fetchData(){
  try{
    const res = await fetch(`${domain}/wordcloud`, { cache: "no-store" });
    const data = await res.json();

    const arr = (data.wordcloud || "")
      .split(",")
      .map(norm)
      .filter(Boolean);

    const counts = { a:0, b:0, c:0, d:0 };

    for (const w of arr){
      if (w === "a" || w === "b" || w === "c" || w === "d"){
        counts[w]++;
      }
    }

    updateUI(counts);
    statusEl.textContent = "A ler comentários…";
  } catch(e){
    statusEl.textContent = "Erro ao ler wordcloud…";
  }
}

setInterval(fetchData, 1000);
