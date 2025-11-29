"""
Test-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid


class TestQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int  # Index of the correct answer (0-3)


class Test(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    title: str
    test_type: Optional[str] = None  # "pre" or "post"
    questions: List[TestQuestion]
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class TestCreate(BaseModel):
    program_id: str
    title: str
    test_type: Optional[str] = None  # "pre" or "post"
    questions: List[TestQuestion]


class TestResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_id: str
    participant_id: str
    session_id: str
    answers: List[int]  # List of selected option indices
    score: float
    passed: bool
    submitted_at: datetime = Field(default_factory=lambda: datetime.now())
    participant_name: Optional[str] = None
    participant_ic: Optional[str] = None
    question_indices: Optional[List[int]] = None  # For shuffled questions


class TestSubmit(BaseModel):
    test_id: str
    session_id: str
    answers: List[int]  # List of selected option indices
    question_indices: Optional[List[int]] = None  # Order questions were shown
