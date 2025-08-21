'use client'

import { useState } from 'react'

export default function ResponsiveTester() {
  const [selectedDevice, setSelectedDevice] = useState('desktop')
  
  const devices = [
    { id: 'mobile', name: '모바일', width: '375px', height: '667px', icon: '📱' },
    { id: 'tablet', name: '태블릿', width: '768px', height: '1024px', icon: '📱' },
    { id: 'desktop', name: '데스크톱', width: '100%', height: '600px', icon: '🖥️' },
  ]
  
  const selectedDeviceInfo = devices.find(device => device.id === selectedDevice)
  
  const sampleContent = `
    <div class="p-6 space-y-6">
      <h1 class="text-3xl font-bold text-gray-800">반응형 테스트</h1>
      <p class="text-gray-600">이 영역에서 다양한 디바이스에서의 레이아웃을 확인할 수 있습니다.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-blue-100 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800">카드 1</h3>
          <p class="text-blue-600 text-sm">모바일에서는 1열, 태블릿에서는 2열, 데스크톱에서는 3열로 표시됩니다.</p>
        </div>
        <div class="bg-green-100 p-4 rounded-lg">
          <h3 class="font-semibold text-green-800">카드 2</h3>
          <p class="text-green-600 text-sm">Tailwind CSS의 반응형 클래스를 사용한 예시입니다.</p>
        </div>
        <div class="bg-purple-100 p-4 rounded-lg">
          <h3 class="font-semibold text-purple-800">카드 3</h3>
          <p class="text-purple-600 text-sm">lg:grid-cols-3 클래스로 데스크톱에서만 3열로 표시됩니다.</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-4">
        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
          Primary Button
        </button>
        <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors">
          Secondary Button
        </button>
      </div>
      
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h4 class="font-medium text-yellow-800">반응형 브레이크포인트</h4>
        <ul class="mt-2 text-sm text-yellow-700 space-y-1">
          <li>• sm: 640px 이상</li>
          <li>• md: 768px 이상</li>
          <li>• lg: 1024px 이상</li>
          <li>• xl: 1280px 이상</li>
          <li>• 2xl: 1536px 이상</li>
        </ul>
      </div>
    </div>
  `
  
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800 mb-6">반응형 테스트 도구</h2>
        
        <div className="space-y-6">
          {/* 디바이스 선택 버튼 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-700">디바이스 선택</h3>
            <div className="flex flex-wrap gap-3">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    selectedDevice === device.id
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50'
                  }`}
                >
                  <span>{device.icon}</span>
                  <span>{device.name}</span>
                  <span className="text-xs opacity-75">
                    {device.width === '100%' ? 'Full' : device.width}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 현재 디바이스 정보 */}
          <div className="card p-4 bg-primary-50 border-primary-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedDeviceInfo?.icon}</span>
              <div>
                <h4 className="font-semibold text-primary-800">
                  현재 미리보기: {selectedDeviceInfo?.name}
                </h4>
                <p className="text-sm text-primary-600">
                  크기: {selectedDeviceInfo?.width} × {selectedDeviceInfo?.height}
                </p>
              </div>
            </div>
          </div>
          
          {/* 미리보기 프레임 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-700">미리보기</h3>
            
            <div className="flex justify-center">
              <div 
                className="border border-secondary-300 rounded-lg overflow-hidden shadow-lg bg-white"
                style={{
                  width: selectedDeviceInfo?.width,
                  height: selectedDeviceInfo?.height,
                  maxWidth: '100%',
                }}
              >
                <div className="h-full overflow-auto">
                  {/* 실제 컨텐츠가 여기에 렌더링됩니다 */}
                  <div className="p-6 space-y-6">
                    <h1 className="text-3xl font-bold text-secondary-800">반응형 테스트</h1>
                    <p className="text-secondary-600">
                      이 영역에서 다양한 디바이스에서의 레이아웃을 확인할 수 있습니다.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-primary-100 p-4 rounded-lg">
                        <h3 className="font-semibold text-primary-800">카드 1</h3>
                        <p className="text-primary-600 text-sm">
                          모바일에서는 1열, 태블릿에서는 2열, 데스크톱에서는 3열로 표시됩니다.
                        </p>
                      </div>
                      <div className="bg-green-100 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800">카드 2</h3>
                        <p className="text-green-600 text-sm">
                          Tailwind CSS의 반응형 클래스를 사용한 예시입니다.
                        </p>
                      </div>
                      <div className="bg-purple-100 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-800">카드 3</h3>
                        <p className="text-purple-600 text-sm">
                          lg:grid-cols-3 클래스로 데스크톱에서만 3열로 표시됩니다.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="btn btn-primary">
                        Primary Button
                      </button>
                      <button className="btn btn-secondary">
                        Secondary Button
                      </button>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <h4 className="font-medium text-yellow-800">반응형 브레이크포인트</h4>
                      <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                        <li>• sm: 640px 이상</li>
                        <li>• md: 768px 이상</li>
                        <li>• lg: 1024px 이상</li>
                        <li>• xl: 1280px 이상</li>
                        <li>• 2xl: 1536px 이상</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 사용법 안내 */}
          <div className="card p-6 bg-secondary-50">
            <h3 className="text-lg font-semibold mb-4 text-secondary-700">사용 방법</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">반응형 테스트</h4>
                <ul className="space-y-2 text-sm text-secondary-600">
                  <li>• 상단의 디바이스 버튼을 클릭하여 전환</li>
                  <li>• 각 디바이스별 레이아웃 변화 확인</li>
                  <li>• 텍스트 크기, 여백, 그리드 컬럼 변화 관찰</li>
                  <li>• 버튼과 컴포넌트의 반응형 동작 확인</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-secondary-800 mb-3">개발 팁</h4>
                <ul className="space-y-2 text-sm text-secondary-600">
                  <li>• 모바일 우선(Mobile First) 접근 방식 사용</li>
                  <li>• Tailwind의 반응형 접두사 활용 (sm:, md:, lg: 등)</li>
                  <li>• 터치 인터페이스를 고려한 버튼 크기 설정</li>
                  <li>• 작은 화면에서의 가독성 우선 고려</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}