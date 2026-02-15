import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { X, Sparkles, Send, Save, RefreshCw } from 'lucide-react';

export default function EmailComposeModal({ isOpen, onClose, application, onSuccess }) {
    if (!isOpen || !application) return null;

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [emailType, setEmailType] = useState("interview");

    // AI 潤飾相關
    const [polishInstruction, setPolishInstruction] = useState("");
    const [isPolishing, setIsPolishing] = useState(false);

    // 1. 載入模板 (這可以是後端 API，這裡先模擬)
    const loadTemplate = (type) => {
        // 理想狀況：call API GET /api/templates/?type={type}
        // 這裡先寫死示範邏輯
        const candidateName = application.candidate?.name || "候選人";
        const jobTitle = application.job?.title || "職缺";

        if (type === 'interview') {
            setSubject(`面試邀約：${jobTitle} - ${candidateName}`);
            setBody(`${candidateName} 您好，\n\n感謝您應徵 ${jobTitle}。我們對您的經歷印象深刻，想邀請您參加面試...\n\nBest Regards,\nHR Team`);
        } else if (type === 'rejection') {
            setSubject(`感謝函：${jobTitle} - ${candidateName}`);
            setBody(`${candidateName} 您好，\n\n感謝您投遞履歷。經過審慎評估，我們決定...\n\nBest Regards,\nHR Team`);
        }
        setEmailType(type);
    };

    // 預設載入一次面試模板
    useEffect(() => {
        if (isOpen && !body) loadTemplate('interview');
    }, [isOpen]);

    // 2. AI 潤飾
    const handlePolish = async () => {
        if (!polishInstruction) return;
        setIsPolishing(true);
        try {
            const res = await axios.post('polish-email/', {
                current_content: `${subject}\n\n${body}`,
                user_instruction: polishInstruction
            });
            // 簡單解析回傳內容 (假設 AI 回傳格式包含標題內文)
            setBody(res.data.polished_content);
            // 註：實際應用可能需要正則表達式分開標題跟內文，或讓使用者手動調整
        } catch (error) {
            alert("潤飾失敗");
        } finally {
            setIsPolishing(false);
        }
    };

    // 3. 儲存草稿 (存到 EmailLog)
    const handleSaveDraft = async () => {
        try {
            await axios.post('email-tasks/', {
                application: application.id,
                subject: subject,
                body: body,
                email_type: emailType,
                status: 'draft'
            });
            alert("已存入信件中心");
            onSuccess(); // 關閉視窗並刷新
            onClose();
        } catch (error) {
            alert("儲存失敗");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800">撰寫信件 - {application.candidate?.name}</h2>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-red-500" /></button>
                </div>

                {/* Body: 左右兩欄 */}
                <div className="flex-1 flex overflow-hidden">

                    {/* 左側：編輯區 */}
                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                        {/* 模板選擇 */}
                        <div className="flex gap-2">
                            <button onClick={() => loadTemplate('interview')} className={`px-3 py-1 text-sm rounded-full border ${emailType === 'interview' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'hover:bg-gray-50'}`}>面試邀約</button>
                            <button onClick={() => loadTemplate('rejection')} className={`px-3 py-1 text-sm rounded-full border ${emailType === 'rejection' ? 'bg-gray-100 border-gray-200 text-gray-700' : 'hover:bg-gray-50'}`}>感謝函</button>
                            <button onClick={() => loadTemplate('offer')} className={`px-3 py-1 text-sm rounded-full border ${emailType === 'offer' ? 'bg-green-100 border-green-200 text-green-700' : 'hover:bg-gray-50'}`}>Offer</button>
                        </div>

                        <input
                            className="w-full p-3 text-lg font-bold border-b outline-none placeholder-gray-400"
                            placeholder="信件主旨"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                        />
                        <textarea
                            className="w-full flex-1 p-3 resize-none outline-none text-gray-700 leading-relaxed"
                            placeholder="信件內文..."
                            value={body}
                            onChange={e => setBody(e.target.value)}
                        />
                    </div>

                    {/* 右側：AI 潤飾區 (寬度 300px) */}
                    <div className="w-[300px] bg-purple-50 p-4 border-l border-purple-100 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-purple-800 font-bold">
                            <Sparkles size={18} /> AI 潤飾助手
                        </div>
                        <p className="text-xs text-purple-600">輸入指令並使用AI進行信件內容客製化。</p>

                        <textarea
                            className="w-full h-32 p-3 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
                            placeholder="例如：語氣再委婉一點、強調我們很重視他的作品集..."
                            value={polishInstruction}
                            onChange={e => setPolishInstruction(e.target.value)}
                        />

                        <button
                            onClick={handlePolish}
                            disabled={isPolishing || !polishInstruction}
                            className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPolishing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            開始潤飾
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">取消</button>
                    <button
                        onClick={handleSaveDraft}
                        className="px-5 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-black flex items-center gap-2"
                    >
                        <Save size={18} /> 存入待寄清單
                    </button>
                </div>

            </div>
        </div>
    );
}