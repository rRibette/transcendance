import {useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { BACKEND_URL } from '../config';
import { logOut, refresh } from '../utils';

function ProfileTab({ logged }) {
	let navigate = useNavigate();
	const [clicked, setClicked] = useState('');

	function useOutsideAlerter(ref) {
		useEffect(() => {
			function handleClickOutside(event) {
				if (ref.current && !ref.current.contains(event.target)) {
					setClicked(false);
				}
			}
			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}, [ref]);
	}

	function OutsideAlerter(props) {
		const wrapperRef = useRef(null);
		useOutsideAlerter(wrapperRef);
		return (<div className="flex h-full w-40 md:w-50" ref={wrapperRef}> {props} </div>);
	}

	function ProfileIcon(){
		const [ name, setName ] = useState('');
		const [ icon, setIcon ] = useState('');

		useEffect(() => {
			async function get_me() {
				let token = localStorage.getItem("access");
				if (!token) {
					if (await refresh())
						get_me();
				}
				const response = await fetch(`${BACKEND_URL}/api/users/me/`, {
					method: 'GET',
					credentials: 'omit',
					headers: {'Authorization': `Bearer ${token}`},
				});
				if (response.ok){
					const data = await response.json();
					setName(data.username);
					setIcon(data.avatar);
				}
				else {
					if (response.status == 401) {
						if (await refresh())
							get_me();
					}
				}	
			}
			get_me();
		}, []);

	useEffect(() =>{
	if (icon){
		const img = new Image();
		img.src = icon;
	}
	}, [icon]);

		if (clicked) {
			return (
				<>
				<button className="flex w-full h-1/3 gap-10 px-4 justify-center items-center 
				bg-slate-300 
				hover:bg-slate-400 hover:shadow-lg
				rounded-t-4xl" 
				onClick={() => setClicked(!clicked)}>
					<img src={icon} className="h-9/10 aspect-square rounded-full" />
					<p className="flex self-center justify-center items-center"> {name} </p>
				</button>
				</>
			);
		} else {
			return (
				<button className="flex w-full justify-center items-center
				hover:bg-slate-300 hover:shadow-lg 
				rounded-full" 
				onClick={() => setClicked(!clicked)}>
					<img src={icon} className="flex h-9/10 aspect-square rounded-full"/>
				</button>
			);
		}
	}
	if (!logged) {
		if (clicked) {
			return (	
			OutsideAlerter(
				<div className="w-full h-3/1 justify-center items-center min-w-9">
					<button className="w-full h-1/3 justify-center items-center
					bg-slate-300 shadow-lg block
					transition-all duration-300
					hover:bg-slate-400 hover:shadow-lg
					rounded-t-4xl" 
					onClick={() => setClicked(!clicked)}> Profile </button>
					<button className="w-full h-1/3 justify-center items-center
					bg-slate-300 shadow-lg block
					transition-all duration-300
					hover:bg-slate-400 hover:shadow-lg" 
					onClick={() => navigate("/login")}> Login </button>
					<button className="w-full h-1/3 justify-center items-center
					bg-slate-300 shadow-lg  block
					transition-all duration-300
					hover:bg-slate-400 hover:shadow-lg
					rounded-b-4xl" 
					onClick={() => navigate("/register")}> Register </button>
				</div>
			));
		} else {
			return (
			OutsideAlerter(
				<button className="w-full h-full 
				transition-all duration-300
				hover:bg-slate-300 hover:shadow-lg 
				rounded-full" onClick={() => setClicked(!clicked)}> Profile </button>
			));
		}
	} else {
		if (clicked){
			return (
			OutsideAlerter(
				<div className="flex flex-col w-full h-3/1 justify-center items-center min-w-9">
					<ProfileIcon />
					<button className="flex w-full h-1/3 justify-center items-center bg-slate-300 
					transition-all duration-300 
					hover:bg-slate-400 hover:shadow-lg" 
					onClick={() => navigate("/manage")}> Manage </button>
					<button className="flex w-full h-1/3 justify-center bg-slate-300 items-center 
					transition-all duration-300
					hover:bg-slate-400 hover:shadow-lg 
					rounded-b-4xl" 
					onClick={() => logOut()}> Log Out </button>
				</div>
			));
		} else {
			return (
			OutsideAlerter(
					<ProfileIcon />
			));
		}
	}
}

export default ProfileTab
