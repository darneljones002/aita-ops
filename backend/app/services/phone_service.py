import phonenumbers


def normalize_phone(raw_phone: str | None, default_region: str = "US"):
    if not raw_phone:
        return None, "unknown"

    try:
        parsed = phonenumbers.parse(raw_phone, default_region)

        if not phonenumbers.is_valid_number(parsed):
            return None, "invalid"

        normalized = phonenumbers.format_number(
            parsed,
            phonenumbers.PhoneNumberFormat.E164
        )

        return normalized, "valid"

    except Exception:
        return None, "invalid"