import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import {
    ArrowLeft, Upload, Eye, EyeOff, FileText,
    Loader2, Trophy, X, Download, Mail, Phone, Calendar, PenTool
} from 'lucide-react';


export default function JobDetail() {
    const { jobId } = useParams();
    const location = useLocation();

    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noteContent, setNoteContent] = useState("");
    const [isEditingNote, setIsEditingNote] = useState(false);

    const [blindMode] = useState(location.state?.blindMode || false);

    // 📄 個人報告 Modal 狀態
    const [selectedApp, setSelectedApp] = useState(null);

    // 上傳相關
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    // 初始化資料
    const fetchJobData = async () => {
        try {
            setLoading(true);
            const [jobRes, appRes] = await Promise.all([
                axios.get(`jobs/${jobId}/`),
                axios.get(`jobs/${jobId}/applications/`)
            ]);
            setJob(jobRes.data);
            // 處理分頁結構
            if (Array.isArray(appRes.data)) setApplications(appRes.data);
            else if (appRes.data.results) setApplications(appRes.data.results);
            else setApplications([]);
        } catch (error) {
            console.error("無法載入資料:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJobData(); }, [jobId]);

    // 上傳邏輯
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            const uploadRes = await axios.post('upload/', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await axios.post('match/', { candidate_id: uploadRes.data.candidate_id, job_id: jobId });
            alert("✅ 上傳並分析成功！");
            fetchJobData();
        } catch (error) {
            alert("❌ 上傳失敗: " + error.message);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    // 當點擊列表打開 Modal 時，同步更新筆記內容
    const handleOpenModal = (app) => {
        setSelectedApp(app);
        setNoteContent(app.note || ""); // 如果後端有筆記就顯示，沒有就空字串
    };

    // 筆記儲存邏輯
    const handleSaveNote = async () => {
        if (!selectedApp) return;
        try {
            // 呼叫我們剛剛寫好的後端 API (PATCH 方法)
            await axios.patch(`applications/${selectedApp.id}/`, {
                note: noteContent
            });

            alert("✅ 筆記已儲存");

            // 更新本地資料，讓畫面同步 (可選，但建議做)
            setSelectedApp({ ...selectedApp, note: noteContent });
            fetchJobData(); // 背景重新整理列表，確保資料最新
        } catch (error) {
            alert("❌ 儲存失敗");
            console.error(error);
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-500">載入戰情室中...</div>;
    if (!job) return <div className="text-center py-20">找不到此職缺</div>;

    return (
        <div className="max-w-6xl mx-auto animate-fade-in relative">
            {/* 隱藏的上傳 input */}
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />

            {/* 頂部導覽區 */}
            <div className="mb-6">
                <Link to="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition mb-4">
                    <ArrowLeft size={18} className="mr-1" /> 返回職缺列表
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            {job.title}
                            <span className={`text-sm px-3 py-1 rounded-full ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {job.status === 'open' ? '開放中' : '已關閉'}
                            </span>
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        {/* 盲測按鈕
                        <button
                            onClick={() => setBlindMode(!blindMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border ${blindMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300'
                                }`}
                        >
                            {blindMode ? <><EyeOff size={18} /> 盲測模式 ON (隱藏學歷)</> : <><Eye size={18} /> 盲測模式 OFF</>}
                        </button> */}
                        {blindMode && (
                            <span className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                <EyeOff size={16} /> 盲測模式已開啟
                            </span>
                        )}

                        <button
                            onClick={() => fileInputRef.current.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                            上傳新履歷
                        </button>
                    </div>
                </div>
            </div>

            {/* 候選人列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {applications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>目前還沒有人應徵這個職缺</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600 w-16">排名</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">候選人</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">AI 適配分</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">學歷 (盲測區)</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">狀態</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">動作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {applications.map((app, index) => (
                                <tr
                                    key={app.id}
                                    onClick={() => handleOpenModal(app)} // 點擊開啟詳細報告
                                    className="hover:bg-blue-50/50 transition cursor-pointer group"
                                >
                                    <td className="p-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-200 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                                            }`}>
                                            {index <= 2 ? <Trophy size={14} /> : index + 1}
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800">{app.candidate?.name || 'Unknown'}</span>
                                            <span className="text-xs text-gray-400">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '-'}</span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className={`text-lg font-bold ${app.ai_match_score >= 80 ? 'text-green-600' :
                                            app.ai_match_score >= 60 ? 'text-yellow-600' : 'text-red-500'
                                            }`}>
                                            {app.ai_match_score}
                                        </span>
                                    </td>

                                    {/* 學歷欄位：盲測時隱藏 */}
                                    <td className="p-4 max-w-xs">
                                        {blindMode ? (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded font-medium">
                                                🙈 資訊已隱藏
                                            </span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                    const edu = app.candidate?.parsed_data?.education;
                                                    if (!edu) return <span className="text-xs text-gray-300">-</span>;
                                                    if (typeof edu === 'object') return `${edu.degree || ''} ${edu.institution ? '@ ' + edu.institution : ''}`;
                                                    return edu;
                                                })()}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                            {app.status}
                                        </span>
                                    </td>

                                    <td className="p-4 text-right">
                                        <button className="text-blue-600 hover:underline text-sm font-medium">查看報告</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* --- 個人分析報告 Modal (Full Screen Overlay) --- */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedApp(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm ${selectedApp.ai_match_score >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {selectedApp.ai_match_score}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedApp.candidate?.name}</h2>
                                    <p className="text-gray-500 flex items-center gap-2 text-sm">
                                        應徵職缺：{job.title} <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                        {new Date(selectedApp.applied_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* 原始履歷下載按鈕 */}
                                {selectedApp.candidate?.resume_file && (
                                    <a
                                        href={selectedApp.candidate.resume_file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition"
                                    >
                                        <Download size={16} /> 下載原始履歷
                                    </a>
                                )}
                                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-200 rounded-full transition">
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body: 左右兩欄佈局 */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* 左欄：基本資料 & 筆記 */}
                                <div className="space-y-6">
                                    {/* 基本資料卡片 */}
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={18} /> 基本資料</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Mail size={16} className="text-gray-400" />
                                                {selectedApp.candidate?.email || '無 Email'}
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Phone size={16} className="text-gray-400" />
                                                {selectedApp.candidate?.phone || '無電話'}
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Trophy size={16} className="text-gray-400" />
                                                {typeof selectedApp.candidate?.parsed_data?.education === 'object'
                                                    ? selectedApp.candidate.parsed_data.education.institution
                                                    : selectedApp.candidate?.parsed_data?.education || '無學歷資訊'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* HR 筆記功能 */}
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PenTool size={18} /> 內部筆記</h3>

                                        {isEditingNote ? (
                                            /* 編輯模式 */
                                            <div className="space-y-3 animate-fade-in">
                                                <textarea
                                                    className="w-full p-3 border border-yellow-300 rounded-lg text-sm bg-yellow-50 focus:ring-2 focus:ring-yellow-400 outline-none transition"
                                                    rows="5"
                                                    placeholder="在此輸入面試筆記..."
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            handleSaveNote();
                                                            setIsEditingNote(false);
                                                        }}
                                                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                                                    >
                                                        💾 儲存筆記
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingNote(false);
                                                            setNoteContent(selectedApp.note || "");
                                                        }}
                                                        className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                                                    >
                                                        ✕ 取消
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* 閱讀模式 */
                                            <div className="space-y-3">
                                                <div
                                                    className="p-4 bg-yellow-50/50 rounded-lg border border-yellow-200 min-h-[120px] text-sm text-gray-700 whitespace-pre-wrap cursor-pointer hover:bg-yellow-50 hover:border-yellow-300 transition"
                                                    onClick={() => setIsEditingNote(true)}
                                                    title="點擊以編輯"
                                                >
                                                    {noteContent ? noteContent : <span className="text-gray-400 italic">📝 尚無筆記，點擊此處新增...</span>}
                                                </div>
                                                <button
                                                    onClick={() => setIsEditingNote(true)}
                                                    className="w-full py-2 text-blue-600 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                                                >
                                                    ✏️ 編輯筆記
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 右欄：AI 詳細報告 */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* AI 總評 */}
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                                        <h3 className="font-bold text-blue-800 mb-2 text-lg">💡 AI 綜合分析</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {selectedApp.ai_analysis_report?.summary || "尚無詳細分析資料"}
                                        </p>
                                    </div>

                                    {/* 優缺點並排 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                            <h4 className="font-bold text-green-700 mb-3">✅ 優勢 (Pros)</h4>
                                            <ul className="space-y-2">
                                                {selectedApp.ai_analysis_report?.pros?.map((pro, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                                        <span className="text-green-500 mt-1">•</span> {pro}
                                                    </li>
                                                )) || <li className="text-gray-400 text-sm">無資料</li>}
                                            </ul>
                                        </div>
                                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                            <h4 className="font-bold text-orange-700 mb-3">⚠️ 風險 (Cons)</h4>
                                            <ul className="space-y-2">
                                                {selectedApp.ai_analysis_report?.cons?.map((con, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                                        <span className="text-orange-500 mt-1">•</span> {con}
                                                    </li>
                                                )) || <li className="text-gray-400 text-sm">無資料</li>}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 面試題 */}
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-gray-800 mb-3">❓ 建議面試題</h4>
                                        <div className="space-y-3">
                                            {selectedApp.ai_analysis_report?.interview_questions?.map((q, i) => (
                                                <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                                    <span className="font-bold text-gray-500 mr-2">Q{i + 1}.</span> {q}
                                                </div>
                                            )) || <p className="text-gray-400">無建議面試題</p>}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}