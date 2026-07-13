
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router";
import hide from '../assets/hide-pass.svg';
import show from '../assets/show-pass.svg';
import { BACKEND_URL, GOOGLE_REDIRECT_URI, REDIRECT_URI_42, CLIENT_ID_42, GOOGLE_CLIENT_ID } from '../config';

function GoogleLoginButton() {
  const handleLogin = () => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    window.location.href = authUrl.toString();
  };
  
  return (
  	<button className="flex w-full justify-center items-center rounded-full shadow-md bg-slate-400
			transition-all
			hover:scale-95 hover:bg-slate-500
			active:bg-slate-600" 
			onClick={handleLogin}>Login with Google</button>
	);
}

function Login42Button() {
  const handleLogin = () => {
    const authUrl = new URL('https://api.intra.42.fr/oauth/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID_42);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI_42);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'public');
    
    window.location.href = authUrl.toString();
  };
  
  return <button className="flex w-full justify-center items-center rounded-full shadow-md bg-slate-400
				transition-all
				hover:scale-95 hover:bg-slate-500
				active:bg-slate-600" 
				onClick={handleLogin}>Login with 42</button>;
}

function LogForms() {

	let navigate = useNavigate();
	useEffect(() => {
		const token = localStorage.getItem('access');
		if (token) {
			navigate('/home');
			return;
		}
	}, [navigate]);

	async function handleLogin(){
		setMsg('');
		setMsgPass('');
		setMsgUser('');
		const response = await fetch(`${BACKEND_URL}/api/auth/login/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: username,
				password: password,
				}),
		});

		const data = await response.json();

		if (data.success)
		{
			localStorage.setItem("access", data.access);
			localStorage.setItem("refresh", data.refresh);
			localStorage.setItem('username', data.user.username);
			localStorage.setItem('id', String(data.user.id));
			navigate("/home");
		}
		else {
			if (data.errors.username)
				setMsgUser(data.errors.username[0]);
			if (data.errors.password)
				setMsgPass(data.errors.password[0]);
			if (data.errors.non_field_errors)
				setMsg(data.errors.non_field_errors[0]);
		}
	}	


	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [passFlag, setPassFlag ] = useState(true);
	const [msgUser, setMsgUser ] = useState('');
	const [msgPass, setMsgPass ] = useState('');
	const [msg, setMsg ] = useState('');

	useEffect(() => {
		function handleInput(event){
			if (event.code == "Enter"){
				handleLogin();
			}
		}
		window.addEventListener("keydown", handleInput);
		return () => {
			window.removeEventListener("keydown", handleInput);
		};
	}, [username, password]);

	function PassButton() {
		if (!passFlag) {
			return (
				<>
					<button className="bg-slate-400 w-3/20 h-full rounded" onClick={() => setPassFlag(!passFlag)}>
						<img src={show}/>
					</button>
				</>
			);
		}
		else {
			return (
				<>
					<button className="bg-slate-400 w-3/20 h-full rounded" onClick={() => setPassFlag(!passFlag)}>
						<img src={hide}/>
					</button>
				</>
			);
		}
	}

	return (
	<>
	<div className="flex flex-col gap-3 items-center">
		<label className="flex flex-col items-center">
			Username: <input className="bg-white border outline-black w-50" onChange={e => setUsername(e.target.value)}/>
			<p className="text-red-800"> {msgUser} </p>
		</label>
		<label className="flex flex-col items-center">
			Password: 
			<div className = "flex flex-row items-center w-50 h-full">
				<input type={passFlag ? "password" : ""} className="bg-white border outline-black w-17/20" onChange={e => setPassword(e.target.value)}/>
				<PassButton />
			</div>
			<p className="text-red-800"> {msgPass} </p>
		</label>
		<p className="text-red-800"> {msg} </p>
	<button className="h-10 w-40 rounded-full shadow-md bg-slate-400
			transition-all
			hover:scale-95 hover:bg-slate-500
			active:bg-slate-600"
			onClick={handleLogin}> Login </button>
	</div>
	</>
	)
}

//add flag to prevent second call and POST error in console
function LogPage() {
	let navigate = useNavigate();
  const [message, setMessage] = useState('');
  const flag = useRef(false);

  useEffect(() => {
	if (flag.current)
			return ;
    if (window.location.pathname === '/auth/google/callback') {
		flag.current = true;
      	handleOAuthCallback('google');
    }
	else if (window.location.pathname === '/auth/42/callback'){
		flag.current = true;
		handleOAuthCallback('42');
	}
  }, []);
  
  async function handleOAuthCallback(provider: 'google'| '42') {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/${provider}/`, {
        method: 'POST',
        credentials: 'omit',
		headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.access) {
          localStorage.setItem('access', data.access);
        }
		if (data.refresh) {
          localStorage.setItem('refresh', data.refresh);
        }
		if (data.user) {
          localStorage.setItem('data', JSON.stringify(data.user));
		  localStorage.setItem('username', data.user.username);
		  localStorage.setItem('id', String(data.user.id));
        }
		window.history.replaceState({}, '', '/home');
		navigate('/home');
      }
    } catch (err) {
      setMessage(`Erreur réseau : ${err}`);
    }
  }
  
  return (
  <div className="w-dvw h-dvh flex items-center justify-center bg-slate-300">
    <div className="h-120 min-w-sm flex flex-col gap-5 justify-around rounded-4xl items-center shadow-md bg-slate-200">
		<LogForms />
		<button className="h-10 w-40 rounded-full shadow-md bg-slate-400
				transition-all
				hover:scale-95 hover:bg-slate-500
				active:bg-slate-600"
				onClick={() => navigate("/home")}> Back to main page </button>
		<div className="flex flex-row justify-around gap-4">
    		<GoogleLoginButton />
			<Login42Button />
		</div>
      {message && <p className="">{message}</p>}
    </div>
</div>
  );
}

export default LogPage;
