/* Catálogo pesquisável: o comprador marca os itens e envia a lista pelo WhatsApp.
   Dados em catalogo-dados.js (const CATALOGO). Sem JS, a seção mostra o link para pedir a lista completa. */
(function () {
  const raiz = document.querySelector('[data-catalogo]');
  if (!raiz || typeof CATALOGO === 'undefined') return;

  const WHATSAPP = raiz.dataset.whatsapp;
  const POR_PAGINA = window.matchMedia('(min-width: 1280px)').matches ? 36 : 24;
  const CHAVE = 'qp-lista';

  const busca = raiz.querySelector('[data-busca]');
  const filtrosEl = raiz.querySelector('[data-filtros]');
  const itensEl = raiz.querySelector('[data-itens]');
  const resumoEl = raiz.querySelector('[data-resumo]');
  const maisBtn = raiz.querySelector('[data-mais]');
  const listaEl = raiz.querySelector('[data-lista]');
  const vaziaEl = raiz.querySelector('[data-vazia]');
  const enviarLinks = document.querySelectorAll('[data-enviar-lista]');
  const contadores = document.querySelectorAll('[data-contador]');
  const limparBtn = raiz.querySelector('[data-limpar]');
  const barra = document.querySelector('[data-barra-lista]');

  const todos = [];
  Object.entries(CATALOGO).forEach(([categoria, itens]) => {
    itens.forEach((nome) => todos.push({ nome, categoria, chave: normalizar(nome) }));
  });

  let filtro = 'Todos';
  let limite = POR_PAGINA;
  let selecionados = carregar();

  raiz.querySelectorAll('[data-total-catalogo]').forEach((el) => (el.textContent = todos.length.toLocaleString('pt-BR')));
  raiz.classList.add('catalogo-ativo');

  function normalizar(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function carregar() {
    try {
      const salvo = JSON.parse(sessionStorage.getItem(CHAVE) || '[]');
      return Array.isArray(salvo) ? salvo : [];
    } catch {
      return [];
    }
  }

  function salvar() {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(selecionados));
    } catch {
      // Sem armazenamento: a lista vale só enquanto a página estiver aberta.
    }
  }

  const iconeCheck =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function montarFiltros() {
    const categorias = ['Todos', ...Object.keys(CATALOGO)];
    filtrosEl.innerHTML = '';
    categorias.forEach((cat) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'filtro-catalogo';
      b.textContent = cat;
      b.setAttribute('aria-pressed', String(cat === filtro));
      b.addEventListener('click', () => definirFiltro(cat));
      filtrosEl.appendChild(b);
    });
  }

  function definirFiltro(cat) {
    filtro = CATALOGO[cat] ? cat : 'Todos';
    limite = POR_PAGINA;
    filtrosEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === filtro)));
    renderizarItens();
  }

  function filtrados() {
    const termo = normalizar(busca.value.trim());
    return todos.filter(
      (i) => (filtro === 'Todos' || i.categoria === filtro) && (!termo || i.chave.includes(termo))
    );
  }

  function renderizarItens() {
    const lista = filtrados();
    itensEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    lista.slice(0, limite).forEach((item) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'item-catalogo';
      b.dataset.nome = item.nome;
      b.setAttribute('aria-pressed', String(selecionados.includes(item.nome)));
      b.innerHTML = `<span class="marca-item">${iconeCheck}</span><span></span>`;
      b.lastChild.textContent = item.nome;
      b.addEventListener('click', () => alternar(item.nome, b));
      li.appendChild(b);
      frag.appendChild(li);
    });
    itensEl.appendChild(frag);

    const termo = busca.value.trim();
    if (!lista.length) {
      resumoEl.innerHTML = '';
      const p = document.createElement('span');
      p.textContent = `Nenhum item com "${termo}" no catálogo. Peça pelo WhatsApp: a equipe verifica se consegue trazer.`;
      resumoEl.appendChild(p);
    } else {
      const n = lista.length.toLocaleString('pt-BR');
      resumoEl.textContent = termo || filtro !== 'Todos' ? `${n} ${lista.length === 1 ? 'item encontrado' : 'itens encontrados'}` : '';
    }
    maisBtn.hidden = lista.length <= limite;
  }

  function alternar(nome, botao) {
    const i = selecionados.indexOf(nome);
    if (i >= 0) selecionados.splice(i, 1);
    else selecionados.push(nome);
    if (botao) botao.setAttribute('aria-pressed', String(i < 0));
    salvar();
    renderizarLista(true);
  }

  function mensagem() {
    if (!selecionados.length) return raiz.dataset.msgVazia;
    const linhas = selecionados.map((n) => `- ${n}`).join('\n');
    return `Olá! Montei esta lista no site da QualiPrime e gostaria de uma cotação:\n${linhas}\n\nEstabelecimento:\nBairro:`;
  }

  function renderizarLista(pular) {
    listaEl.innerHTML = '';
    selecionados.forEach((nome) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between gap-3 py-2';
      const span = document.createElement('span');
      span.textContent = nome;
      const rem = document.createElement('button');
      rem.type = 'button';
      rem.className = 'icone-btn -mr-2 shrink-0';
      rem.setAttribute('aria-label', `Tirar ${nome} da lista`);
      rem.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      rem.addEventListener('click', () => {
        alternar(nome);
        const b = itensEl.querySelector(`[data-nome="${CSS.escape(nome)}"]`);
        if (b) b.setAttribute('aria-pressed', 'false');
      });
      li.append(span, rem);
      listaEl.appendChild(li);
    });

    const n = selecionados.length;
    vaziaEl.hidden = n > 0;
    limparBtn.hidden = n === 0;
    contadores.forEach((c) => {
      c.textContent = n;
      if (pular) {
        c.classList.remove('contador-pulo');
        void c.offsetWidth;
        c.classList.add('contador-pulo');
      }
    });
    const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem())}`;
    enviarLinks.forEach((a) => {
      a.href = href;
      const rotulo = a.querySelector('[data-rotulo]');
      if (rotulo) rotulo.textContent = n ? rotulo.dataset.comItens : rotulo.dataset.semItens;
    });
    atualizarBarra();
  }

  // Barra fixa no celular: aparece com itens na lista enquanto o catálogo está na tela
  let catalogoVisivel = false;
  function atualizarBarra() {
    if (!barra) return;
    const mostrar = catalogoVisivel && selecionados.length > 0;
    barra.hidden = !mostrar;
    document.body.classList.toggle('barra-lista-aberta', mostrar);
  }
  if (barra && 'IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      catalogoVisivel = entradas[0].isIntersecting;
      atualizarBarra();
    }, { rootMargin: '0px 0px -30% 0px' }).observe(raiz);
  }

  busca.addEventListener('input', () => {
    limite = POR_PAGINA;
    renderizarItens();
  });
  maisBtn.addEventListener('click', () => {
    limite += POR_PAGINA * 2;
    renderizarItens();
  });
  limparBtn.addEventListener('click', () => {
    selecionados = [];
    salvar();
    itensEl.querySelectorAll('[aria-pressed="true"]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    renderizarLista(false);
  });

  // Links "Ver no catálogo" das categorias
  document.querySelectorAll('[data-filtrar]').forEach((a) =>
    a.addEventListener('click', () => {
      busca.value = '';
      definirFiltro(a.dataset.filtrar);
    })
  );

  montarFiltros();
  renderizarItens();
  renderizarLista(false);
})();
