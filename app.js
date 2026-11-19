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
      theme: 'journey',
      switchLabel: '西游记'
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
      theme: 'forest',
      switchLabel: 'The Big Green Forest'
    },
    peppa: {
      id: 'peppa',
      episodes: window.PEPPA_EPISODES || [],
      eyebrow: 'PEPPA PIG · SEASON 1 ENGLISH STUDY',
      title: '小猪佩奇 第一季 52 集英文学习整理',
      subtitle: '按每集聚合英文台词、音标、中文、语法句型与固定搭配',
      catalog: '第一季目录',
      footer: '小猪佩奇第一季：台词依据 52 集中英对照资料整理；音标采用 IPA 近似标注。扩展例句为学习练习，不是原剧台词。',
      ranges: [['all', '全部', ''], ['1-26', '第 1–26 集', '26'], ['27-52', '第 27–52 集', '26']],
      plan: true,
      panelNote: '台词按小猪佩奇第一季资料顺序整理；音标采用 IPA 近似标注，角色信息以原资料可确认的内容为准。',
      theme: 'peppa',
      switchLabel: '小猪佩奇'
    }
  };

  const hashRoute = location.hash.replace('#', '').split('?')[0];
  const state = { seriesId: ['journey', 'forest', 'peppa'].includes(hashRoute) ? hashRoute : 'journey', view: hashRoute === 'peppa-plan' ? 'plan' : 'episode', episode: 1, range: 'all', query: '', tab: 'dialogue' };
  const $ = (s) => document.querySelector(s);
  const list = $('#episodeList');
  const search = $('#searchInput');
  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentSeries = () => seriesMap[state.seriesId];
  const episodes = () => currentSeries().episodes;
  const episode = () => episodes().find(e => e.episode === state.episode) || episodes()[0];
  const planData = { get grammar() { return window.PEPPA_PLAN_DATA?.grammar || []; }, get collocations() { return window.PEPPA_PLAN_DATA?.collocations || []; } };

  function balancedParts(items, count) {
    const groups = Array.from({ length: count }, () => []);
    items.forEach((item, index) => groups[index % count].push(item));
    return groups.map(group => group.length ? group : []);
  }

  const pepaPlan = (() => {
    if (!window.PEPPA_PLAN_DATA || !window.PEPPA_PLAN_DATA.grammar.length || !window.PEPPA_PLAN_DATA.collocations.length) return null;
    const weeklyGrammar = [];
    const weeklyCollocations = [];
    for (let week = 0; week < 52; week++) {
      weeklyGrammar.push(Array.from({ length: 3 }, (_, i) => planData.grammar[(week * 3 + i) % planData.grammar.length]));
      weeklyCollocations.push(Array.from({ length: 10 }, (_, i) => planData.collocations[(week * 10 + i) % planData.collocations.length]));
    }
    return { weeklyGrammar, weeklyCollocations };
  })();

  function setSeries(id) {
    if (!seriesMap[id] || id === state.seriesId) return;
    state.seriesId = id; state.episode = 1; state.range = 'all'; state.query = ''; state.tab = 'dialogue';
    state.view = 'episode';
    location.hash = id;
    search.value = '';
    render();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function showOverview() {
    if (state.seriesId !== 'peppa') { setSeries('peppa'); }
    state.view = state.view === 'plan' ? 'episode' : 'plan';
    location.hash = state.view === 'plan' ? 'peppa-plan' : 'peppa';
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
    $('#seriesSwitch').innerHTML = Object.values(seriesMap).map(item => `<button class="series-chip ${item.id === state.seriesId ? 'active' : ''}" data-series="${item.id}">${esc(item.switchLabel)}</button>`).join('');
    $('#seriesSwitch').querySelectorAll('[data-series]').forEach(btn => btn.addEventListener('click', () => setSeries(btn.dataset.series)));
    $('#rangeFilters').innerHTML = (s.plan ? [['plan', '学习总览与计划', s.plan ? 'NEW' : ''], ...s.ranges] : s.ranges).map(([value, label, count]) => `<button class="filter ${((state.view === 'plan' && value === 'plan') || (state.view === 'episode' && value === state.range)) ? 'active' : ''}" data-range="${value}">${label} <span>${count || episodes().length}</span></button>`).join('');
    $('#rangeFilters').querySelectorAll('[data-range]').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.range === 'plan') { showOverview(); return; }
      state.view = 'episode'; state.range = btn.dataset.range; renderList(); renderSeriesShell();
    }));
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
    const ipaCell = (value) => value ? `/${esc(value)}/` : '—';
    const rows = e.dialogue.map((r,i) => withSpeaker ? `<tr><td>${i+1}</td><td class="speaker">${esc(r.speaker || '')}</td><td class="english">${esc(r.en)}</td><td class="ipa">${ipaCell(r.ipa)}</td><td class="zh">${esc(r.zh)}</td></tr>` : `<tr><td>${i+1}</td><td class="english">${esc(r.en)}</td><td class="ipa">${ipaCell(r.ipa)}</td><td class="zh">${esc(r.zh)}</td></tr>`).join('');
    return `<p class="panel-intro">${esc(currentSeries().panelNote)}</p><table class="dialogue-table ${withSpeaker ? 'has-speaker' : ''}"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderGrammar(e) {
    if (!e.grammar.length) return '<div class="empty">本集暂未匹配到可独立整理的语法句型。</div>';
    return `<p class="panel-intro">原文例句来自本集台词；扩展例句用于替换练习，不属于原剧台词。</p><table class="grammar-table"><thead><tr><th>语法类型</th><th>语法句型</th><th>说明</th><th>原文例句</th><th>扩展例句 10 句</th></tr></thead><tbody>${e.grammar.map(r => `<tr><td><strong>${esc(r.type)}</strong></td><td class="pattern">${esc(r.pattern)}</td><td>${esc(r.description)}</td><td class="source">${esc(r.source)}</td><td><ol class="examples">${r.examples.map(x => `<li>${esc(x)}</li>`).join('')}</ol></td></tr>`).join('')}</tbody></table>`;
  }

  function renderCollocations(e) {
    if (!e.collocations.length) return '<div class="empty">本集暂未匹配到固定搭配。</div>';
    return `<p class="panel-intro">固定搭配取自本集英文台词；语境栏保留完整原文句子。</p><table class="colloc-table"><thead><tr><th>固定搭配</th><th>音标</th><th>中文</th><th>原文语境</th></tr></thead><tbody>${e.collocations.map(r => `<tr><td class="phrase">${esc(r.phrase)}</td><td class="ipa">${r.ipa ? `/${esc(r.ipa)}/` : '—'}</td><td>${esc(r.zh)}</td><td class="context">${esc(r.context)}</td></tr>`).join('')}</tbody></table>`;
  }

  function splitLines(items, count) {
    const groups = balancedParts(items, count);
    const labels = ['第1天', '第2天', '第3天', '第4天'];
    const goals = ['跟读建立语感', '分段朗读练习', '完整连读', '脱稿复述'];
    return groups.map((group, index) => ({ label: labels[index], goal: goals[index], items: group }));
  }

  function renderPlan() {
    const listHtml = episodes().map((e, index) => {
      const days = splitLines(e.dialogue, 4);
      const grammar = pepaPlan?.weeklyGrammar?.[index] || [];
      const collocations = pepaPlan?.weeklyCollocations?.[index] || [];
      const detail = days.map((day) => `
        <article class="plan-day">
          <div class="plan-day-label">${esc(day.label)}</div>
          <div class="plan-day-title">${esc(day.goal)}</div>
          <div class="plan-day-meta">${day.items.length} 组台词${day.items.length ? ` · 第 ${day.items[0].lineNumber}–${day.items[day.items.length-1].lineNumber} 句` : ''}</div>
          <div class="plan-lines">
            ${day.items.map(row => `
              <div><div class="plan-line-en">${esc(row.en)}</div><div class="plan-line-zh">${esc(row.zh || '')}${row.ipa ? ` · /${esc(row.ipa)}/` : ''}</div></div>
            `).join('') || '<div class="plan-day-meta">本集台词数量不足以再分组。</div>'}
          </div>
        </article>
      `).join('');
      const grammarHtml = grammar.length ? grammar.map((row, i) => `
        <div class="plan-item">
          <div class="plan-item-no">${esc(String(index * 3 + i + 1))}</div>
          <div><div class="plan-item-title">${esc(row.type)} · ${esc(row.pattern)}</div><div class="plan-item-detail">${esc(row.description)}</div><div class="plan-item-detail">原文：${esc(row.source[0] || '')}</div></div>
          <div class="plan-item-right">全季次数 ${esc(String(row.count))}<br>扩展 10 句</div>
        </div>
      `).join('') : '<div class="empty">本周期暂无语法安排。</div>';
      const collocHtml = collocations.length ? collocations.map((row, i) => `
        <div class="plan-item">
          <div class="plan-item-no">${esc(String(index * 10 + i + 1))}</div>
          <div><div class="plan-item-title">${esc(row.phrase)}${row.ipa ? ` <span class="ipa">/${esc(row.ipa)}/</span>` : ''}</div><div class="plan-item-detail">${esc(row.zh)}</div><div class="plan-item-detail">语境：${esc(row.context)}</div></div>
          <div class="plan-item-right">全季次数 ${esc(String(row.count))}</div>
        </div>
      `).join('') : '<div class="empty">本周期暂无固定搭配安排。</div>';
      return `
        <section class="plan-week" data-week="${e.episode}">
          <button class="plan-header" data-week-toggle="${e.episode}" aria-expanded="false">
            <span class="plan-week-no">W${String(e.episode).padStart(2, '0')}</span>
            <span class="plan-title"><strong>第 ${e.episode} 周 · ${esc(e.titleZh)}</strong><span>${esc(e.titleEn || '')} · <button class="ghost" data-open-episode="${e.episode}">打开本集</button></span></span>
            <span class="plan-meta">${days.map(day => `${day.label} ${day.items.length} 组`).join('<br>')}</span>
            <span class="plan-arrow">›</span>
          </button>
          <div class="plan-body">
            <h3 class="plan-subhead">台词 · 4 天朗读计划</h3>
            <div class="plan-day-list">${detail}</div>
            <h3 class="plan-subhead">固定语法 · 3 条</h3>
            <div class="plan-grid">${grammarHtml}</div>
            <h3 class="plan-subhead">固定搭配 · 10 个</h3>
            <div class="plan-grid">${collocHtml}</div>
          </div>
        </section>
      `;
    }).join('');
    return `
      <div class="overview-hero">
        <div class="overview-top">
          <div>
            <p class="overview-kicker">PEPPA PIG · 52 WEEK PLAN</p>
            <h2 class="overview-title">小猪佩奇第一季学习总览与计划</h2>
            <p class="overview-desc">每周学习一集，第 1 周从《泥坑》开始。台词按顺序平均分成 4 天朗读；语法每周固定 3 条，固定搭配每周固定 10 个，均按汇总版文档顺序安排。</p>
          </div>
          <div class="overview-actions">
            <a class="action-link primary" href="assets/peppa-season1-summary.docx" download="小猪佩奇第一季_语法原句与固定搭配统计.docx">下载汇总版 Word</a>
            <a class="action-link ghost" href="#peppa">返回逐集学习</a>
          </div>
        </div>
        <div class="overview-stats">
          <div class="overview-stat"><strong>52</strong><span>周</span></div>
          <div class="overview-stat"><strong>${episodes().length}</strong><span>集</span></div>
          <div class="overview-stat"><strong>${episodes().reduce((sum, e) => sum + e.lineCount, 0)}</strong><span>组台词</span></div>
          <div class="overview-stat"><strong>${planData.grammar.length}</strong><span>语法句型</span></div>
          <div class="overview-stat"><strong>${planData.collocations.length}</strong><span>固定搭配</span></div>
        </div>
      </div>
      <div id="weeklyPlanList">${listHtml}</div>
    `;
  }

  function bindPlanEvents(root=document) {
    root.querySelectorAll('[data-week-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const week = button.closest('.plan-week');
        const isOpen = week.classList.toggle('open');
        button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
    root.querySelectorAll('[data-open-episode]').forEach(button => {
      button.addEventListener('click', () => {
        state.view = 'episode'; state.episode = Number(button.dataset.openEpisode); state.tab = 'dialogue';
        location.hash = 'peppa';
        render();
        window.scrollTo({top: 0, behavior: 'smooth'});
      });
    });
  }

  function render() {
    const s = currentSeries();
    renderSeriesShell();
    if (s.plan && state.view === 'plan') {
      $('#loading').hidden = true;
      $('#episodeView').hidden = true;
      $('#content').innerHTML = renderPlan();
      bindPlanEvents($('#content'));
      renderList();
      return;
    }
    const e = episode(); if (!e) return;
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
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '').split('?')[0];
    const targetView = hash === 'peppa-plan' ? 'plan' : 'episode';
    const next = ['journey', 'forest', 'peppa'].includes(hash) ? hash : (targetView === 'plan' ? 'peppa' : 'journey');
    const shouldRender = next !== state.seriesId || (next === 'peppa' && targetView !== state.view);
    if (shouldRender) {
      if (next !== state.seriesId) { state.episode = 1; state.range = 'all'; state.query = ''; search.value = ''; }
      state.seriesId = next; state.view = targetView; render();
    }
  });
  for (const row of currentSeries().episodes) {
    row.dialogue.forEach((line, index) => { line.lineNumber = index + 1; });
  }
  render();
})();
