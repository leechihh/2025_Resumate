import { useEffect, useState } from 'react';
import axios from '../api/axios'; // 注意路徑可能變成兩個點 ..
import { Plus, X, ChevronRight, Edit3, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 1. 引入 useNavigate

function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // 路由導航工具
    const navigate = useNavigate(); // 2. 初始化 hook

    // 配對相關狀態
    const [matchResult, setMatchResult] = useState(null);
    const [globalBlindMode, setGlobalBlindMode] = useState(false); // 全域盲測開關

    // 表單狀態
    const [formData, setFormData] = useState({
        title: '', description: '', requirements: '', culture_traits: '',
    });

    // 取得資料
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

    // 表單處理
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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

    // 點擊卡片跳轉邏輯
    const handleCardClick = (jobId) => {
        navigate(`/jobs/${jobId}`, { state: { blindMode: globalBlindMode } });
    };

    // 編輯按鈕點擊邏輯
    const handleEditClick = (e, jobId) => {
        e.stopPropagation();
        navigate(`/jobs/${jobId}/edit`);
    };


    // 上傳 / 配對功能已移除（使用者要求不需上傳按鈕）

    return (
        <div>
            {/* 隱藏的檔案上傳 Input（已移除） */}

            {/* 標題與新增按鈕 */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">職缺總覽</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setGlobalBlindMode(!globalBlindMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border ${globalBlindMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300'
                            }`}
                    >
                        {globalBlindMode ? <><EyeOff size={20} /> 盲測模式 ON</> : <><Eye size={20} /> 盲測模式 OFF</>}
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                        {showForm ? <><X size={20} /> 取消新增</> : <><Plus size={20} /> 新增職缺</>}
                    </button>
                </div>
            </div>

            {/* 新增表單區塊 (省略細節，保持原本邏輯即可) */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-blue-100 animate-fade-in">
                    {/* ... 這裡保持你原本的表單內容 ... */}
                    <h2 className="text-xl font-bold mb-4 text-gray-700">📝 新增一筆職缺</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 簡化顯示，請直接用原本的表單內容填入這裡 */}
                        <input name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="職稱" required />
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="JD" required />
                        <textarea name="requirements" value={formData.requirements} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="硬性條件" required />
                        <input name="culture_traits" value={formData.culture_traits} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="特質" />
                        <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg">發布</button></div>
                    </form>
                </div>
            )}

            {/* 職缺列表 */}
            {loading ? (
                <p className="text-center text-gray-500 py-10">載入中...</p>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            // 4. 在這裡綁定卡片點擊事件
                            onClick={() => handleCardClick(job.id)}
                            className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col md:flex-row justify-between gap-6 cursor-pointer relative hover:border-blue-300"
                        >
                            {/* 左側資訊 */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">{job.title}</h2>
                                        <p className="text-sm text-gray-500 mt-1">建立於 {new Date(job.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium md:hidden ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {job.status === 'open' ? '開放中' : '已關閉'}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-3 line-clamp-2">{job.description}</p>
                                <div className="mt-4 flex gap-2 flex-wrap">
                                    {Array.isArray(job.culture_traits) ? (
                                        job.culture_traits.map((trait, index) => (
                                            <span key={index} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium border border-blue-100">{trait}</span>
                                        ))
                                    ) : job.culture_traits && typeof job.culture_traits === 'object' ? (
                                        Object.entries(job.culture_traits).map(([k, v], index) => (
                                            <span key={index} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium border border-blue-100">{typeof v === 'string' ? v : k}</span>
                                        ))
                                    ) : null}
                                </div>
                            </div>

                            {/* 右側按鈕與狀態（重新排列以平均分布） */}
                            <div className="flex flex-col items-end justify-between gap-3 min-w-[160px]">
                                <span className={`hidden md:inline-block px-3 py-1 rounded-full text-xs font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {job.status === 'open' ? '開放中' : '已關閉'}
                                </span>
                                <div className="flex items-center gap-3 mt-2 md:mt-0">
                                    <button
                                        onClick={(e) => handleEditClick(e, job.id)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                        title="編輯職缺"
                                    >
                                        <Edit3 size={20} />
                                    </button>
                                    <div className="text-gray-400 group-hover:text-blue-600">
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {matchResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setMatchResult(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* 這裡放原本的 Modal 內容 (省略以節省篇幅) ... */}
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">分析報告</h2>
                                <button onClick={() => setMatchResult(null)}><X /></button>
                            </div>
                            <div className="text-center text-6xl font-bold mb-4 text-blue-600">{matchResult?.report?.match_score}</div>
                            <p>{matchResult?.report?.summary}</p>
                            {/* ... 其他內容 ... */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;