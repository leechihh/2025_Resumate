import os
import json
from dotenv import load_dotenv
from pypdf import PdfReader
from google import genai # <--- 注意：引用名稱變了
from google.genai import types # <--- 用來設定 Config

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
# 初始化 Client
client = genai.Client(api_key=api_key)

# ==========================================
# 1. PDF 讀取函數 (加上進度條除錯)
# ==========================================
def extract_text_from_pdf(pdf_path):
    print(f"📄 正在讀取 PDF: {pdf_path}")
    try:
        reader = PdfReader(pdf_path)
        text = ""
        total_pages = len(reader.pages)
        print(f"   共發現 {total_pages} 頁，開始解析...")
        
        for i, page in enumerate(reader.pages):
            # 印出進度，確認不是卡死
            print(f"   -> 正在處理第 {i+1}/{total_pages} 頁...") 
            page_text = page.extract_text()
            if page_text:
                text += page_text
        
        print(f"✅ PDF 讀取完成！(共 {len(text)} 字)")
        return text
    except Exception as e:
        print(f"❌ 讀取 PDF 失敗: {e}")
        return None

# ==========================================
# 2. 新版 Gemini API 函數
# ==========================================
def test_gemini_parsing(text):
    print("🤖 正在呼叫 Gemini (新版 SDK)...")
    
    # # 初始化 Client
    # client = genai.Client(api_key=api_key)

    prompt = f"""
    請將這份履歷提取為 JSON 格式。
    需要的欄位: personal_info (name, email, phone, summary), experience (list), education (list), skills (dict), projects (list).
    
    履歷內容:
    {text[:5000]} 
    """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json" # <--- 關鍵！強迫回傳 JSON
            )
        )
        
        print("\n🎉 Gemini 回傳成功！\n")
        print(response.text)
        return response.text
        
    except Exception as e:
        print(f"❌ Gemini API 錯誤: {e}")
        return None

# ==========================================
# 主程式
# ==========================================
if __name__ == "__main__":
    pdf_file = "cv_example.pdf" # 請確認你的檔名是這個
    
    if not os.path.exists(pdf_file):
        print(f"❌ 找不到檔案: {pdf_file}，請檢查檔名")
    else:
        pdf_text = extract_text_from_pdf(pdf_file)
        
        if pdf_text:
            test_gemini_parsing(pdf_text)