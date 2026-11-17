# talentmatch-ai.
TalentMatch AI • Recrutador Virtual Inteligente
TalentMatch AI é um aplicativo web inteligente e leve de triagem, entrevista virtual automatizada e ranking de candidatos. O sistema foi desenvolvido para otimizar processos seletivos de forma ágil, permitindo que recrutadores configurem o fluxo de perguntas, avaliem currículos em PDF e gerem relatórios finais protegidos por senha numérica.
🎯 Objetivo do Projeto
Fornecer às empresas e recrutadores uma ferramenta autônoma, rápida e segura para conduzir entrevistas virtuais padronizadas com candidatos, extrair dados de currículos e centralizar relatórios de compatibilidade sem a necessidade de bancos de dados complexos ou servidores externos pesados.
✨ Funcionalidades Principais
Marcador Área do Recrutador Protegida por PIN de 1 Dígito:
Marcador O recrutador define e cadastra um PIN numérico único de um só dígito (0 a 9) no primeiro acesso, garantindo extrema rapidez e praticidade na validação.
Marcador Acesso restrito e blindado para visualizar candidatos, configurar perguntas e gerar o relatório final.
Marcador Configuração Dinâmica de Perguntas:
Marcador O próprio recrutador determina exatamente quantas perguntas (de 1 a 15) o candidato irá responder na entrevista virtual e personaliza os enunciados.
Marcador Triagem e Leitura de Currículo em PDF:
Marcador Os candidatos podem enviar o seu currículo em formato PDF (lido diretamente no navegador via PDF.js) ou colar o texto manualmente.
Marcador Entrevista Virtual Interativa (Texto e Voz):
Marcador O candidato visualiza as perguntas de forma guiada, podendo responder digitando ou utilizando o reconhecimento de voz nativo do navegador.
Marcador Geração de Relatório Final Exclusivo:
Marcador As respostas e o currículo são salvos de forma segura no armazenamento local (localStorage). A opção de gerar o Relatório Final e a análise de aderência fica oculta para os candidatos e visível somente para o recrutador autenticado.
🛠️ Construído Com (Tecnologias)
O projeto foi construído utilizando uma arquitetura moderna e estática de alta performance, sem dependências de compilação complexas:
Marcador HTML5 Semantic: Estrutura limpa das telas do aplicativo.
Marcador Tailwind CSS (via CDN): Design system moderno, responsivo e com identidade visual em modo escuro (Dark Mode).
Marcador JavaScript (Vanilla): Lógica completa de navegação, manipulação do localStorage, validação de PIN e integração de APIs.
Marcador PDF.js (via CDN): Leitura e extração de texto de arquivos PDF direto no lado do cliente (browser).
Marcador Vercel: Plataforma de hospedagem e deploy contínuo de alta velocidade.
📂 Estrutura do Repositório
O repositório possui uma estrutura minimalista e direta na raiz para garantir publicação instantânea:
talentmatch-ai/
├── index.html       # Interface principal, telas (candidato e recrutador) e estilos visuais
└── app.js           # Lógica do aplicativo, leitor de PDF, reconhecimento de voz e segurança por PIN
