/**
 * AI 부트캠프 공유회 — 토큰 투표 집계 백엔드
 * ---------------------------------------------------------------
 * Google Apps Script 웹 앱. 스프레드시트 한 장에 표를 쌓습니다.
 * 설치 방법은 ../README.md 의 "실제 집계 모드로 바꾸기" 참고.
 *
 * 저장되는 것: 시각, eventId, presenterId, 익명 투표자 토큰
 * 저장되지 않는 것: 이름, 이메일, IP — 누가 누구를 뽑았는지 알 수 없습니다.
 */

var SHEET_NAME = 'votes';

/* ★ 관리자 비밀번호 — 붙여넣은 뒤 반드시 원하는 값으로 바꾸세요.
   admin.html 의 '데이터 초기화' 버튼에서 이 값을 물어봅니다. */
var ADMIN_KEY = 'CHANGE-ME';

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);

    if (req.action === 'vote') {
      return json(castVote(req.eventId, req.presenterId, req.voter));
    }
    if (req.action === 'tally') {
      return json({ ok: true, tally: tallyFor(req.eventId) });
    }
    if (req.action === 'reset') {
      if (!req.adminKey || req.adminKey !== ADMIN_KEY) {
        return json({ ok: false, error: 'BAD_KEY' });
      }
      return json(resetVotes(req.eventId));
    }
    return json({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** eventId 가 'all' 이면 전체, 아니면 해당 행사 표만 삭제합니다. */
function resetVotes(eventId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    if (!eventId || eventId === 'all') {
      var n = Math.max(sheet.getLastRow() - 1, 0);
      if (n > 0) sheet.deleteRows(2, n);
      return { ok: true, deleted: n };
    }
    var rows = sheet.getDataRange().getValues();
    var deleted = 0;
    for (var i = rows.length - 1; i >= 1; i--) {
      if (rows[i][1] === eventId) {
        sheet.deleteRow(i + 1);
        deleted++;
      }
    }
    return { ok: true, deleted: deleted };
  } finally {
    lock.releaseLock();
  }
}

/** 브라우저로 주소를 직접 열었을 때 살아있는지 확인용 */
function doGet() {
  return json({ ok: true, status: 'alive' });
}

function castVote(eventId, presenterId, voter) {
  if (!eventId || !presenterId || !voter) return { ok: false, error: 'BAD_REQUEST' };

  // 동시에 여러 명이 눌러도 중복 검사와 기록이 어긋나지 않게 잠금을 씁니다.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === eventId && rows[i][3] === voter) {
        return { ok: false, error: 'ALREADY_VOTED' };
      }
    }

    sheet.appendRow([new Date(), eventId, presenterId, voter]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function tallyFor(eventId) {
  var rows = getSheet().getDataRange().getValues();
  var counts = {};
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] !== eventId) continue;
    var pid = rows[i][2];
    counts[pid] = (counts[pid] || 0) + 1;
  }
  return counts;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['시각', 'eventId', 'presenterId', 'voterToken']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
