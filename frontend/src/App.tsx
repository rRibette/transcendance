import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LogPage from './pages/LogPage.tsx'
import FrontPage from './pages/FrontPage.tsx'
import Register from './pages/Register.tsx'
import ManagePage from './pages/Manage.tsx'
import Notification from './pages/Notification'
import Profile from './pages/Profile.tsx'
import Privacy_pol from './pages/Privacy_Policy.tsx'
import TermsOfService from './pages/TermsOfService.tsx'
import Chatroom from './pages/Chat.tsx'
import Game from './pages/SoloGame.tsx'
import Select from './pages/Game.tsx'
import GameRoom from './pages/GameRoom.tsx'
import ChatsList from './pages/Messages.tsx'
import { useEffect } from 'react'
import {Navigate} from 'react-router'

import "./index.css"

function App() {
	function resetApp()
	{
		localStorage.removeItem("access");
		localStorage.removeItem("refresh");
		localStorage.removeItem("data");
	}

	// useEffect(() => {
    // const token = localStorage.getItem("access");
    // if (!token)
	// 	return;
    // const ws = new WebSocket(`wss://${window.location.host}/ws/presence/?token=${token}`);
    // return () => ws.close();
// 	const ws = new WebSocket(`wss://${window.location.host}/ws/presence/?token=${token}`);
// 	ws.onmessage = (e) => {
//     const data = JSON.parse(e.data);
//     setUsers(prev => prev.map(u =>
//         u.id === data.user_id ? { ...u, is_online: data.is_online } : u
//     ));
// };
// return () => ws.close();
//   }, []);

	// useEffect(() => {
	// 	fetch(`${BACKEND_URL}/api/me/friends`, {
	// 		headers: {
	// 			'Accept': 'application/json',
	// 			'Authorization': `Bearer ${token}`,
	// 		}
	// 	})
	// 	.then(response => response.json())
	// 	.then(data => setFriends(data))

	// 	const ws = new WebSocket(`wss://${window.location.host}/ws/presence/?token=${token}`);
	// 	ws.onmessage = (e) => {
	// 		const data = JSON.parse(e.data);
	// 		setFriends(prev => prev ? prev.map(u =>
	// 			u.id === data.user_id ? { ...u, is_online: data.is_online } : u
	// 		) : prev);
	// 	};
	// 	return () => ws.close();
	// }, [])

  return (
    <BrowserRouter>
		<Routes>
			<Route path="/" element={<FrontPage />} />
			<Route path="/login" element={<LogPage />} />
			<Route path="/home" element={<FrontPage />} />
			<Route path="/register" element={<Register />} />
			<Route path="/privacy_policy" element={<Privacy_pol />} />
			<Route path="/TermsOfService" element={<TermsOfService />} />
			<Route path="/chatroom" element={<Navigate to="/messages" replace />} />
			<Route path="/chatroom/:roomName" element={<Chatroom />} />
			<Route path="/manage" element={<ManagePage />} />
			<Route path="/users/:username" element={<Profile />} />
			<Route path="/notification" element={<Notification/>} />
			<Route path="/auth/google/callback" element={<LogPage />} />
			<Route path="/auth/42/callback" element={<LogPage />} />
			<Route path="/game" element={<Select />} />
			<Route path="/soloGame/:roomName" element={<Game />} />
			<Route path="/gameRoom/:roomName" element={<GameRoom />} />
			<Route path="/messages" element={<ChatsList />} />
		</Routes>
    </BrowserRouter>
  );
}

export default App
