# 1. Tech Stack & Environment (Default)
- Frontend: React (Functional Components, Hooks 중심. 함수 선언 스타일은 Coding Standards의 함수 선언 스타일 규칙을 따른다.)
- Style: Tailwind CSS + Shadcn UI (Maintain Design Consistency)
- Language: TypeScript (Strict mode, No `any`)
- Routing: React Router v7
- State: Zustand (UI State), TanStack Query (Server State)
- Networking: Axios (with Interceptors), MSW (Mocking Sync required)

# 2. Coding Standards (Quality & Readability)
- "읽기 쉬운 코드" 최우선: 변수명은 직관적으로, 로직은 단순하게 작성할 것.
- **주석 작성 원칙**:
  - 주석은 코드가 "무엇을 하는지"보다 "왜 이렇게 처리하는지"를 설명한다.
  - 코드만으로 의도가 분명한 단순 로직에는 주석을 달지 않는다.
  - 화면, 훅, mock, API처럼 흐름이 긴 파일은 기존 코드처럼 번호나 짧은 제목으로 구획을 나눈다.
    - 예: `// 1. 데이터 가져오기 및 권한 확인`, `{/* 참여자 명단 섹션 */}`
  - 제품 정책, 서버 응답 보완, 캐시 동기화, 예외 처리, mock이 실제 백엔드 정책을 흉내 내는 부분에는 짧은 한국어 주석을 남긴다.
  - 주석은 기본적으로 1~2줄로 작성하고, 긴 설명은 Plan 문서나 별도 문서에 남긴다.
  - 오래된 주석, 주석 처리된 미사용 코드, 코드와 맞지 않는 설명은 수정 과정에서 함께 정리한다.
- 모듈화: 하나의 파일이 너무 길어지지 않게 기능별로 분리할 것.
- 에러 처리: 예외 상황(Error Handling)을 항상 고려하여 코드를 작성할 것.
- **Strict Typing**: `any` 사용을 엄격히 금지하며, 모든 API 응답과 Props에 대해 구체적인 interface/type을 정의할 것.
- **데이터 관리 원칙**: 서버 데이터(Server State)는 TanStack Query를, 순수 UI 상태나 전역 캐싱(Client State)은 Zustand를 사용하여 역할을 엄격히 분리할 것.
- **MSW Sync**: 새로운 API 연동이나 수정 시, 반드시 `src/mocks` 내의 모킹 핸들러와 데이터도 세트로 업데이트할 것.
- **코드 검토 및 품질 관리**: 
  - 코드 검토(타입 체크, 포매팅 검사 등)가 필요할 때는 `yarn check-all` 명령어를 사용할 것.
  - 코드 포매팅이 필요한 경우 `yarn fix` 명령어를 사용할 것.
- **함수 선언 스타일**:
  - React 컴포넌트는 `function` 키워드로 선언한다.
    - 예: `export default function EventMain() { ... }`
  - 커스텀 훅은 기존 코드베이스 패턴에 맞춰 `function` 키워드로 선언한다.
    - 예: `export default function useEventDetail(...) { ... }`
  - 컴포넌트/훅 내부의 이벤트 핸들러, 비즈니스 로직, 유틸리티 함수는 화살표 함수로 작성한다.
    - 예: `const handleSubmit = async () => { ... }`
  - 컴포넌트가 아닌 export 유틸리티는 화살표 함수로 작성한다.
    - 예: `export const formatDate = (...) => { ... }`


# 3. Work Process (Mandatory File-based Planning)
- **Step-by-Step Approach**: 코드를 수정하기 전, 반드시 다음 두 파일을 생성/업데이트하여 제시한다.
  1. **[Implementation Plan]**: 구체적인 수정 범위와 로직을 한국어로 기술한 문서.
  2. **[Task]**: 체크박스(`- [ ]`) 형태의 세부 작업 리스트 파일.
- **Permission Required**: 위 두 파일이 생성되고, 사용자의 **승인(Confirmation)**을 받은 후에만 실제 코드 수정을 시작한다.
- **Progress Tracking**: 작업이 진행됨에 따라 [Task] 파일의 체크박스를 업데이트하여 진행 상황을 공유한다.

# ４. Communication & Persona
- 언어: 모든 설명과 주석, 작업 계획(Plan)은 **'한국어'**로 작성.
- 설명 방식: 초보자도 이해할 수 있게 쉽게 설명하되, 비즈니스 로직과 구조를 명확히 짚어줄 것.
- 태도: 단순히 코드만 짜지 말고, 내 요청에 잠재된 '리스크'나 더 좋은 '대안'이 있다면 먼저 제안해주는 파트너가 될 것.
- 답변 형식: [결론/해결책] -> [코드] -> [상세 설명] 순서로 두괄식으로 답변할 것.