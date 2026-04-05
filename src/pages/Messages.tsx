import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MessageSquare, Search, PhoneCall, Video, Check, CheckCheck } from 'lucide-react';
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
      // Mark as read locally para esta sesión sin refrescar todo
      setTimeout(scrollToBottom, 100);
      fetchInbox(false); // Refresca los badges
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
    ? users.filter(u => u.fullname.toLowerCase().includes(searchQuery.toLowerCase()) && u._id !== currentUserId)
    : inbox.map(i => ({ ...i.otherUser, lastMessage: i.lastMessage, unreadCount: i.unreadCount }));

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar: Lista de Mensajes */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
            Mensajes
            <MessageSquare className="text-blue-600" size={20} />
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar contactos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 text-sm pl-9 pr-3 py-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
             <p className="text-center text-gray-400 py-8 text-sm">Cargando conversaciones...</p>
          ) : displayedContacts.length === 0 ? (
             <p className="text-center text-gray-400 py-8 text-sm">No hay resultados</p>
          ) : (
            displayedContacts.map((contact: any) => {
              const bg = activeChat?._id === contact._id ? 'bg-blue-50' : 'hover:bg-gray-50';
              const nameInitial = contact.fullname ? contact.fullname.charAt(0).toUpperCase() : '?';
              return (
                <div 
                  key={contact._id} 
                  onClick={() => selectChat(contact)}
                  className={`p-4 border-b border-gray-50 flex items-center gap-3 cursor-pointer transition-colors ${bg}`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                      {nameInitial}
                    </div>
                    {contact.unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate pr-2">{contact.fullname}</h3>
                      {contact.lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(contact.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {contact.lastMessage ? (
                      <p className={`text-sm truncate ${contact.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {contact.lastMessage.senderId === currentUserId ? 'Tú: ' : ''}
                        {contact.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Inicia una conversación</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white/50 relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden p-2 -ml-2 text-gray-500"
                  onClick={() => setActiveChat(null)}
                >
                  ←
                </button>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                  {activeChat.fullname?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{activeChat.fullname}</h3>
                  <span className="text-xs text-green-500 font-medium">En línea</span>
                </div>
              </div>
              <div className="flex gap-2 text-gray-400">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><PhoneCall size={18} /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Video size={18} /></button>
              </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingChat ? (
                <div className="h-full flex items-center justify-center">
                   <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                   <MessageSquare size={48} className="opacity-20" />
                   <p>Envía un mensaje para comenzar la conversación</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMine = msg.sender._id === currentUserId;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 relative shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}`}>
                         <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                         <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                           <span className="text-[10px]">
                             {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                           {isMine && (
                             msg.isRead ? <CheckCheck size={14} className="text-blue-200" /> : <Check size={14} />
                           )}
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!inputValue.trim()}
                  className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="hidden md:flex h-full flex-col items-center justify-center text-gray-400 bg-gray-50/50">
             <div className="w-24 h-24 bg-blue-50 flex items-center justify-center rounded-full mb-6">
                <MessageSquare size={40} className="text-blue-300" />
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">Hospitalis Connect</h3>
             <p className="text-sm">Selecciona un chat o inicia una nueva conversación</p>
          </div>
        )}
      </div>

    </div>
  );
};