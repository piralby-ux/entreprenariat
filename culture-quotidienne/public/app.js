const app = document.getElementById('app');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function api(path, opts = {}) {
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  let res;
  try {
    res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  } catch {
    throw new Error('Hors connexion : impossible de joindre l’app. Les articles déjà ouverts restent lisibles.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

function loading(msg) {
  app.innerHTML = `<div class="loading"><div class="spinner"></div><span>${esc(msg)}</span></div>`;
}

function showError(err) {
  app.innerHTML = `<div class="notice error">${esc(err.message)}</div>`;
}

const formatDate = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function metaChips(t, { withStatus = true } = {}) {
  const chips = [`<span class="chip${t.isJoker ? ' joker' : ''}">${esc(t.theme)}${t.isJoker ? ' · joker' : ''}</span>`];
  if (t.carried) {
    const d = t.waitingDays;
    chips.push(`<span class="chip carried">Reporté${d > 0 ? ` · ${d} jour${d > 1 ? 's' : ''} d’attente` : ''}</span>`);
  }
  if (withStatus && t.status === 'read') chips.push('<span class="chip read">Lu ✓</span>');
  chips.push(`<span class="chip muted">${t.readMinutes} min de lecture</span>`);
  return `<div class="meta">${chips.join('')}</div>`;
}

function feedbackButtons(t) {
  return `<span class="feedback" data-id="${t.id}">
    <button class="thumb${t.feedback === 1 ? ' on' : ''}" data-fb="1" title="J’ai aimé : plus de sujets comme ça" aria-pressed="${t.feedback === 1}">👍</button>
    <button class="thumb${t.feedback === -1 ? ' on' : ''}" data-fb="-1" title="Pas pour moi : moins de sujets comme ça" aria-pressed="${t.feedback === -1}">👎</button>
  </span>`;
}

function bindFeedback(root) {
  root.querySelectorAll('.feedback').forEach((box) =>
    box.querySelectorAll('[data-fb]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const value = btn.classList.contains('on') ? 0 : Number(btn.dataset.fb);
        try {
          await api(`/api/topics/${box.dataset.id}/feedback`, { method: 'POST', body: { value } });
          box.querySelectorAll('[data-fb]').forEach((b) => {
            const on = Number(b.dataset.fb) === value;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on);
          });
          toast(value === 1 ? 'Noté : plus de sujets comme ça' : value === -1 ? 'Noté : moins de sujets comme ça' : 'Avis retiré');
        } catch (e) {
          toast(e.message);
        }
      })
    )
  );
}

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

/* ---------------- Aujourd'hui ---------------- */

async function renderToday() {
  loading('Préparation des sujets du jour… (quelques secondes à la première ouverture)');
  let data;
  try {
    data = await api('/api/today');
  } catch (e) {
    return showError(e);
  }
  const { topics, date, queued, readToday, streak } = data;
  // Met en cache (hors connexion) les articles déjà rédigés du jour.
  if ('serviceWorker' in navigator && navigator.onLine) {
    topics.filter((t) => t.hasArticle).forEach((t) => fetch(`/api/topics/${t.id}/article`).catch(() => {}));
  }
  const cards = topics
    .map(
      (t) => `
    <article class="card${t.status === 'read' ? ' is-read' : ''}" data-id="${t.id}">
      ${metaChips(t)}
      <h2><a href="#/article/${t.id}">${esc(t.title)}</a></h2>
      <p class="hook">${esc(t.hook)}</p>
      <div class="actions">
        <a class="btn primary" href="#/article/${t.id}">Lire</a>
        ${t.status === 'read' ? '' : `
        <button data-action="archive">À lire plus tard</button>
        <button data-action="read" title="Ne reviendra plus">Marquer comme lu</button>`}
      </div>
    </article>`
    )
    .join('');

  app.innerHTML = `
    <div class="page-head">
      <h1>${esc(formatDate(date))}</h1>
      ${streak ? `<p class="streak">🔥 ${plural(streak, 'jour')} d’affilée${readToday ? '' : ' · lis un sujet aujourd’hui pour continuer la série'}</p>` : ''}
      <p>${topics.length} sujet${topics.length > 1 ? 's' : ''} aujourd’hui · ${readToday} lu${readToday > 1 ? 's' : ''}${queued ? ` · ${queued} en file d’attente` : ''}</p>
    </div>
    ${topics.length ? `<div class="grid">${cards}</div>` : '<div class="empty">Tout est traité pour aujourd’hui. À demain !</div>'}`;

  app.querySelectorAll('button[data-action]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const id = btn.closest('.card').dataset.id;
      btn.disabled = true;
      try {
        await api(`/api/topics/${id}/${btn.dataset.action}`, { method: 'POST' });
        toast(btn.dataset.action === 'archive' ? 'Reporté à demain' : 'Marqué comme lu');
        renderToday();
      } catch (e) {
        toast(e.message);
        btn.disabled = false;
      }
    })
  );
}

/* ---------------- Article ---------------- */

