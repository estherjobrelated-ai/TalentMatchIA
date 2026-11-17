// Configura o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Chaves do localStorage
const KEY_PIN = 'talentmatch_recrutador_pin';
const KEY_PERGUNTAS = 'talentmatch_perguntas_config';
const KEY_CANDIDATOS = 'talentmatch_candidatos_salvos';

// Perguntas padrão caso o recrutador ainda não tenha editado
const PERGUNTAS_PADRAO = [
  "Fale resumidamente sobre sua principal experiência profissional e conquistas recentes.",
  "Como você lida com prazos apertados e resolução de problemas imprevistos no dia a dia?",
  "Quais ferramentas ou tecnologias você domina melhor para esta vaga?",
  "Qual é o seu nível de proficiência em língua inglesa para leitura de documentação técnica e resolução de problemas no dia a dia?"
];

// Estado temporário da entrevista atual
let curriculoExtraido = "";
let nomeArquivoPDF = "";
let perguntasAtivas = [];
let indicePerguntaAtual = 0;
let respostasCandidato = [];

// Inicialização
window.onload = () => {
  if (!localStorage.getItem(KEY_PERGUNTAS)) {
    localStorage.setItem(KEY_PERGUNTAS, JSON.stringify(PERGUNTAS_PADRAO));
  }
};

// ==========================================
// 1. LÓGICA DO PIN DE 1 DÍGITO DO RECRUTADOR
// ==========================================

function abrirModalRecrutador() {
  const pinSalvo = localStorage.getItem(KEY_PIN);
  const titulo = document.getElementById('modal-pin-titulo');
  const desc = document.getElementById('modal-pin-desc');
  const input = document.getElementById('input-pin');
  const erro = document.getElementById('modal-pin-erro');

  erro.classList.add('hidden');
  input.value = '';

  if (!pinSalvo) {
    titulo.textContent = "Criar PIN do Recrutador";
    desc.textContent = "Primeiro acesso: defina um PIN de apenas 1 único número (de 0 a 9) para proteger os relatórios.";
  } else {
    titulo.textContent = "Acesso Restrito • Recrutador";
    desc.textContent = "Digite seu PIN de 1 dígito para configurar perguntas ou gerar o Relatório Final.";
  }

  document.getElementById('modal-pin').classList.remove('hidden');
  setTimeout(() => input.focus(), 100);
}

function fecharModalPIN() {
  document.getElementById('modal-pin').classList.add('hidden');
}

function confirmarPIN() {
  const input = document.getElementById('input-pin').value.trim();
  const erro = document.getElementById('modal-pin-erro');
  const pinSalvo = localStorage.getItem(KEY_PIN);

  // Validação obrigatória: exatamente 1 dígito numérico de 0 a 9
  if (!/^[0-9]$/.test(input)) {
    erro.textContent = "Digite obrigatoriamente apenas 1 único número (0 a 9).";
    erro.classList.remove('hidden');
    return;
  }

  if (!pinSalvo) {
    // Primeiro acesso: cadastra e salva o PIN no navegador
    localStorage.setItem(KEY_PIN, input);
    fecharModalPIN();
    entrarPainelRecrutador();
  } else {
    // Valida o PIN digitado
    if (input === pinSalvo) {
      fecharModalPIN();
      entrarPainelRecrutador();
    } else {
      erro.textContent = "PIN incorreto. Tente novamente.";
      erro.classList.remove('hidden');
      document.getElementById('input-pin').value = '';
    }
  }
}

function redefinirPIN() {
  if (confirm("Deseja apagar o PIN atual e cadastrar um novo número de 0 a 9?")) {
    localStorage.removeItem(KEY_PIN);
    sairModoRecrutador();
    abrirModalRecrutador();
  }
}

// ==========================================
// 2. PAINEL DO RECRUTADOR (PERGUNTAS + RELATÓRIO)
// ==========================================

function entrarPainelRecrutador() {
  esconderTodasTelas();
  document.getElementById('tela-recrutador').classList.remove('hidden');

  const perguntasSalvas = JSON.parse(localStorage.getItem(KEY_PERGUNTAS)) || PERGUNTAS_PADRAO;
  document.getElementById('qtd-perguntas').value = perguntasSalvas.length;
  renderizarInputsPerguntas(perguntasSalvas);
  renderizarListaCandidatos();
}

function sairModoRecrutador() {
  voltarParaInicio();
}

function atualizarCamposPerguntas() {
  let qtd = parseInt(document.getElementById('qtd-perguntas').value, 10);
  if (isNaN(qtd) || qtd < 1) qtd = 1;
  if (qtd > 15) qtd = 15;
  document.getElementById('qtd-perguntas').value = qtd;

  const atuais = Array.from(document.querySelectorAll('.input-pergunta-config')).map(el => el.value);
  const novaLista = [];

  for (let i = 0; i < qtd; i++) {
    novaLista.push(atuais[i] || PERGUNTAS_PADRAO[i] || `Pergunta ${i + 1}: Descreva sua experiência relevante.`);
  }
  renderizarInputsPerguntas(novaLista);
}

