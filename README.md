# Korean-Heritage-WEB
Ajou Univ. 26' Google AI Capstone Project

## API 연동

Production API:

```text
https://jeju-backend-385248657749.asia-northeast3.run.app
```

Web은 녹음된 음성을 `POST /translate`의 `file` multipart field로 전송합니다. 최근 완료 대화
최대 5턴은 브라우저 `localStorage`에 저장하고, 매 요청의 `history` multipart field로 함께 전송합니다.
따라서 같은 브라우저에서 새로고침해도 AI가 직전 대화 문맥을 이어서 응답합니다.

예상 응답:

```json
{
  "status": "success",
  "jeju_text": "STT 제주어 인식 결과",
  "standard_text": "Gemini 표준어 번역",
  "ars_reply_text": "Gemini AI ARS 제주어 답변",
  "audio_mime_type": "audio/wav",
  "audio_filename": "ars_reply.wav",
  "audio_sample_rate": 22050,
  "audio_base64": "UklGR...",
  "processing_time": 2.31
}
```

## UI 동작

1. 사용자 발화의 제주어 STT 결과와 표준어 번역을 사용자 말풍선에 표시
2. `ars_reply_text`를 AI 답변 말풍선에 표시
3. `audio_base64`를 WAV Blob URL로 변환해 응답 직후 자동 재생
4. AI 답변 텍스트를 클릭하면 같은 TTS 음성을 다시 재생
5. 새 답변 음성이 재생되면 기존 재생 중인 음성은 중지
6. 최초 한 번 `자동 듣기 시작`을 누른 뒤에는 일정 음량 이상 발화를 감지해 녹음을 시작하고, 1.2초 이상 무음이 이어지면 자동 전송
7. AI TTS가 재생되는 동안 음성 감지를 일시 정지해 스피커 음성이 다음 질문으로 재입력되는 것을 방지
8. 헤더의 `대화 초기화` 버튼으로 저장된 대화 이력, 화면 말풍선, 처리 통계를 초기 상태로 되돌림
9. 대화가 화면 높이를 넘으면 대화 영역 안에서 스크롤해 이전 말풍선을 확인

브라우저 자동재생 정책으로 즉시 재생이 막히는 경우에도 AI 답변 텍스트를 클릭하면 재생할 수 있습니다.
