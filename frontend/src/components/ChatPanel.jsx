import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function ChatPanel({ matchId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const data = await api.getMessages(matchId);
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.sendMessage(matchId, text.trim());
      setText('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {error && <div className="error-banner">{error}</div>}
        {messages.length === 0 ? (
          <div className="chat-empty">Say something to lock in the fade.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={'chat-bubble ' + (m.sender_id === user.id ? 'mine' : 'theirs')}>
              {m.body}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-row" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          maxLength={2000}
        />
        <button className="chat-send" disabled={sending || !text.trim()}>➤</button>
      </form>
    </div>
  );
}
