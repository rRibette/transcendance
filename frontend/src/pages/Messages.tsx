import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { BACKEND_URL } from "../config";
import { refresh } from "../utils.tsx";
import ChatButton from "../components/ChatButton.tsx"
import chatIcon from "../assets/message-square-svgrepo-com.svg";


export default function ChatsList() {
	let navigate = useNavigate();
	const ids = useRef(new Array<number>());
	const data = useRef(null);
	const [size, setSize] = useState(0);

		useEffect(() => {
			async function getChats() {
				const token = localStorage.getItem('access');
				if (!token)
					navigate("/home");
				ids.current.splice(0, ids.current.length);
				const res = await fetch (`${BACKEND_URL}/api/all_user_chatrooms/`, {
					credentials: 'omit',
					headers: {
						'Authorization' : `Bearer ${token}`,
					},
				});
				if (res.ok) {
					const response = await res.json();
					data.current = response;			
					for (let i = 0; i < data.current.length; i++)
						ids.current.push(i);
					setSize(data.current.length);
				}
				else {
					if (res.status == 401) {
						if (await refresh())
							getChats();
					}
				}
			};
			getChats();
		}, []);

	function List() {
		function Row( {index} ) {
			const [ avatar, setAvatar ] = useState("");
			const [ name, setName ] = useState("");
			const [ msg, setMsg ] = useState("");
			const [ isOnline, setIsOnline ] = useState(false);
			const id = useRef(0);
			const username = useRef("");
			const blocked = useRef(false)
			function Button() {
				return (
						<button className="h-full w-40
						hover:scale-95" 
						onClick={() => navigate(`/chatroom/${data.current[index].room_name}/`)}>
							<img src={chatIcon} className="h-full" />
						</button>
				);
			}

			useEffect(() => {
				const token = localStorage.getItem('access');
				if (!token)
					navigate("/home");
				if (data.current && data.current.length > index) {
					async function get_user() {
						const response = await fetch (`${BACKEND_URL}/api/users/${data.current[index].other_user}/`, 
						{
							headers: {
								'Accept': 'application/json',
							}
						});
						if (response.ok) {
							const resp = await response.json();
							setName(resp.display_name);
							setAvatar(resp.avatar);
							setIsOnline(resp.is_online);
							username.current = resp.username;
							id.current = resp.id;

							const res = await fetch (`${BACKEND_URL}/api/blocked_status/${id.current}`, {
								headers: {
									'Accept': 'application/json',
									'Authorization': `Bearer ${token}`,
								},
							});
							if (res.ok){
								const resj = await res.json();
								if (resj.is_blocked){
									blocked.current = true;
									setIsOnline(false);
								}
							}
							else {
								if ( await refresh())
									get_user();
							}
						}
					}
					get_user()
					if (data.current[index].last_message.length < 8)
						setMsg(data.current[index].last_message);
					else 
						setMsg(data.current[index].last_message.substr(0,8) + "...");
				}
			}, [data]);

			useEffect(() => {
				const token = localStorage.getItem('access');
				if (!token) return;
				const ws = new WebSocket(`wss://${window.location.host}/ws/presence/?token=${token}`);
				ws.onmessage = (e) => {
					const event = JSON.parse(e.data);
					if (event.user_id === id.current && !blocked.current)
						setIsOnline(event.is_online);
				};
				return () => ws.close();
			}, []);


			return (
				<div className="flex flex-row bg-slate-300 w-9/10 h-10 justify-center rounded-full">
					<button className="flex flex-row w-4/10 rounded-full mr-10 
					hover:scale-95 hover:bg-slate-200" 
					onClick={() => navigate(`/users/${username.current}`)}>	
						<img src={avatar} className="rounded-full h-9/10 aspect-square mx-2 justify-center items-center self-center"/>
						<div className="flex justify-center items-center w-4/10 overflow-hidden mr-2"> {name} </div>
						<span className={"justify-center self-center  " + (isOnline ? "text-green-500" : "text-gray-400")}>●</span>
					</button>
					<div className="flex justify-left w-full items-center" > {msg} </div> 
					<Button />
				</div>
			);
		}

		const list = ids.current.map(id => <Row key={id} index={id} />);
		// console.log(ids);
		return (
			<>
				<div className="flex flex-col h-8/10 pt-13 overflow-scroll items-center w-7/10 gap-5 rounded-4xl shadow-lg">
					{ list } 
				</div>
			</>
		);
	}
	return (
		<>
			<div className="w-dvw h-dvh flex items-center justify-center bg-slate-300">
				<div className="flex flex-col h-dvh w-200 gap-5 justify-around rounded-4xl items-center shadow-md bg-slate-200">
					<List />
					<ChatButton />	
					<button className="flex relative bg-slate-400 w-40 h-10 rounded-full justify-center items-center shadow-md bg-slate-400
					transition-all
					hover:scale-95 hover:bg-slate-500
					active:bg-slate-600"
					onClick={() => navigate("/home")}> Back to main page </button>
				</div>
			</div>
		</>
	);
}
