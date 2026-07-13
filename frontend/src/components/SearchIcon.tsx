import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { logOut, refresh } from '../utils.tsx'
import { BACKEND_URL } from '../config';
import searchIcon from '../assets/search-svgrepo-com.svg'


export default function SearchIcon() {
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
						searchProfile();
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

	async function searchProfile()
	{
		if (`${buffer.current}`== "") {
			return;
		}
		const response = await fetch (`${BACKEND_URL}/api/users/${buffer.current}`,{
			method: 'GET',
			credentials: 'omit',
		});
		const data = await response.json();
		if (data.exists)
        {
            const is_himself = localStorage.getItem('username')
            if (buffer.current === is_himself)
                navigate("/manage")
            else
			    navigate(`/users/${buffer.current}`);
        }
		else {
			setMsg("user does not exist");
		}
	}

    async function handleClick(){
        setClicked(!clicked);
		setMsg("");
		if (!clicked)
			buffer.current = "";
        if (clicked)
			searchProfile();
    }

    function SearchBar({handleClick}) {
        return (
            OutsideAlerter(
        <div className="flex flex-row w-40 h-8">
            <input className="flex bg-slate-300 text-slate-800 w-full justify-center text-center items-center rounded-l-xl p-1 focus:outline-0" onChange={e => buffer.current = e.target.value}/>
            <button onClick={handleClick} className="flex h-full">
                <img src={searchIcon} className="h-full p-1 aspect-square bg-slate-300  transition-all duration-300 hover:shadow-lg hover:bg-slate-400 rounded-r-xl"/>
            </button>
        </div>)
        );
    }

    function SearchButton({handleClick}) {
        return (
			<button onClick={handleClick} className="rounded-full w-6 h-6 items-center justify-center
			transition-all duration-100
			hover:scale-90" >
				<img src={searchIcon} />
			</button>
        );
    }

    return (
		<>
		<div className="flex justify-center items-center flex-row">
			<p className="text-red-800"> {msg} </p>
        	{ clicked ? <SearchBar handleClick={handleClick}/> : <SearchButton handleClick={handleClick}/> }
		</div>
		</>
    );
 }
