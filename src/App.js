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
    link.download = `마음편의점_방문기록.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-800 selection:bg-orange-200">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-orange-600">
            <Home className="w-8 h-8" />
            <h1 className="text-2xl font-