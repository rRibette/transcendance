import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { BACKEND_URL } from '../config.ts';
import TopBar from '../pages/TopBar.tsx'

export default function ChatRoom() {
  let navigate = useNavigate();
  type message = {user: string; text: string};
  const [readBy, setReadBy] = useState<string | null>(null);
  const [messages, setMessages] = useState<message[]>([]);
  const [isTyping, setIsTyping] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [otherId, setOtherId] = useState<number | null>(null);
  const { roomName } = useParams<{ roomName: string }>();
  const selfusername = localStorage.getItem("username");
  const otherusername = roomName?.split("--").find(x => x != selfusername);
  const Timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const selfid = parseInt(localStorage.getItem("id") ?? "0");
  
  let token = localStorage.getItem("access");
	let logged = false;
  if (token != null)
		logged = true;

  useEffect(() => {
    if (!otherusername) 
      return;
    fetch(`${BACKEND_URL}/api/users/${otherusername}/`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => { if (data?.id) setOtherId(data.id); })
      .catch(() => {});
  }, [otherusername]);


  useEffect(() => {
    if (!otherId) 
      return;
    async function checkBlocked() {
      const res = await fetch(`${BACKEND_URL}/api/blocked_status/${otherId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setIsBlocked(data.is_blocked);
      }
    }
    checkBlocked();
    const interval = setInterval(checkBlocked, 5000);
    return () => clearInterval(interval);
  }, [otherId]);


  useEffect(() => {
    setRoomReady(false);
    const allowedusers = roomName?.split("--").filter(Boolean);
    if (!allowedusers || allowedusers.length !== 2 || allowedusers[0] === allowedusers[1] || !allowedusers.includes(selfusername ?? "")) {
      navigate("/home");
    }
  }, [roomName, selfusername, navigate]);

  useEffect(() => {
    if (!otherId) 
      return;
    const allowedusers = roomName?.split("--").filter(Boolean);
    const isValidRoom = allowedusers?.length === 2 &&
      allowedusers[0] !== allowedusers[1] &&
      allowedusers.includes(selfusername ?? "");
    if (!isValidRoom) 
      return;

    const RealRoomName = selfid < otherId
      ? [selfusername, otherusername].join("--")
      : [otherusername, selfusername].join("--");

    if (RealRoomName !== roomName) {
      navigate(`/chatroom/${RealRoomName}`);
    } else {
      setRoomReady(true);
    }
  }, [roomName, selfid, otherId, otherusername, selfusername, navigate]);

  useEffect(() => {
    if (!roomReady) return;
    const chatSocket = new WebSocket('wss://' + window.location.host + '/ws/chat/' + roomName + '/?token=' + token);
    socketRef.current = chatSocket;
    chatSocket.onopen = () => console.log('Socket opened');
    chatSocket.onclose = (e) => {
      console.log('Socket closed');
      if (e.code === 4000) navigate("/home");
      else if (e.code === 4001) setIsBlocked(true);
    };
    chatSocket.onerror = (e) => console.log('Socket error:', e);
    chatSocket.onmessage = function(e: MessageEvent) {
      const data = JSON.parse(e.data);
      if (data.message) {
        setMessages((prev) => [...prev, { user: data.user, text: data.message }]);
      } else if ('typing' in data) {
        setIsTyping(data.typing ? `${data.user} is typing...` : '');
      } else if ('read' in data) {
        setReadBy(data.user);
      }
    };
    return () => chatSocket.close();
  }, [roomReady, roomName]);


  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.user === selfusername) 
      return;
    if (socketRef.current?.readyState !== WebSocket.OPEN) 
      return;
    const sendRead = () => {
      socketRef.current?.send(JSON.stringify({ read: true }));
    };
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      sendRead();
    } else {
      const handleVisible = () => {
        if (document.visibilityState === 'visible' && document.hasFocus()) {
          sendRead();
        }
      };
      document.addEventListener('visibilitychange', handleVisible);
      window.addEventListener('focus', handleVisible);
      return () => {
        document.removeEventListener('visibilitychange', handleVisible);
        window.removeEventListener('focus', handleVisible);
      };
    }
  }, [messages]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);
  
  function handleSubmit() {
    if (socketRef.current?.readyState === WebSocket.OPEN && inputRef.current) {
      socketRef.current.send(JSON.stringify({ typing: false }));
      socketRef.current.send(JSON.stringify({ message: inputRef.current.value }));
      setReadBy(null);
      inputRef.current.value = '';
    }
  }

  function handleGameInvite() {
    const token = localStorage.getItem('access');
    if (!token) {
      navigate('/login');
      return;
    }
    if (isBlocked)
      return;
    if (socketRef.current?.readyState !== WebSocket.OPEN || !otherusername || !selfusername) 
      return;
    const invitemsg = `${selfusername} has invited you to play! Join them: /gameRoom/${roomName}/`;
    socketRef.current.send(JSON.stringify({typing: false}));
    socketRef.current.send(JSON.stringify({message: invitemsg }));
    setReadBy(null);
    setTimeout(() => navigate(`/gameRoom/${roomName}/`), 150);
  }
  
  useEffect(() => {
    const input = inputRef.current;
    if (!input) 
      return;
    const handleTyping = () => {
      socketRef.current?.send(JSON.stringify({ typing: true }));
      if (Timeout.current) 
        clearTimeout(Timeout.current);
      Timeout.current = setTimeout(() => {
        socketRef.current?.send(JSON.stringify({ typing: false }));
      }, 1000);
    }
    input.addEventListener('input', handleTyping);
    return () => input.removeEventListener('input', handleTyping);
  }, []);

  const typingUser = isTyping?.split(" ")[0]
  
  return (
    <div className="flex-box"><TopBar logged={logged}/>
      <div className="flex flex-col h-dvh w-dvw bg-slate-300 items-center justify-center">
          <div className="flex flex-col gap-2 w-1/2">
            <div className="flex flex-row justify-between items-center">
              <button className="self-start font-bold text-slate-800 
                      transition-all 
                      hover:scale-110 hover:text-slate-400"
                      style={{ textShadow: '0px 0px 15px rgb(255, 255, 255)' }} 
                      onClick ={() => navigate(`/users/${otherusername}`)}>
                        {otherusername}
              </button>
              <button className="self-end font-bold text-slate-800
                      transition-all 
                      hover:scale-110 hover:text-slate-400"
                      onClick={handleGameInvite}>
                        Invite to play
              </button>
            </div>
            <div ref={logRef} className="border rounded border-slate-500 shadow-lg p-2 h-96 overflow-y-auto flex flex-col gap-1 bg-slate-100">
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1;
                  const isSelf = m.user === selfusername;
                  const inviteMatch = m.text.match(/Join them: (\/gameRoom\/[^\s]+)/);
                  return (
                    <div key={i} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    <span className={`px-3 py-1 rounded-lg max-w-[70%] break-words 
                          ${isSelf ? 'bg-slate-500 text-white' : 'bg-gray-200 text-black'}`}>
                      {inviteMatch ? (
                        <>
                          {m.text.split(inviteMatch[1])[0]}
                          <button className="underline font-semibold hover:text-slate-200"
                            onClick={() => {
                              if (socketRef.current?.readyState === WebSocket.OPEN && selfusername) {
                                socketRef.current.send(JSON.stringify({
                                  message: `${selfusername} has joined your game!`
                                }));
                              }
                              setTimeout(() => navigate(inviteMatch[1]), 150);
                            }}>
                            Join game
                          </button>
                        </>
                      ) : (
                        m.text
                      )}
                    </span>
                    {isSelf && isLast && (<span className="text-xs text-gray-400 mt-0.5">
                                          {readBy === otherusername ? 'Seen' : 'Delivered'}</span>)
                    }
                  </div>
                );
              })}
            </div>
            <p className="text-gray-500 text-sm h-5">{selfusername != typingUser ? isTyping : ''}</p>
            <div className="flex flex-row gap-2 mt-5"> 
              {!isBlocked ?
              (<input 
                ref={inputRef} 
                type="text" 
                className="flex flex-row border rounded border-slate-500 shadow-lg bg-slate-200 p-2 w-4/4"
                onKeyUp={(e) => { if (e.key === 'Enter') handleSubmit(); }}/>)
                : 
              (<div className="flex flex-row border rounded p-2 w-4/4 bg-slate-200 text-slate-600">Can't message this user</div>)}
              {!isBlocked ? (<button onClick={handleSubmit} className="flex-row self-end p-2 shadow-lg border rounded border-slate-500 bg-slate-200 transition-all hover:bg-slate-500 hover:scale-95 hover:text-slate-100">Send</button>) 
              : ""}
            </div>
          </div>
      </div>
    </div>
  );
}