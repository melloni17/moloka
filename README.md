# 📰 Historical Newspaper Generator

시대별 역사 신문 이미지를 자동 생성하는 Vercel 기반 API입니다.
기원전부터 20세기까지 시대를 자동 감지하여 해당 시대의 신문 스타일로 PNG 이미지를 반환합니다.

---

## ✨ 기능

- **시대 자동 감지** — 날짜 입력만으로 기원전~20세기 스타일 자동 전환
- **다국어 폰트 지원** — 한글, 한자(일본/중국), 유럽어, 키릴 문자
- **원문 + 한글 번역** — 헤드라인과 본문을 원어/한글 병기
- **위치 기반 신문사/화폐** — LLM이 자동으로 당대 신문사명과 화폐 단위 생성
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
이 레포지토리를 Fork합니다.

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
| 나눔가람 | OFL (네이버) |
| Noto Serif | OFL (Google) |
| Noto Serif JP | OFL (Google) |
| Noto Serif SC | OFL (Google) |

모든 폰트는 OFL(Open Font License)로 자유롭게 사용 가능합니다.

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
