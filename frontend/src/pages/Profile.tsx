import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router';
import FriendRequest from '../components/Button.tsx';
import BlockUser from '../components/BlockButton.tsx';
import { BACKEND_URL } from "../config";
import TopBar from './TopBar.tsx';

type User = {
  id: number
  email: string
  username: string
  display_name: string
  bio: string
  date_joined: string
  friends: Array<string>
  avatar:string
}

export default function Profile() {

  let navigate = useNavigate();
  const { username } = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  let token = localStorage.getItem("access");
	let logged = false;
	if (token != null)
	  logged = true;

  function Item({ name, variable, edit }) {
    return (
      <>
        <div className="flex flex-row justify-center items-center">
          <div className="flex flex-col justify-center items-center">
            <p className={"bg-slate-400 w-full justify-center text-center items-center px-20 " + (edit ? "rounded-tl-xl" : "rounded-t-xl")}> {name} </p>
            <p className={"bg-slate-100 w-full justify-center text-center items-center px-20 " + (edit ? "rounded-bl-xl" : "rounded-b-xl")}> {variable} </p>
          </div>
        </div>
      </>
    );
  }
  
  async function startChat(){
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
      const chatname = selfid < user.id 
      ? [selfusername, username].join("--")
      : [username, selfusername].join("--");
      navigate(`/chatroom/${chatname}/`)
      return
    }
  }

  //exec code when loading page
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/users/${username}/`, {
      headers: {
        'Accept': 'application/json',
      }
    })
    .then(response => response.json()) //convert to json
    .then(data => {
      if (data.exists === false)
        setUser(null);
      else
        setUser(data);
    })
  }, [username]) //re-exec if username changes (so in case we go from users/luna to users/jack)

  useEffect(() => {
    if (!user?.id) return;
    async function fetchBlockedStatus() {
		const token = localStorage.getItem('access');
		if (!token)
			return;
      const res = await fetch(`${BACKEND_URL}/api/blocked_status/${user.id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setIsBlocked(data.is_blocked);
      }
    }
    fetchBlockedStatus();
  }, [user?.id])

  if (!user) return <p>User doesn't exist</p>
  // not good if user does not exist at all
  // search in database if user exists

return (
    <>
      <div className="flex-box">
        <TopBar logged={logged} />
        <div className="w-dvw h-dvh flex items-center justify-center bg-slate-300 pt-20">
          <div className="m-10 h-8/10 w-7/10 flex flex-col py-10 justify-between rounded-4xl shadow-md items-center bg-slate-200">
            <img src={user.avatar} className="h-40 aspect-square rounded-full shadow-md" />
            <Item name="Display Name" variable={user.display_name} edit={false} />
            <Item name="Biography" variable={user.bio ? user.bio : "no bio"} edit={false} />
            <div className="flex flex-row items-center justify-around w-full">
              <Item name="Email" variable={user.email} edit={false} />
              <Item name="Username" variable={user.username} edit={false} />
            </div>
            <div className="flex flex-row gap-4">
              <FriendRequest receiver_id={user.id} isBlocked={isBlocked} />
              <button
                className="align:center p-4 rounded-full shadow-md bg-slate-400
                           transition-all
                           hover:scale-95 hover:bg-slate-500
                           active:bg-slate-600"
                onClick={startChat}>
                Message
              </button>
              <BlockUser receiver_id={user.id} isBlocked={isBlocked} setIsBlocked={setIsBlocked} />
            </div>
            <button
              className="h-10 w-40 rounded-full shadow-md bg-slate-400
                         transition-all
                         hover:scale-95 hover:bg-slate-500
                         active:bg-slate-600"
              onClick={() => navigate("/home")}>
              Back to main page
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
