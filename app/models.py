from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Index, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import validates
from app.utils.database import Base
from datetime import datetime
import re

class Expense(Base):
    """
    Expense model for storing financial expense records with optimizations and constraints
    """
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Add composite indexes for better query performance
    __table_args__ = (
        Index('idx_expense_category_date', 'category', 'date'),
        Index('idx_expense_date_amount', 'date', 'amount'),
        Index('idx_expense_created_at', 'created_at'),
        Index('idx_expense_amount_desc', 'amount'),
        Index('idx_expense_title_search', 'title'),
        # Add database-level constraints
        CheckConstraint('amount > 0', name='check_positive_amount'),
        CheckConstraint('length(title) > 0', name='check_non_empty_title'),
    )

    @validates('title')
    def validate_title(self, key, title):
        """Validate title field"""
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")
        # Remove extra whitespace and limit length
        cleaned_title = re.sub(r'\s+', ' ', title.strip())
        if len(cleaned_title) > 200:
            raise ValueError("Title cannot exceed 200 characters")
        return cleaned_title

    @validates('category')
    def validate_category(self, key, category):
        """Validate category field with mapping for old category names"""
        # Map old category names to new ones
        category_mapping = {
            'Food & Dining': 'Food',
            'Bills & Utilities': 'Utilities',
            'Others': 'Other',
            'Travel': 'Other'  # Map Travel to Other since it's not in our list
        }
        
        # Apply mapping if category exists in mapping
        if category in category_mapping:
            category = category_mapping[category]
        
        allowed_categories = [
            'Food', 'Transportation', 'Entertainment', 'Shopping', 
            'Healthcare', 'Education', 'Utilities', 'Other'
        ]
        if category not in allowed_categories:
            raise ValueError(f"Category must be one of: {', '.join(allowed_categories)}")
        return category

    @validates('amount')
    def validate_amount(self, key, amount):
        """Validate amount field"""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        if amount > 1000000:
            raise ValueError("Amount cannot exceed ₹10,00,000")
        # Round to 2 decimal places
        return round(float(amount), 2)

    @validates('description')
    def validate_description(self, key, description):
        """Validate description field"""
        if description is not None:
            cleaned_desc = description.strip()
            if len(cleaned_desc) > 500:
                raise ValueError("Description cannot exceed 500 characters")
            return cleaned_desc if cleaned_desc else None
        return description

    def __repr__(self):
        return f"<Expense(id={self.id}, title='{self.title}', category='{self.category}', amount={self.amount}, date='{self.date}')>"

    def __str__(self):
        return f"{self.title} - ₹{self.amount:.2f} on {self.date}"

    @property
    def formatted_amount(self):
        """Return formatted amount with currency symbol"""
        return f"₹{self.amount:,.2f}"

    @property
    def age_days(self):
        """Return how many days ago this expense was created"""
        if self.created_at:
            return (datetime.now() - self.created_at.replace(tzinfo=None)).days
        return 0

    @property
    def is_recent(self):
        """Check if expense was created in the last 7 days"""
        return self.age_days <= 7

    @property
    def is_high_amount(self):
        """Check if expense amount is considered high (>₹5000)"""
        return self.amount > 5000

    @classmethod
    def get_category_choices(cls):
        """Get list of valid category choices"""
        return [
            'Food', 'Transportation', 'Entertainment', 'Shopping', 
            'Healthcare', 'Education', 'Utilities', 'Other'
        ]

    def to_dict(self, include_computed=True):
        """Convert model instance to dictionary"""
        result = {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'amount': self.amount,
            'date': self.date.isoformat() if self.date else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_computed:
            result.update({
                'formatted_amount': self.formatted_amount,
                'age_days': self.age_days,
                'is_recent': self.is_recent,
                'is_high_amount': self.is_high_amount
            })
        
        return result

    def update_from_dict(self, data):
        """Update instance from dictionary"""
        allowed_fields = ['title', 'category', 'amount', 'date', 'description']
        for field, value in data.items():
            if field in allowed_fields and value is not None:
                setattr(self, field, value)

    @classmethod
    def search_expenses(cls, session, query_text, limit=50):
        """Search expenses by title or description"""
        search_pattern = f"%{query_text}%"
        return session.query(cls).filter(
            cls.title.ilike(search_pattern) | 
            cls.description.ilike(search_pattern)
        ).order_by(cls.date.desc()).limit(limit).all()

    @classmethod
    def get_expenses_by_category(cls, session, category, limit=None):
        """Get expenses filtered by category"""
        query = session.query(cls).filter(cls.category == category).order_by(cls.date.desc())
        if limit:
            query = query.limit(limit)
        return query.all()

    @classmethod
    def get_recent_expenses(cls, session, days=30, limit=50):
        """Get recent expenses within specified days"""
        from datetime import date, timedelta
        cutoff_date = date.today() - timedelta(days=days)
        return session.query(cls).filter(
            cls.date >= cutoff_date
        ).order_by(cls.date.desc()).limit(limit).all()