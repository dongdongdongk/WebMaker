# 이미지 키워드 설정 가이드

## 개요
`image-keywords.json` 파일을 통해 블로그 주제에 따른 이미지 검색 키워드를 쉽게 관리할 수 있습니다.

## 설정 파일 구조

### 1. koreanToEnglish
한국어 키워드를 영어 검색어로 매핑합니다.

```json
{
  "koreanToEnglish": {
    "인공지능": "artificial intelligence",
    "블록체인": "blockchain",
    "요리": "cooking",
    "여행": "travel"
  }
}
```

### 2. categoryKeywords
카테고리별 관련 키워드들을 그룹화합니다.

```json
{
  "categoryKeywords": {
    "food": ["food", "cooking", "nutrition", "restaurant", "culinary"],
    "travel": ["travel", "tourism", "vacation", "destination", "adventure"],
    "fitness": ["fitness", "exercise", "gym", "health", "workout"]
  }
}
```

### 3. defaultKeywords
키워드를 찾지 못했을 때 사용할 기본 키워드들입니다.

```json
{
  "defaultKeywords": ["technology", "business", "innovation", "development", "modern"]
}
```

## 새로운 블로그 주제 추가하기

### 예시: 요리 블로그 설정

1. **한국어-영어 매핑 추가:**
```json
"koreanToEnglish": {
  "요리": "cooking",
  "레시피": "recipe",
  "맛집": "restaurant",
  "디저트": "dessert",
  "베이킹": "baking",
  "건강식": "healthy food"
}
```

2. **카테고리 키워드 추가:**
```json
"categoryKeywords": {
  "cooking": ["cooking", "kitchen", "chef", "food preparation", "culinary"],
  "baking": ["baking", "bread", "pastry", "oven", "dessert"],
  "healthy": ["healthy food", "nutrition", "organic", "vegetables", "wellness"]
}
```

3. **기본 키워드 수정:**
```json
"defaultKeywords": ["food", "cooking", "kitchen", "culinary", "restaurant"]
```

### 예시: 여행 블로그 설정

```json
{
  "koreanToEnglish": {
    "여행": "travel",
    "관광": "tourism", 
    "호텔": "hotel",
    "항공": "airplane",
    "배낭여행": "backpacking",
    "해외여행": "international travel"
  },
  "categoryKeywords": {
    "travel": ["travel", "tourism", "vacation", "destination", "adventure"],
    "accommodation": ["hotel", "resort", "accommodation", "lodging", "booking"],
    "transport": ["airplane", "train", "car rental", "transportation", "flight"]
  },
  "defaultKeywords": ["travel", "vacation", "tourism", "destination", "adventure"]
}
```

## 키워드 추출 로직

1. **제목/내용에서 한국어 키워드 찾기** → 영어로 변환
2. **영어 키워드 직접 추출** (3글자 이상)
3. **카테고리 추론** → 관련 키워드 추가
4. **기본 키워드 사용** (키워드가 부족한 경우)

## 팁

- **구체적인 키워드 사용**: "음식" → "Korean food", "Italian cuisine"
- **검색 친화적 용어**: Unsplash에서 많이 검색되는 영어 용어 사용
- **카테고리 세분화**: 큰 카테고리를 여러 하위 카테고리로 나누기
- **정기적 업데이트**: 새로운 트렌드 키워드 추가

## 테스트 방법

```bash
# 키워드 추출 테스트
node -e "
const UnsplashImageService = require('./scripts/apis/unsplash-image-service');
const service = new UnsplashImageService(console);
console.log(service.extractKeywordsFromText('AI 버블 붕괴 징후'));
"
```