import React, { useState, useEffect } from 'react';
import { User, Calendar, ClipboardList, Clock, Download, Home, Edit2, Trash2, Check, X, Coffee, Music, Zap } from 'lucide-react';

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

    // 활동 내용 문자열 생성
    let activities = [];
    if (formData.foodEnabled && formData.foodType) activities.push(`식품(${formData.foodType})`);
    if (formData.massage) activities.push('마사지기');
    if (formData.karaoke) activities.push('노래방부스');

    if (activities.length === 0) {
      alert('활동 내용을 최소 하나 이상 선택해주세요.');
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
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800 selection:bg-orange-200 pb-10">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-orange-600">
            <Home className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">마음편의점</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('register')} className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'register' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>방문 등록</button>
            <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-1 ${activeTab === 'admin' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><ClipboardList className="w-4 h-4" /> 관리자</button>
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
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><User className="w-5 h-5 text-orange-500" /> 이름</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="홍길동" className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><Calendar className="w-5 h-5 text-orange-500" /> 생년월일</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} max={new Date().toISOString().split("T")[0]} className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><Zap className="w-5 h-5 text-orange-500" /> 활동 내용 (중복 선택 가능)</label>
                
                <div className="space-y-4 border-t pt-4">
                  {/* 식품 섭취 섹션 */}
                  <div className={`p-4 rounded-xl border-2 transition-all ${formData.foodEnabled ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="foodEnabled" checked={formData.foodEnabled} onChange={handleInputChange} className="w-6 h-6 accent-orange-500" />
                      <span className="text-xl font-medium">식품 섭취</span>
                    </label>
                    {formData.foodEnabled && (
                      <div className="flex gap-4 mt-4 ml-9">
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border shadow-sm">
                          <input type="radio" name="foodType" value="라면" checked={formData.foodType === '라면'} onChange={handleInputChange} className="w-5 h-5 accent-orange-500" />
                          <span className="text-lg">라면</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border shadow-sm">
                          <input type="radio" name="foodType" value="음료" checked={formData.foodType === '음료'} onChange={handleInputChange} className="w-5 h-5 accent-orange-500" />
                          <span className="text-lg">음료</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 마사지기 */}
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.massage ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}>
                    <input type="checkbox" name="massage" checked={formData.massage} onChange={handleInputChange} className="w-6 h-6 accent-orange-500" />
                    <span className="text-xl font-medium">마사지기</span>
                  </label>

                  {/* 노래방부스 */}
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.karaoke ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}>
                    <input type="checkbox" name="karaoke" checked={formData.karaoke} onChange={handleInputChange} className="w-6 h-6 accent-orange-500" />
                    <span className="text-xl font-medium">노래방부스</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold py-6 rounded-2xl shadow-lg transform transition active:scale-95 mt-4">방문 기록하기</button>
            </form>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">방문자 리스트</h2>
              <div className="flex gap-2 w-full md:w-auto">
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="all">전체 보기</option>
                  <option value="week">최근 1주일</option>
                  <option value="month">이번 달</option>
                </select>
                <button onClick={downloadCSV} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2">
                  <Download className="w-5 h-5" /> 엑셀 다운로드
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200">
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
                  {getFilteredVisitors().map((visitor) => (
                    <tr key={visitor.id} className="border-b hover:bg-teal-50/30 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{new Date(visitor.visitDate).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-4 font-medium text-gray-800">{visitor.name}</td>
                      <td className="p-4 text-gray-600">{visitor.birthDate}</td>
                      <td className="p-4"><span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">{visitor.activity}</span></td>
                      <td className="p-4 text-center">
                        {deleteConfirmId === visitor.id ? (
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => { setVisitors(prev => prev.filter(v => v.id !== visitor.id)); setDeleteConfirmId(null); }} className="text-xs p-1 bg-red-500 text-white rounded">확인</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs p-1 bg-gray-200 rounded">취소</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(visitor.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}