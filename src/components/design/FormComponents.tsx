export default function FormComponents() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800 mb-6">폼 컴포넌트</h2>
        
        <div className="space-y-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">입력 필드</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">기본 입력 필드</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      이메일
                    </label>
                    <input 
                      type="email" 
                      className="input w-full" 
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      비밀번호
                    </label>
                    <input 
                      type="password" 
                      className="input w-full" 
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      비활성 상태
                    </label>
                    <input 
                      type="text" 
                      className="input w-full opacity-50 cursor-not-allowed" 
                      placeholder="비활성 입력 필드"
                      disabled
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">텍스트 영역</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      메시지
                    </label>
                    <textarea 
                      className="input w-full h-24 resize-y" 
                      placeholder="여기에 메시지를 입력하세요..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      에러 상태
                    </label>
                    <input 
                      type="text" 
                      className="input w-full border-red-300 focus:ring-red-500 focus:border-red-500" 
                      placeholder="잘못된 입력"
                    />
                    <p className="mt-1 text-sm text-red-600">
                      이 필드는 필수입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">선택 컴포넌트</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">셀렉트 박스</h4>
                <div className="space-y-4">
                  <select className="input w-full">
                    <option>옵션을 선택하세요</option>
                    <option>옵션 1</option>
                    <option>옵션 2</option>
                    <option>옵션 3</option>
                  </select>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">체크박스</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded" 
                    />
                    <span className="ml-2 text-sm text-secondary-700">옵션 1</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded" 
                      checked 
                    />
                    <span className="ml-2 text-sm text-secondary-700">옵션 2 (선택됨)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-secondary-800 mb-4">라디오 버튼</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="radio-group" 
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300" 
                    />
                    <span className="ml-2 text-sm text-secondary-700">선택 1</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="radio-group" 
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300" 
                      checked 
                    />
                    <span className="ml-2 text-sm text-secondary-700">선택 2</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 text-secondary-700">완성된 폼 예시</h3>
            <form className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  이름 *
                </label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="홍길동"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  이메일 *
                </label>
                <input 
                  type="email" 
                  className="input w-full" 
                  placeholder="hong@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  카테고리
                </label>
                <select className="input w-full">
                  <option>일반 문의</option>
                  <option>기술 지원</option>
                  <option>제휴 문의</option>
                  <option>기타</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  메시지
                </label>
                <textarea 
                  className="input w-full h-24" 
                  placeholder="문의사항을 입력해주세요..."
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded" 
                />
                <label className="ml-2 text-sm text-secondary-700">
                  개인정보 처리방침에 동의합니다
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary">
                  제출하기
                </button>
                <button type="button" className="btn btn-outline">
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}