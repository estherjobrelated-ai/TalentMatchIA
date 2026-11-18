// --- CONFIGURAÇÕES E ESTADO GLOBAL ---
let perguntasPadrao = [
  "Qual é a sua principal motivação para assumir este desafio na nossa empresa?",
  "Descreva uma situação complexa que enfrentou no seu último projeto e como a resolveu.",
  "Como gere o seu tempo e prazos quando tem múltiplas tarefas urgentes?",
  "Onde se vê profissionalmente daqui a 3 anos e como planeia lá chegar?",
  "Explique como lida com feedbacks negativos ou críticas construtivas no ambiente de trabalho.",
  "Qual considera ser a sua maior competência técnica e como a aplica no dia a dia?",
  "Descreva uma experiência em que trabalhou em equipa sob forte pressão.",
  "Como se mantém atualizado(a) em relação às novidades da sua área de atuação?",
  "Porque devemos escolhê-lo(a) em detrimento de outros candidatos?",
  "Tem alguma dúvida ou questão sobre a nossa empresa ou sobre a vaga?"
];

let perguntasAtuais = [];
let perguntaAtualIndex = 0;
let respostasCandidato = [];
let curriculoTextoConteudo = "";

// Carrega as configurações guardadas ao iniciar
window.addEventListener('DOMContentLoaded', () => {
  carregarConfiguracoesRecrutador();
});

// --- LEITOR DE PDF (PDF.JS) ---
async function processarPDF(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('pdf-status');
  statusEl.textContent = "A ler currículo PDF...";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    
    let textoExtraido = "";
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      textoExtraido += pageText + "\n";
    }

    curriculoTextoConteudo = textoExtraido.trim();
    document.getElementById('curriculo-texto').value = curriculoTextoConteudo;
    statusEl.textContent = `PDF carregado com sucesso: ${file.name}`;
  } catch (error) {
    console.error("Erro ao ler PDF:", error);
    statusEl.textContent = "Erro ao ler PDF. Tente colar o texto manualmente.";
  }
}

// --- FLUXO DA ENTREVISTA ---
function iniciarEntrevista() {
  const textoManual = document.getElementById('curriculo-texto').value.trim();
  if (textoManual) {
    curriculoTextoConteudo = textoManual;
  }

  if (!curriculoTextoConteudo) {
    alert("Por favor, faça o upload de um currículo em PDF ou cole o texto do currículo antes de iniciar.");
    return;
  }

  // Carrega as perguntas configuradas pelo recrutador
  carregarConfiguracoesRecrutador();
  if (!perguntasAtuais || perguntasAtuais.length === 0) {
    perguntasAtuais = [...perguntasPadrao];
  }

  perguntaAtualIndex = 0;
  respostasCandidato = [];

  // Transição segura de telas (Evita tela preta)
  document.getElementById('tela-candidato-inicio').classList.add('hidden');
  document.getElementById('tela-recrutador').classList.add('hidden');
  document.getElementById('tela-entrevista').classList.remove('hidden');

  mostrarPerguntaAtual();
}

function mostrarPerguntaAtual() {
  if (perguntaAtualIndex >= perguntasAtuais.length) {
    finalizarEntrevistaCandidato();
    return;
  }

  document.getElementById('entrevista-contador').textContent = `Pergunta ${perguntaAtualIndex + 1} de ${perguntasAtuais.length}`;
  document.getElementById('pergunta-atual-texto').textContent = perguntasAtuais[perguntaAtualIndex];
  document.getElementById('resposta-atual').value = "";
}

function salvarEAvancar() {
  const resposta = document.getElementById('resposta-atual').value.trim();
  if (!resposta) {
    alert("Por favor, responda à pergunta antes de avançar.");
    return;
  }

  respostasCandidato.push({
    pergunta: perguntasAtuais[perguntaAtualIndex],
    resposta: resposta
  });

  perguntaAtualIndex++;
  mostrarPerguntaAtual();
}

function finalizarEntrevistaCandidato() {
  // Salva no localStorage para o painel do recrutador
  let candidatosSalvos = JSON.parse(localStorage.getItem('talentmatch_candidatos') || '[]');
  
  const novoCandidato = {
    id: Date.now(),
    data: new Date().toLocaleDateString('pt-BR'),
    curriculo: curriculoTextoConteudo,
    respostas: respostasCandidato
  };

  candidatosSalvos.push(novoCandidato);
  localStorage.setItem('talentmatch_candidatos', JSON.stringify(candidatosSalvos));

  // Esconde entrevista e mostra tela de conclusão (bloqueada para o candidato)
  document.getElementById('tela-entrevista').classList.add('hidden');
  document.getElementById('tela-concluido-candidato').classList.remove('hidden');
}

