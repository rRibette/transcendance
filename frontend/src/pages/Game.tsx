import { useState, useEffect } from 'react'
import TopBar from './TopBar';
import { useNavigate } from 'react-router';
import { BACKEND_URL } from "../config";

type User = {
  id: number
  email: string
  username: string
  display_name: string
  bio: string
  date_joined: string
  friends: Array<string>
}

type InviteProps = {
  state: string;
  navigate: (path: string) => void;
  OnMainClick: () => void;
};

function Invite({state, navigate, OnMainClick}: InviteProps){
	let token = localStorage.getItem("access");
	let logged = false;
	const [friends, setFriends] = useState<Array<User> | null>(null)
	if (token != null)
		logged = true;
	if (logged) {
		useEffect(() => {
			fetch(`${BACKEND_URL}/api/me/friends`, {
				headers: {
					'Accept': 'application/json',
					'Authorization': `Bearer ${token}`,
				}
			})
			.then(response => response.json()) //convert to json
			.then(data => setFriends(data))
		}, [])
	}
	if (state == "invite") {
		if (!logged)
			return <div className="flex h-20 w-full rounded-full justify-center items-center
						text-slate-700">You must log in to play multiplayer</div>
		else
		{
			if (!friends || friends.length < 1)
			{
				return (
					<div className="flex h-20 w-full rounded-full justify-center items-center
						text-slate-700">You don't have friends to defy</div>
				)
			}
			return (
				<div className='flex flex-col gap-2 max-h-96 overflow-y-auto w-full'>
					{friends.map((friend) => (
						<button key={friend.id} type='button' className="flex h-20 w-full rounded-full justify-center items-center
						text-slate-700
						transition-all duration-300 bg-blue-500
						hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
						onClick={() => startGame(friend, navigate)}>
							{friend.username}
						</button>
					))}
				</div>)
		}
	}
	else
	{
		return (
			<button className="flex h-20 w-full rounded-full justify-center items-center
				text-slate-700 bg-blue-500
				transition-all duration-300
				hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
				onClick={OnMainClick}>Multiplayer invite
			</button>
		)
	}
}

async function startGame(user: User, navigate: any){
	const token = localStorage.getItem("access");
	if (!token || !user) {
		navigate('/login')
		return
	}
	else {
		const selfid = parseInt(localStorage.getItem("id") ?? "0");
		const selfusername = localStorage.getItem("username");

		const gamename = selfid < user.id 
		? [selfusername, user.username].join("--")
		: [user.username, selfusername].join("--");
		navigate(`/gameRoom/${gamename}/`)
		return
	}
}

export default function Select() {
	const [state, SetState] = useState<string>("default");
	let navigate = useNavigate();
	const selfusername = localStorage.getItem("username");
	let token = localStorage.getItem("access");
	let logged = false;
	if (token != null)
		logged = true;

	//create user var init to null 
	//<User | null> which types of var are possible
	//(null) < initial value before init
	
	function changeState(newState: string) {
		if (state == newState)
			SetState("default");
		else
			SetState(newState)
	}

	//exec code when loading page
	// useEffect(() => {
	// fetch(`${BACKEND_URL}/api/users/${username}/`, {
	// 	headers: {
	// 	'Accept': 'application/json',
	// 	}
	// })
	// .then(response => response.json()) //convert to json
	// .then(data => setUser(data))
	// }, [username]) //re-exec if username changes (so in case we go from users/luna to users/jack)

	// if (!user) return <p>User doesn't exist</p> 


	return (
		<div className="flex h-dvh w-dvw bg-slate-300">
			<TopBar logged={logged}/>
			<div className='flex flex-box w-full items-center'>
				{logged ? (
					<button className="
						flex h-20 w-full rounded-full justify-center items-center
						text-slate-700 bg-blue-500
						transition-all duration-300
						hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800
						active:scale-80" onClick={() => navigate(`/soloGame/${selfusername}`)}>
						Vs AI
					</button>
				) : (
					<button className="
						flex h-20 w-full rounded-full justify-center items-center
						text-slate-700 bg-blue-500
						transition-all duration-300
						hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800
						active:scale-80" onClick={() => navigate("/login")}>
						Log in to play vs AI
					</button>
				)}
				<Invite state={state} navigate={navigate} OnMainClick={() => changeState('invite')}/>
			</div>
		</div>
	)
}