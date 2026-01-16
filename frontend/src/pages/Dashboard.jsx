import { useEffect, useState, useRef } from 'react';
import axios from './api/axios';
import { Plus, X, Upload, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';

function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // 新增：處理配對相關的狀態
    const [matchingJobId, setMatchingJobId] = useState(null); // 紀錄目前正在對哪一個職缺進行配對 (顯示 loading 用)
    const [matchResult, setMatchResult] = useState(null);     // 儲存 AI 分析結果
    const fileInputRef = useRef(null);                        // 用來控制隱藏的 input
    const [selectedJobId, setSelectedJobId] = useState(null); // 暫存使用者點擊的職缺 ID

    // 表單狀態
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        culture_traits: '',
    });

    // 1. 取得職缺列表
    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get('jobs/');
            setJobs(response.data);
        } catch (error) {
            console.error("無法取得職缺:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // 2. 處理新增職缺輸入
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. 送出新增職缺
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formattedData = {
                ...formData,
                culture_traits: formData.culture_traits
                    ? formData.culture_traits.split(/[,，]/).map(t => t.trim()).filter(Boolean)
                    : [],
            };
            await axios.post('jobs/', formattedData);
            alert('✅ 職缺新增成功！');
            fetchJobs();
            setShowForm(false);
            setFormData({ title: '', description: '', requirements: '', culture_traits: '' });
        } catch (error) {
            console.error("新增失敗:", error);
            alert('❌ 新增失敗，請檢查輸入格式');
        }
    };

    // --- 新增的核心功能：上傳並配對 ---

    // 4. 當使用者點擊「上傳履歷」按鈕
    const handleMatchClick = (jobId) => {
        setSelectedJobId(jobId);       // 記住是哪個職缺
        fileInputRef.current.click();  // 觸發隱藏的檔案選擇框
    };

    // 5. 當檔案被選取後，自動開始上傳 + 配對流程
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 開始 loading 狀態
        setMatchingJobId(selectedJobId);

        try {
            // 步驟 A: 上傳履歷 (POST /api/upload/)
            const uploadData = new FormData();
            uploadData.append('file', file);

            // 注意：上傳檔案 header 要設為 multipart/form-data
            const uploadRes = await axios.post('upload/', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const candidateId = uploadRes.data.candidate_id;
            console.log("履歷上傳成功，ID:", candidateId);

            // 步驟 B: 進行配對 (POST /api/match/)
            const matchRes = await axios.post('match/', {
                candidate_id: candidateId,
                job_id: selectedJobId
            });

            console.log("配對結果:", matchRes.data);
            setMatchResult(matchRes.data); // 將結果存起來，顯示 Modal

        } catch (error) {
            console.error("配對流程失敗:", error);
            alert("❌ 配對失敗: " + (error.response?.data?.error || error.message));
        } finally {
            setMatchingJobId(null); // 結束 loading
            e.target.value = '';    // 清空 input，允許重複上傳同個檔案
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* 隱藏的檔案上傳 Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                />

                {/* 標題區 */}
                <div className="flex justify-between items-center mb-8">
                    {/* <div className="flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-800">職缺管理系統</h1>
                    </div> */}
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                        {showForm ? <><X size={20} /> 取消新增</> : <><Plus size={20} /> 新增職缺</>}
                    </button>
                </div>

                {/* 新增職缺表單 */}
                {showForm && (
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-blue-100 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">📝 新增一筆職缺</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">職稱</label>
                                <input name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：Python Backend Engineer" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">工作內容 (JD)</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="請描述工作職責..." required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">硬性條件</label>
                                    <textarea name="requirements" value={formData.requirements} onChange={handleChange} className="w-full p-2 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：熟悉 Django, 3年以上經驗..." required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">文化特質 (用逗號分隔)</label>
                                <input name="culture_traits" value={formData.culture_traits} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：主動積極, 重視溝通" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">確認發布</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 職缺列表 */}
                {loading ? (
                    <p className="text-center text-gray-500 py-10">載入中...</p>
                ) : (
                    <div className="grid gap-4">
                        {jobs.length === 0 ? (
                            <p className="text-center text-gray-500 py-10 bg-white rounded-lg shadow">目前還沒有職缺，點擊右上角新增吧！</p>
                        ) : (
                            jobs.map((job) => (
                                <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                                    {/* 左側：職缺資訊 */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">{job.title}</h2>
                                                <p className="text-sm text-gray-500 mt-1">建立於 {new Date(job.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium md:hidden ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {job.status === 'open' ? '開放中' : '已關閉'}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 mt-3 line-clamp-2">{job.description}</p>

                                        <div className="mt-4 flex gap-2 flex-wrap">

                                            {Array.isArray(job.culture_traits) ? (

                                                /* 情況 1: 它是陣列 */

                                                job.culture_traits.map((trait, index) => (

                                                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">

                                                        {trait}

                                                    </span>

                                                ))

                                            ) : job.culture_traits && typeof job.culture_traits === 'object' ? (

                                                /* 情況 2: 它是物件 (Object)，用 Object.keys() 來迴圈 */

                                                Object.keys(job.culture_traits).map((trait, index) => (

                                                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">

                                                        {trait}

                                                    </span>

                                                ))

                                            ) : (

                                                /* 情況 3: 其他 (顯示原始文字或預設值) */

                                                <span className="text-xs text-gray-400">

                                                    {job.culture_traits ? String(job.culture_traits) : "無標籤"}

                                                </span>

                                            )}

                                        </div>
                                    </div>

                                    {/* 右側：動作區 (新增的部分) */}
                                    <div className="flex flex-col items-end justify-center gap-3 min-w-[180px]">
                                        <span className={`hidden md:inline-block px-3 py-1 rounded-full text-xs font-medium mb-auto ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {job.status === 'open' ? '開放中' : '已關閉'}
                                        </span>

                                        <button
                                            onClick={() => handleMatchClick(job.id)}
                                            disabled={matchingJobId === job.id}
                                            className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition w-full justify-center
                          ${matchingJobId === job.id
                                                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}
                        `}
                                        >
                                            {matchingJobId === job.id ? (
                                                <><Loader2 className="animate-spin" size={18} /> 分析中...</>
                                            ) : (
                                                <><Upload size={18} /> 上傳履歷配對</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* AI 分析結果 Modal (彈跳視窗) */}
                {matchResult && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-full ${matchResult.report.match_score >= 80 ? 'bg-green-100 text-green-600' : matchResult.report.match_score >= 60 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">AI 適配度分析報告</h2>
                                        <p className="text-sm text-gray-500">針對職缺：{jobs.find(j => j.id === selectedJobId)?.title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setMatchResult(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">

                                {/* 分數區 */}
                                <div className="flex items-center justify-center py-4">
                                    <div className="text-center">
                                        <div className={`text-6xl font-black mb-2 ${matchResult.report.match_score >= 80 ? 'text-green-600' : matchResult.report.match_score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {matchResult.report.match_score}
                                        </div>
                                        <span className="text-gray-400 font-medium uppercase tracking-wider text-sm">Match Score</span>
                                    </div>
                                </div>

                                {/* 總結 */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h3 className="font-bold text-blue-800 mb-2">💡 綜合評語</h3>
                                    <p className="text-blue-900 leading-relaxed">{matchResult.report.summary}</p>
                                </div>

                                {/* 優缺點並排 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border p-4 rounded-xl">
                                        <h3 className="font-bold text-green-700 flex items-center gap-2 mb-3">
                                            <CheckCircle size={18} /> 優勢 (Pros)
                                        </h3>
                                        <ul className="space-y-2">
                                            {matchResult.report.pros.map((pro, i) => (
                                                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                                    <span className="text-green-500 mt-1">•</span> {pro}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="border p-4 rounded-xl">
                                        <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-3">
                                            <AlertTriangle size={18} /> 風險 (Cons)
                                        </h3>
                                        <ul className="space-y-2">
                                            {matchResult.report.cons.map((con, i) => (
                                                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                                    <span className="text-orange-500 mt-1">•</span> {con}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* 面試題 */}
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3">❓ 建議面試題</h3>
                                    <div className="space-y-3">
                                        {matchResult.report.interview_questions.map((q, i) => (
                                            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                                <span className="font-bold text-gray-400 mr-2">Q{i + 1}.</span> {q}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">
                                AI 生成結果僅供參考，請以實際面試為準
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;