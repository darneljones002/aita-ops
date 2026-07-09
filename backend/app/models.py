from sqlalchemy import (Column, Integer, String, DateTime, ForeignKey, Text)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True)

    phone = Column(String, nullable=True)
    phone_normalized = Column(String, nullable=True)
    phone_valid = Column(String, default="unknown")
    # valid | invalid | unknown

    sms_consent_status = Column(String, default="not_requested")
    # not_requested | opted_in | opted_out
    email_consent_status = Column(String, default="subscribed")
    # subscribed | unsubscribed

    sms_consent_source = Column(String, nullable=True)
    # registration_form | manual_import | text_reply | parent_portal

    sms_consent_timestamp = Column(DateTime, nullable=True)
    sms_opt_out_timestamp = Column(DateTime, nullable=True)
    
    email_consent_timestamp = Column(DateTime, nullable=True)
    email_opt_out_timestamp = Column(DateTime, nullable=True)

    athletes = relationship("Athlete", back_populates="parent")


class Athlete(Base):
    __tablename__ = "athletes"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    graduation_year = Column(String, nullable=True)
    status = Column(String, default="lead")
    preferred_location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    parent_id = Column(Integer, ForeignKey("parents.id"))
    parent = relationship("Parent", back_populates="athletes")

    invites = relationship("SessionInvite", back_populates="athlete")
    athlete_tags = relationship("AthleteTag", back_populates="athlete")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    capacity = Column(Integer, default=12)
    session_type = Column(String, default="academy")

    invites = relationship("SessionInvite", back_populates="session")


class SessionInvite(Base):
    __tablename__ = "session_invites"

    id = Column(Integer, primary_key=True, index=True)

    athlete_id = Column(Integer, ForeignKey("athletes.id"))
    session_id = Column(Integer, ForeignKey("sessions.id"))

    status = Column(String, default="invited")
    notes = Column(Text, nullable=True)

    athlete = relationship("Athlete", back_populates="invites")
    session = relationship("Session", back_populates="invites")


class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    channel = Column(String, default="sms")
    body = Column(Text, nullable=False)


class MessageLog(Base):
    __tablename__ = "message_logs"

    id = Column(Integer, primary_key=True, index=True)

    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)

    channel = Column(String, default="sms")
    message_type = Column(String, default="session_reminder")

    recipient = Column(String, nullable=False)
    body = Column(Text, nullable=False)

    status = Column(String, default="draft")
    provider_message_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.now)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    color = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    athlete_tags = relationship("AthleteTag", back_populates="tag")


class AthleteTag(Base):
    __tablename__ = "athlete_tags"

    id = Column(Integer, primary_key=True, index=True)

    athlete_id = Column(Integer, ForeignKey("athletes.id"))
    tag_id = Column(Integer, ForeignKey("tags.id"))

    athlete = relationship("Athlete", back_populates="athlete_tags")
    tag = relationship("Tag", back_populates="athlete_tags")