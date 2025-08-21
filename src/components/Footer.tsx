import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">WebMaker</h3>
            <p className="text-gray-600 text-sm">
              AI 기반 자동화 블로그 시스템으로 최신 트렌드와 인사이트를 제공합니다.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">링크</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                  홈
                </Link>
              </li>
              <li>
                <Link href="/design-preview" className="text-gray-600 hover:text-blue-600 transition-colors">
                  디자인 시스템
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">자동화 정보</h4>
            <p className="text-gray-600 text-sm mb-2">
              매일 새벽 2시(UTC) 자동 콘텐츠 생성
            </p>
            <p className="text-gray-600 text-sm">
              GitHub Actions + OpenAI 기반
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} WebMaker. AI로 생성된 콘텐츠입니다.
          </p>
        </div>
      </div>
    </footer>
  )
}