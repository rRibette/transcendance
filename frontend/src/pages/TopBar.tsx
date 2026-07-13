import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import ReactDOM from 'react-dom'
import logo from '../assets/42-svgrepo-com.svg'
import { BACKEND_URL } from '../config';
import NotificationIcon from '../components/NotificationIcon.tsx'
import SearchIcon  from '../components/SearchIcon.tsx'
import MsgIcon from '../components/MsgIcon.tsx'
import ProfileTab from '../components/ProfileTab.tsx'

function TopBar( {logged} ) {
	const buffer = useRef("");
	let navigate = useNavigate();
	return (
		<>
		<div className="flex flex-row justify-center bg-slate-200 h-25 w-full box-border border-15 border-slate-200 fixed justify-between rounded-full shadow-lg">
			<button className="w-50 justify-center items-center
			hover:scale-95" onClick={() => navigate("/home")}> <img className="w-full h-full" src={logo} /> </button>
			<button className="text-5xl absolute justify-center items-center font-bold text-center self-center min-w-30 hidden 2xl:flex
			hover:scale-95 hover:text-slate-800"
			style={{ textShadow: '0px 0px 15px rgb(54, 60, 69)' }} onClick={() => navigate("/home")}> Transcendence </button>
			<div ref={buffer} id="buttons" className="w-full flex flex-row gap-2 md:gap-10 justify-end rounded-full">
				<SearchIcon />
				{logged && <MsgIcon />}
				{logged && <NotificationIcon />}
			 	<ProfileTab logged={logged} /> 
			</div>
		</div>
		</>
	);
}

export default TopBar
