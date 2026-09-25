/**
 * 기타 & 화성학 · 버그 제보용 구글 폼 만들기 (Google Apps Script)
 *
 * 1. https://script.google.com 에 들어가 '새 프로젝트'를 누릅니다.
 * 2. 편집기에 있던 내용을 지우고 이 파일 내용을 모두 붙여넣은 뒤 저장(Ctrl+S)합니다.
 * 3. 위쪽 ▶ 실행 을 누릅니다. 권한 창이 뜨면 계정을 고르고
 *    '고급' → '(안전하지 않은 페이지)로 이동' → '허용'. 직접 만든 스크립트라 이렇게 뜹니다.
 * 4. 아래 '실행 로그'의 ▶ 로 시작하는 줄을 복사해서 Claude 에게 보내 주세요.
 *
 * 만들어지는 것: 구글 폼 '기타 & 화성학 버그 제보' + 응답이 쌓이는 스프레드시트.
 * 이메일은 모으지 않고, 로그인 없이 제출할 수 있습니다.
 */
var KINDS = ['소리가 안 나거나 이상해요', '화면이 깨지거나 이상해요', '버튼 · 기능이 안 돼요', '설명 · 이론이 틀렸어요', '느리거나 멈춰요', '그 밖의 문제'];

function createBugForm() {
  var form = FormApp.create('기타 & 화성학 버그 제보');
  form.setDescription('사이트에서 이상한 점을 알려 주세요. 보낸 내용은 사이트 운영자만 볼 수 있어요.\n사이트의 "버그 제보" 페이지에서 보내면 페이지 · 기기 정보가 자동으로 채워져요.');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(true);
  form.setConfirmationMessage('고마워요! 확인하고 고칠게요.');

  var kind = form.addMultipleChoiceItem().setTitle('어떤 문제인가요?').setChoiceValues(KINDS);
  var what = form.addParagraphTextItem().setTitle('무엇이 이상했나요?').setHelpText('"이렇게 될 줄 알았는데 → 이렇게 됐어요"처럼 적으면 금방 찾아요.').setRequired(true);
  var steps = form.addParagraphTextItem().setTitle('어떻게 하면 다시 생기나요? (선택)');
  var page = form.addTextItem().setTitle('어느 페이지에서요?');
  var env = form.addParagraphTextItem().setTitle('기기 정보').setHelpText('사이트에서 보내면 자동으로 채워져요.');

  try { form.setPublished(true); } catch (e) { /* 게시 설정이 없는 계정은 이미 게시 상태 */ }
  form.setAcceptingResponses(true);

  var sheet = SpreadsheetApp.create('기타 & 화성학 버그 제보 (응답)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  /* 미리 채운 주소에서 사이트가 쓸 칸 번호(entry)를 알 수 있다 */
  var r = form.createResponse()
    .withItemResponse(kind.createResponse(KINDS[0]))
    .withItemResponse(what.createResponse('WHAT'))
    .withItemResponse(steps.createResponse('STEPS'))
    .withItemResponse(page.createResponse('PAGE'))
    .withItemResponse(env.createResponse('ENV'));

  Logger.log('▶ ' + r.toPrefilledUrl());
  Logger.log('응답 스프레드시트: ' + sheet.getUrl());
  Logger.log('폼 고치기: ' + form.getEditUrl());
}
