import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import addFriend  from '../assets/add-friend-svgrepo-com.svg';
import { logOut, refresh } from '../utils.tsx';
import { BACKEND_URL} from '../config';

function FriendsList() {
	const navigate = useNavigate();
	const [ hovered, setHovered ] = useState(false);
	const [ size, setSize ] = useState(0);
	const ids = useRef(new Array<number>());
	const [data, setData] = useState(null);
	
		useEffect(() => {
			async function get_friends() {
				let token = localStorage.getItem("access");
				ids.current.splice(0, ids.current.length);
				const response = await fetch (`${BACKEND_URL}/api/me/friends/`, {
					method: 'GET',
					credentials: 'omit',
					headers: {'Authorization': `Bearer ${token}`},
				});
				if (response.ok){
					const resp = await response.json();
					setData(resp);
					setSize(resp.length);
					for (let i = 0; i < resp.length; i++)
						ids.current.push(i)
				}
				else {
					if (response.status == 401) {
						if (await refresh())
							get_friends();
					}
				}
			}
			get_friends();

			const token = localStorage.getItem("access");
				if (!token) return;
				const ws = new WebSocket(`wss://${window.location.host}/ws/presence/?token=${token}`);
				ws.onmessage = (e) => {
					const event = JSON.parse(e.data);
					setData(prev => prev ? prev.map(u =>
						u.id === event.user_id ? { ...u, is_online: event.is_online } : u
					) : prev);
				};
				return () => ws.close();
			}, []);

	function List() {
		function Friend({index}){
			const [ avatar, setAvatar ] = useState("");
			const [ display, setDisplay ] = useState("");
			const [ username, setUsername ] = useState("");
			const [ isOnline, setIsOnline ] = useState(false);
			useEffect(() => {
				if (data && data.length > index) {
					setAvatar(data[index].avatar);
					setDisplay(data[index].display_name);
					setUsername(data[index].username);
					setIsOnline(data[index].is_online);
				}
			}, [data]);
			return (
				<>
				<button className="flex h-12 my-2 justify-center items-center rounded-full
					hover:shadow-lg hover:scale-95 hover:bg-slate-300" onClick={() => navigate(`/users/${username}`)}>
					{hovered ? 
						<div className="flex flex-row justify-center gap-5 items-center">
							<p className="w-35 overflow-hidden"> {display} </p>
							<img src={avatar} className="h-12 aspect-square rounded-full"/>
							<span className={isOnline ? "text-green-500" : "text-gray-400"}>●</span>
						</div> :
						<img src={avatar} className="h-12 aspect-square rounded-full"/>
					}	
				</button>
			</>
			);
		}
		const list  = ids.current.map(id => <Friend key={id} index={id} />);
				
		return (
			<>
			<div className="flex flex-col h-full pt-13 overflow-scroll">
				{list}
			</div>
			</>
		);
	}


	function ButtonAdd(){
		const [ clicked, setClicked ] = useState(false);
		const [ msg, setMsg ] = useState("");
		const buffer = useRef("");
		const id = useRef(-1);

		function useOutsideAlerter(ref) {
			useEffect(() => {
				function handleClickOutside(event) {
					if (ref.current && !ref.current.contains(event.target)){
						setClicked(false);
					}
				}
				function handleEnterInside(event) {
					if (event.code == "Enter"){
						if (ref.current && ref.current.contains(event.target)) {
							searchFriend();
							setClicked(false);
						}
					}
				}
			document.addEventListener("keydown", handleEnterInside);
			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("keydown", handleEnterInside);
				document.removeEventListener("mousedown", handleClickOutside);
			};
			}, [ref]);
		}

		function OutsideAlerter(props) {
			const wrapperRef = useRef(null);
			useOutsideAlerter(wrapperRef);

			return (<div ref={wrapperRef}>{props}</div>);
		}


		async function searchFriend() {
			async function sendRequest() {
				if (id.current < 0)
					return ;
				const token = localStorage.getItem('access');
				if (!token) {
					logOut();
					return ;
				}
				for (let i = 0; i < data.length; i++)
				{
					if (id.current == data[i].id){
						setMsg("user is already friend");
						return ;
					}
				}
				const response = await fetch (`${BACKEND_URL}/api/send_friend_request/${id.current}/`, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});
				if (response.status == 401) {
					if (await refresh())
						sendRequest();
					else 
						logOut();
				}
				else if (response.ok) {
					setMsg("request sent");
				}
			}

			if (buffer.current == "")
				return;
			const response = await fetch (`${BACKEND_URL}/api/users/${buffer.current}`,{
				method: 'GET',
				credentials: 'omit',
			});
			// if (response.ok){
			const resp_json = await response.json();
			if (resp_json.exists){
				id.current = resp_json.id;
				sendRequest();
			}
			else {
				setMsg("user does not exist");
			}
			//TODO : send friend request;
			//${BACKEND_URL}/api/send_friend_request/${id}
		}
	
		function handleClick(){
			setClicked(!clicked);
			if (!clicked) {
				buffer.current = "";
				id.current = -1;
			}
			else
				searchFriend()
		}

		function SearchBar() {
			return (
				OutsideAlerter(
					<div className="flex flex-row h-15 mb-5 md:mx-2 bg-slate-400 justify-center text-center items-center rounded-full">
						<input className="flex text-slate-800 w-full justify-center text-center rounded-l-xl p-1 focus:outline-0" onChange={e => buffer.current = e.target.value} />
						<button onClick={handleClick} className="flex w-3/10 h-full">
							<img src={addFriend} className="aspect-square transition-all duration-300 hover:shadow-lg hover:bg-slate-400 rounded-r-xl" />
						</button>
					</div>
				)
			);
		}
		
		return (
			<>
				<p className="text-red-700"> {msg} </p>
				{clicked ? <SearchBar /> :
					<button className="flex h-20 justify-center items-center rounded-full mb-5
						text-slate-700
						transition-all duration-300
						bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800
						active:scale-80" onClick={handleClick}>
					{hovered ? "Add friend" : <img className="p-2" src={addFriend} />}
				</button> }
			</>
		);
	}


	return (
		<>
			<div className="flex flex-col h-full min-h-100 border-t-50 w-1/20 min-w-15
			hover:w-1/10 hover:min-w-70
			border-slate-200 bg-slate-200 justify-between shadow-lg"
				onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
				<List />
				<ButtonAdd />
			</div>
		</>
	);
}

export default FriendsList;
