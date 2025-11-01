from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date as date_type, datetime
from typing import Optional, List

class ExpenseCreate(BaseModel):
    """Schema for creating a new expense"""
    title: str = Field(..., min_length=1, max_length=200, description="Title of the expense")
    category: str = Field(..., min_length=1, max_length=100, description="Category of the expense")
    amount: float = Field(..., gt=0, le=1000000, description="Amount spent (must be positive)")
    date: date_type = Field(..., description="Date of the expense")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")

class ExpenseUpdate(BaseModel):
    """Schema for updating an existing expense"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0, le=1000000)
    date: Optional[date_type] = None
    description: Optional[str] = Field(None, max_length=500)

class ExpenseOut(BaseModel):
    """Schema for expense output"""
    id: int
    title: str
    category: str
    amount: float
    date: date_type
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ExpenseStats(BaseModel):
    """Schema for expense statistics"""
    total_expenses: int
    total_amount: float
    average_amount: float
    categories: dict = Field(..., description="Category breakdown")
    expense_count: int

class InsightData(BaseModel):
    """Schema for AI-generated insights"""
    total_spent: float = Field(..., description="Total amount spent")
    top_categories: List[str] = Field(default_factory=list, description="Top spending categories")
    patterns: List[str] = Field(default_factory=list, description="Spending patterns detected")
    outliers: List[str] = Field(default_factory=list, description="Unusual expenses")
    suggestions: List[str] = Field(default_factory=list, description="Money-saving suggestions")

class HealthCheck(BaseModel):
    """Schema for API health check"""
    status: str
    message: str

class CategorySummary(BaseModel):
    """Schema for category summary statistics"""
    category: str = Field(..., description="Category name")
    count: int = Field(..., description="Number of expenses in this category")
    total_amount: float = Field(..., description="Total amount spent in this category")
    average_amount: float = Field(..., description="Average amount per expense in this category")
    percentage: float = Field(..., description="Percentage of total spending")

class SpendingTrends(BaseModel):
    """Schema for spending trends analysis"""
    period_days: int = Field(..., description="Number of days analyzed")
    total_expenses: int = Field(..., description="Total number of expenses in period")
    total_amount: float = Field(..., description="Total amount spent in period")
    daily_spending: dict = Field(..., description="Daily spending breakdown")
    category_breakdown: dict = Field(..., description="Category spending breakdown")
    average_daily: float = Field(..., description="Average daily spending")

class ErrorResponse(BaseModel):
    """Schema for error responses"""
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code for programmatic handling")
    
class SuccessResponse(BaseModel):
    """Schema for success responses"""
    message: str = Field(..., description="Success message")
    data: Optional[dict] = Field(None, description="Additional response data")
    timestamp: str

class ErrorResponse(BaseModel):
    """Schema for error responses"""
    error: str
    detail: str
    status_code: int