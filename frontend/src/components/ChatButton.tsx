import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { logOut, refresh } from '../utils.tsx'
import { BACKEND_URL } from '../config';
import chatIcon from "../assets/message-square-svgrepo-com.svg";


export default function ChatButton() {
    const [ clicked, setClicked ] = useState(false);
	const [ msg, setMsg ] = useState("");
    const buffer = useRef("");

	let navigate = useNavigate();

    function useOutsideAlerter(ref) {
        useEffect(() => {
            function handleClickOutside(event) {
                if (ref.current && !ref.current.contains(event.target)) {
                    setClicked(false);
                }
            }
            function handleEnterInside(event) {
                if (event.code == "Enter"){
                    if (ref.current && ref.current.contains(event.target)) {
						startChat();
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

	async function startChat() {
		const id = parseInt(localStorage.getItem("id") ?? "0");
		const username = localStorage.getItem("username");
		if (!id || !username)
			navigate('/login');
		if (buffer.current == "")
			return ;
		const response = await fetch (`${BACKEND_URL}/api/users/${buffer.current}/` ,{
			method: 'GET',
			credentials: 'omit',
		});
		const data = await response.json();
		if (data.exists){
			const other_id = data.id;
			const other_name = data.username;
			if (id == other_id) 
				setMsg("cant chat yourself");
			else {
				const chatname = id < other_id ?
					[username, other_name].join("--") :
					[other_name, username].join("--");
				navigate(`/chatroom/${chatname}/`);
			}
		}
		else 
			setMsg("user does not exist");
	};

    function OutsideAlerter(props) {
        const wrapperRef = useRef(null);
        useOutsideAlerter(wrapperRef);

        return (<div ref={wrapperRef}>{props}</div>);
    }

    async function handleClick(){
        setClicked(!clicked);
		setMsg("");
		if (!clicked)
			buffer.current = "";
        if (clicked)
			startChat();
    }

    function SearchBar({handleClick}) {
        return (
            OutsideAlerter(
        <div className="flex flex-row w-40 h-10">
            <input className="flex bg-slate-400 text-slate-800 w-full justify-center text-center items-center rounded-l-xl p-1 focus:outline-0" onChange={e => buffer.current = e.target.value}/>
            <button onClick={handleClick} className="flex h-full bg-slate-400 rounded-r-xl">
				<img src={chatIcon} />
            </button>
        </div>)
        );
    }

    function SearchButton({handleClick}) {
        return (
			<button onClick={handleClick} className="rounded-full w-40 h-10 items-center justify-center bg-slate-400
			transition-all duration-100
			hover:scale-95 hover:bg-slate-500
			active:bg-slate-600" >
				Start a new chat
			</button>
        );
    }

    return (
		<>
		<div className="flex justify-center items-center flex-col">
			<p className="text-red-800"> {msg} </p>
        	{ clicked ? <SearchBar handleClick={handleClick}/> : <SearchButton handleClick={handleClick}/> }
		</div>
		</>
    );
 }
