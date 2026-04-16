import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, ClipboardList, Clock, Download, Home, Edit2, Trash2, Check, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [visitors, setVisitors] = useState([]);
  const [formData, setFormData] = useState({ name: '', birthDate: '', residence: '' });
  const [filter, setFilter] = useState('all');

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', birthDate: '', residence: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem('maum_visitors');
    if (savedData) {
      setVisitors(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('maum_visitors', JSON.stringify(visitors));
  }, [visitors]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate || !formData.residence) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    const newVisitor = {
      id: Date.now().toString(),
      name: formData.name,
      birthDate: formData.birthDate,
      residence: formData.residence,
      visitDate: new Date().toISOString(),
    };

    setVisitors(prev => [newVisitor, ...prev]);
    setFormData({ name: '', birthDate: '', residence: '' });
    alert(`${formData.name}님, 마음편의점 방문을 환영합니다!`);
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

  const handleEditClick = (visitor) => {
    setEditingId(visitor.id);
    setEditFormData({ name: visitor.name, birthDate: visitor.birthDate, residence: visitor.residence });
    setDeleteConfirmId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = (id) => {
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, ...editFormData } : v));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    setVisitors(prev => prev.filter(v => v.id !== id));
    setDeleteConfirmId(null);
  };

  const downloadCSV = () => {
    const filteredData = getFilteredVisitors();
    if (filteredData.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }
    const headers = ['방문일시', '이름', '생년월일', '거주지'];
    const csvData = filteredData.map(v => [
      new Date(v.visitDate).toLocaleString('ko-KR'),
      v.name,
      v.birthDate,
      v.residence
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
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800 selection:bg-orange-200">
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
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><User className="w-5 h-5 text-orange-500" /> 이름</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="홍길동" className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><Calendar className="w-5 h-5 text-orange-500" /> 생년월일</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} max={new Date().toISOString().split("T")[0]} className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700"><MapPin className="w-5 h-5 text-orange-500" /> 거주지 (동 단위까지만)</label>
                <input type="text" name="residence" value={formData.residence} onChange={handleInputChange} placeholder="예: 가산동" className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
              </div>
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold py-5 rounded-xl shadow-lg transform transition active:scale-95 mt-4">방문 기록하기</button>
            </form>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-teal-600" /> 방문자 데이터 리스트</h2>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1 md:flex-none">
                  <option value="all">전체 보기</option>
                  <option value="week">최근 1주일</option>
                  <option value="month">이번 달</option>
                </select>
                <button onClick={downloadCSV} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap"><Download className="w-5 h-5" /> 다운로드</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="p-4 font-semibold">일시</th>
                    <th className="p-4 font-semibold">이름</th>
                    <th className="p-4 font-semibold">생년월일</th>
                    <th className="p-4 font-semibold">거주지</th>
                    <th className="p-4 font-semibold text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredVisitors().map((visitor) => (
                    <tr key={visitor.id} className="border-b border-gray-100 hover:bg-teal-50/50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{new Date(visitor.visitDate).toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-4 font-medium text-gray-800">{editingId === visitor.id ? <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full p-1 border rounded" /> : visitor.name}</td>
                      <td className="p-4 text-gray-600">{editingId === visitor.id ? <input type="date" name="birthDate" value={editFormData.birthDate} onChange={handleEditChange} className="w-full p-1 border rounded" /> : visitor.birthDate}</td>
                      <td className="p-4 text-gray-600">{editingId === visitor.id ? <input type="text" name="residence" value={editFormData.residence} onChange={handleEditChange} className="w-full p-1 border rounded" /> : visitor.residence}</td>
                      <td className="p-4 text-center">
                        {editingId === visitor.id ? (
                          <div className="flex justify-center gap-1">
                            <button onClick={() => handleUpdate(visitor.id)} className="p-1 bg-green-500 text-white rounded"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setEditingId(null)} className="p-1 bg-gray-200 text-gray-700 rounded"><X className="w-4 h-4"/></button>
                          </div>
                        ) : deleteConfirmId === visitor.id ? (
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleDelete(visitor.id)} className="text-xs p-1 bg-red-500 text-white rounded">삭제</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs p-1 bg-gray-200 text-gray-700 rounded">취소</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEditClick(visitor)} className="p-1 text-blue-600"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => setDeleteConfirmId(visitor.id)} className="p-1 text-red-600"><Trash2 className="w-4 h-4"/></button>
                          </div>
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