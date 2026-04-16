import React, { useState, useEffect } from 'react';
import { User, Calendar, ClipboardList, Clock, Download, Home, Edit2, Trash2, Check, X, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [visitors, setVisitors] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', 
    birthDate: '', 
    foodEnabled: false,
    foodType: '', 
    massage: false, 
    karaoke: false 
  });
  const [filter, setFilter] = useState('all');

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem('maum_visitors_v2');
    if (savedData) {
      setVisitors(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('maum_visitors_v2', JSON.stringify(visitors));
  }, [visitors]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) {
      alert('이름과 생년월일을 입력해주세요.');
      return;
    }

    let activities = [];
    if (formData.foodEnabled && formData.foodType) activities.push(`식품(${formData.foodType})`);
    if (formData.massage) activities.push('마사지기');
    if (formData.karaoke) activities.push('노래방부스');

    if (activities.length === 0) {
      alert('활동 내용을 하나 이상 선택해주세요.');
      return;
    }

    const newVisitor = {
      id: Date.now().toString(),
      name: formData.name,
      birthDate: formData.birthDate,
      activity: activities.join(', '),
      visitDate: new Date().toISOString(),
    };

    setVisitors(prev => [newVisitor, ...prev]);
    setFormData({ name: '', birthDate: '', foodEnabled: false, foodType: '', massage: false, karaoke: false });
    alert(`${formData.name}님, 방문 기록이 완료되었습니다!`);
  };

  const getFilteredVisitors = () => {
    const now = new Date();
    return visitors.filter(visitor => {
      const visitDate = new Date(visitor.visitDate);
      if (filter === 'all') return true;
      if (filter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return visitDate >= oneWeekAgo;
      }
      if (filter === 'month') {
        return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const downloadCSV = () => {
    const filteredData = getFilteredVisitors();
    if (filteredData.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }
    const headers = ['방문일시', '이름', '생년월일', '활동내용'];
    const csvData = filteredData.map(v => [
      new Date(v.visitDate).toLocaleString('ko-KR'),
      v.name,
      v.birthDate,
      v.activity
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "마음편의점_방문기록.csv";
    link.click();
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800 pb-10">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto relative flex items-center justify-center min-h-[3rem]">
          {/* 좌측 끝: 로고 이미지 */}
          <div className="absolute left-0 flex items-center">
            <img src="/welfare_logo.png" alt="티뷰크사회복지재단 금천누리종합사회복지관" className="h-8 md:h-10 w-auto" />
          </div>
          
          {/* 중앙: 마음편의점 타이틀 */}
          <div className="flex items-center text-orange-600">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">마음편의점</h1>
          </div>
          
          {/* 우측 끝: 메뉴 버튼들 */}
          <div className="absolute right-0 flex gap-2">
            <button onClick={() => setActiveTab('register')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-medium text-sm md:text-base ${activeTab === 'register' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'}`}>방문 등록</button>
            <button onClick={() => setActiveTab('admin')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-medium flex items-center gap-1 text-sm md:text-base ${activeTab === 'admin' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'}`}><ClipboardList className="w-4 h-4" /> 관리자</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        {activeTab === 'register' && (
          <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
            <div className="bg-orange-500 p-8 text-center text-white">
              <h2 className="text-3xl font-bold mb-2">환영합니다!</h2>
              <p className="text-orange-100">마음편의점 금천2호점입니다.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><User className="w-5 h-5 text-orange-500" /> 이름</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="이름을 입력하세요" className="w-full p-4 text-lg border-2 border-gray-100 rounded-xl focus:border-orange-500 outline-none transition-all" />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><Calendar className="w-5 h-5 text-orange-500" /> 생년월일</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} max={new Date().toISOString().split("T")[0]} className="w-full p-4 text-lg border-2 border-gray-100 rounded-xl focus:border-orange-500 outline-none transition-all" />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><Zap className="w-5 h-5 text-orange-500" /> 활동 내용</label>
                <div className="space-y-3 pt-2">
                  <div className={`p-4 rounded-xl border-2 transition-all ${formData.foodEnabled ? 'border-orange-400 bg-orange-50' : 'border-gray-50'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="foodEnabled" checked={formData.foodEnabled} onChange={handleInputChange} className="w-6 h-6 accent-orange-500" />
                      <span className="text-lg font-medium">식품 섭취</span>
                    </label>
                    {formData.foodEnabled && (
                      <div className="flex gap-4 mt-3 ml-9">
                        {['라면', '음료'].map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border shadow-sm">
                            <input type="radio" name="foodType" value={type} checked={formData.foodType === type} onChange={handleInputChange} className="w-5 h-5 accent-orange-500" />
                            <span>{type}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {['massage', 'karaoke'].map(key => (
                    <label key={key} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData[key] ? 'border-orange-400 bg-orange-50' : 'border-gray-50'}`}>
                      <input type="checkbox" name={key} checked={formData[key]} onChange={handleInputChange} className="w-6 h-6 accent-orange-500" />
                      <span className="text-lg font-medium">{key === 'massage' ? '마사지기' : '노래방부스'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold py-5 rounded-2xl shadow-lg mt-4 transition-transform active:scale-95">방문 기록하기</button>
            </form>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">방문자 리스트</h2>
              <div className="flex gap-2 w-full md:w-auto">
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="all">전체 보기</option>
                  <option value="week">최근 1주일</option>
                  <option value="month">이번 달</option>
                </select>
                <button onClick={downloadCSV} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm hover:bg-teal-700 transition-colors">
                  <Download className="w-4 h-4" /> 엑셀 다운로드
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b">
                    <th className="p-4 font-semibold">일시</th>
                    <th className="p-4 font-semibold">이름</th>
                    <th className="p-4 font-semibold">생년월일</th>
                    <th className="p-4 font-semibold">활동 내용</th>
                    <th className="p-4 font-semibold text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredVisitors().length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-gray-400">조회된 기록이 없습니다.</td></tr>
                  ) : (
                    getFilteredVisitors().map((visitor) => (
                      <tr key={visitor.id} className="border-b hover:bg-teal-50/20 transition-colors">
                        <td className="p-4 text-sm text-gray-500">{new Date(visitor.visitDate).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-4 font-bold">{visitor.name}</td>
                        <td className="p-4 text-gray-600">{visitor.birthDate}</td>
                        <td className="p-4"><span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">{visitor.activity}</span></td>
                        <td className="p-4 text-center">
                          {deleteConfirmId === visitor.id ? (
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => { setVisitors(prev => prev.filter(v => v.id !== visitor.id)); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-500 text-white rounded text-xs shadow-sm">삭제</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-200 rounded text-xs shadow-sm">취소</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(visitor.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right text-gray-400 text-sm">
              총 <span className="font-bold text-teal-600">{getFilteredVisitors().length}</span>명의 데이터가 로컬 저장소에 보관 중입니다.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}