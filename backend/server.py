from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from slugify import slugify
import secrets
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from passlib.context import CryptContext
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Test Platform API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBasic()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Email service
class EmailDeliveryError(Exception):
    pass

async def send_email(to: str, subject: str, content: str, content_type: str = "html"):
    """Send email via SendGrid"""
    message = Mail(
        from_email=os.getenv('SENDER_EMAIL'),
        to_emails=to,
        subject=subject,
        html_content=content if content_type == "html" else None,
        plain_text_content=content if content_type == "plain" else None
    )

    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        raise EmailDeliveryError(f"Failed to send email: {str(e)}")

# Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: str = "#4F46E5"
    sort_order: int = 0
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    type: str  # single_choice, multiple_choice, scale, text
    options: Optional[List[str]] = None
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    min_label: Optional[str] = None
    max_label: Optional[str] = None
    required: bool = True
    order: int = 0

class TestTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category_id: str
    questions: List[Question]
    result_templates: Optional[Dict[str, Any]] = None
    is_public: bool = True
    creator_id: Optional[str] = None
    estimated_duration: int = 5  # minutes
    completions_count: int = 0
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomTest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    creator_email: EmailStr
    questions: List[Question]
    share_token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    settings: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_id: str
    test_type: str  # template or custom
    respondent_email: EmailStr
    answers: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: str = "#4F46E5"

class TestTemplateCreate(BaseModel):
    title: str
    description: str
    category_id: str
    questions: List[Question]

class CustomTestCreate(BaseModel):
    title: str
    description: str
    creator_email: EmailStr
    questions: List[Question]

class TestResponseCreate(BaseModel):
    test_id: str
    test_type: str
    respondent_email: EmailStr
    answers: Dict[str, Any]

