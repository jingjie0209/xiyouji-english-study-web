(() => {
  const episodes = window.XIYOU_EPISODES || [];
  const state = { episode: 1, range: 'all', query: '', tab: 'dialogue' };
  const $ = (s) => document.querySelector(s);
  const list = $('#episodeList');
  const search = $('#searchInput');

  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const firstSentence = (text) => String(text || '').replace(/\s+/g, ' ').trim();
  const episode = () => episodes.find(e => e.episode === state.episode) || episodes[0];

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return episodes.filter(e => {
      const inRange = state.range === 'all' || (() => { const [a,b] = state.range.split('-').map(Number); return e.episode >= a && e.episode <= b; })();
      if (!inRange) return false;
      if (!q) return true;
      return [e.episode, e.titleZh, e.titleEn, ...e.dialogue.slice(0, 12).map(x => x.en)].join(' ').toLowerCase().includes(q);
    });
  }

  function renderList() {
    const rows = filtered();
    list.innerHTML = rows.length ? rows.map(e => `
      <button class="episode-item ${e.episode === state.episode ? 'active' : ''}" data-episode="${e.episode}">
        <span class="ep-num">${String(e.episode).padStart(3, '0')}</span>
        <span><span class="ep-title">${esc(e.titleZh)}</span><span class="ep-en">${esc(e.titleEn || '')}</span></span>
      </button>`).join('') : '<div class="empty">没有找到匹配集数</div>';
    list.querySelectorAll('[data-episode]').forEach(btn => btn.addEventListener('click', () => { state.episode = Number(btn.dataset.episode); render(); window.scrollTo({top: 0, behavior: 'smooth'}); }));
  }

  function stats(e) {
    return `<div class="stat"><strong>${e.lineCount}</strong><span>组台词</span></div><div class="stat"><strong>${e.grammarCount}</strong><span>类语法句型</span></div><div class="stat"><strong>${e.collocationCount}</strong><span>组固定搭配</span></div>`;
  }

  function renderDialogue(e) {
    return `<p class="panel-intro">按原 PDF 台词顺序排列。音标保留原 PDF 中的标注体系。</p><table class="dialogue-table"><thead><tr><th>序号</th><th>英文</th><th>音标</th><th>中文</th></tr></thead><tbody>${e.dialogue.map((r,i) => `<tr><td>${i+1}</td><td class="english">${esc(r.en)}</td><td class="ipa">[${esc(r.ipa)}]</td><td class="zh">${esc(r.zh)}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderGrammar(e) {
    if (!e.grammar.length) return '<div class="empty">本集暂未匹配到可独立整理的语法句型。</div>';
    return `<p class="panel-intro">原文例句来自本集台词；扩展例句用于替换练习，不属于原剧台词。</p><table class="grammar-table"><thead><tr><th>语法类型</th><th>语法句型</th><th>说明</th><th>原文例句</th><th>扩展例句 10 句</th></tr></thead><tbody>${e.grammar.map(r => `<tr><td><strong>${esc(r.type)}</strong></td><td class="pattern">${esc(r.pattern)}</td><td>${esc(r.description)}</td><td class="source">${esc(r.source)}</td><td><ol class="examples">${r.examples.map(x => `<li>${esc(x)}</li>`).join('')}</ol></td></tr>`).join('')}</tbody></table>`;
  }

  function renderCollocations(e) {
    if (!e.collocations.length) return '<div class="empty">本集暂未匹配到固定搭配。</div>';
    return `<p class="panel-intro">固定搭配取自本集英文台词；语境栏保留完整原文句子。</p><table class="colloc-table"><thead><tr><th>固定搭配</th><th>音标</th><th>中文</th><th>原文语境</th></tr></thead><tbody>${e.collocations.map(r => `<tr><td class="phrase">${esc(r.phrase)}</td><td class="ipa">[${esc(r.ipa)}]</td><td>${esc(r.zh)}</td><td class="context">${esc(r.context)}</td></tr>`).join('')}</tbody></table>`;
  }

  function render() {
    const e = episode();
    if (!e) return;
    $('#loading').hidden = true; $('#episodeView').hidden = false;
    $('#episodeKicker').textContent = `第 ${e.episode} 集 · ${e.range} 集单元`;
    $('#episodeTitle').textContent = e.titleZh;
    $('#episodeEnTitle').textContent = e.titleEn || 'Journey to the West';
    $('#stats').innerHTML = stats(e);
    $('#prevBtn').disabled = e.episode <= 1; $('#nextBtn').disabled = e.episode >= episodes.length;
    $('#dialoguePanel').innerHTML = renderDialogue(e);
    $('#grammarPanel').innerHTML = renderGrammar(e);
    $('#collocationsPanel').innerHTML = renderCollocations(e);
    document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === state.tab));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.hidden = panel.id !== `${state.tab}Panel`);
    renderList();
  }

  search.addEventListener('input', e => { state.query = e.target.value; renderList(); });
  document.querySelectorAll('[data-range]').forEach(btn => btn.addEventListener('click', () => { state.range = btn.dataset.range; document.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x === btn)); renderList(); }));
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => { state.tab = btn.dataset.tab; render(); }));
  $('#prevBtn').addEventListener('click', () => { if (state.episode > 1) { state.episode--; render(); } });
  $('#nextBtn').addEventListener('click', () => { if (state.episode < episodes.length) { state.episode++; render(); } });
  $('#randomBtn').addEventListener('click', () => { state.episode = Math.floor(Math.random() * episodes.length) + 1; render(); window.scrollTo({top:0,behavior:'smooth'}); });
  $('#printBtn').addEventListener('click', () => { document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('print-active')); window.print(); setTimeout(() => document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('print-active')), 500); });
  render();
})();
