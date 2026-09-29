function getQuotaWindow(session, now = new Date()) {
  if (session.role === 'admin') {
    return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  }

  if (session.role === 'visitor') {
    return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
  }

  return session.sessionId;
}

function getQuotaKey(session, now = new Date()) {
  const quotaSubject = session.quotaSubject || session.sessionId;
  return `chat-quota:${session.role}:${quotaSubject}:${getQuotaWindow(session, now)}`;
}

module.exports = {
  getQuotaKey,
  getQuotaWindow,
};
