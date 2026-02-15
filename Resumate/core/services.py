import os
import json
from google import genai # <--- 注意：引用名稱變了
from google.genai import types # <--- 用來設定 Config
from pypdf import PdfReader
from django.conf import settings
from dotenv import load_dotenv

# 設定 API Key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

def extract_text_from_pdf(pdf_source):
    """
    將 PDF 轉換為純文字
    :param pdf_source: 可以是檔案路徑 (str) 或是 Django 的 InMemoryUploadedFile
    """
    try:
        reader = PdfReader(pdf_source)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"PDF 解析錯誤: {e}")
        return None

def parse_resume_with_gemini(pdf_text):
    """呼叫 Gemini 將履歷文字轉換為結構化 JSON"""
    
    if not api_key:
        print("錯誤: 未設定 API Key")
        return None

    client = genai.Client(api_key=api_key)

    # 定義 Prompt (提示詞) - 這是 AI 的靈魂
    # 我們要求它輸出的格式必須跟我們之前的 Seed Data 一樣
    prompt = f"""
    你是一位專業的人資招聘專家。請閱讀以下履歷內容，並將其提取為嚴格的 JSON 格式。
    
    資料結構必須完全符合以下 Schema (Snake Case):
    {{
        "personal_info": {{
            "name": "姓名",
            "email": "Email",
            "phone": "電話",
            "summary": "個人簡介摘要"
        }},
        "experience": [
            {{
                "title": "職稱",
                "company": "公司名稱",
                "dates": "任職期間",
                "responsibilities": ["職責1", "職責2"]
            }}
        ],
        "education": [
            {{
                "degree": "學位",
                "institution": "學校",
                "dates": "就讀期間"
            }}
        ],
        "skills": {{
            "technical": ["技能1", "技能2"],
            "languages": ["語言1"]
        }},
        "projects": [
            {{
                "name": "專案名稱",
                "description": "描述",
                "technologies": ["技術1"]
            }}
        ]
    }}

    請注意：
    1. 若某欄位找不到資料，請填入 null 或空字串，不要自行杜撰。
    2. 只回傳 JSON 字串，不要包含 ```json 或其他 Markdown 標記。
    3. 確保 Email 格式正確。

    以下是履歷內容：
    {pdf_text}
    """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview", # <--- 測試成功的模型名稱
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # 回傳原本就是 JSON string，我們把它轉成 Python Dict 方便後續處理
        return json.loads(response.text)
        
    except Exception as e:
        print(f"AI 解析錯誤: {e}")
        return None
    
# ... (上面是原本的 code) ...

def analyze_job_match(candidate_data, job_description, culture_traits):
    """
    呼叫 AI 分析候選人與職缺的適配度
    :param candidate_data: 候選人的結構化資料 (Dict/JSON)
    :param job_description: 職缺描述 (String)
    :param culture_traits: 企業文化偏好 (List of Strings)
    """
    if not api_key:
        return None

    client = genai.Client(api_key=api_key)

    # 將資料轉成字串塞入 Prompt
    candidate_str = json.dumps(candidate_data, ensure_ascii=False)
    traits_str = ", ".join(culture_traits) if culture_traits else "無特別指定"

    prompt = f"""
    你是一位資深的人才招募專家。請根據以下資料，分析該候選人與職缺的適配度。

    【職缺描述 (JD)】
    {job_description}

    【企業文化/軟實力偏好】
    {traits_str}

    【候選人資料】
    {candidate_str}

    請回傳嚴格的 JSON 格式，包含以下欄位：
    1. match_score (0-100 的整數分數)
    2. summary (100字以內的綜合評語)
    3. pros (優勢列表，至少 3 點)
    4. cons (劣勢或風險列表，至少 3 點)
    5. interview_questions (針對該候選人經歷的客製化面試題，建議 3 題)
    6. culture_fit_analysis (針對文化偏好的具體分析)

    注意：只回傳 JSON，不要 markdown。
    """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
        
    except Exception as e:
        print(f"AI 配對分析錯誤: {e}")
        return None
    
def generate_email(candidate_name, job_title, email_type):
        """
        呼叫 Gemini 生成信件內容
        """
        if not api_key:
            return None

        client = genai.Client(api_key=api_key)

        # 1. 根據類型決定 Prompt 的意圖
        if email_type == 'interview':
            prompt_intent = "邀請面試"
            tone = "專業且熱情"
        elif email_type == 'rejection':
            prompt_intent = "婉拒信 (感謝函)"
            tone = "溫暖、禮貌且保留未來合作機會"
        elif email_type == 'offer':
            prompt_intent = "錄取通知 (Offer Letter)"
            tone = "恭喜、正式且激勵人心"
        else:
            prompt_intent = "通知信"
            tone = "專業"

        # 2. 組裝 Prompt
        prompt = f"""
        請你扮演一位專業的 HR，撰寫一封繁體中文的 Email。
        
        收件人：{candidate_name}
        應徵職位：{job_title}
        信件目的：{prompt_intent}
        語氣設定：{tone}
        
        請直接提供信件標題與內文，不要有額外的說明或開場白。
        格式如下：
        標題：...
        內文：...
        """

        try:
            # 3. 修正後的呼叫方式 (統一使用 client.models.generate_content)
            response = client.models.generate_content(
                model="gemini-3-flash-preview", # 這裡改用新版模型名稱，例如 gemini-2.0-flash 或 gemini-1.5-flash
                contents=prompt,
                # 這裡不需要 JSON mime_type，因為我們要的是純文字
            )
            return response.text
            
        except Exception as e:
            print(f"AI 生成信件錯誤: {e}")
            raise Exception("AI 服務暫時無法使用，請稍後再試。")
        
def polish_email(current_content, user_instruction):
        """
        AI 潤飾信件
        :param current_content: 目前的草稿內容
        :param user_instruction: 使用者的指令 (例如: 語氣再委婉一點、幫我縮短一點)
        """
        client = genai.Client(api_key=api_key)
        if not client: return "AI Service Unavailable"

        prompt = f"""
        你是一位專業的文字編輯。請根據使用者的指令，修改以下這封 Email 草稿。

        【原始草稿】
        {current_content}

        【修改指令】
        {user_instruction}

        請直接回傳修改後的完整信件內容（包含標題與內文），不要有額外的對話或說明。
        保持繁體中文。
        """

        try:
            response = client.models.generate_content(
                model="gemini-3-flash-preview", 
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"潤飾失敗: {str(e)}"