import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import addFriend  from '../assets/add-friend-svgrepo-com.svg';
import { logOut, refresh } from '../utils.tsx';
import { BACKEND_URL} from '../config';

function FriendsList_without_add() {
	const navigate = useNavigate();
	const [ hovered, setHovered ] = useState(false);
	const [ size, setSize ] = useState(0);
	const ids = useRef(new Array<number>());

	const data = useRef(null);
	
		useEffect(() => {
			async function get_friends() {
				let token = localStorage.getItem("access");
				const response = await fetch (`${BACKEND_URL}/api/me/friends/`, {
					method: 'GET',
					credentials: 'omit',
					headers: {'Authorization': `Bearer ${token}`},
				});
				if (response.ok){
					const resp = await response.json();
					data.current = resp;
					setSize(resp.length);
                    ids.current = [];
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
		}, []);

	function List() {
		function Friend({index}){
			const [ avatar, setAvatar ] = useState("");
			const [ display, setDisplay ] = useState("");
			const [ username, setUsername ] = useState("");
			const [ userid, setUserid ] = useState(0);
			const [ isOnline, setIsOnline ] = useState(false);
			const [ LastMessage, setLastMessage ] = useState("");
			useEffect(() => {
				async function loadFriend(){
				if (data.current && data.current.length > index) {

					setAvatar(data.current[index].avatar);
					setDisplay(data.current[index].display_name);
					setUsername(data.current[index].username);
					setIsOnline(data.current[index].is_online);
					setUserid(data.current[index].id);
					const selfusername = localStorage.getItem("username");
					const friendUsername = data.current[index].username;
					let token = localStorage.getItem("access");
					const selfid = parseInt(localStorage.getItem("id") ?? "0");
					const friendid = data.current[index].id;
					const chatname = selfid < friendid
						? [selfusername, friendUsername].join("--")
						: [username, selfusername].join("--");
					const res = await fetch (`${BACKEND_URL}/api/last_message/${chatname}/`, {
					method: 'GET',
					credentials: 'omit',
					headers: {'Authorization': `Bearer ${token}`},
				});
				if (res.ok){
					const resp = await res.json();
					setLastMessage(resp.message);
				}
			}
		}
		loadFriend();
		}, [data]);

	// useEffect(() =>{
	// if (avatar){
	// 	const img = new Image();
	// 	img.src = avatar;
	// }
	// }, [avatar]);

        function startChat(){
            const token = localStorage.getItem("access");
            if (!token) {
            navigate('/login')
            return
            }
            else {
            const selfid = parseInt(localStorage.getItem("id") ?? "0");
            const selfusername = localStorage.getItem("username");
        //to uncomment when we have a page for all existing chatrooms
        //involving the logged in user
            // if (selfusername == username) { 
            //   navigate('/messages')
            //   return;
            // }
            const chatname = selfid < userid
				? [selfusername, username].join("--")
				: [username, selfusername].join("--");
            navigate(`/chatroom/${chatname}/`)
            return
            }
        }

			return (
				<>
				<div className="flex h-12 my-2 bg-slate-200 justify-between p-9 items-center rounded-full" >
                    <div className="flex flex-row justify-center gap-5 items-center">
                        <p> {display} </p>
						<span className={isOnline ? "text-green-500" : "text-gray-400"}>●</span>
                        <img src={avatar} className="h-12 aspect-square rounded-full"/>
						<p className="text-sm text-gray-500 truncate">{LastMessage}</p>
                    </div>
                <button
                    className="h-10 px-4 bg-amber-400 rounded-full active:bg-amber-600"
                    onClick={startChat}>
                    Message
                </button>
				</div>

			</>
			);
		}
		const list = ids.current.map(id => <Friend index={id} />);
				
		return (
			<>
			<div className="flex flex-col h-full pt-13">	
				{list}
			</div>
			</>
		);
	}

	return (
		<>
			<div className="flex flex-col h-7/10 w-9/10 rounded-4xl overflow-scroll border-slate-300 justify-between shadow-lg">
				<List />
				{/* <ButtonAdd /> */}
			</div>
		</>
	);
}

export default FriendsList_without_add;
