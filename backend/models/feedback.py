"""
Feedback-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime
import uuid


class FeedbackQuestion(BaseModel):
    question: str
    type: str  # "rating" or "text"  (changed from question_type for backward compatibility)
    required: bool = True
    options: Optional[List[str]] = None


class FeedbackTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    title: Optional[str] = None  # Made optional for backward compatibility
    questions: List[FeedbackQuestion]
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class FeedbackTemplateCreate(BaseModel):
    program_id: str
    title: Optional[str] = None  # Made optional for backward compatibility
    questions: List[FeedbackQuestion]


class FeedbackTemplateUpdate(BaseModel):
    title: Optional[str] = None
    questions: Optional[List[FeedbackQuestion]] = None


class CourseFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    participant_id: str
    feedback_template_id: Optional[str] = None
    responses: List[Dict]
    submitted_at: datetime = Field(default_factory=lambda: datetime.now())


class FeedbackSubmit(BaseModel):
    session_id: str
    feedback_template_id: Optional[str] = None
    responses: List[Dict]


class CoordinatorFeedbackTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sections: List[Dict] = [
        {
            "title": "Training Delivery",
            "questions": [
                {"id": "td1", "question": "How would you rate the trainer's knowledge?", "type": "rating"},
                {"id": "td2", "question": "Was the training content well-organized?", "type": "rating"},
            ]
        }
    ]


class ChiefTrainerFeedbackTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sections: List[Dict] = [
        {
            "title": "Trainer Performance",
            "questions": [
                {"id": "tp1", "question": "Rate trainer's technical competency", "type": "rating"},
            ]
        }
    ]


class CoordinatorFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    coordinator_id: str
    responses: Dict
    submitted_at: datetime = Field(default_factory=lambda: datetime.now())


class ChiefTrainerFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    trainer_id: str
    responses: Dict
    submitted_at: datetime = Field(default_factory=lambda: datetime.now())
