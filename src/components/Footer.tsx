import Link from 'next/link'
import { getBranding, getNavigation, getSiteInfo, getSocialLinks, getFooterConfig } from '@/lib/config'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const branding = getBranding()
  const navigation = getNavigation()
  const siteInfo = getSiteInfo()
  const socialLinks = getSocialLinks()
  const footerConfig = getFooterConfig()
  
  // 섹션 콘텐츠 렌더링 함수
  const renderSectionContent = (section: any) => {
    switch (section.content) {
      case 'description':
        return (
          <p className="text-gray-600 text-sm">
            {siteInfo.description}
          </p>
        )
      
      case 'navigation':
        return (
          <ul className="space-y-2 text-sm">
            {navigation.footer.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-gray-600 hover:text-blue-600 transition-colors">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        )
      
      case 'social':
        return (
          <ul className="space-y-2 text-sm">
            {Object.entries(socialLinks).map(([platform, url]) => (
              <li key={platform}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-blue-600 transition-colors capitalize"
                >
                  {platform}
                </a>
              </li>
            ))}
          </ul>
        )
      
      case 'automation':
        return (
          <>
            <p className="text-gray-600 text-sm mb-2">
              {footerConfig.automation.schedule}
            </p>
            <p className="text-gray-600 text-sm">
              {footerConfig.automation.technology}
            </p>
          </>
        )
      
      case 'custom':
        if (section.customText) {
          return (
            <p className="text-gray-600 text-sm">
              {section.customText}
            </p>
          )
        }
        if (section.customLinks) {
          return (
            <ul className="space-y-2 text-sm">
              {section.customLinks.map((link: any) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 hover:text-blue-600 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
        return null
      
      default:
        return null
    }
  }
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {footerConfig.sections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {section.title || (index === 0 ? branding.siteName : '')}
              </h3>
              {renderSectionContent(section)}
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            {footerConfig.copyright.showYear && `© ${currentYear} `}
            {footerConfig.copyright.showCompany && branding.companyName}
            {footerConfig.copyright.showYear && footerConfig.copyright.showCompany && '. '}
            {footerConfig.copyright.text}
          </p>
        </div>
      </div>
    </footer>
  )
}