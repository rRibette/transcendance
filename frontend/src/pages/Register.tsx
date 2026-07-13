import { useEffect, useState } from 'react';
import hide from '../assets/hide-pass.svg'
import show from '../assets/show-pass.svg'
import { useNavigate } from "react-router";
import { BACKEND_URL } from '../config';

function Register() {
	let navigate = useNavigate();
	const [ flag, setFlag ] = useState(false);
	const [ username, setUsername ] = useState('');
	const [ mail, setMail ] = useState('');
	const [ password, setPassword ] = useState('');
	const [ msgUser, setMsgUser ] = useState('');
	const [ msgPass, setMsgPass ] = useState('');
	const [ msgMail, setMsgMail ] = useState('');
	const [ passFlag, setPassFlag ] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem('access');
		if (token) {
			navigate('/home');
			return;
		}
	}, [navigate]);
//add the 3 setMsg to reinitialize at the beginning to fix case where user write unvalid username and unvalid password size, gets 2 errors, fixes one and retry and now gets onluy one
	async function handleReg(){
		setMsgUser('');
		setMsgPass('');
		setMsgMail('');
		const response = await fetch(`${BACKEND_URL}/api/auth/register/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body : JSON.stringify({
				username: username,
				email: mail,
				password: password,
			}),
		});

		const data = await response.json();
		if (data.success) {
			setFlag(true);
			setMsgUser("");
			setMsgMail("");
			setMsgPass("");
			localStorage.setItem("access", data.access);
			localStorage.setItem("refresh", data.refresh);
			localStorage.setItem("username", data.user.username);
			localStorage.setItem("id", String(data.user.id));
			navigate("/home");
		}
		else {
			if (data.errors.username){
				setMsgUser(data.errors.username[0]);
			}
			if (data.errors.email) {
				setMsgMail(data.errors.email[0]);
			}
			if (data.errors.password) {
				setMsgPass(data.errors.password[0]);
			}
		}
	}

	useEffect(() => {
		function handleInput(event) {
			if (event.code == "Enter"){
				handleReg();
			}
		}
		window.addEventListener("keydown", handleInput);
		return () => {
			window.removeEventListener("keydown", handleInput);
		};
	}, [username, mail, password]);

	function Button() {
		if (!flag)
		{
			return (
			<>
				<div className="flex flex-col w-full justify-center items-center gap-5">	
					<button className="h-10 w-40 rounded-full shadow-md bg-slate-400
                         transition-all
                         hover:scale-95 hover:bg-slate-500
                         active:bg-slate-600"
						 onClick={handleReg}> Register </button>
					<button className="h-10 w-40 rounded-full shadow-md bg-slate-400
                         transition-all
                         hover:scale-95 hover:bg-slate-500
                         active:bg-slate-600" 
						onClick={() => navigate("/home")}> Back to main page </button>
				</div>
			</> );
		}
		else
		{
			return (
			<>
				<div className="flex flex-col w-full justify-center items-center gap-5">	
					<p className={"text-green-600"}> "You are registered, you can go back to mainpage" </p>
					<button className="flex relative bg-amber-400 w-40 h-10 rounded-full active:bg-amber-600 justify-center items-center" onClick={() => navigate("/home")}> Back to main page </button>
				</div>
			</> );
		}
	}

	function PassButton() {
			if (!passFlag){
				return (
					<>
						<button className="bg-slate-400 w-3/20 h-full rounded"  onClick={() => setPassFlag(!passFlag)}>
							<img src={show}/>
						</button>
					</>
				);
			}
			else {
				return (
					<>
						<button className="bg-slate-400 w-3/20 h-full rounded"  onClick={() => setPassFlag(!passFlag)}>
							<img src={hide}/>
						</button>
					</>
				);
			}
	}

	return (
	<>
	<div className="flex w-dvw h-dvh items-center justify-center bg-slate-300">
		<div className="h-120 min-w-sm flex flex-col gap-5 rounded-4xl items-center justify-around p-5 shadow-md bg-slate-200">
			<div className="flex flex-col gap-3 items-center">
				<label className="flex flex-col items-center">
					Username: <input className="bg-white border outline-black w-50" onChange={e => setUsername(e.target.value)}/>
					<p className="text-red-800"> {msgUser} </p>
				</label>
				<label className="flex flex-col items-center">
					Email: <input className="bg-white border outline-black w-50" onChange={e => setMail(e.target.value)}/>
					<p className="text-red-800"> {msgMail} </p>
				</label>
				<label className="flex flex-col items-center">
					Password: 
					<div className="flex flex-row items-center w-50 h-full">
							<input type={passFlag ? "password" : ""} className="bg-white border w-17/20 outline-black" onChange={e => setPassword(e.target.value)} />
							<PassButton />
					</div>
					<p className="text-red-800"> {msgPass} </p>
				</label>
			</div>
			<Button />
		</div>
	</div>
	</>
	)
}

export default Register;