function voltarParaInicio() {
  curriculoTextoConteudo = "";
  document.getElementById('curriculo-texto').value = "";
  document.getElementById('pdf-status').textContent = "Clique para selecionar PDF do currículo";
  document.getElementById('pdf-upload').value = "";
  
  document.getElementById('tela-concluido-candidato').classList.add('hidden');
  document.getElementById('tela-candidato-inicio').classList.remove('hidden');
}

// --- RECONHECIMENTO DE VOZ ---
function ativarReconhecimentoVoz() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("O seu navegador não suporta reconhecimento de voz direto. Utilize a digitação.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const btnVozTexto = document.getElementById('btn-voz-texto');
  btnVozTexto.textContent = "A ouvir...";

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    const textarea = document.getElementById('resposta-atual');
    textarea.value = textarea.value ? textarea.value + " " + speechResult : speechResult;
    btnVozTexto.textContent = "Responder por Voz";
  };

  recognition.onerror = () => {
    btnVozTexto.textContent = "Responder por Voz";
    alert("Erro no reconhecimento de voz. Tente novamente.");
  };

  recognition.onend = () => {
    btnVozTexto.textContent = "Responder por Voz";
  };

  recognition.start();
}

// --- ÁREA DO RECRUTADOR E SEGURANÇA POR PIN DE 1 DÍGITO ---
let acaoAposPIN = null;

function abrirModalRecrutador() {
  const pinSalvo = localStorage.getItem('talentmatch_pin');
  
  document.getElementById('modal-pin').classList.remove('hidden');
  document.getElementById('input-pin').value = "";
  document.getElementById('modal-pin-erro').classList.add('hidden');

  if (!pinSalvo) {
    document.getElementById('modal-pin-titulo').textContent = "Criar PIN do Recrutador";
    document.getElementById('modal-pin-desc').textContent = "Defina um PIN numérico de 1 único dígito (0 a 9) para proteger o acesso.";
    acaoAposPIN = 'criar';
  } else {
    document.getElementById('modal-pin-titulo').textContent = "Acesso do Recrutador";
    document.getElementById('modal-pin-desc').textContent = "Digite o seu PIN numérico de 1 dígito para entrar.";
    acaoAposPIN = 'entrar';
  }
}

function fecharModalPIN() {
  document.getElementById('modal-pin').classList.add('hidden');
}

function confirmarPIN() {
  const inputPin = document.getElementById('input-pin').value.trim();
  const erroEl = document.getElementById('modal-pin-erro');

  if (inputPin.length !== 1 || !/[0-9]/.test(inputPin)) {
    erroEl.textContent = "Por favor, digite exatamente 1 dígito numérico (0 a 9).";
    erroEl.classList.remove('hidden');
    return;
  }

  const pinSalvo = localStorage.getItem('talentmatch_pin');

  if (acaoAposPIN === 'criar') {
    localStorage.setItem('talentmatch_pin', inputPin);
    fecharModalPIN();
    entrarPainelRecrutador();
  } else {
    if (inputPin === pinSalvo) {
      fecharModalPIN();
      entrarPainelRecrutador();
    } else {
      erroEl.textContent = "PIN incorreto. Tente novamente.";
      erroEl.classList.remove('hidden');
    }
  }
}

function redefinirPIN() {
  localStorage.removeItem('talentmatch_pin');
  abrirModalRecrutador();
}

function entrarPainelRecrutador() {
  document.getElementById('tela-candidato-inicio').classList.add('hidden');
  document.getElementById('tela-entrevista').classList.add('hidden');
  document.getElementById('tela-concluido-candidato').classList.add('hidden');
  document.getElementById('tela-recrutador').classList.remove('hidden');

  carregarConfiguracoesRecrutador();
  renderizarListaCandidatos();
}

function sairModoRecrutador() {
  document.getElementById('tela-recrutador').classList.add('hidden');
  document.getElementById('tela-candidato-inicio').classList.remove('hidden');
}

// --- CONFIGURAÇÃO DE PERGUNTAS DO RECRUTADOR ---
function carregarConfiguracoesRecrutador() {
  let perguntasSalvas = JSON.parse(localStorage.getItem('talentmatch_perguntas'));
  if (!perguntasSalvas || perguntasSalvas.length === 0) {
    perguntasAtuais = [...perguntasPadrao];
  } else {
    perguntasAtuais = perguntasSalvas;
  }

  const qtdInput = document.getElementById('qtd-perguntas');
  if (qtdInput) {
    qtdInput.value = perguntasAtuais.length;
  }
  renderizarInputsPerguntas(perguntasAtuais);
}

function atualizarCamposPerguntas() {
  let qtd = parseInt(document.getElementById('qtd-perguntas').value);
  if (isNaN(qtd) || qtd < 1) qtd = 1;
  if (qtd > 15) qtd = 15;
  document.getElementById('qtd-perguntas').value = qtd;

  let novasPerguntas = [];
  for (let i = 0; i < qtd; i++) {
    novasPerguntas.push(perguntasAtuais[i] || `Pergunta ${i + 1}: Descreva sua experiência relevante para este cargo.`);
  }
  renderizarInputsPerguntas(novasPerguntas);
}

function renderizarInputsPerguntas(lista) {
  const container = document.getElementById('lista-inputs-perguntas');
  if (!container) return;

  container.innerHTML = "";
  lista.forEach((pergunta, index) => {
    const div = document.createElement('div');
    div.className = "space-y-1";
    div.innerHTML = `
      <label class="text-[10px] uppercase font-semibold text-gray-400">Pergunta ${index + 1}</label>
      <input type="text" value="${pergunta}" class="input-pergunta-item w-full input-dark rounded-xl px-3.5 py-2.5 text-sm" />
    `;
    container.appendChild(div);
  });
}

function salvarConfiguracaoPerguntas() {
  const inputs = document.querySelectorAll('.input-pergunta-item');
  let novasPerguntas = [];
  
  inputs.forEach(input => {
    if (input.value.trim()) {
      novasPerguntas.push(input.value.trim());
    }
  });

  if (novasPerguntas.length === 0) {
    alert("Insira pelo menos uma pergunta.");
    return;
  }

  localStorage.setItem('talentmatch_perguntas', JSON.stringify(novasPerguntas));
  perguntasAtuais = novasPerguntas;
  alert("Configuração de perguntas salva com sucesso para os próximos candidatos!");
}

// --- GESTÃO DE CANDIDATOS E RELATÓRIO FINAL ---
function renderizarListaCandidatos() {
  const container = document.getElementById('lista-candidatos');
  if (!container) return;

  let candidatos = JSON.parse(localStorage.getItem('talentmatch_candidatos') || '[]');
  container.innerHTML = "";

  if (candidatos.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 italic">Ainda não existem candidatos avaliados.</p>`;
    return;
  }

  candidatos.forEach((cand, idx) => {
    const card = document.createElement('div');
    card.className = "card-dark rounded-xl p-4 flex items-center justify-between border border-[#27273A]";
    card.innerHTML = `
      <div>
        <span class="text-xs font-bold text-white">Candidato #${idx + 1}</span>
        <p class="text-[11px] text-gray-400">Data: ${cand.data} • Respostas: ${cand.respostas.length}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="gerarRelatorioFinal(${cand.id})" class="text-xs px-3 py-1.5 rounded-lg btn-primary text-white font-medium">Ver Relatório</button>
        <button onclick="removerCandidato(${cand.id})" class="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">Excluir</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function gerarRelatorioFinal(id) {
  let candidatos = JSON.parse(localStorage.getItem('talentmatch_candidatos') || '[]');
  const cand = candidatos.find(c => c.id === id);
  if (!cand) return;

  const boxRelatorio = document.getElementById('box-relatorio-final');
  const conteudo = document.getElementById('conteudo-relatorio-final');
  
  boxRelatorio.classList.remove('hidden');

  let htmlRespostas = cand.respostas.map((r, i) => `
    <div class="p-3.5 rounded-xl bg-[#09090D] border border-[#27273A] space-y-1">
      <p class="text-xs font-semibold text-[#7C6BF8]">P${i + 1}: ${r.pergunta}</p>
      <p class="text-sm text-gray-200">R: ${r.resposta}</p>
    </div>
  `).join('');

  conteudo.innerHTML = `
    <div class="space-y-3">
      <div>
        <h4 class="text-xs uppercase font-bold text-gray-400">Data da Entrevista</h4>
        <p class="text-sm text-white font-medium">${cand.data}</p>
      </div>
      <div>
        <h4 class="text-xs uppercase font-bold text-gray-400">Currículo Extraído / Texto</h4>
        <div class="p-3 rounded-xl bg-[#09090D] border border-[#27273A] text-xs text-gray-300 max-h-36 overflow-y-auto whitespace-pre-wrap">${cand.curriculo}</div>
      </div>
      <div class="space-y-2">
        <h4 class="text-xs uppercase font-bold text-gray-400">Respostas da Entrevista Virtual</h4>
        ${htmlRespostas}
      </div>
    </div>
  `;

  boxRelatorio.scrollIntoView({ behavior: 'smooth' });
}

function removerCandidato(id) {
  let candidatos = JSON.parse(localStorage.getItem('talentmatch_candidatos') || '[]');
  candidatos = candidatos.filter(c => c.id !== id);
  localStorage.setItem('talentmatch_candidatos', JSON.stringify(candidatos));
  renderizarListaCandidatos();
  document.getElementById('box-relatorio-final').classList.add('hidden');
}

function limparCandidatos() {
  if (confirm("Tem certeza que deseja limpar todo o histórico de candidatos?")) {
    localStorage.removeItem('talentmatch_candidatos');
    renderizarListaCandidatos();
    document.getElementById('box-relatorio-final').classList.add('hidden');
  }
}