function renderizarInputsPerguntas(lista) {
  const container = document.getElementById('lista-inputs-perguntas');
  container.innerHTML = '';

  lista.forEach((texto, idx) => {
    container.innerHTML += `
      <div>
        <label class="block text-[11px] font-semibold text-gray-400 mb-1">Pergunta ${idx + 1}</label>
        <input type="text" value="${texto.replace(/"/g, '&quot;')}" class="input-pergunta-config w-full input-dark rounded-xl px-3.5 py-2.5 text-sm" />
      </div>
    `;
  });
}

function salvarConfiguracaoPerguntas() {
  const inputs = document.querySelectorAll('.input-pergunta-config');
  const novasPerguntas = Array.from(inputs)
    .map(i => i.value.trim())
    .filter(texto => texto.length > 0);

  if (novasPerguntas.length === 0) {
    alert("Adicione pelo menos 1 pergunta.");
    return;
  }

  localStorage.setItem(KEY_PERGUNTAS, JSON.stringify(novasPerguntas));
  alert(`Configuração salva! A entrevista agora terá exatamente ${novasPerguntas.length} pergunta(s).`);
}

function renderizarListaCandidatos() {
  const lista = JSON.parse(localStorage.getItem(KEY_CANDIDATOS)) || [];
  const container = document.getElementById('lista-candidatos');

  if (lista.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Nenhum candidato concluiu a entrevista ainda.</p>`;
    return;
  }

  container.innerHTML = lista.map((cand, index) => `
    <div class="input-dark rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p class="font-bold text-white text-sm">${cand.nome}</p>
        <p class="text-xs text-gray-400">Concluído em: ${cand.data} • ${cand.respostas.length} perguntas respondidas</p>
        <p class="text-[11px] text-[#7C6BF8] mt-0.5">Currículo: ${cand.arquivoPDF || 'Texto colado'}</p>
      </div>
      <button onclick="gerarRelatorioFinal(${index})" class="btn-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0">
        Gerar Relatório Final
      </button>
    </div>
  `).join('');
}

function gerarRelatorioFinal(index) {
  const lista = JSON.parse(localStorage.getItem(KEY_CANDIDATOS)) || [];
  const cand = lista[index];
  if (!cand) return;

  // Análise automática simples de palavras-chave e completude
  const totalPalavras = cand.respostas.reduce((acc, item) => acc + item.resposta.split(/\s+/).length, 0);
  const mediaPalavras = Math.round(totalPalavras / cand.respostas.length);
  const scoreCompatibilidade = Math.min(98, Math.max(62, 60 + mediaPalavras * 2 + (cand.curriculo.length > 200 ? 15 : 5)));

  const box = document.getElementById('box-relatorio-final');
  const conteudo = document.getElementById('conteudo-relatorio-final');

  conteudo.innerHTML = `
    <div class="grid grid-cols-2 gap-3 bg-[#09090D] p-4 rounded-xl border border-[#27273A]">
      <div>
        <span class="text-[11px] text-gray-400 uppercase">Candidato</span>
        <p class="font-bold text-white">${cand.nome}</p>
      </div>
      <div>
        <span class="text-[11px] text-gray-400 uppercase">Índice de Aderência</span>
        <p class="font-bold text-emerald-400 text-lg">${scoreCompatibilidade}%</p>
      </div>
    </div>

    <div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-[#7C6BF8] mb-2">Resumo do Currículo Enviado</h4>
      <div class="bg-[#09090D] p-3.5 rounded-xl border border-[#27273A] text-xs text-gray-300 max-h-40 overflow-y-auto whitespace-pre-line">
        ${cand.curriculo || "Nenhum texto de currículo extraído."}
      </div>
    </div>

    <div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-[#7C6BF8] mb-2">Transcrição da Entrevista (${cand.respostas.length} Perguntas)</h4>
      <div class="space-y-3">
        ${cand.respostas.map((r, i) => `
          <div class="bg-[#09090D] p-3.5 rounded-xl border border-[#27273A]">
            <p class="text-xs font-semibold text-white mb-1">${i + 1}. ${r.pergunta}</p>
            <p class="text-xs text-gray-300">"${r.resposta}"</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  box.classList.remove('hidden');
  box.scrollIntoView({ behavior: 'smooth' });
}

function limparCandidatos() {
  if (confirm("Deseja apagar todos os registros de candidatos salvos neste navegador?")) {
    localStorage.removeItem(KEY_CANDIDATOS);
    document.getElementById('box-relatorio-final').classList.add('hidden');
    renderizarListaCandidatos();
  }
}

// ==========================================
// 3. FLUXO DO CANDIDATO (PDF + ENTREVISTA)
// ==========================================

async function processarPDF(event) {
  const file = event.target.files[0];
  if (!file) return;

  nomeArquivoPDF = file.name;
  const statusEl = document.getElementById('pdf-status');
  statusEl.textContent = `Lendo PDF: ${file.name}...`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      textoCompleto += pageText + '\n';
    }

    curriculoExtraido = textoCompleto.trim();
    document.getElementById('curriculo-texto').value = curriculoExtraido;
    statusEl.innerHTML = `<span class="text-emerald-400 font-medium">✓ PDF carregado: ${file.name}</span>`;
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<span class="text-red-400">Erro ao ler PDF. Cole o texto abaixo.</span>`;
  }
}

function iniciarEntrevista() {
  const nome = document.getElementById('candidato-nome').value.trim();
  const textoCurriculo = document.getElementById('curriculo-texto').value.trim();

  if (!nome) {
    alert("Por favor, preencha seu nome completo.");
    return;
  }
  if (!textoCurriculo && !nomeArquivoPDF) {
    alert("Por favor, selecione o PDF do currículo ou cole o texto.");
    return;
  }

  curriculoExtraido = textoCurriculo;
  perguntasAtivas = JSON.parse(localStorage.getItem(KEY_PERGUNTAS)) || PERGUNTAS_PADRAO;
  indicePerguntaAtual = 0;
  respostasCandidato = [];

  esconderTodasTelas();
  document.getElementById('tela-entrevista').classList.remove('hidden');
  document.getElementById('entrevista-header-nome').textContent = `ENTREVISTA VIRTUAL • ${nome.toUpperCase()}`;

  exibirPerguntaAtual();
}

function exibirPerguntaAtual() {
  const total = perguntasAtivas.length;
  document.getElementById('entrevista-contador').textContent = `Pergunta ${indicePerguntaAtual + 1} de ${total}`;
  document.getElementById('pergunta-atual-texto').textContent = `"${perguntasAtivas[indicePerguntaAtual]}"`;
  document.getElementById('resposta-atual').value = '';

  const btn = document.getElementById('btn-proxima-pergunta');
  if (indicePerguntaAtual === total - 1) {
    btn.textContent = "Concluir e Enviar Entrevista";
  } else {
    btn.textContent = "Próxima Pergunta";
  }
}

function salvarEAvancar() {
  const resposta = document.getElementById('resposta-atual').value.trim();
  if (!resposta) {
    alert("Por favor, responda à pergunta antes de continuar.");
    return;
  }

  respostasCandidato.push({
    pergunta: perguntasAtivas[indicePerguntaAtual],
    resposta: resposta
  });

  if (indicePerguntaAtual < perguntasAtivas.length - 1) {
    indicePerguntaAtual++;
    exibirPerguntaAtual();
  } else {
    finalizarEntrevistaCandidato();
  }
}

function finalizarEntrevistaCandidato() {
  const nome = document.getElementById('candidato-nome').value.trim();
  const listaSalva = JSON.parse(localStorage.getItem(KEY_CANDIDATOS)) || [];

  listaSalva.unshift({
    nome: nome,
    arquivoPDF: nomeArquivoPDF,
    curriculo: curriculoExtraido,
    respostas: respostasCandidato,
    data: new Date().toLocaleString('pt-BR')
  });

  // Salva no navegador para apenas o recrutador acessar depois
  localStorage.setItem(KEY_CANDIDATOS, JSON.stringify(listaSalva));

  esconderTodasTelas();
  document.getElementById('tela-concluido-candidato').classList.remove('hidden');
}

// ==========================================
// 4. RECONHECIMENTO DE VOZ E NAVEGAÇÃO
// ==========================================

function ativarReconhecimentoVoz() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Seu navegador não suporta ditado por voz. Digite sua resposta.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;

  const btnTexto = document.getElementById('btn-voz-texto');
  btnTexto.textContent = "Ouvindo...";

  recognition.onresult = (event) => {
    const transcricao = event.results[0][0].transcript;
    const campo = document.getElementById('resposta-atual');
    campo.value = campo.value ? `${campo.value} ${transcricao}` : transcricao;
  };

  recognition.onend = () => {
    btnTexto.textContent = "Responder por Voz";
  };

  recognition.start();
}

function esconderTodasTelas() {
  document.getElementById('tela-candidato-inicio').classList.add('hidden');
  document.getElementById('tela-entrevista').classList.add('hidden');
  document.getElementById('tela-concluido-candidato').classList.add('hidden');
  document.getElementById('tela-recrutador').classList.add('hidden');
}

function voltarParaInicio() {
  esconderTodasTelas();
  document.getElementById('candidato-nome').value = '';
  document.getElementById('curriculo-texto').value = '';
  document.getElementById('pdf-status').textContent = 'Clique para selecionar PDF do currículo';
  nomeArquivoPDF = '';
  curriculoExtraido = '';
  document.getElementById('tela-candidato-inicio').classList.remove('hidden');
}
