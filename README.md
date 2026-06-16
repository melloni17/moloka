# 📰 Historical Newspaper Generator

시대별 역사 신문 이미지를 자동 생성하는 Vercel 기반 API입니다.
기원전부터 20세기까지 시대를 자동 감지하여 해당 시대의 신문 스타일로 PNG 이미지를 반환합니다.

---

## ✨ 기능

- **시대 자동 감지** — 날짜 입력만으로 기원전~20세기 스타일 자동 전환
- **다국어 폰트 지원** — 한글, 한자(일본/중국), 라틴 문자, 키릴 문자 등
- **원문 + 한글 번역** — 헤드라인과 본문을 원어/한글 병기
- **위치 기반 신문사/화폐** — LLM을 통해 자동으로 당대 신문사명과 화폐 단위 생성 가능
- **기원전 석판 스타일** — 음각 효과와 돌 질감 배경 적용

---

## 🗓️ 시대별 스타일

| 시대 | 연도 범위 | 스타일 |
|------|-----------|--------|
| 기원전 | ~0년 | 회색 석판, 음각 효과 |
| 고대 | 1~499년 | 파피루스 황갈색 |
| 중세 | 500~1499년 | 양피지 크림색 |
| 르네상스 | 1500~1699년 | 초기 인쇄물 |
| 18세기 | 1700~1799년 | 프랑스 가제트 스타일 |
| 19세기 | 1800~1899년 | Le Moniteur 스타일 |
| 20세기 | 1900~ | 갱지 타블로이드 스타일 |

---

## 🚀 배포 방법

### 1. GitHub Fork
이 레포지토리를 Fork합니다.(우측 상단 즈음에 있음)

### 2. Vercel 연동
1. [vercel.com](https://vercel.com) 가입 (GitHub 계정으로 로그인)
2. **Add New Project** → Fork한 레포 선택 → **Import**
3. **Deploy** 클릭

### 3. 완료
배포 완료 후 `xxx.vercel.app/api/newspaper?...` 형식으로 사용 가능합니다.

---

## 📡 API 사용법

### 엔드포인트
GET /api/newspaper
### 파라미터

| 파라미터 | 필수 | 설명 | 예시 |
|----------|------|------|------|
| `date` | ✅ | 날짜 (YYYY-MM-DD) | `1804-12-03` |
| `date` | ✅ | 기원전은 앞에 `-` | `-44-03-15` |
| `paper` | ❌ | 신문사 이름 | `Le Moniteur Universel` |
| `price` | ❌ | 당대 화폐 단위 | `Prix: 2 Sols` |
| `lang` | ❌ | 한자 언어 (`ja`/`zh`) | `ja` |
| `h1` | ❌ | 1번 헤드라인 원문 | `Caesar Occisus Est` |
| `hk1` | ❌ | 1번 헤드라인 한글 번역 | `카이사르가 암살되었다` |
| `b1` | ❌ | 1번 본문 원문 | `Idibus Martiis...` |
| `bk1` | ❌ | 1번 본문 한글 번역 | `3월의 이데스에...` |
| `h2`, `hk2`, `b2`, `bk2` | ❌ | 2번 기사 | - |
| `h3`, `hk3`, `b3`, `bk3` | ❌ | 3번 기사 | - |

### 예시 URL

**19세기 유럽:**
/api/newspaper?date=1804-12-03&paper=Le+Moniteur+Universel&price=Prix:+5+Centimes&h1=Couronnement+de+l%27Empereur&hk1=황제+대관식+거행&b1=Napoléon+Bonaparte...&bk1=나폴레옹+보나파르트...

**기원전 로마:**
/api/newspaper?date=-44-03-15&paper=Acta+Diurna&price=I+Sestertius&h1=Caesar+Occisus+Est&hk1=카이사르가+암살되었다

**1919년 조선:**
/api/newspaper?date=1919-10-20&paper=每日申報&price=1錢&lang=ja&h1=國際赤十字委員會+調査官+來鮮&hk1=국제적십자위원회+조사관+내선

---

## 🔤 폰트 라이센스

| 폰트 | 라이센스 |
|------|----------|
| 나눔명조 | OFL (네이버) |
| 나눔가람연꽃 | OFL (네이버) |
| Noto Serif | OFL (Google) |
| Noto Serif JP | OFL (Google) |
| Noto Serif SC | OFL (Google) |

모든 폰트는 OFL(Open Font License)로 자유롭게 사용 가능합니다.
---

## 📊 리포트 API

인과율 진단 리포트를 홀로그램 GIF로 생성합니다.

### 엔드포인트
GET /api/report

### 파라미터

| 파라미터 | 필수 | 설명 | 예시 |
|----------|------|------|------|
| `timeline1` | ❌ | 변형 연대기 1번 | `나폴레옹 황제 즉위` |
| `timeline2` | ❌ | 변형 연대기 2번 | `삼각동맹 구상 완료` |
| `timeline3` | ❌ | 변형 연대기 3번 | `서신 발송 성공` |
| `gap` | ❌ | 인과 괴리율 (숫자만) | `47` |
| `butterfly` | ❌ | 나비효과 10년후 | `유럽 세력균형 재편` |
| `risk` | ❌ | 생존 위험도 (숫자만) | `31` |
| `riskreason` | ❌ | 위험 책정 사유 | `전장 노출 빈도 높음` |
| `risknet` | ❌ | 자원 차감 후 순위험 | `18` |
| `npc1name` | ❌ | NPC 이름 | `알렉산드르` |
| `npc1psych` | ❌ | NPC 심리 상태 | `유저에게 종속된 마음` |
| `npc1eval` | ❌ | 관리자 시점 평가 | `이탈률 없음. 케어 미흡시 잠적 가능` |
| `npc2name`, `npc2psych`, `npc2eval` | ❌ | 2번 NPC | - |
| `npc3name`, `npc3psych`, `npc3eval` | ❌ | 3번 NPC | - |

### 예시 URL
/api/report?timeline1=나폴레옹황제즉위&timeline2=삼각동맹구상완료&gap=47&butterfly=유럽세력균형러시아주도재편&risk=31&riskreason=전장노출빈도높음&risknet=18&npc1name=알렉산드르&npc1psych=유저에게종속된마음&npc1eval=이탈률없음케어미흡시잠적가능

### 응답 형식
- 이미지 형식: `image/gif`
- 애니메이션: 글리치 + 스캔라인 효과
- 캐시: 1시간 (`Cache-Control: public, max-age=3600`)
---

## 🛠️ 기술 스택

- **Runtime** — Node.js (Vercel Serverless Functions)
- **이미지 생성** — [@resvg/resvg-js](https://github.com/nicolo-ribaudo/resvg-js) (SVG → PNG)
- **배포** — [Vercel](https://vercel.com)

---

## 📝 참고사항

- 이미지 응답 형식: `image/png`
- 캐시: 24시간 (`Cache-Control: public, max-age=86400`)
- 기원전 날짜: `-YYYY-MM-DD` 형식 사용
- 한자 포함 시 `lang=ja` (일본/한국 한자) 또는 `lang=zh` (중국 간체) 지정 권장