# Admin authentication
async def verify_admin_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = "admin"
    correct_password = "1234"
    
    if credentials.username != correct_username or credentials.password != correct_password:
        raise HTTPException(
            status_code=401,
            detail="Неверные учетные данные",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Test Platform API"}

# Categories
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().sort("sort_order", 1).to_list(length=None)
    return [Category(**cat) for cat in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, admin: HTTPBasicCredentials = Depends(verify_admin_credentials)):
    category_data = category.dict()
    category_data['slug'] = slugify(category.name)
    category_obj = Category(**category_data)
    await db.categories.insert_one(category_obj.dict())
    return category_obj

# Test Templates
@api_router.get("/test-templates", response_model=List[TestTemplate])
async def get_test_templates(category_id: Optional[str] = None):
    query = {"is_public": True}
    if category_id:
        query["category_id"] = category_id
    templates = await db.test_templates.find(query).sort("created_at", -1).to_list(length=None)
    return [TestTemplate(**template) for template in templates]

@api_router.get("/test-templates/{template_id}", response_model=TestTemplate)
async def get_test_template(template_id: str):
    template = await db.test_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Тест не найден")
    return TestTemplate(**template)

@api_router.post("/test-templates", response_model=TestTemplate)
async def create_test_template(template: TestTemplateCreate, admin: HTTPBasicCredentials = Depends(verify_admin_credentials)):
    template_obj = TestTemplate(**template.dict())
    await db.test_templates.insert_one(template_obj.dict())
    return template_obj

# Custom Tests
@api_router.post("/custom-tests", response_model=CustomTest)
async def create_custom_test(test: CustomTestCreate):
    test_obj = CustomTest(**test.dict())
    await db.custom_tests.insert_one(test_obj.dict())
    return test_obj

@api_router.get("/custom-tests/{share_token}", response_model=CustomTest)
async def get_custom_test_by_token(share_token: str):
    test = await db.custom_tests.find_one({"share_token": share_token, "is_active": True})
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    return CustomTest(**test)

# Test Responses
@api_router.post("/test-responses")
async def submit_test_response(response: TestResponseCreate, background_tasks: BackgroundTasks):
    response_obj = TestResponse(**response.dict())
    
    # Save response to database
    await db.test_responses.insert_one(response_obj.dict())
    
    # Get test details for email notification
    if response.test_type == "custom":
        test = await db.custom_tests.find_one({"id": response.test_id})
        if test:
            # Send notification to test creator
            background_tasks.add_task(
                send_test_completion_notification,
                test['creator_email'],
                test['title'],
                response.respondent_email,
                response_obj.dict()
            )
    
    return {"status": "success", "message": "Ответы сохранены"}

async def send_test_completion_notification(creator_email: str, test_title: str, respondent_email: str, response_data: dict):
    """Send notification to test creator about new response"""
    subject = f"Новый ответ на ваш тест: {test_title}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center;">
                <h1 style="color: #333;">Новый ответ на ваш тест!</h1>
            </div>
            <div style="padding: 20px;">
                <h2>📋 {test_title}</h2>
                <p><strong>👤 Респондент:</strong> {respondent_email}</p>
                <p><strong>📅 Дата прохождения:</strong> {response_data['completed_at']}</p>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>🎯 Ответы:</h3>
                    <div style="white-space: pre-wrap;">{str(response_data['answers'])}</div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #666;">Создайте свой тест на нашей платформе!</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    try:
        await send_email(creator_email, subject, html_content, "html")
    except EmailDeliveryError as e:
        print(f"Failed to send notification email: {e}")

# Admin routes
@api_router.get("/admin/stats")
async def get_admin_stats(admin: HTTPBasicCredentials = Depends(verify_admin_credentials)):
    total_templates = await db.test_templates.count_documents({})
    total_custom_tests = await db.custom_tests.count_documents({})
    total_responses = await db.test_responses.count_documents({})
    total_categories = await db.categories.count_documents({})
    
    return {
        "total_templates": total_templates,
        "total_custom_tests": total_custom_tests,
        "total_responses": total_responses,
        "total_categories": total_categories
    }

# Initialize default data
@api_router.post("/admin/init-data")
async def initialize_default_data(admin: HTTPBasicCredentials = Depends(verify_admin_credentials)):
    """Initialize platform with default categories and test templates"""
    
    # Check if data already exists
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Данные уже инициализированы"}
    
    # Default categories
    default_categories = [
        {
            "name": "Личность и характер",
            "slug": "personality",
            "description": "Тесты для определения типа личности и черт характера",
            "icon": "user",
            "color": "#4F46E5",
            "sort_order": 1
        },
        {
            "name": "Отношения",
            "slug": "relationships", 
            "description": "Тесты о совместимости и отношениях",
            "icon": "heart",
            "color": "#EC4899",
            "sort_order": 2
        },
        {
            "name": "Карьера и профессия",
            "slug": "career",
            "description": "Профориентационные тесты и тесты для карьеры",
            "icon": "briefcase",
            "color": "#059669",
            "sort_order": 3
        },
        {
            "name": "Интеллект и способности", 
            "slug": "intelligence",
            "description": "Тесты на интеллект и когнитивные способности",
            "icon": "brain",
            "color": "#DC2626",
            "sort_order": 4
        },
        {
            "name": "Эмоциональное состояние",
            "slug": "emotions",
            "description": "Тесты на эмоциональное состояние и стрессоустойчивость",
            "icon": "smile",
            "color": "#7C3AED",
            "sort_order": 5
        }
    ]
    
    # Insert categories
    categories = []
    for cat_data in default_categories:
        category = Category(**cat_data)
        await db.categories.insert_one(category.dict())
        categories.append(category)
    
    # Create sample test template
    sample_questions = [
        Question(
            text="Какой ваш любимый цвет?",
            type="single_choice",
            options=["Красный", "Синий", "Зеленый", "Желтый", "Черный", "Белый"],
            order=1
        ),
        Question(
            text="Как вы предпочитаете проводить выходные?",
            type="single_choice", 
            options=["Дома с книгой", "С друзьями на природе", "В спортзале", "За творчеством", "За изучением чего-то нового"],
            order=2
        ),
        Question(
            text="Оцените свою общительность по шкале от 1 до 10",
            type="scale",
            min_value=1,
            max_value=10,
            min_label="Интроверт",
            max_label="Экстраверт",
            order=3
        )
    ]
    
    sample_template = TestTemplate(
        title="Узнай меня лучше",
        description="Базовый тест для знакомства с человеком. Узнайте больше о предпочтениях и характере.",
        category_id=categories[0].id,  # Personality category
        questions=sample_questions,
        estimated_duration=3
    )
    
    await db.test_templates.insert_one(sample_template.dict())
    
    return {"message": "Данные успешно инициализированы", "categories_created": len(categories)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()