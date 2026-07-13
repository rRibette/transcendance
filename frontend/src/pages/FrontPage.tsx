import { useState } from 'react'
import TopBar from "./TopBar.tsx"
import MainBody from "./MainBody.tsx"
import FriendsList from "./FriendsList.tsx"
import NavBar from "./NavBar.tsx"

function FrontPage() {
	const [ window, setWindow ] = useState('');
	let token = localStorage.getItem("access");
	let logged = false;
	if (token != null)
		logged = true;
	return (
	<>
	{/* bg color here */}
		<div className="flex flex-col h-screen min-h-100 w-full bg-slate-300"> 
			<TopBar logged={logged}/>
			<div className="flex flex-row w-full h-full justify-between">
				<NavBar state={window} setState={setWindow}/>
				<MainBody state={window}/>
				{logged && <FriendsList />}
			</div>
		</div>
	</>
	)
}

export default FrontPage
