export default function ColorPalette() {
  const colors = {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  }

  const ColorSwatch = ({ color, name, value }: { color: string; name: string; value: string }) => (
    <div className="flex items-center space-x-3">
      <div 
        className="w-12 h-12 rounded-lg shadow-sm border border-secondary-200" 
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="font-medium text-secondary-800">{name}</p>
        <p className="text-sm text-secondary-500 font-mono">{value}</p>
      </div>
    </div>
  )

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800 mb-6">컬러 팔레트</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">Primary Colors</h3>
            <div className="space-y-4">
              <ColorSwatch color={colors.primary[50]} name="Primary 50" value="#eff6ff" />
              <ColorSwatch color={colors.primary[500]} name="Primary 500" value="#3b82f6" />
              <ColorSwatch color={colors.primary[600]} name="Primary 600" value="#2563eb" />
              <ColorSwatch color={colors.primary[700]} name="Primary 700" value="#1d4ed8" />
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">Secondary Colors</h3>
            <div className="space-y-3">
              {Object.entries(colors.secondary).map(([key, value]) => (
                <ColorSwatch 
                  key={key}
                  color={value} 
                  name={`Secondary ${key}`} 
                  value={value} 
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold mb-4 text-secondary-700">색상 사용 가이드</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-secondary-800 mb-3">Primary Colors</h4>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li>• Primary 500: 메인 액션 버튼, 링크</li>
                <li>• Primary 600: 버튼 hover 상태</li>
                <li>• Primary 700: 활성 상태, 강조</li>
                <li>• Primary 50: 배경, 하이라이트</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-secondary-800 mb-3">Secondary Colors</h4>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li>• Secondary 50-100: 배경색</li>
                <li>• Secondary 200-300: 테두리, 구분선</li>
                <li>• Secondary 500-600: 일반 텍스트</li>
                <li>• Secondary 700-900: 제목, 강조 텍스트</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}