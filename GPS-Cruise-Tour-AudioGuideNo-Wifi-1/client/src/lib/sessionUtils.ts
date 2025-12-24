// Generate or retrieve session ID from localStorage
export function getSessionId(): string {
  const SESSION_KEY = 'gps_audio_guide_session';
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate a simple session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}
