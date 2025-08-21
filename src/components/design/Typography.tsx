export default function Typography() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800 mb-6">타이포그래피</h2>
        
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-700">제목 계층</h3>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-secondary-800">H1 - 메인 제목 (4xl)</h1>
                <code className="text-sm text-secondary-500">text-4xl font-bold</code>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-secondary-800">H2 - 섹션 제목 (3xl)</h2>
                <code className="text-sm text-secondary-500">text-3xl font-semibold</code>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-secondary-800">H3 - 서브섹션 제목 (2xl)</h3>
                <code className="text-sm text-secondary-500">text-2xl font-semibold</code>
              </div>
              <div>
                <h4 className="text-xl font-medium text-secondary-800">H4 - 카드 제목 (xl)</h4>
                <code className="text-sm text-secondary-500">text-xl font-medium</code>
              </div>
              <div>
                <h5 className="text-lg font-medium text-secondary-800">H5 - 작은 제목 (lg)</h5>
                <code className="text-sm text-secondary-500">text-lg font-medium</code>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-700">본문 텍스트</h3>
            <div className="space-y-4">
              <div>
                <p className="text-lg text-secondary-700">
                  대형 본문 텍스트 - 주요 설명이나 인트로에 사용 (text-lg)
                </p>
              </div>
              <div>
                <p className="text-base text-secondary-600">
                  기본 본문 텍스트 - 일반적인 콘텐츠에 사용 (text-base)
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">
                  작은 본문 텍스트 - 부가 정보나 캡션에 사용 (text-sm)
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">
                  매우 작은 텍스트 - 저작권 표시나 메타 정보에 사용 (text-xs)
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-700">코드 및 특수 텍스트</h3>
            <div className="space-y-4">
              <div>
                <code className="bg-secondary-100 px-2 py-1 rounded text-sm font-mono text-secondary-800">
                  인라인 코드 스타일
                </code>
              </div>
              <div>
                <pre className="bg-secondary-900 text-secondary-100 p-4 rounded-lg overflow-x-auto">
                  <code>{`// 코드 블록 스타일
function example() {
  return "Hello, World!";
}`}</code>
                </pre>
              </div>
              <div className="border-l-4 border-primary-500 pl-4 py-2 bg-primary-50">
                <p className="text-secondary-700 font-medium">인용문 스타일</p>
                <p className="text-secondary-600">
                  &ldquo;이것은 블록 인용문의 예시입니다. 중요한 내용이나 인용구에 사용됩니다.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}