import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function JobEdit() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '', description: '', requirements: '', culture_traits: '', status: 'open'
    });

    // 載入舊資料
    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await axios.get(`jobs/${jobId}/`);
                const job = response.data;
                setFormData({
                    title: job.title,
                    description: job.description,
                    requirements: job.requirements,
                    // 把陣列轉回逗號分隔字串，方便編輯
                    culture_traits: Array.isArray(job.culture_traits) ? job.culture_traits.join(', ') : '',
                    status: job.status
                });
            } catch (error) {
                alert("找不到該職缺");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [jobId, navigate]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formattedData = {
                ...formData,
                // 轉回陣列
                culture_traits: formData.culture_traits.split(/[,，]/).map(t => t.trim()).filter(Boolean)
            };

            // 使用 PUT 更新
            await axios.put(`jobs/${jobId}/`, formattedData);
            alert('✅ 修改成功！');
            navigate('/'); // 回首頁
        } catch (error) {
            alert('❌ 修改失敗');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('確定要刪除此職缺嗎？相關的應徵紀錄也會一併刪除！')) {
            try {
                await axios.delete(`jobs/${jobId}/`);
                alert('🗑️ 已刪除');
                navigate('/');
            } catch (error) {
                alert('刪除失敗');
            }
        }
    }

    if (loading) return <div className="p-8 text-center">載入中...</div>;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6 flex justify-between items-center">
                <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600">
                    <ArrowLeft size={18} className="mr-1" /> 取消編輯
                </Link>
                <button onClick={handleDelete} className="text-red-500 hover:text-red-700 flex items-center text-sm font-bold">
                    <Trash2 size={16} className="mr-1" /> 刪除職缺
                </button>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-blue-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ 編輯職缺</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">職缺狀態</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50">
                            <option value="open">🟢 開放中 (Open)</option>
                            <option value="closed">🔴 已關閉 (Closed)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">職稱</label>
                        <input name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">工作內容 (JD)</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg h-40" required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">硬性條件</label>
                            <textarea name="requirements" value={formData.requirements} onChange={handleChange} className="w-full p-2 border rounded-lg h-40" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">特質 (逗號分隔)</label>
                        <input name="culture_traits" value={formData.culture_traits} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                    </div>

                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2">
                        <Save size={20} /> 儲存變更
                    </button>
                </form>
            </div>
        </div>
    );
}