async function renderArticle(id) {
  loading('Rédaction de l’article… La première ouverture peut prendre une à deux minutes, ensuite il est enregistré.');
  let a;
  try {
    a = await api(`/api/topics/${id}/article`);
  } catch (e) {
    return showError(e);
  }

  const quiz = a.quiz
    .map(
      (q, qi) => `
    <div class="quiz-q" data-q="${qi}">
      <h3>${qi + 1}. ${esc(q.question)}</h3>
      <div class="choices">
        ${q.choices.map((c, ci) => `<button data-choice="${ci}">${esc(c)}</button>`).join('')}
      </div>
      <button class="reveal" data-reveal>Voir la correction sans répondre</button>
      <div class="explanation" hidden></div>
    </div>`
    )
    .join('');

  const sources = a.sources.length
    ? `<h2 class="section-title">Sources</h2><ol class="sources">${a.sources
        .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>${s.age ? ` <span>(${esc(s.age)})</span>` : ''}</li>`)
        .join('')}</ol>`
    : '';

  const footer =
    a.status === 'read'
      ? `<span class="chip read">Lu le ${esc(new Date(a.readDate + 'T12:00:00').toLocaleDateString('fr-FR'))}</span>`
      : `<button class="primary" data-action="read">J’ai lu, marquer comme lu</button>
         ${a.status === 'proposed' ? '<button data-action="archive">À lire plus tard</button>' : ''}`;

  app.innerHTML = `
    <div class="article">
      <a class="back" href="#/">← Retour aux sujets du jour</a>
      ${metaChips(a)}
      <div class="prose">${a.html}</div>
      <h2 class="section-title">Mini-quiz</h2>
      ${quiz}
      ${sources}
      <div class="article-footer">${footer}<span class="fb-label">Ce sujet ?</span>${feedbackButtons(a)}</div>
    </div>`;

  // Mise en valeur de la section "À retenir"
  app.querySelectorAll('.prose h2').forEach((h) => {
    if (/^à retenir/i.test(h.textContent.trim())) {
      h.classList.add('takeaways');
      const next = h.nextElementSibling;
      if (next?.tagName === 'UL') next.classList.add('takeaways');
    }
  });

  // Quiz : la correction reste cachée jusqu'au clic
  app.querySelectorAll('.quiz-q').forEach((box) => {
    const q = a.quiz[box.dataset.q];
    const reveal = (picked) => {
      box.querySelectorAll('[data-choice]').forEach((b) => {
        const ci = Number(b.dataset.choice);
        b.disabled = true;
        if (ci === q.answer) b.classList.add('correct');
        else if (ci === picked) b.classList.add('wrong');
      });
      const ex = box.querySelector('.explanation');
      ex.innerHTML = `${picked === undefined ? '' : picked === q.answer ? '<strong>Bonne réponse !</strong> ' : '<strong>Raté.</strong> '}${esc(q.explanation || '')}`;
      ex.hidden = false;
      box.querySelector('[data-reveal]')?.remove();
    };
    const qi = Number(box.dataset.q);
    if (a.answers[qi] !== undefined) return reveal(a.answers[qi]);
    box.querySelectorAll('[data-choice]').forEach((b) =>
      b.addEventListener('click', () => {
        const choice = Number(b.dataset.choice);
        reveal(choice);
        api(`/api/topics/${id}/quiz`, { method: 'POST', body: { question: qi, choice } }).catch(() => {});
      })
    );
    box.querySelector('[data-reveal]').addEventListener('click', () => reveal(undefined));
  });

  bindFeedback(app);
  app.querySelectorAll('.article-footer button[data-action]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await api(`/api/topics/${id}/${btn.dataset.action}`, { method: 'POST' });
        toast(btn.dataset.action === 'archive' ? 'Reporté à demain' : 'Marqué comme lu');
        location.hash = '#/';
      } catch (e) {
        toast(e.message);
        btn.disabled = false;
      }
    })
  );
  window.scrollTo(0, 0);
}

/* ---------------- Historique ---------------- */

async function renderHistory() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const q = params.get('q') || '';
  const theme = params.get('theme') || '';
  loading('Chargement…');
  let data;
  try {
    data = await api(`/api/history?${new URLSearchParams({ q, theme })}`);
  } catch (e) {
    return showError(e);
  }
  const total = data.themes.reduce((n, t) => n + t.n, 0);
  app.innerHTML = `
    <div class="page-head">
      <h1>Historique</h1>
      <p>${total} sujet${total > 1 ? 's' : ''} lu${total > 1 ? 's' : ''}</p>
    </div>
    <form class="filters" id="filters">
      <input type="search" name="q" placeholder="Rechercher un titre…" value="${esc(q)}">
      <select name="theme">
        <option value="">Tous les thèmes</option>
        ${data.themes.map((t) => `<option value="${esc(t.theme)}"${t.theme === theme ? ' selected' : ''}>${esc(t.theme)} (${t.n})</option>`).join('')}
      </select>
    </form>
    ${data.items.length
      ? `<div class="list">${data.items
          .map(
            (t) => `
        <article class="card">
          <div class="meta"><span class="chip">${esc(t.theme)}</span><span class="chip muted">Lu le ${esc(new Date(t.readDate + 'T12:00:00').toLocaleDateString('fr-FR'))} · ${t.readMinutes} min</span></div>
          <div class="row"><h2><a href="#/article/${t.id}">${esc(t.title)}</a></h2>${feedbackButtons(t)}</div>
        </article>`
          )
          .join('')}</div>`
      : '<div class="empty">Rien pour l’instant.</div>'}`;

  bindFeedback(app);
  const form = document.getElementById('filters');
  const apply = () => {
    const p = new URLSearchParams(new FormData(form));
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    const qs = p.toString();
    history.replaceState(null, '', `#/historique${qs ? '?' + qs : ''}`);
    renderHistory().then(() => {
      const input = document.querySelector('#filters input');
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  };
  let timer;
  form.q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 300); });
  form.theme.addEventListener('change', apply);
  form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
}

