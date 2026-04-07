import { useEffect, useState } from 'react';
import axios from '../api/axios';
import {
    Mail, Send, FileText, AlertCircle, CheckCircle, Clock,
    ChevronDown, ChevronUp, Loader2, RefreshCw, Trash2, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_MAP = {
    interview: { label: '面試邀約', color: 'bg-blue-100 text-blue-700' },
    rejection: { label: '感謝函', color: 'bg-gray-100 text-gray-600' },
    offer:     { label: '錄取通知', color: 'bg-green-100 text-green-700' },
    other:     { label: '其他',    color: 'bg-purple-100 text-purple-700' },
};

const STATUS_CONFIG = {
    draft:  { label: '草稿',  color: 'bg-yellow-100 text-yellow-700', icon: FileText },
    queued: { label: '排程中', color: 'bg-blue-100 text-blue-600',   icon: Clock },
    sent:   { label: '已寄出', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    failed: { label: '失敗',  color: 'bg-red-100 text-red-600',     icon: AlertCircle },
};

export default function EmailCenter() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [sendingId, setSendingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const res = await axios.get('email-tasks/all/', { params });
            setTasks(Array.isArray(res.data) ? res.data : res.data.results ?? []);
        } catch (err) {
            console.error('無法載入信件列表', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, [statusFilter]);

    const handleSend = async (task) => {
        if (!window.confirm(`確認寄出至 ${task.candidate_email}？`)) return;
        setSendingId(task.id);
        try {
            await axios.post(`email-tasks/${task.id}/send/`);
            await fetchTasks();
        } catch (err) {
            alert('❌ 寄送失敗：' + (err.response?.data?.error || err.message));
            await fetchTasks(); // 重抓以顯示 failed 狀態
        } finally {
            setSendingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定刪除此信件？')) return;
        setDeletingId(id);
        try {
            await axios.delete(`email-tasks/${id}/`);
            setTasks(prev => prev.filter(t => t.id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch (err) {
            alert('刪除失敗');
        } finally {
            setDeletingId(null);
        }
    };

    // 統計
    const counts = tasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
    }, {});

    const filterTabs = ['all', 'draft', 'sent', 'failed'];
    const displayed = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Mail className="text-blue-600" /> 信件中心
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">管理所有候選人往來信件</p>
                </div>
                <button
                    onClick={fetchTasks}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm"
                >
                    <RefreshCw size={16} /> 重新整理
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { key: 'draft',  label: '草稿',  icon: FileText,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { key: 'queued', label: '排程中', icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50' },
                    { key: 'sent',   label: '已寄出', icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50' },
                    { key: 'failed', label: '失敗',   icon: AlertCircle, color: 'text-red-500',    bg: 'bg-red-50' },
                ].map(({ key, label, icon: Icon, color, bg }) => (
                    <div key={key} className={`${bg} p-4 rounded-xl border border-white shadow-sm`}>
                        <div className={`flex items-center gap-2 ${color} font-medium text-sm mb-1`}>
                            <Icon size={16} /> {label}
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{counts[key] || 0}</div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {filterTabs.map(tab => {
                    const cfg = STATUS_CONFIG[tab];
                    const isActive = statusFilter === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                isActive ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {tab === 'all' ? `全部 (${tasks.length})` : `${cfg.label} (${counts[tab] || 0})`}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center text-gray-400">
                        <Loader2 className="animate-spin mx-auto mb-3" size={28} />
                        <p>載入中...</p>
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <Mail className="mx-auto mb-3 text-gray-300" size={40} />
                        <p>尚無信件紀錄</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {displayed.map(task => {
                            const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.draft;
                            const typeCfg   = TYPE_MAP[task.email_type] ?? TYPE_MAP.other;
                            const StatusIcon = statusCfg.icon;
                            const isExpanded = expandedId === task.id;

                            return (
                                <div key={task.id}>
                                    {/* Row */}
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition"
                                        onClick={() => setExpandedId(isExpanded ? null : task.id)}
                                    >
                                        {/* 狀態 icon */}
                                        <StatusIcon size={20} className={statusCfg.color.split(' ')[1]} />

                                        {/* 主要資訊 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-800 truncate">{task.candidate_name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.color}`}>
                                                    {typeCfg.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">{task.subject}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {task.job_title} &nbsp;·&nbsp;
                                                {task.status === 'sent' && task.sent_at
                                                    ? `寄出於 ${new Date(task.sent_at).toLocaleString()}`
                                                    : `建立於 ${new Date(task.created_at).toLocaleString()}`}
                                            </p>
                                        </div>

                                        {/* 操作按鈕 */}
                                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                            {(task.status === 'draft' || task.status === 'failed') && (
                                                <button
                                                    onClick={() => handleSend(task)}
                                                    disabled={sendingId === task.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                                >
                                                    {sendingId === task.id
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <Send size={14} />}
                                                    寄出
                                                </button>
                                            )}
                                            <Link
                                                to={`/jobs/${task.application_id}`}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="前往職缺頁面"
                                            >
                                                <ExternalLink size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                disabled={deletingId === task.id}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                title="刪除"
                                            >
                                                {deletingId === task.id
                                                    ? <Loader2 size={16} className="animate-spin" />
                                                    : <Trash2 size={16} />}
                                            </button>
                                        </div>

                                        {/* 展開 icon */}
                                        <div className="text-gray-400">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>

                                    {/* 展開內容 */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100 animate-fade-in">
                                            <div className="flex gap-3 mt-4 mb-2">
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">收件人</span>
                                                <span className="text-xs text-blue-600">{task.candidate_email}</span>
                                            </div>
                                            <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                                                <p className="font-bold text-gray-500 text-xs mb-2 uppercase tracking-wide">主旨：{task.subject}</p>
                                                {task.body}
                                            </div>
                                            {task.status === 'failed' && task.error_message && (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                                                    <span className="font-bold">錯誤訊息：</span>{task.error_message}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
