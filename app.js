(() => {
  const seriesMap = {
    journey: {
      id: 'journey',
      episodes: window.XIYOU_EPISODES || [],
      eyebrow: 'JOURNEY TO THE WEST · ENGLISH STUDY',
      title: '西游记 108 集英文学习整理',
      subtitle: '按每集整理英文台词、音标、中文、语法句型与固定搭配',
      catalog: '全书目录',
      footer: '内容依据《西游记》英文学习 PDF 整理 · 扩展例句为学习练习，不是原文台词',
      ranges: [['all', '全部', ''], ['1-36', '第 1–36 集', '36'], ['37-72', '第 37–72 集', '36'], ['73-108', '第 73–108 集', '36']],
      panelNote: '按原 PDF 台词顺序排列。音标保留原 PDF 中的标注体系。',
      theme: 'journey'
    },
    forest: {
      id: 'forest',
      episodes: window.BIG_GREEN_FOREST_EPISODES || [],
      eyebrow: 'THE BIG GREEN FOREST · ENGLISH STUDY',
      title: 'The Big Green Forest 24 集英文学习整理',
      subtitle: '按每集聚合英文台词、音标、中文、语法句型与固定搭配',
      catalog: '森林目录',
      footer: 'The Big Green Forest：第1–7集、第11–24集按随附视频字幕核对；第8–10集本地未提供视频，按 Little Fox 官方台词页补齐。扩展例句为学习练习，不是原剧台词。',
      ranges: [['all', '全部', ''], ['1-24', '第 1–24 集', '24']],
      panelNote: '台词按视频英文字幕整理，音标采用美式英语近似读音。第8–10集本地没有视频文件，已按 Little Fox 官方台词页补齐。',
      theme: 'forest'
    }
  };

  const state = { seriesId: location.hash === '#forest' ? 'forest' : 'journey', episode: 1, range: 'all', query: '', tab: 'dialogue' };
  const $ = (s) => document.querySelector(s);
  const list = $('#episodeList');
  const search = $('#searchInput');
  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentSeries = () => seriesMap[state.seriesId];
  const episodes = () => currentSeries().episodes;
  const episode = () => episodes().find(e => e.episode === state.episode) || episodes()[0];

  function setSeries(id) {
    if (!seriesMap[id] || id === state.seriesId) return;
    state.seriesId = id; state.episode = 1; state.range = 'all'; state.query = ''; state.tab = 'dialogue';
    location.hash = id === 'forest' ? 'forest' : 'journey';
    search.value = '';
    render();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function renderSeriesShell() {
    const s = currentSeries();
    document.body.dataset.series = s.theme;
    $('#seriesEyebrow').textContent = s.eyebrow;
    $('#siteTitle').textContent = s.title;
    $('#siteSubtitle').textContent = s.subtitle;
    $('#catalogLabel').textContent = s.catalog;
    $('#countBadge').textContent = `${episodes().length} 集`;
    $('#siteFooter').textContent = s.footer;
    $('#seriesSwitch').innerHTML = Object.values(seriesMap).map(item => `<button class="series-chip ${item.id === state.seriesId ? 'active' : ''}" data-series="${item.id}">${esc(item.id === 'forest' ? 'The Big Green Forest' : '西游记')}</button>`).join('');
    $('#seriesSwitch').querySelectorAll('[data-series]').forEach(btn => btn.addEventListener('click', () => setSeries(btn.dataset.series)));
    $('#rangeFilters').innerHTML = s.ranges.map(([value, label, count]) => `<button class="filter ${value === state.range ? 'active' : ''}" data-range="${value}">${label} <span>${count || episodes().length}</span></button>`).join('');
    $('#rangeFilters').querySelectorAll('[data-range]').forEach(btn => btn.addEventListener('click', () => { state.range = btn.dataset.range; renderList(); renderSeriesShell(); }));
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return episodes().filter(e => {
      const inRange = state.range === 'all' || (() => { const [a,b] = state.range.split('-').map(Number); return e.episode >= a && e.episode <= b; })();
      if (!inRange) return false;
      if (!q) return true;
      return [e.episode, e.titleZh, e.titleEn, ...e.dialogue.slice(0, 20).map(x => `${x.speaker || ''} ${x.en}`)].join(' ').toLowerCase().includes(q);
    });
  }

  function renderList() {
    const rows = filtered();
    list.innerHTML = rows.length ? rows.map(e => `<button class="episode-item ${e.episode === state.episode ? 'active' : ''}" data-episode="${e.episode}"><span class="ep-num">${String(e.episode).padStart(3, '0')}</span><span><span class="ep-title">${esc(e.titleZh)}</span><span class="ep-en">${esc(e.titleEn || '')}</span></span></button>`).join('') : '<div class="empty">没有找到匹配集数</div>';
    list.querySelectorAll('[data-episode]').forEach(btn => btn.addEventListener('click', () => { state.episode = Number(btn.dataset.episode); render(); window.scrollTo({top: 0, behavior: 'smooth'}); }));
  }

  function stats(e) { return `<div class="stat"><strong>${e.lineCount}</strong><span>组台词</span></div><div class="stat"><strong>${e.grammarCount}</strong><span>类语法句型</span></div><div class="stat"><strong>${e.collocationCount}</strong><span>组固定搭配</span></div>`; }

  function renderDialogue(e) {
    const withSpeaker = e.dialogue.some(r => r.speaker);
    const header = withSpeaker ? '<th>序号</th><th>角色</th><th>英文</th><th>音标</th><th>中文</th>' : '<th>序号</th><th>英文</th><th>音标</th><th>中文</th>';
    const rows = e.dialogue.map((r,i) => withSpeaker ? `<tr><td>${i+1}</td><td class="speaker">${esc(r.speaker || '')}</td><td class="english">${esc(r.en)}</td><td class="ipa">/${esc(r.ipa)}/</td><td class="zh">${esc(r.zh)}</td></tr>` : `<tr><td>${i+1}</td><td class="english">${esc(r.en)}</td><td class="ipa">/${esc(r.ipa)}/</td><td class="zh">${esc(r.zh)}</td></tr>`).join('');
    return `<p class="panel-intro">${esc(currentSeries().panelNote)}</p><table class="dialogue-table ${withSpeaker ? 'has-speaker' : ''}"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderGrammar(e) {
    if (!e.grammar.length) return '<div class="empty">本集暂未匹配到可独立整理的语法句型。</div>';
    return `<p class="panel-intro">原文例句来自本集台词；扩展例句用于替换练习，不属于原剧台词。</p><table class="grammar-table"><thead><tr><th>语法类型</th><th>语法句型</th><th>说明</th><th>原文例句</th><th>扩展例句 10 句</th></tr></thead><tbody>${e.grammar.map(r => `<tr><td><strong>${esc(r.type)}</strong></td><td class="pattern">${esc(r.pattern)}</td><td>${esc(r.description)}</td><td class="source">${esc(r.source)}</td><td><ol class="examples">${r.examples.map(x => `<li>${esc(x)}</li>`).join('')}</ol></td></tr>`).join('')}</tbody></table>`;
  }

  function renderCollocations(e) {
    if (!e.collocations.length) return '<div class="empty">本集暂未匹配到固定搭配。</div>';
    return `<p class="panel-intro">固定搭配取自本集英文台词；语境栏保留完整原文句子。</p><table class="colloc-table"><thead><tr><th>固定搭配</th><th>音标</th><th>中文</th><th>原文语境</th></tr></thead><tbody>${e.collocations.map(r => `<tr><td class="phrase">${esc(r.phrase)}</td><td class="ipa">/${esc(r.ipa)}/</td><td>${esc(r.zh)}</td><td class="context">${esc(r.context)}</td></tr>`).join('')}</tbody></table>`;
  }

  function render() {
    const s = currentSeries(); const e = episode(); if (!e) return;
    renderSeriesShell();
    $('#loading').hidden = true; $('#episodeView').hidden = false;
    $('#episodeKicker').textContent = `第 ${e.episode} 集 · ${e.range} 集单元`;
    $('#episodeTitle').textContent = e.titleZh;
    $('#episodeEnTitle').textContent = e.titleEn || s.title;
    $('#stats').innerHTML = stats(e);
    $('#prevBtn').disabled = e.episode <= 1; $('#nextBtn').disabled = e.episode >= episodes().length;
    $('#dialoguePanel').innerHTML = renderDialogue(e);
    $('#grammarPanel').innerHTML = renderGrammar(e);
    $('#collocationsPanel').innerHTML = renderCollocations(e);
    document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === state.tab));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.hidden = panel.id !== `${state.tab}Panel`);
    renderList();
  }

  search.addEventListener('input', e => { state.query = e.target.value; renderList(); });
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => { state.tab = btn.dataset.tab; render(); }));
  $('#prevBtn').addEventListener('click', () => { if (state.episode > 1) { state.episode--; render(); } });
  $('#nextBtn').addEventListener('click', () => { if (state.episode < episodes().length) { state.episode++; render(); } });
  $('#randomBtn').addEventListener('click', () => { state.episode = episodes()[Math.floor(Math.random() * episodes().length)].episode; render(); window.scrollTo({top:0,behavior:'smooth'}); });
  $('#printBtn').addEventListener('click', () => { document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('print-active')); window.print(); setTimeout(() => document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('print-active')), 500); });
  window.addEventListener('hashchange', () => { const next = location.hash === '#forest' ? 'forest' : 'journey'; if (next !== state.seriesId) { state.seriesId = next; state.episode = 1; state.range = 'all'; state.query = ''; search.value = ''; render(); } });
  render();
})();
