import Link from 'next/link'
import { getBranding, getNavigation, getSiteInfo } from '@/lib/config'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const branding = getBranding()
  const navigation = getNavigation()
  const siteInfo = getSiteInfo()
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{branding.siteName}</h3>
            <p className="text-gray-600 text-sm">
              {siteInfo.description}
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">링크</h4>
            <ul className="space-y-2 text-sm">
              {navigation.footer.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-600 hover:text-blue-600 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
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
            © {currentYear} {branding.companyName}. 모든 권리 보유.
          </p>
        </div>
      </div>
    </footer>
  )
}