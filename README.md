# Korean-Heritage-WEB
Ajou Univ. 26' Google AI Capstone Project

## API 연동

Production API:

```text
https://jeju-backend-385248657749.asia-northeast3.run.app
```

Web은 녹음된 음성을 `POST /translate`의 `file` multipart field로 전송합니다.

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

브라우저 자동재생 정책으로 즉시 재생이 막히는 경우에도 AI 답변 텍스트를 클릭하면 재생할 수 있습니다.
