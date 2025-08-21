'use client'

import { useState } from 'react'
import Typography from '@/components/design/Typography'
import ColorPalette from '@/components/design/ColorPalette'
import ButtonShowcase from '@/components/design/ButtonShowcase'
import ResponsiveTester from '@/components/design/ResponsiveTester'
import FormComponents from '@/components/design/FormComponents'
import LayoutShowcase from '@/components/design/LayoutShowcase'

export default function DesignPreviewPage() {
  const [activeTab, setActiveTab] = useState('typography')
  
  const tabs = [
    { id: 'typography', name: '타이포그래피', component: Typography },
    { id: 'colors', name: '컬러 팔레트', component: ColorPalette },
    { id: 'buttons', name: '버튼', component: ButtonShowcase },
    { id: 'forms', name: '폼 컴포넌트', component: FormComponents },
    { id: 'layouts', name: '레이아웃', component: LayoutShowcase },
    { id: 'responsive', name: '반응형 테스트', component: ResponsiveTester },
  ]
  
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Typography

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-4">
          디자인 시스템 미리보기
        </h1>
        <p className="text-lg text-secondary-600">
          WebMaker 프로젝트의 디자인 시스템과 컴포넌트 라이브러리를 확인할 수 있습니다.
        </p>
      </div>
      
      {/* 탭 네비게이션 */}
      <div className="mb-8">
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* 컨텐츠 영역 */}
      <div className="min-h-screen">
        <ActiveComponent />
      </div>
      
      {/* 하단 정보 */}
      <div className="mt-16 pt-8 border-t border-secondary-200">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-800">
              디자인 시스템 정보
            </h3>
            <ul className="space-y-2 text-secondary-600">
              <li>• <strong>프레임워크:</strong> Next.js 14 + TypeScript</li>
              <li>• <strong>스타일링:</strong> Tailwind CSS</li>
              <li>• <strong>폰트:</strong> Inter (Sans), Merriweather (Serif), Fira Code (Mono)</li>
              <li>• <strong>아이콘:</strong> Heroicons</li>
            </ul>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary-800">
              사용 방법
            </h3>
            <ul className="space-y-2 text-secondary-600">
              <li>• 각 탭을 클릭하여 다른 디자인 요소 확인</li>
              <li>• 반응형 테스트로 모바일/태블릿 호환성 확인</li>
              <li>• 코드 예시를 참고하여 컴포넌트 구현</li>
              <li>• 일관된 디자인 가이드라인 준수</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}