/* ---------------- Progrès ---------------- */

async function renderStats() {
  loading('Chargement…');
  let s;
  try {
    s = await api('/api/stats');
  } catch (e) {
    return showError(e);
  }
  const pct = (c, n) => (n ? Math.round((100 * c) / n) + ' %' : '—');
  const hours = s.totalMinutes >= 60 ? `${Math.floor(s.totalMinutes / 60)} h ${String(s.totalMinutes % 60).padStart(2, '0')}` : `${s.totalMinutes} min`;
  const maxRead = Math.max(1, ...s.byTheme.map((t) => t.read));
  const pref = (w) => (w > 1.05 ? '<span class="pref up">plus souvent</span>' : w < 0.95 ? '<span class="pref down">moins souvent</span>' : '');

  app.innerHTML = `
    <div class="page-head"><h1>Progrès</h1><p>Ta régularité, tes thèmes et tes quiz.</p></div>
    <div class="stats">
      <div class="stat"><span class="big">🔥 ${s.current}</span><span>jour${s.current > 1 ? 's' : ''} d’affilée</span></div>
      <div class="stat"><span class="big">${s.best}</span><span>meilleure série</span></div>
      <div class="stat"><span class="big">${s.totalRead}</span><span>sujet${s.totalRead > 1 ? 's' : ''} lu${s.totalRead > 1 ? 's' : ''}</span></div>
      <div class="stat"><span class="big">${hours}</span><span>de lecture</span></div>
      <div class="stat"><span class="big">${pct(s.quiz.correct, s.quiz.answered)}</span><span>bonnes réponses (${s.quiz.correct}/${s.quiz.answered})</span></div>
    </div>

    <h2 class="section-title">Par thème</h2>
    ${s.byTheme.length ? `<div class="themes">${s.byTheme.map((t) => `
      <div class="theme-row">
        <div class="theme-head"><strong>${esc(t.theme)}</strong> ${pref(t.weight)}
          <span class="muted">${plural(t.read, 'lu')} · ${t.minutes} min · quiz ${pct(t.correct, t.answered)} · 👍 ${t.likes} · 👎 ${t.dislikes}</span></div>
        <div class="bar"><span style="width:${(100 * t.read) / maxRead}%"></span></div>
      </div>`).join('')}</div>` : '<div class="empty">Lis ton premier sujet pour voir tes statistiques.</div>'}
    <p class="hint">Tes 👍 / 👎 changent la fréquence des thèmes et orientent le choix des sujets.</p>

    <h2 class="section-title">Exporter en flashcards</h2>
    <p class="hint">Pour chaque article lu : une carte « À retenir » et une carte par question du quiz.</p>
    <div class="actions">
      <a class="btn primary" href="/api/export/flashcards?format=anki" download>Anki (.txt)</a>
      <a class="btn" href="/api/export/flashcards?format=csv" download>CSV (Excel, Quizlet…)</a>
    </div>`;
}

/* ---------------- Routeur ---------------- */

function route() {
  const hash = location.hash || '#/';
  const article = hash.match(/^#\/article\/(\d+)/);
  document.querySelectorAll('[data-nav]').forEach((a) =>
    a.classList.toggle('active', (a.dataset.nav === 'history' && hash.startsWith('#/historique')) || (a.dataset.nav === 'stats' && hash.startsWith('#/progres')) || (a.dataset.nav === 'today' && (hash === '#/' || hash === '#')))
  );
  if (article) return renderArticle(article[1]);
  if (hash.startsWith('#/historique')) return renderHistory();
  if (hash.startsWith('#/progres')) return renderStats();
  return renderToday();
}

window.addEventListener('hashchange', route);
route();

const offlineBanner = () => document.body.classList.toggle('offline', !navigator.onLine);
window.addEventListener('online', offlineBanner);
window.addEventListener('offline', offlineBanner);
offlineBanner();

// Service worker : app installable + articles lisibles hors connexion
// (fonctionne sur localhost ou en HTTPS, voir README).
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
