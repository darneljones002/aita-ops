from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ParentCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    sms_consent_status: Optional[str] = "not_requested"
    sms_consent_source: Optional[str] = None
    email_consent_status: Optional[str] = "subscribed"


class ParentOut(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    phone_normalized: Optional[str] = None
    phone_valid: str = "unknown"
    sms_consent_status: str = "not_requested"
    sms_consent_source: Optional[str] = None
    sms_consent_timestamp: Optional[datetime] = None
    sms_opt_out_timestamp: Optional[datetime] = None
    email_consent_status: str = "subscribed"
    email_consent_timestamp: Optional[datetime] = None
    email_opt_out_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class AthleteCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    grade: Optional[str] = None
    graduation_year: Optional[str] = None
    status: Optional[str] = "lead"
    preferred_location: Optional[str] = None
    notes: Optional[str] = None
    parent_id: int


class AthleteOut(AthleteCreate):
    id: int

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    title: str
    location: str
    start_time: datetime
    end_time: datetime
    capacity: int = 12
    session_type: str = "academy"


class SessionOut(SessionCreate):
    id: int

    class Config:
        from_attributes = True


class InviteCreate(BaseModel):
    athlete_id: int
    session_id: int
    status: Optional[str] = "invited"
    notes: Optional[str] = None


class InviteUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class InviteOut(InviteCreate):
    id: int

    class Config:
        from_attributes = True

       
class MessageTemplateCreate(BaseModel):
    name: str
    channel: str = "sms"
    body: str


class MessageTemplateOut(MessageTemplateCreate):
    id: int

    class Config:
        from_attributes = True


class MessageRenderRequest(BaseModel):
    template_id: int
    athlete_id: int
    session_id: Optional[int] = None


class SendSmsRequest(BaseModel):
    parent_id: int
    athlete_id: Optional[int] = None
    session_id: Optional[int] = None
    body: str
    message_type: Optional[str] = "session_reminder"


class MessageLogOut(BaseModel):
    id: int
    parent_id: Optional[int] = None
    athlete_id: Optional[int] = None
    session_id: Optional[int] = None
    channel: str
    message_type: str
    recipient: str
    body: str
    status: str
    provider_message_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SendEmailRequest(BaseModel):
    parent_id: int
    athlete_id: Optional[int] = None
    session_id: Optional[int] = None
    subject: str
    body: str
    message_type: Optional[str] = "session_email"

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = None
    description: Optional[str] = None


class TagOut(TagCreate):
    id: int

    class Config:
        from_attributes = True


class AthleteTagCreate(BaseModel):
    athlete_id: int
    tag_id: int


class AthleteTagOut(AthleteTagCreate):
    id: int

    class Config:
        from_attributes = True

class BulkPreviewByTagRequest(BaseModel):
    tag_ids: list[int]
    template_id: int
    session_id: Optional[int] = None
    channel: str
    subject: Optional[str] = None
    message_type: Optional[str] = "bulk_message"


class BulkPreviewResultItem(BaseModel):
    athlete_id: int
    athlete_name: str
    parent_id: Optional[int] = None
    parent_name: Optional[str] = None
    recipient: Optional[str] = None
    status: str
    body: str
    subject: Optional[str] = None
    reason: Optional[str] = None


class BulkPreviewResult(BaseModel):
    total_matched: int
    ready: int
    blocked: int
    results: list[BulkPreviewResultItem]

class BulkInviteByTagRequest(BaseModel):
    tag_ids: list[int]
    status: Optional[str] = "invited"
    skip_existing: Optional[bool] = True


class BulkInviteResult(BaseModel):
    created: int
    skipped: int
    athlete_ids: list[int]

class BulkSendByTagRequest(BaseModel):
    tag_ids: list[int]
    template_id: int
    session_id: Optional[int] = None
    channel: str  # sms | email
    subject: Optional[str] = None
    message_type: Optional[str] = "bulk_message"
    skip_existing_logs: Optional[bool] = False


class BulkSendResultItem(BaseModel):
    athlete_id: int
    parent_id: Optional[int] = None
    recipient: Optional[str] = None
    status: str
    message: Optional[str] = None


class BulkSendResult(BaseModel):
    total_matched: int
    sent_or_logged: int
    blocked: int
    results: list[BulkSendResultItem]