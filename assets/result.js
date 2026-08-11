/* ============================================================
   결과 공개 화면 동작
   흐름: 대기 화면 → 결과 보기 → 집계 애니메이션 → Winner 공개 → 왕관
   ============================================================ */

(() => {
  const EVENT = getEvent();
  const params = new URLSearchParams(location.search);
  const $ = (id) => document.getElementById(id);

  /* 득표수 표시 여부: config 값이 기본, 주소에 ?count=0 / ?count=1 을 붙이면 그때만 덮어씁니다. */
  const showCount = params.has('count') ? params.get('count') === '1' : !!EVENT.showTokenCount;
  /* ?detail=1 을 붙이면 전체 집계표가 함께 나옵니다. 호스트가 기록할 때만 쓰세요. */
  const showDetail = params.get('detail') === '1';

  const els = {
    badge: $('badge-text'),
    gateScene: $('gate-scene'),
    gateNote: $('gate-note'),
    btnReveal: $('btn-reveal'),
    screenGate: $('screen-gate'),
    screenWinner: $('screen-winner'),
    counting: $('counting'),
    countingCaption: $('counting-caption'),
    coreToken: $('core-token'),
    swarm: $('swarm'),
    flash: $('flash'),
    confetti: $('confetti'),
    stages: $('winner-stages'),
    tieSlot: $('winner-tie-slot'),
    name: $('winner-name'),
    title: $('winner-title'),
    count: $('winner-count'),
    standings: $('standings'),
    modePill: $('mode-pill'),
  };

  let busy = false;

  /* ---------------- 첫 렌더 ---------------- */

  function init() {
    els.badge.textContent = `${EVENT.label} 공유회 · ${EVENT.dateText}`;
    els.coreToken.innerHTML = Characters.tokenSVG();

    if (Store.mode === 'demo') {
      els.modePill.hidden = false;
      els.modePill.textContent = '데모 모드 · 이 기기에만 집계됨';
    }

    renderGateScene();
    els.btnReveal.addEventListener('click', reveal);
  }

  /* 대기 화면: 오늘의 발표자 로봇 몇 명과 떠다니는 토큰들 */
  function renderGateScene() {
    const crowd = pickSpread(EVENT.presenters, 4);
    const robots = crowd
      .map((p) => `<div class="crowd-robot">${Characters.robotSVG({ hue: p.hue, full: true })}</div>`)
      .join('');

    const spots = [
      [8, 6], [30, 22], [52, 2], [74, 18], [92, 34], [18, 40], [66, 38],
    ];
    const tokens = spots
      .map(
        ([x, y], i) =>
          `<div class="float-token" style="left:${x}%; top:${y}%; animation-delay:${(
            -i * 0.6
          ).toFixed(1)}s; width:${24 + (i % 3) * 7}px">${Characters.tokenSVG()}</div>`
      )
      .join('');

    els.gateScene.innerHTML = robots + tokens;
  }

  /* 명단에서 고르게 퍼뜨려 n명 뽑기 (앞쪽만 몰리지 않게) */
  function pickSpread(list, n) {
    if (list.length <= n) return list.slice();
    const step = list.length / n;
    return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
  }

  /* ---------------- 결과 공개 ---------------- */

  async function reveal() {
    if (busy) return;
    busy = true;
    els.btnReveal.disabled = true;

    const loading = Store.tally(EVENT.id).then(
      (t) => ({ ok: true, tally: t }),
      (err) => ({ ok: false, err })
    );

    await playCounting(loading);
    busy = false;
  }

  async function playCounting(loading) {
    spawnSwarm(18);
    els.countingCaption.innerHTML = '토큰을 세고 있어요<span class="dots"></span>';
    els.counting.classList.add('is-open');

    await frame();
    els.swarm.classList.add('is-on');

    await sleep(1150);
    els.countingCaption.innerHTML =
      '가장 많은 토큰을 받은 AI를 찾는 중<span class="dots"></span>';

    await sleep(950);
    const result = await loading;

    if (!result.ok) {
      els.countingCaption.innerHTML =
        '집계를 불러오지 못했어요.<br><button class="btn btn-ghost" onclick="location.reload()" style="margin-top:10px">다시 시도</button>';
      return;
    }

    const ranked = rank(result.tally);
    const total = ranked.reduce((s, r) => s + r.votes, 0);

    if (total === 0) {
      els.countingCaption.innerHTML =
        '아직 도착한 토큰이 없어요.<br><button class="btn btn-ghost" onclick="location.reload()" style="margin-top:10px">돌아가기</button>';
      return;
    }

    /* 화면이 어두워졌다 밝아지는 순간에 화면을 갈아끼웁니다. */
    els.flash.classList.add('is-on');
    await sleep(330);

    renderWinner(ranked, total);
    els.counting.classList.remove('is-open');
    els.swarm.classList.remove('is-on');
    els.screenGate.classList.remove('is-active');
    els.screenWinner.classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'auto' });

    await sleep(240);
    els.screenWinner
      .querySelectorAll('.winner-stage')
      .forEach((s, i) => setTimeout(() => s.classList.add('is-crowned'), i * 180));

    await sleep(180);
    confetti(90);
    setTimeout(() => els.flash.classList.remove('is-on'), 500);
  }

  /* 표수 기준 내림차순. 동점자는 함께 묶입니다. */
  function rank(tally) {
    return EVENT.presenters
      .map((p) => ({ ...p, votes: tally[p.id] || 0 }))
      .sort((a, b) => b.votes - a.votes);
  }

  function renderWinner(ranked, total) {
    const top = ranked[0].votes;
    const winners = ranked.filter((r) => r.votes === top);

    els.stages.innerHTML = winners
      .map(
        (w) => `
      <div class="winner-stage">
        <span class="halo" aria-hidden="true"></span>
        ${Characters.crownSVG()}
        ${Characters.robotSVG({ hue: w.hue, full: true, className: 'is-winner is-happy' })}
      </div>`
      )
      .join('');

    els.name.innerHTML = winners
      .map((w) => `<span class="accent">${escapeHTML(w.name)}</span>`)
      .join(' · ');

    if (winners.length === 1) {
      const t = winners[0].title && winners[0].title.trim();
      els.title.textContent = t ? `〈${t}〉` : '';
      els.title.hidden = !t;
      els.tieSlot.innerHTML = '';
    } else {
      const titles = winners.filter((w) => w.title && w.title.trim());
      els.title.textContent = titles.map((w) => `〈${w.title}〉`).join('  ');
      els.title.hidden = titles.length === 0;
      els.tieSlot.innerHTML = `<span class="winner-tie">공동 1위 ${winners.length}명</span>`;
    }

    if (showCount) {
      els.count.hidden = false;
      els.count.innerHTML = `${Characters.tokenSVG()} 총 <b>${top}개</b>의 토큰을 받았어요!`;
    } else {
      els.count.hidden = true;
    }

    if (showDetail) renderStandings(ranked, total);
  }

  function renderStandings(ranked, total) {
    els.standings.innerHTML = `
      <div class="section-label">전체 집계 (총 ${total}표)</div>
      <ul class="standings">
        ${ranked
          .map(
            (r) => `<li>
              <span class="st-name">${escapeHTML(r.name)}</span>
              <span class="st-bar"><i style="width:${total ? (r.votes / total) * 100 : 0}%"></i></span>
              <span class="st-num">${r.votes}</span>
            </li>`
          )
          .join('')}
      </ul>`;
  }

  /* ---------------- 효과 ---------------- */

  function spawnSwarm(n) {
    const reach = Math.max(window.innerWidth, window.innerHeight) * 0.62;
    els.swarm.innerHTML = Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const d = reach * (0.6 + Math.random() * 0.4);
      return `<i style="
        --sx:${(Math.cos(a) * d).toFixed(0)}px;
        --sy:${(Math.sin(a) * d).toFixed(0)}px;
        width:${22 + Math.random() * 18}px;
        height:${22 + Math.random() * 18}px;
        animation-delay:${(i * 32).toFixed(0)}ms">${Characters.tokenSVG()}</i>`;
    }).join('');
  }

  function confetti(count) {
    const colors = ['#6D5AE6', '#A78BFA', '#FFB63D', '#4FD1B0', '#FF9E6B', '#FF8FA3', '#FFE9A3'];
    els.confetti.innerHTML = Array.from({ length: count }, (_, i) => {
      const c = colors[i % colors.length];
      const round = Math.random() > 0.6;
      return `<i style="
        left:${(Math.random() * 100).toFixed(1)}%;
        background:${c};
        border-radius:${round ? '50%' : '2px'};
        width:${round ? 9 : 8 + Math.random() * 5}px;
        height:${round ? 9 : 13 + Math.random() * 7}px;
        --dur:${(2.4 + Math.random() * 2).toFixed(2)}s;
        --delay:${(Math.random() * 1.1).toFixed(2)}s;
        --drift:${(Math.random() * 180 - 90).toFixed(0)}px;
        --spin:${(Math.random() * 1000 - 340).toFixed(0)}deg;"></i>`;
    }).join('');
    setTimeout(() => (els.confetti.innerHTML = ''), 7000);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  init();
})();
