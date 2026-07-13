import { useEffect, useState , useRef} from 'react';
import { useNavigate } from 'react-router';
import { logOut, refresh } from '../utils.tsx';
import { BACKEND_URL} from '../config';
import upload_avatar  from '../assets/upload_avatar.svg';
import TopBar from './TopBar.tsx';

function ManagePage() {
	let navigate = useNavigate();
	const [ avatar, setAvatar ] = useState('');
	const [ bio, setBio ] = useState('');
	const [ display, setDisplay ] = useState('');
	const [ email, setEmail ] = useState('');
	const [ username,  setUsername ] = useState('');
	const [errorMsg, setError] = useState("");
	const inputFile = useRef<HTMLInputElement>(null);
	let token = localStorage.getItem("access");
	let logged = false;
	if (token != null)
		logged = true;

	function Item({name, variable, edit, fieldname}){
		const [ flag, setFlag ] = useState(false);
		const [ buffer, setBuffer ] = useState('');
		function handleEdit()
		{
			setError("");
			if (!flag){
				setFlag(true);
			}
			else {
				setFlag(false);
				if (fieldname && buffer.trim() != ''){
					save_field(fieldname, buffer);
				}
			}
		}
		return (
		<>
			<div className="flex flex-row justify-center items-center">
				<div className="flex flex-col justify-center items-center">
					<p className={"bg-slate-400 w-full justify-center text-center items-center px-20 " + (edit ? "rounded-tl-xl" : "rounded-t-xl")}> {name} </p>
					{flag ? 
						<input className={"bg-slate-100 w-full justify-center text-center items-center px-20 " + (edit ? "rounded-bl-xl" : "rounded-b-xl")} onChange={e => setBuffer(e.target.value)}/> :
					<p className={"bg-slate-100 w-full justify-center text-center items-center px-20 " + (edit ? "rounded-bl-xl" : "rounded-b-xl")}> {variable} </p> }
				</div>
				{edit && <button className="bg-slate-500 rounded-r-xl h-full aspect-square" onClick={handleEdit}> {flag ? "Save" : "Edit"} </button>}
			</div>
		</>
		);
	}

	async function save_field(field:string, value:string) {
		let token = localStorage.getItem("access");
		const response = await fetch (`${BACKEND_URL}/api/users/me/`, {
			method: 'PATCH',
			credentials: 'omit',
			headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json',},
			body: JSON.stringify({ [field]: value}),
		});
		if (response.status == 401) {
			if (await refresh())
				return save_field(field, value);
			return ;
			}
		const data = await response.json();
		if (data.success){
			if (field === 'bio') setBio(value);
			if (field === 'display_name') setDisplay(value);
			setError("");
		}
		else
			setError(data.errors[field][0]);
	}

	async function get_me() {
		let token = localStorage.getItem("access");
		const response = await fetch (`${BACKEND_URL}/api/users/me/`, {
			method: 'GET',
			credentials: 'omit',
			headers: {'Authorization': `Bearer ${token}`},
		});
		if (response.ok) {
			const data = await response.json();
			setAvatar(data.avatar);
			setBio(data.bio);
			setDisplay(data.display_name);
			setEmail(data.email);
			setUsername(data.username);
		}
		else {
			if (response.status == 401) {
				if (await refresh())
					get_me();
			}
		}
	}

	async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file)
			return;
		if (file.size > 4 * 1024 * 1024)//4MB
			return;
		const formData = new FormData();
		formData.append('avatar_upload', file);
		let token = localStorage.getItem('access');
		const response = await fetch(`${BACKEND_URL}/api/users/me/`, {
		method: 'PATCH',
		credentials: 'omit',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
		body: formData,
    });

		if (response.ok) {
		const data = await response.json();
		setAvatar(data.avatar);
		}
	}

	useEffect(() =>{
	get_me();
	}, []);

	useEffect(() =>{
	if (avatar){
		const img = new Image();
		img.src = avatar;
	}
	}, [avatar]);

	
	function change_avatar() {
		inputFile.current.click();
	}

	return (
		<>
			<div className="flex-box"><TopBar logged={logged}/>
				<div className ="w-dvw h-bg-gray-600 h-dvh flex items-center justify-center bg-slate-300 pt-20">
					<div className="m-10 h-8/10 w-7/10 flex flex-col py-10 justify-between rounded-4xl shadow-md items-center bg-slate-200">
						<div className="relative">
							<img src={avatar} className="h-40 aspect-square rounded-full shadow-md"/>
							<input
								type="file"
								accept="image/*"
								ref={inputFile}
								onChange={handleFileSelected}
								style={{ display: 'none' }}
							/>
							<button 
								className="absolute bottom-0 right-0 h-12 w-12 bg-slate-400 rounded-full flex justify-center items-center" 
								onClick={() => change_avatar()}>
								<img src={upload_avatar} className="h-6 w-6"/>
							</button>
						</div>
						<Item  name="Display Name" variable={display} edit={true} fieldname="display_name"/>
						<Item  name="Biography" variable={bio ? bio : "start writing your bio"} edit={true} fieldname="bio" />
						<div className="flex flex-row items-center justify-around w-full">
							<Item  name="Email" variable={email} edit={false}/>
							<p className="text-red-800"> {errorMsg}</p>
							<Item  name="Username" variable={username} edit={false}/>
						</div>
					<button className=
							"h-10 w-40 rounded-full justify-center items-center shadow-md bg-slate-400 
							transition-all
							hover:scale-95 hover:bg-slate-500
							active:bg-slate-600" 
							onClick={() => navigate("/home")}> Back to main page </button>
					</div>
				</div>
			</div>
		</>
	);
}

export default ManagePage;
