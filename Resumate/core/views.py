from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Candidate, JobPosition, Application
from .services import extract_text_from_pdf, parse_resume_with_gemini, analyze_job_match
from .serializers import ResumeUploadSerializer, MatchJobSerializer, JobPositionSerializer, ApplicationSerializer
import random

class ResumeUploadView(APIView):
    # 設定 Parser，讓這個 View 懂得處理檔案上傳 (Multipart)
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = ResumeUploadSerializer

    def post(self, request, *args, **kwargs):
        # 1. 獲取上傳的檔案
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({"error": "未提供檔案"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            print(f"📥 接收到檔案: {file_obj.name}")

            # 2. 呼叫 Service: PDF 轉文字
            # 注意：extract_text_from_pdf 已經寫好可以處理 Django 的 file_obj
            text = extract_text_from_pdf(file_obj)
            
            if not text:
                return Response({"error": "無法讀取 PDF 內容"}, status=status.HTTP_400_BAD_REQUEST)

            # 3. 呼叫 Service: AI 分析
            print("🤖 正在呼叫 AI 進行分析...")
            ai_data = parse_resume_with_gemini(text)
            
            if not ai_data:
                return Response({"error": "AI 解析失敗，請稍後再試"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 4. 準備資料寫入資料庫
            # 從 AI 回傳的 JSON 提取基本欄位
            p_info = ai_data.get('personal_info', {})
            name = p_info.get('name') or "Unknown Candidate"
            
            # 處理 Email：因為我們設定了 Unique，若 AI 沒抓到，先給個假的不然會報錯
            email = p_info.get('email')
            if not email:
                 email = f"unknown_{random.randint(1000,9999)}@example.com"

            phone = p_info.get('phone', '')

            # 5. 寫入資料庫 (update_or_create 避免重複上傳同一人報錯)
            print(f"💾 正在寫入資料庫: {name}")
            candidate, created = Candidate.objects.update_or_create(
                email=email,
                defaults={
                    'name': name,
                    'phone': phone,
                    'resume_file': file_obj, # Django 會自動幫你存檔案到 media/resumes/
                    'parsed_data': ai_data   # 把完整的 AI JSON 存進去
                }
            )

            action = "建立" if created else "更新"
            return Response({
                "message": f"成功{action}候選人資料！",
                "candidate_id": candidate.id,
                "name": candidate.name,
                "parsed_data": ai_data # 回傳給前端顯示
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"❌ 發生錯誤: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MatchJobView(APIView):
    serializer_class = MatchJobSerializer

    def post(self, request, *args, **kwargs):
        
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. 獲取前端傳來的 ID
        candidate_id = request.data.get('candidate_id')
        job_id = request.data.get('job_id')

        if not candidate_id or not job_id:
            return Response({"error": "缺少 candidate_id 或 job_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 2. 從資料庫撈資料
            candidate = Candidate.objects.get(id=candidate_id)
            job = JobPosition.objects.get(id=job_id)

            # 3. 呼叫 AI 進行分析 (傳入 履歷JSON, JD文字, 文化列表)
            print(f"🤖 正在分析 {candidate.name} 與 {job.title} 的適配度...")
            
            # 注意：這裡我們直接用 candidate.parsed_data，這是之前 AI 解析好存進去的
            analysis_result = analyze_job_match(
                candidate.parsed_data, 
                job.description, 
                job.culture_traits
            )

            if not analysis_result:
                return Response({"error": "AI 分析失敗"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 4. 儲存或更新 Application 紀錄
            # Application 是連結 Candidate 與 Job 的中間表
            application, created = Application.objects.update_or_create(
                candidate=candidate,
                job=job,
                defaults={
                    'ai_match_score': analysis_result.get('match_score', 0),
                    'ai_analysis_report': analysis_result, # 把整份報告存進去
                    'status': 'screening' # 更新狀態為初篩中
                }
            )

            return Response({
                "message": "分析完成",
                "application_id": application.id,
                "score": application.ai_match_score,
                "report": application.ai_analysis_report
            }, status=status.HTTP_200_OK)

        except Candidate.DoesNotExist:
            return Response({"error": "找不到該候選人"}, status=status.HTTP_404_NOT_FOUND)
        except JobPosition.DoesNotExist:
            return Response({"error": "找不到該職缺"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# 1. 職缺列表與新增 (GET / POST)
class JobPositionListCreateView(generics.ListCreateAPIView):
    queryset = JobPosition.objects.all().order_by('-created_at')
    serializer_class = JobPositionSerializer

# 2. (選用) 單一職缺修改與刪除 (GET / PUT / DELETE)
# 如果你之後想在網頁上修改 JD，可以加上這個
class JobPositionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = JobPosition.objects.all()
    serializer_class = JobPositionSerializer

class JobApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        # 從網址取得 job_id (例如 jobs/1/applications/ 的 1)
        job_id = self.kwargs['pk']
        
        # 撈出該職缺的所有紀錄，並依照分數由高到低排序 (高分在前)
        return Application.objects.filter(job_id=job_id).order_by('-ai_match_score')

class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer