import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MessageSquare, Search, PhoneCall, Video, Check, CheckCheck, Edit, FileText, MoreVertical, Paperclip, Smile, Lock } from 'lucide-react';
import { getInbox, getConversation, sendMessage, markAsRead } from '../services/messages.service';
import { getUsers } from '../services/users.service';

export const Messages = () => {
  const [inbox, setInbox] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [filter, setFilter] = useState('All');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub);
    }
    fetchInbox();
    fetchAllUsers();
    
    // Polling de 30s
    const int = setInterval(() => {
      fetchInbox(false);
      if (activeChat) fetchConversation(activeChat._id, false);
    }, 30000);

    return () => clearInterval(int);
  }, [activeChat]);

  const fetchInbox = async (showLoading = true) => {
    if (showLoading) setLoadingList(true);
    try {
      const res = await getInbox();
      setInbox(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoadingList(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data.data || res.data); // Dependiendo de si está en {data, total}
    } catch (err) { }
  };

  const fetchConversation = async (otherUserId: string, showLoading = true) => {
    if (showLoading) setLoadingChat(true);
    try {
      const res = await getConversation(otherUserId);
      setMessages(res.data);
      setTimeout(scrollToBottom, 50);
      fetchInbox(false); // Refresca los badges
      window.dispatchEvent(new Event('refreshUnreadCount')); // Actualiza el Layout Global
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoadingChat(false);
    }
  };

  const selectChat = (user: any) => {
    setActiveChat(user);
    setMessages([]);
    fetchConversation(user._id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChat) return;

    const val = inputValue.trim();
    setInputValue('');
    
    // Optimistic UI
    const tempMsg = {
      _id: Date.now().toString(),
      content: val,
      sender: { _id: currentUserId },
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      await sendMessage(activeChat._id, val);
      fetchConversation(activeChat._id, false);
      fetchInbox(false);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Combinar inbox con búsqueda para que los usuarios sin conversación aparezcan si se busca
  const displayedContacts = searchQuery 
    ? users.filter(u => u.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) && u._id !== currentUserId)
    : inbox.length > 0
      ? inbox.map(i => ({ ...i.otherUser, lastMessage: i.lastMessage, unreadCount: i.unreadCount }))
      : users.filter(u => u._id !== currentUserId);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: '#ffffff', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      
      {/* ─── SIDEBAR: CONTACT LIST ────────────────────────────────────────── */}
      <div 
        style={{ 
          width: '380px', 
          borderRight: '1px solid #e5e7eb', 
          display: activeChat ? 'none' : 'flex', 
          flexDirection: 'column',
          background: '#ffffff',
          flexShrink: 0
        }}
        className="md:flex"
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Messages
            </h2>
            <button style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Edit size={20} />
            </button>
          </div>
          
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={16} />
            <input 
              type="text" 
              placeholder="Search colleagues, cases..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', background: '#f3f4f6', border: 'none', borderRadius: '10px',
                padding: '10px 16px 10px 38px', fontSize: '14px', color: '#111827', outline: 'none'
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
            {['All', 'Urgent', 'Department', 'Patient Cases'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: filter === f ? '#2563eb' : '#f3f4f6',
                  color: filter === f ? '#ffffff' : '#4b5563',
                  transition: '0.2s'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingList ? (
             <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px', fontSize: '14px' }}>Cargando conversaciones...</p>
          ) : displayedContacts.length === 0 ? (
             <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px', fontSize: '14px' }}>No hay resultados</p>
          ) : (
            displayedContacts.map((contact: any) => {
              const isActive = activeChat?._id === contact._id;
              const nameInitial = contact.fullname ? contact.fullname.charAt(0).toUpperCase() : '?';
              const lastMsg = contact.lastMessage?.content;
              const isMine = contact.lastMessage?.senderId === currentUserId;
              
              const isNurse = contact.fullname?.toLowerCase().includes('nurse');
              const isCardio = contact.fullname?.toLowerCase().includes('cardio');
              
              // Estilos avatar aleatorios basados en lógica simple
              const avatarBg = isNurse ? '#e0e7ff' : isCardio ? '#dcfce7' : '#dbeafe';
              const avatarColor = isNurse ? '#4f46e5' : isCardio ? '#16a34a' : '#2563eb';

              return (
                <div 
                  key={contact._id} 
                  onClick={() => selectChat(contact)}
                  style={{
                    padding: '16px 24px',
                    display: 'flex', gap: '14px', cursor: 'pointer',
                    background: isActive ? '#f8fafc' : 'transparent',
                    borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
                    borderBottom: '1px solid #f3f4f6',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '50%', background: avatarBg, color: avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700
                    }}>
                      {nameInitial}
                    </div>
                    {/* Badge verde de Online o Circulo de notif */}
                    {contact.unreadCount > 0 ? (
                      <span style={{ position: 'absolute', top: '-2px', right: '-4px', background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 700, borderRadius: '10px', padding: '2px 6px', border: '2px solid #fff' }}>
                        {contact.unreadCount}
                      </span>
                    ) : (
                      <span style={{ position: 'absolute', bottom: '0px', right: '0px', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', border: '2px solid #fff' }}></span>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contact.fullname}
                      </h3>
                      {contact.lastMessage && (
                        <span style={{ fontSize: '12px', color: isActive ? '#2563eb' : '#9ca3af', fontWeight: isActive ? 600 : 400 }}>
                          {new Date(contact.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    {lastMsg ? (
                      <p style={{ fontSize: '14px', margin: 0, color: (isActive || contact.unreadCount > 0) ? '#1f2937' : '#6b7280', fontWeight: contact.unreadCount > 0 ? 600 : 400, whiteSpace: 'wrap', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                        {isMine ? 'Tú: ' : ''}{lastMsg}
                      </p>
                    ) : (
                      <p style={{ fontSize: '14px', margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>
                        Inicia una conversación
                      </p>
                    )}
                    
                    {/* Mock Tags extra decorativos (como se ven en Stitch) */}
                    {isActive && !isMine && (
                      <div style={{ display: 'flex', marginTop: '8px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>#Patient-XM92</span>
                      </div>
                    )}
                    {isNurse && (
                      <div style={{ display: 'flex', marginTop: '8px' }}>
                        <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Urgent</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── MAIN CHAT AREA ────────────────────────────────────────── */}
      <div 
        style={{ 
          flex: 1, 
          display: activeChat ? 'flex' : 'none', 
          flexDirection: 'column', 
          background: '#ffffff',
          position: 'relative',
        }}
        className="md:flex"
      >
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div style={{ height: '76px', padding: '0 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button 
                  className="md:hidden"
                  style={{ background: 'none', border: 'none', color: '#6b7280', padding: '8px', cursor: 'pointer', marginLeft: '-12px' }}
                  onClick={() => setActiveChat(null)}
                >
                  ←
                </button>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>
                    {activeChat.fullname?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', border: '2px solid #fff' }}></span>
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {activeChat.fullname}
                    <Lock size={14} color="#9ca3af" />
                  </h3>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    <span style={{ color: '#2563eb', fontWeight: 500 }}>Active now</span> • {activeChat.specialty || 'Médico'}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', color: '#6b7280' }}>
                <button style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#4b5563' }}><PhoneCall size={20} /></button>
                <button style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#4b5563' }}><FileText size={20} /></button>
                <button style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#4b5563' }}><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Fake Date Pill */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <span style={{ background: '#e5e7eb', color: '#4b5563', fontSize: '11px', fontWeight: 500, padding: '4px 12px', borderRadius: '12px' }}>
                  Today, October 24
                </span>
              </div>

              {loadingChat ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <p style={{ color: '#9ca3af' }}>Cargando conversación...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: '16px' }}>
                   <MessageSquare size={48} opacity={0.3} />
                   <p>Envía un mensaje para comenzar</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMine = msg.sender._id === currentUserId;
                  const msgTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', width: '100%' }}>
                      
                      {/* Name & Time Label above bubble */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: isMine ? '0 48px 0 0' : '0 0 0 48px' }}>
                        {!isMine && <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>{msg.sender?.fullname || activeChat.fullname}</span>}
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{msgTime}</span>
                        {isMine && <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>You</span>}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', maxWidth: '75%', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                        
                        {/* Avatar */}
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: isMine ? '#1e3a8a' : '#dbeafe', color: isMine ? '#fff' : '#2563eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700
                        }}>
                          {isMine ? 'Tú' : (msg.sender?.fullname || activeChat.fullname)?.charAt(0).toUpperCase()}
                        </div>

                        {/* Bubble */}
                        <div>
                          <div style={{
                            padding: '14px 18px',
                            background: isMine ? '#0ea5e9' : '#ffffff',
                            color: isMine ? '#ffffff' : '#1f2937',
                            border: isMine ? 'none' : '1px solid #e5e7eb',
                            borderRadius: '16px',
                            borderTopRightRadius: isMine ? '4px' : '16px',
                            borderTopLeftRadius: !isMine ? '4px' : '16px',
                            fontSize: '15px',
                            lineHeight: 1.5,
                            boxShadow: isMine ? '0 4px 14px rgba(14, 165, 233, 0.2)' : '0 2px 5px rgba(0,0,0,0.02)'
                          }}>
                            {msg.content}
                          </div>

                          {/* Tag mock (if not mine, visually added to match design) */}
                          {!isMine && msg.content.length > 50 && (
                            <div style={{ marginTop: '8px', display: 'flex' }}>
                              <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>#Patient-XM92</span>
                            </div>
                          )}

                          {/* Read receipt */}
                          {isMine && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#9ca3af' }}>
                               {msg.isRead ? <img src="https://img.icons8.com/color/16/double-tick.png" alt="read" /> : <Check size={14} />}
                               <span style={{ fontSize: '11px' }}>{msg.isRead ? 'Read' : 'Sent'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input form area */}
            <div style={{ padding: '20px 32px 16px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '8px 8px 8px 16px' }}>
                <button type="button" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}>
                  <Paperclip size={20} />
                </button>
                
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Type a secure message..."
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '15px', color: '#111827', padding: '0 12px'
                  }}
                />
                
                <button type="button" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px', marginRight: '8px' }}>
                  <Smile size={20} />
                </button>
                
                <button 
                  type="submit" 
                  disabled={!inputValue.trim()}
                  style={{
                    width: '38px', height: '38px', background: inputValue.trim() ? '#2563eb' : '#9ca3af', color: '#fff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', 
                    border: 'none', cursor: inputValue.trim() ? 'pointer' : 'not-allowed', transition: '0.2s',
                    boxShadow: inputValue.trim() ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none'
                  }}
                >
                  <Send size={18} style={{ marginLeft: '2px' }} />
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Lock size={10} /> HIPAA Compliant & End-to-End Encrypted
                </p>
              </div>
            </div>
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4b5563', background: '#f9fafb' }}>
             <div style={{ width: '80px', height: '80px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginBottom: '24px' }}>
                <MessageSquare size={36} color="#3b82f6" />
             </div>
             <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#111827' }}>Hospitalis Connect</h3>
             <p style={{ fontSize: '14px', color: '#6b7280' }}>Selecciona un chat o inicia una nueva conversación</p>
          </div>
        )}
      </div>

    </div>
  );
};