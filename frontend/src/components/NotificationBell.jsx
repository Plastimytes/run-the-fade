import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso + 'Z').getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  const nav = useNavigate();

  const pollCount = async () => {
    try {
      const data = await api.getUnreadCount();
      setCount(data.count);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    pollCount();
    const id = setInterval(pollCount, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const data = await api.getNotifications();
      setItems(data.notifications);
    }
  };

  const onItemClick = async (n) => {
    if (!n.is_read) await api.markNotificationRead(n.id);
    setOpen(false);
    pollCount();
    if (n.link) nav(n.link);
  };

  const markAll = async () => {
    await api.markAllNotificationsRead();
    setItems((its) => its.map((i) => ({ ...i, is_read: true })));
    setCount(0);
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={toggle}>
        🔔
        {count > 0 && <span className="bell-dot">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <span>Notifications</span>
            {items.some((i) => !i.is_read) && <button onClick={markAll}>Mark all read</button>}
          </div>
          {items.length === 0 ? (
            <div className="notif-empty">Nothing yet.</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className={'notif-item' + (n.is_read ? '' : ' unread')}
                onClick={() => onItemClick(n)}
                style={{ width: '100%', textAlign: 'left', background: n.is_read ? 'none' : undefined, border: 'none', cursor: 'pointer' }}
              >
                <div className="notif-title">{n.title}</div>
                {n.body && <div className="notif-body">{n.body}</div>}
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
