import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, ClipboardList, Clock, Download, Home, Edit2, Trash2, Check, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Firebase 초기화 (앱 실행 시 최초 1회 세팅)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function App() {
  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'admin'
  const [visitors, setVisitors] = useState([]);
  const [user, setUser] = useState(null); // 클라우드 접속을 위한 유저 상태
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    residence: ''
  });
  const [filter, setFilter] = useState('all'); // 'all', 'week', 'month'

  // 관리자 수정/삭제 관련 상태 추가
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', birthDate: '', residence: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Firebase 인증 및 실시간 데이터 연동
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("인증 에러:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 유저 인증이 완료되면 클라우드에서 방문자 목록을 불러옵니다
  useEffect(() => {
    if (!user) return;
    
    const visitorsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'visitors');
    const unsubscribe = onSnapshot(visitorsRef, (snapshot) => {
      const loadedVisitors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // 최신 방문 기록이 가장 위로 올라오도록 정렬
      loadedVisitors.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      setVisitors(loadedVisitors);
    }, (error) => {
      console.error("데이터 불러오기 에러:", error);
    });
    
    return () => unsubscribe();
  }, [user]);

  // 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 방문자 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate || !formData.residence) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    if (!user) {
      alert('데이터베이스에 연결 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const newVisitor = {
      name: formData.name,
      birthDate: formData.birthDate,
      residence: formData.residence,
      visitDate: new Date().toISOString(), // 시스템 시간 자동 입력
    };

    try {
      // 클라우드 데이터베이스에 방문자 기록 영구 저장
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'visitors'), newVisitor);
      
      setFormData({ name: '', birthDate: '', residence: '' });
      alert(`${formData.name}님, 마음편의점 방문을 환영합니다!`);
    } catch (error) {
      console.error("저장 에러:", error);
      alert('데이터 저장 중 문제가 발생했습니다.');
    }
  };

  // 날짜 필터링 로직
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

  // 수정 버튼 클릭 시 초기화
  const handleEditClick = (visitor) => {
    setEditingId(visitor.id);
    setEditFormData({
      name: visitor.name,
      birthDate: visitor.birthDate,
      residence: visitor.residence
    });
    setDeleteConfirmId(null);
  };

  // 수정 폼 입력 핸들러
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // 수정 내용 저장 (Firebase 업데이트)
  const handleUpdate = async (id) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'visitors', id);
      await updateDoc(docRef, editFormData);
      setEditingId(null);
    } catch (error) {
      console.error("수정 에러:", error);
    }
  };

  // 방문 기록 삭제 (Firebase 삭제)
  const handleDelete = async (id) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'visitors', id);
      await deleteDoc(docRef);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("삭제 에러:", error);
    }
  };

  // 엑셀(CSV) 다운로드 기능
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

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // 한글 깨짐 방지 BOM 추가
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `마음편의점_방문기록_${new Date().toLocaleDateString('ko-KR')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800 selection:bg-orange-200">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-orange-600">
            <Home className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">마음편의점</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'register' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              방문 등록
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-1 ${activeTab === 'admin' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <ClipboardList className="w-4 h-4" /> 관리자
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        {/* === 방문자 등록 탭 === */}
        {activeTab === 'register' && (
          <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
            <div className="bg-orange-500 p-8 text-center text-white">
              <h2 className="text-3xl font-bold mb-2">환영합니다!</h2>
              <p className="text-orange-100">마음편의점 금천2호점입니다.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <User className="w-5 h-5 text-orange-500" /> 이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="홍길동"
                  className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <Calendar className="w-5 h-5 text-orange-500" /> 생년월일
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <MapPin className="w-5 h-5 text-orange-500" /> 거주지 (동 단위까지만)
                </label>
                <input
                  type="text"
                  name="residence"
                  value={formData.residence}
                  onChange={handleInputChange}
                  placeholder="예: 가산동"
                  className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold py-5 rounded-xl shadow-lg transform transition active:scale-95 mt-4"
              >
                방문 기록하기
              </button>
              <p className="text-center text-sm text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" /> 방문 일시는 현재 시간으로 자동 기록됩니다.
              </p>
            </form>
          </div>
        )}

        {/* === 관리자 데이터 확인 탭 === */}
        {activeTab === 'admin' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-teal-600" /> 방문자 데이터 리스트
                </h2>
                <p className="text-gray-500 mt-1">주간, 월간 방문자 통계를 확인하고 다운로드 하세요.</p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1 md:flex-none"
                >
                  <option value="all">전체 보기</option>
                  <option value="week">최근 1주일</option>
                  <option value="month">이번 달</option>
                </select>
                <button 
                  onClick={downloadCSV}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-5 h-5" /> 데이터 다운로드
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="p-4 font-semibold">방문 일시</th>
                    <th className="p-4 font-semibold">이름</th>
                    <th className="p-4 font-semibold">생년월일</th>
                    <th className="p-4 font-semibold">거주지</th>
                    <th className="p-4 font-semibold text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredVisitors().length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">
                        해당 기간의 방문 기록이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    getFilteredVisitors().map((visitor) => (
                      <tr key={visitor.id} className="border-b border-gray-100 hover:bg-teal-50/50 transition-colors">
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(visitor.visitDate).toLocaleString('ko-KR', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4 font-medium text-gray-800">
                          {editingId === visitor.id ? (
                            <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full p-1.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                          ) : visitor.name}
                        </td>
                        <td className="p-4 text-gray-600">
                          {editingId === visitor.id ? (
                            <input type="date" name="birthDate" value={editFormData.birthDate} onChange={handleEditChange} max={new Date().toISOString().split("T")[0]} className="w-full p-1.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                          ) : visitor.birthDate}
                        </td>
                        <td className="p-4 text-gray-600">
                          {editingId === visitor.id ? (
                            <input type="text" name="residence" value={editFormData.residence} onChange={handleEditChange} className="w-full p-1.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" />
                          ) : visitor.residence}
                        </td>
                        <td className="p-4 text-center">
                          {editingId === visitor.id ? (
                            <div className="flex justify-center gap-1">
                              <button onClick={() => handleUpdate(visitor.id)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded shadow-sm" title="저장"><Check className="w-4 h-4"/></button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded shadow-sm" title="취소"><X className="w-4 h-4"/></button>
                            </div>
                          ) : deleteConfirmId === visitor.id ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] text-red-500 font-bold leading-none">삭제할까요?</span>
                              <div className="flex justify-center gap-1">
                                <button onClick={() => handleDelete(visitor.id)} className="px-2 py-1 text-white bg-red-500 hover:bg-red-600 rounded text-xs shadow-sm">확인</button>
                                <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded text-xs shadow-sm">취소</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleEditClick(visitor)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="수정"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={() => setDeleteConfirmId(visitor.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title="삭제"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-right text-gray-500 text-sm">
              총 <span className="font-bold text-teal-600">{getFilteredVisitors().length}</span>명의 방문 기록이 조회되었습니다.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}