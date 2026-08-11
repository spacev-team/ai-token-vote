/* ============================================================
   투표 저장소 (Store)
   ------------------------------------------------------------
   화면 코드는 아래 4개 함수만 사용합니다.
     Store.mode                      → 'demo' | 'remote'
     Store.hasVoted(eventId)         → 이 기기에서 이미 투표했는지 (즉시, 동기)
     Store.vote(eventId, presenterId)→ 투표 보내기 (Promise)
     Store.tally(eventId)            → { presenterId: 표수 } (Promise)

   구현체가 2개 있습니다.
     DemoStore   : localStorage 만 사용. 접속한 기기 안에서만 집계됩니다.
     RemoteStore : Google Apps Script 로 전송. 실제 다중 사용자 집계.
   config.js 의 REMOTE_ENDPOINT 값이 있으면 자동으로 RemoteStore 를 씁니다.
   ============================================================ */

const Store = (() => {
  const VOTED_PREFIX = 'aitoken:voted:';
  const TALLY_PREFIX = 'aitoken:tally:';
  const VOTER_KEY = 'aitoken:voter';

  /* 이 브라우저를 가리키는 익명 식별자.
     서버는 이 값만 보고 중복 투표를 막습니다. 누구인지는 알 수 없습니다. */
  function voterToken() {
    let t = localStorage.getItem(VOTER_KEY);
    if (!t) {
      t = 'v_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      localStorage.setItem(VOTER_KEY, t);
    }
    return t;
  }

  function markVotedLocally(eventId, presenterId) {
    localStorage.setItem(VOTED_PREFIX + eventId, presenterId);
  }

  function localVote(eventId) {
    return localStorage.getItem(VOTED_PREFIX + eventId);
  }

  /* ---------------- 데모 모드 ---------------- */
  const DemoStore = {
    mode: 'demo',

    hasVoted(eventId) {
      return !!localVote(eventId);
    },

    async vote(eventId, presenterId) {
      if (localVote(eventId)) throw new Error('ALREADY_VOTED');
      const tally = readDemoTally(eventId);
      tally[presenterId] = (tally[presenterId] || 0) + 1;
      localStorage.setItem(TALLY_PREFIX + eventId, JSON.stringify(tally));
      markVotedLocally(eventId, presenterId);
      await wait(350); // 실제 네트워크 느낌을 위한 최소 지연
    },

    async tally(eventId) {
      return readDemoTally(eventId);
    },
  };

  function readDemoTally(eventId) {
    try {
      return JSON.parse(localStorage.getItem(TALLY_PREFIX + eventId) || '{}');
    } catch {
      return {};
    }
  }

  /* ---------------- 실제 집계 모드 ---------------- */
  const RemoteStore = {
    mode: 'remote',

    hasVoted(eventId) {
      /* 서버 확인은 네트워크가 필요하므로, 화면 진입 시점의 빠른 판단은
         로컬 기록으로 합니다. 최종 중복 차단은 서버가 담당합니다. */
      return !!localVote(eventId);
    },

    async vote(eventId, presenterId) {
      if (localVote(eventId)) throw new Error('ALREADY_VOTED');
      const res = await post({
        action: 'vote',
        eventId,
        presenterId,
        voter: voterToken(),
      });
      if (!res.ok && res.error === 'ALREADY_VOTED') {
        markVotedLocally(eventId, presenterId);
        throw new Error('ALREADY_VOTED');
      }
      if (!res.ok) throw new Error(res.error || 'NETWORK');
      markVotedLocally(eventId, presenterId);
    },

    async tally(eventId) {
      const res = await post({ action: 'tally', eventId });
      if (!res.ok) throw new Error(res.error || 'NETWORK');
      return res.tally || {};
    },
  };

  /* Apps Script 로 보낼 때는 Content-Type 을 text/plain 으로 둡니다.
     그래야 브라우저가 preflight(OPTIONS) 요청을 보내지 않아 CORS 문제가 없습니다. */
  async function post(payload) {
    const r = await fetch(REMOTE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (!r.ok) throw new Error('NETWORK');
    return r.json();
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  const impl = REMOTE_ENDPOINT ? RemoteStore : DemoStore;

  /* 테스트용 초기화: 주소 끝에 &reset=1 을 붙이면 이 기기의 투표 기록이 지워집니다.
     행사 당일에는 이 주소를 공유하지 마세요. */
  if (new URLSearchParams(location.search).get('reset') === '1') {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('aitoken:'))
      .forEach((k) => localStorage.removeItem(k));
  }

  return impl;
})();
