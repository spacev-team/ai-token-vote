/* ============================================================
   투표 화면 동작
   흐름: 발표자 선택 → 확인 시트 → 토큰 전송 애니메이션 → 완료
   ============================================================ */

(() => {
  const EVENT = getEvent();
  const $ = (id) => document.getElementById(id);

  /* 주소에 반이 명시됐으면 바로 투표 화면, 없으면 반 선택 화면부터 */
  const HAS_CLASS = !!EVENTS[new URLSearchParams(location.search).get('class')];

  const els = {
    badge: $('badge-text'),
    badge2: $('badge-text-2'),
    introScene: $('intro-scene'),
    introActions: $('intro-actions'),
    screenIntro: $('screen-intro'),
    grid: $('card-grid'),
    screenVote: $('screen-vote'),
    screenDone: $('screen-done'),
    doneRobot: $('done-robot'),
    receipt: $('receipt'),
    backdrop: $('sheet-backdrop'),
    sheetRobot: $('sheet-robot'),
    sheetTitle: $('sheet-title'),
    sheetNote: $('sheet-note'),
    btnConfirm: $('btn-confirm'),
    btnCancel: $('btn-cancel'),
    stage: $('stage'),
    stageRobot: $('stage-robot'),
    stageCaption: $('stage-caption'),
    flyer: $('token-flyer'),
    burst: $('munch-burst'),
    confetti: $('confetti'),
    modePill: $('mode-pill'),
  };

  /* 애니메이션 구간 길이 (ms). CSS 의 --fly-dur 와 맞춰둡니다. */
  const T = { open: 180, beforeFly: 110, fly: 820, chomp: 460, happy: 430 };

  let selected = null;
  let busy = false;

  /* ---------------- 첫 렌더 ---------------- */

  function init() {
    els.badge.textContent = 'AI 부트캠프 1기 합동 공유회';
    els.badge2.textContent = `${EVENT.label} 공유회 · ${EVENT.dateText}`;

    /* 인트로: 로봇 한 마리가 밥(토큰)을 기다리는 장면 */
    els.introScene.innerHTML =
      Characters.robotSVG({ hue: 258, full: true, className: 'is-happy' }) +
      `<span class="intro-token">${Characters.tokenSVG()}</span>`;

    /* 반 선택 버튼 */
    els.introActions.innerHTML = Object.keys(EVENTS)
      .map((key) => {
        const ev = EVENTS[key];
        return `
        <button class="btn ${key === 'theory' ? 'btn-mint' : ''}" type="button" data-class="${key}">
          <span class="token-slot" aria-hidden="true">${Characters.tokenSVG()}</span>
          <span>${ev.label}에 토큰 주기 <small class="btn-date">${ev.dateText.split(' · ')[0]}</small></span>
        </button>`;
      })
      .join('');
    els.introActions.querySelectorAll('[data-class]').forEach((btn) => {
      btn.addEventListener('click', () => {
        location.href = `vote.html?class=${btn.dataset.class}`;
      });
    });

    document.querySelector('#btn-confirm .token-slot').innerHTML = Characters.tokenSVG();

    if (Store.mode === 'demo') {
      els.modePill.hidden = false;
      els.modePill.textContent = '데모 모드 · 이 기기에만 집계됨';
    }

    /* 이미 투표한 사람은 곧바로 완료 화면으로 */
    if (HAS_CLASS && Store.hasVoted(EVENT.id)) {
      showDone(findPresenter(localStorage.getItem('aitoken:voted:' + EVENT.id)), { returning: true });
      return;
    }

    /* 반이 정해져 있으면 인트로를 건너뛰고 바로 투표 화면으로 */
    if (HAS_CLASS) {
      els.screenIntro.classList.remove('is-active');
      els.screenVote.classList.add('is-active');
    }

    renderCards();
    bindEvents();
  }

  function findPresenter(id) {
    return EVENT.presenters.find((p) => p.id === id) || EVENT.presenters[0];
  }

  function renderCards() {
    els.grid.innerHTML = EVENT.presenters
      .map((p, i) => {
        const hasTitle = p.title && p.title.trim();
        return `
        <button class="p-card" type="button" data-id="${p.id}" style="--i:${i}">
          <span class="p-avatar">${Characters.robotSVG({ hue: p.hue })}</span>
          <span class="p-meta">
            <span class="p-name">${escapeHTML(p.name)}</span>
            <span class="p-title${hasTitle ? '' : ' is-empty'}">${
              hasTitle ? escapeHTML(p.title) : '발표 주제 준비 중'
            }</span>
          </span>
          <span class="p-send">${Characters.tokenSVG()} 토큰 보내기</span>
        </button>`;
      })
      .join('');

    els.grid.querySelectorAll('.p-card').forEach((card) => {
      card.addEventListener('click', () => openSheet(card.dataset.id));
    });
  }

  function bindEvents() {
    els.btnCancel.addEventListener('click', closeSheet);
    els.btnConfirm.addEventListener('click', submit);
    els.backdrop.addEventListener('click', (e) => {
      if (e.target === els.backdrop) closeSheet();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els.backdrop.classList.contains('is-open')) closeSheet();
    });
  }

  /* ---------------- 확인 시트 ---------------- */

  function openSheet(id) {
    if (busy) return;
    selected = findPresenter(id);
    els.sheetRobot.innerHTML = Characters.robotSVG({ hue: selected.hue });
    els.sheetTitle.textContent = `${selected.name}님에게 토큰을 보낼까요?`;
    els.sheetNote.innerHTML = '한 번 보내면 <strong>바꿀 수 없어요.</strong>';
    els.backdrop.classList.add('is-open');
    els.btnConfirm.disabled = false;
    requestAnimationFrame(() => els.btnConfirm.focus({ preventScroll: true }));
  }

  function closeSheet() {
    if (busy) return;
    els.backdrop.classList.remove('is-open');
  }

  /* ---------------- 전송 ---------------- */

  async function submit() {
    if (busy || !selected) return;
    busy = true;
    els.btnConfirm.disabled = true;

    const presenter = selected;
    els.backdrop.classList.remove('is-open');

    /* 애니메이션과 실제 저장을 동시에 시작합니다.
       화면은 기다리지 않고 바로 반응하고, 저장 결과는 애니메이션 끝에서 확인합니다. */
    const saving = Store.vote(EVENT.id, presenter.id).then(
      () => ({ ok: true }),
      (err) => ({ ok: false, err })
    );

    await playTransfer(presenter);
    const result = await saving;

    if (result.ok || result.err?.message === 'ALREADY_VOTED') {
      showDone(presenter, { returning: result.err?.message === 'ALREADY_VOTED' });
      closeStage();
    } else {
      showStageError();
    }
    busy = false;
  }

  /* ---------------- 토큰 전송 애니메이션 ---------------- */

  async function playTransfer(presenter) {
    els.stageRobot.querySelectorAll('.robot').forEach((n) => n.remove());
    els.stageRobot.insertAdjacentHTML('afterbegin', Characters.robotSVG({ hue: presenter.hue, full: true }));
    const robot = els.stageRobot.querySelector('.robot');

    els.flyer.innerHTML = Characters.tokenSVG();
    els.flyer.classList.remove('is-flying');
    els.burst.classList.remove('is-on');
    els.burst.innerHTML = '';
    els.stageCaption.innerHTML = '토큰 전달 중<span class="dots"></span>';
    els.stage.classList.add('is-open');

    /* 로봇 입 위치를 재서 토큰이 정확히 입으로 들어가게 맞춥니다.
       full 로봇의 viewBox 는 120×138 이고 입 중심은 y=75 → 높이의 54.3% 지점입니다. */
    await frame();
    const robotH = els.stageRobot.clientHeight || 240;
    const mouthY = robotH * 0.543;
    const flyerH = els.flyer.offsetHeight || 62;
    els.flyer.style.setProperty('--drop', `${Math.round(mouthY - flyerH / 2)}px`);
    els.burst.style.top = `${Math.round(mouthY)}px`;

    await sleep(T.open);
    robot.classList.add('is-open');

    await sleep(T.beforeFly);
    els.flyer.classList.add('is-flying');

    await sleep(T.fly);
    els.flyer.classList.remove('is-flying');
    els.flyer.innerHTML = '';
    robot.classList.remove('is-open');
    robot.classList.add('is-chomp');
    spawnBurst();

    await sleep(T.chomp);
    robot.classList.remove('is-chomp');
    robot.classList.add('is-happy');
    els.stageCaption.textContent = '냠!';

    await sleep(T.happy);
  }

  function spawnBurst() {
    const n = 10;
    const colors = ['#FFB63D', '#FFD98A', '#FF9E6B', '#A78BFA'];
    els.burst.innerHTML = Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const d = 34 + Math.random() * 26;
      return `<i style="--bx:${(Math.cos(a) * d).toFixed(1)}px; --by:${(
        Math.sin(a) * d - 10
      ).toFixed(1)}px; background:${colors[i % colors.length]}; animation-delay:${i * 14}ms"></i>`;
    }).join('');
    els.burst.classList.add('is-on');
  }

  function closeStage() {
    els.stage.classList.remove('is-open');
  }

  function showStageError() {
    els.stageCaption.innerHTML =
      '전송에 실패했어요. 잠시 뒤 다시 시도해주세요.<br>' +
      '<button class="btn btn-ghost" onclick="location.reload()" style="margin-top:10px">새로고침</button>';
  }

  /* ---------------- 완료 화면 ---------------- */

  function showDone(presenter, { returning = false } = {}) {
    els.doneRobot.insertAdjacentHTML(
      'afterbegin',
      Characters.robotSVG({ hue: presenter.hue, full: true, className: 'is-full' })
    );

    els.receipt.innerHTML = `${Characters.tokenSVG()} <b>${escapeHTML(
      presenter.name
    )}</b>님에게 토큰 1개 전달`;

    if (returning) {
      els.screenDone.querySelector('.done-sub').textContent =
        '이미 토큰을 보내셨어요. 토큰은 한 개뿐이에요!';
    }

    els.screenIntro.classList.remove('is-active');
    els.screenVote.classList.remove('is-active');
    els.screenDone.classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (!returning) confetti(26);
  }

  /* ---------------- 유틸 ---------------- */

  function confetti(count) {
    const colors = ['#6D5AE6', '#A78BFA', '#FFB63D', '#4FD1B0', '#FF9E6B', '#FF8FA3'];
    els.confetti.innerHTML = Array.from({ length: count }, (_, i) => {
      const c = colors[i % colors.length];
      const round = Math.random() > 0.6;
      return `<i style="
        left:${(Math.random() * 100).toFixed(1)}%;
        background:${c};
        border-radius:${round ? '50%' : '2px'};
        width:${round ? 8 : 8 + Math.random() * 4}px;
        height:${round ? 8 : 12 + Math.random() * 6}px;
        --dur:${(2.2 + Math.random() * 1.6).toFixed(2)}s;
        --delay:${(Math.random() * 0.5).toFixed(2)}s;
        --drift:${(Math.random() * 140 - 70).toFixed(0)}px;
        --spin:${(Math.random() * 900 - 300).toFixed(0)}deg;"></i>`;
    }).join('');
    setTimeout(() => (els.confetti.innerHTML = ''), 4600);
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
