export function formatSessionDate(value) {
  if (!value) return "";

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return date.toLocaleString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function generateSessionConfirmation({ athlete, session }) {
  return `Hi, just confirming ${athlete.first_name} for our upcoming training session:

Location: ${session.location}
Time: ${formatSessionDate(session.start_time)}

Please reply CONFIRMED to hold the spot.

Unconfirmed spots may be released to other athletes.

Coach Chuck & Coach DJ
A.I. Training Academy`;
}

export function generateDayOfReminder({ athlete, session }) {
  return `Good morning! Just a reminder that ${athlete.first_name} is scheduled for training today.

Location: ${session.location}
Time: ${formatSessionDate(session.start_time)}

Please arrive 10 minutes early and bring a basketball and water.

Coach Chuck & Coach DJ`;
}

export function generateNoShowFollowUp({ athlete }) {
  return `Hey, we missed ${athlete.first_name} at today's session.

We had a spot held, so I just wanted to check in and make sure everything is okay.

If you'd like to reschedule, let me know and I can share the next available session.

Coach Chuck & Coach DJ`;
}