/* ============================================================
   AI 부트캠프 공유회 — 투표 설정 파일
   ------------------------------------------------------------
   여기만 고치면 됩니다. 다른 파일은 건드릴 필요 없습니다.

   1) presenters 의 title 에 발표 제목을 채워주세요. (비워두면 카드에 "발표 주제 준비 중" 표시)
   2) 순서를 바꾸고 싶으면 배열 순서만 바꾸면 됩니다.
   3) 사람을 추가/삭제할 때는 id 가 겹치지 않게만 해주세요.
   4) 실제로 여러 명이 각자 휴대폰으로 투표해서 합산하려면
      아래 REMOTE_ENDPOINT 에 Google Apps Script 주소를 넣으세요. (README.md 참고)
   ============================================================ */

/* 비워두면 '데모 모드'로 동작합니다.
   데모 모드: 투표가 접속한 기기에만 저장됩니다. 화면/애니메이션 확인용.
   실제 행사에서는 반드시 REMOTE_ENDPOINT 를 채워주세요. */
const REMOTE_ENDPOINT = 'https://script.google.com/a/macros/spacev.kr/s/AKfycbx2CCxNyJib3X-o7a9BwOj9gCJIwyjFLkASWwOR9-CjvskuyP_qSGiU1KrR00x9OLjccg/exec';

const EVENTS = {
  /* ---------------- 실습반 : 8/19 (수) 18:00 ---------------- */
  practice: {
    id: 'practice-2026-08-19',
    label: '실습반',
    dateText: '8월 19일 (수) 오후 6시 · 3층 라운지',
    /* Winner 화면에서 득표수를 보여줄지 여부 */
    showTokenCount: true,
    presenters: [
      { id: 'pr-park-sunju',  name: '박순주', title: '', hue: 258 },
      { id: 'pr-park-kijung', name: '박기정', title: '', hue: 200 },
      { id: 'pr-eom-jinyong', name: '엄진용', title: '', hue: 168 },
      { id: 'pr-ka-seungwon', name: '가승원', title: '', hue: 132 },
      { id: 'pr-mun-heewon',  name: '문희원', title: '', hue: 44  },
      { id: 'pr-lee-jaeyoung',name: '이재영', title: '', hue: 22  },
      { id: 'pr-kim-youngeun',name: '김영은', title: '', hue: 338 },
      { id: 'pr-hwang-hanseul',name: '황한슬', title: '', hue: 292 },
      { id: 'pr-heo-mihyun',  name: '허미현', title: '', hue: 82  },
    ],
  },

  /* ---------------- 이론반 : 8/20 (목) 18:00 ---------------- */
  theory: {
    id: 'theory-2026-08-20',
    label: '이론반',
    dateText: '8월 20일 (목) 오후 6시 · 3층 라운지',
    showTokenCount: true,
    presenters: [
      { id: 'th-lee-daseul',   name: '이다슬', title: '', hue: 258 },
      { id: 'th-lee-sohyun',   name: '이소현', title: '', hue: 196 },
      { id: 'th-hwang-eunsook',name: '황은숙', title: '', hue: 158 },
      { id: 'th-shin-boyoung', name: '신보영', title: '', hue: 38  },
      { id: 'th-kim-soohyun',  name: '김수현', title: '', hue: 330 },
    ],
  },
};

/* ------------------------------------------------------------
   여기부터는 수정하지 않아도 됩니다.
   ------------------------------------------------------------ */

/* ?class=practice / ?class=theory 로 오늘의 반을 고릅니다.
   값이 없으면 practice 를 기본으로 씁니다. */
function getEvent() {
  const key = new URLSearchParams(location.search).get('class');
  return EVENTS[key] || EVENTS.practice;
}

function getEventKey() {
  const key = new URLSearchParams(location.search).get('class');
  return EVENTS[key] ? key : 'practice';
}
