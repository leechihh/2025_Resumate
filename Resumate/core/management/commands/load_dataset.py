import json
import random
from django.core.management.base import BaseCommand
from core.models import Candidate
from datasets import load_dataset

class Command(BaseCommand):
    help = '從 Hugging Face (datasetmaster/resumes) 下載並匯入履歷資料 (Schema 適配版)'

    def handle(self, *args, **kwargs):
        self.stdout.write("正在連接 Hugging Face 下載 datasetmaster/resumes ...")
        
        # 載入資料集 (只取前 20 筆測試)
        ds = load_dataset("datasetmaster/resumes", split="train[:20]")
        
        self.stdout.write(f"下載完成，準備處理 {len(ds)} 筆資料...")

        candidates_to_create = []
        
        for i, item in enumerate(ds):
            # item 結構對應你提供的 Schema:
            # {
            #   "personal_info": { "name": "...", "email": "...", ... },
            #   "experience": [ ... ],
            #   "skills": { "technical": { ... } },
            #   ...
            # }

            # 1. 提取基本個資 (注意這裡是小寫 personal_info)
            p_info = item.get('personal_info', {})
            
            # 2. 處理姓名
            # 資料集 schema 顯示 name 是 string
            name = p_info.get('name') or f"Candidate_{i+1}"
            
            # 3. 處理 Email (生成假 Email 以防重複或空值)
            # 雖然 schema 有 email 欄位，但為了避免 Unique Constraint Error，
            # 若 email 為空或為了測試方便，我們這裡混合一點隨機數
            original_email = p_info.get('email')
            if original_email:
                # 簡單處理：保留原 email username，後面加隨機數，確保不重複
                email_user = original_email.split('@')[0]
                fake_email = f"{email_user}_{random.randint(1000, 9999)}@example.com"
            else:
                fake_email = f"user_{i+1}_{random.randint(1000, 9999)}@example.com"

            phone = p_info.get('phone', "")

            # 4. 準備 parsed_data
            # 因為你的資料集結構已經非常完美（已經是結構化的 JSON），
            # 我們可以直接把整包 item 存進去，或者只存我們在意的部分。
            # 這裡我們選擇存入完整的結構，讓未來的 AI 分析可以用。
            
            structured_payload = {
                "personal_info": p_info,
                "summary": p_info.get('summary', ''), # 摘要通常在 personal_info 裡
                "experience": item.get('experience', []),
                "education": item.get('education', []),
                "skills": item.get('skills', {}),
                "projects": item.get('projects', []),
                "certifications": item.get('certifications', ''),
                "languages": item.get('languages', [])
            }

            # 5. 建立 Candidate 物件
            candidate = Candidate(
                name=name,
                email=fake_email, 
                phone=phone,
                resume_file=None, # 沒有實體 PDF
                parsed_data=structured_payload # <--- 完美存入結構化資料
            )
            candidates_to_create.append(candidate)

        # 6. 寫入資料庫
        # ignore_conflicts=True：如果剛好隨機生成的 Email 還是重複，就跳過該筆
        Candidate.objects.bulk_create(candidates_to_create, ignore_conflicts=True)
        
        self.stdout.write(self.style.SUCCESS(f"成功匯入 {len(candidates_to_create)} 筆資料！"))
        self.stdout.write(f"範例資料：{candidates_to_create[0].name} ({candidates_to_create[0].email})")