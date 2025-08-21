export default function LayoutShowcase() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800 mb-6">레이아웃 시스템</h2>
        
        <div className="space-y-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">그리드 레이아웃</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">2열 그리드</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary-100 p-4 rounded-lg text-center">
                    <p className="text-primary-800 font-medium">컬럼 1</p>
                  </div>
                  <div className="bg-primary-100 p-4 rounded-lg text-center">
                    <p className="text-primary-800 font-medium">컬럼 2</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">3열 그리드</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-100 p-4 rounded-lg text-center">
                    <p className="text-green-800 font-medium">컬럼 1</p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg text-center">
                    <p className="text-green-800 font-medium">컬럼 2</p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg text-center">
                    <p className="text-green-800 font-medium">컬럼 3</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">4열 그리드 (반응형)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-purple-100 p-4 rounded-lg text-center">
                    <p className="text-purple-800 font-medium">1</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-lg text-center">
                    <p className="text-purple-800 font-medium">2</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-lg text-center">
                    <p className="text-purple-800 font-medium">3</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-lg text-center">
                    <p className="text-purple-800 font-medium">4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">플렉스박스 레이아웃</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">수평 정렬</h4>
                <div className="space-y-3">
                  <div className="flex justify-start gap-2 p-3 bg-secondary-50 rounded">
                    <div className="bg-primary-500 text-white px-3 py-1 rounded text-sm">Left</div>
                    <div className="bg-primary-500 text-white px-3 py-1 rounded text-sm">Aligned</div>
                  </div>
                  <div className="flex justify-center gap-2 p-3 bg-secondary-50 rounded">
                    <div className="bg-green-500 text-white px-3 py-1 rounded text-sm">Center</div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded text-sm">Aligned</div>
                  </div>
                  <div className="flex justify-end gap-2 p-3 bg-secondary-50 rounded">
                    <div className="bg-purple-500 text-white px-3 py-1 rounded text-sm">Right</div>
                    <div className="bg-purple-500 text-white px-3 py-1 rounded text-sm">Aligned</div>
                  </div>
                  <div className="flex justify-between gap-2 p-3 bg-secondary-50 rounded">
                    <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm">Space</div>
                    <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm">Between</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">수직 정렬</h4>
                <div className="flex items-center justify-center h-24 bg-secondary-50 rounded gap-4">
                  <div className="bg-primary-500 text-white px-4 py-2 rounded">수직</div>
                  <div className="bg-primary-500 text-white px-4 py-2 rounded">가운데</div>
                  <div className="bg-primary-500 text-white px-4 py-2 rounded">정렬</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">카드 레이아웃</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-secondary-800 mb-2">기능 1</h4>
                <p className="text-secondary-600 text-sm">
                  카드 형태의 레이아웃으로 정보를 체계적으로 구성할 수 있습니다.
                </p>
                <button className="btn btn-outline mt-4 w-full">
                  자세히 보기
                </button>
              </div>
              
              <div className="card p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-secondary-800 mb-2">기능 2</h4>
                <p className="text-secondary-600 text-sm">
                  아이콘과 함께 시각적으로 매력적인 카드를 만들 수 있습니다.
                </p>
                <button className="btn btn-outline mt-4 w-full">
                  자세히 보기
                </button>
              </div>
              
              <div className="card p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-secondary-800 mb-2">기능 3</h4>
                <p className="text-secondary-600 text-sm">
                  반응형 그리드 시스템으로 모든 디바이스에서 완벽하게 표시됩니다.
                </p>
                <button className="btn btn-outline mt-4 w-full">
                  자세히 보기
                </button>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">컨테이너 및 여백</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">최대 너비 컨테이너</h4>
                <div className="space-y-3">
                  <div className="max-w-sm mx-auto bg-primary-100 p-4 rounded text-center">
                    <p className="text-primary-800">max-w-sm (384px)</p>
                  </div>
                  <div className="max-w-md mx-auto bg-green-100 p-4 rounded text-center">
                    <p className="text-green-800">max-w-md (448px)</p>
                  </div>
                  <div className="max-w-lg mx-auto bg-purple-100 p-4 rounded text-center">
                    <p className="text-purple-800">max-w-lg (512px)</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">여백 시스템</h4>
                <div className="space-y-3">
                  <div className="p-2 bg-red-100 text-red-800 text-center">p-2 (8px)</div>
                  <div className="p-4 bg-orange-100 text-orange-800 text-center">p-4 (16px)</div>
                  <div className="p-6 bg-yellow-100 text-yellow-800 text-center">p-6 (24px)</div>
                  <div className="p-8 bg-green-100 text-green-800 text-center">p-8 (32px)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}