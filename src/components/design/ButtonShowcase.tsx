export default function ButtonShowcase() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800 mb-6">버튼 컴포넌트</h2>
        
        <div className="space-y-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">버튼 스타일</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">Primary Buttons</h4>
                <div className="space-y-3">
                  <button className="btn btn-primary w-full">기본 Primary</button>
                  <button className="btn btn-primary w-full" disabled>비활성 Primary</button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">Secondary Buttons</h4>
                <div className="space-y-3">
                  <button className="btn btn-secondary w-full">기본 Secondary</button>
                  <button className="btn btn-secondary w-full" disabled>비활성 Secondary</button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">Outline Buttons</h4>
                <div className="space-y-3">
                  <button className="btn btn-outline w-full">기본 Outline</button>
                  <button className="btn btn-outline w-full" disabled>비활성 Outline</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">버튼 크기</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <button className="px-2 py-1 text-sm btn btn-primary">Small</button>
                <button className="btn btn-primary">Medium (기본)</button>
                <button className="px-6 py-3 text-lg btn btn-primary">Large</button>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">아이콘 버튼</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <button className="btn btn-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  추가하기
                </button>
                
                <button className="btn btn-secondary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  편집
                </button>
                
                <button className="btn btn-outline flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">버튼 상태 데모</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <button className="btn btn-primary hover:bg-primary-600 transition-colors">
                  Hover 효과
                </button>
                <button className="btn btn-primary active:scale-95 transform transition-transform">
                  Active 효과
                </button>
                <button className="btn btn-primary animate-pulse">
                  Loading 상태
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
                <code className="text-sm text-secondary-600">
                  {`<button className="btn btn-primary hover:bg-primary-600 transition-colors">
  Hover 효과
</button>`}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}