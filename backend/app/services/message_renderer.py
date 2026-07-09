from datetime import datetime


def format_session_time(dt: datetime | None) -> str:
    if not dt:
        return ""

    return dt.strftime("%A, %b %d at %I:%M %p").replace(" 0", " ") if hasattr(dt, "strftime") else ""


def render_template(template_body: str, athlete=None, parent=None, session=None) -> str:
    values = {
        "athlete_first_name": getattr(athlete, "first_name", ""),
        "athlete_last_name": getattr(athlete, "last_name", "") or "",
        "parent_first_name": getattr(parent, "first_name", ""),
        "session_title": getattr(session, "title", "") if session else "",
        "session_location": getattr(session, "location", "") if session else "",
        "session_start_time": format_session_time(getattr(session, "start_time", None)) if session else "",
        "coach_name": "Coach Chuck & Coach DJ",
        "academy_name": "A.I. Training Academy",
    }

    rendered = template_body

    for key, value in values.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value))

    return rendered