import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router';
import FriendRequest from '../components/Button.tsx'
import Header from '../components/Header.tsx'
import type { Route } from "./+types/users"
import { BACKEND_URL } from "../config";
import FriendsList_without_add from "../components/FriendsList_without_add.tsx"
import TopBar from './TopBar.tsx'

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

export default function ChatsList() {

  let navigate = useNavigate();
  //retrieves username from URL
  const { username } = useParams()
  //create user var init to null 
  //<User | null> which types of var are possible
  //(null) < initial value before init
  const [user, setUser] = useState<User | null>(null)

  function Item({ name, variable, edit }) {
    return (
      <>
        <div className="flex flex-row justify-center items-center">
          <div className="flex flex-col justify-center items-center">
            <p className={"bg-amber-400 w-full justify-center text-center items-center px-20 " + (edit ? "rounded-tl-xl" : "rounded-t-xl")}> {name} </p>
            <p className={"bg-amber-500 w-full justify-center text-center items-center px-20 " + (edit ? "rounded-bl-xl" : "rounded-b-xl")}> {variable} </p>
          </div>
        </div>
      </>
    );
  }
  
//   async function startChat(){
//     const token = localStorage.getItem("access");
//     if (!token) {
//       navigate('/login')
//       return
//     }
//     else {
//       const selfid = parseInt(localStorage.getItem("id") ?? "0");
//       const selfusername = localStorage.getItem("username");
// //to uncomment when we have a page for all existing chatrooms
// //involving the logged in user
//       // if (selfusername == username) { 
//       //   navigate('/messages')
//       //   return;
//       // }
//       const chatname = selfid < user.id 
//       ? [selfusername, username].sort().join("--")
//       : [username, selfusername].sort().join("--");
//       navigate(`/chatroom/${chatname}/`)
//       return
//     }
//   }

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

//   if (!user) return <p>User doesn't exist</p>
//   // not good if user does not exist at all
//   // search in database if user exists


// return (
//     <>
//     <div className=" w-dvw h-dvh bg-gray-600 flex flex-col items-center justify-center">
//     <FriendsList_witout_add />
//     {/* <button
//         className="h-10 px-4 bg-amber-400 rounded-full active:bg-amber-600"
//         onClick={startChat}>
//         Message
//     </button> */}
//     {/* <button
//         className="h-10 w-40 bg-amber-400 rounded-full active:bg-amber-600"
//         onClick={() => navigate("/home")}>
//         Back to main page
//     </button> */}
//     <button className="flex relative bg-slate-400 w-40 h-10 rounded-full active:bg-slate-500 justify-center items-center" onClick={() => navigate("/home")}> Back To main page </button>
//     </div>
//     </>
//   )

      return (
	<>
	<div className="w-dvw h-dvh flex items-center justify-center bg-slate-300">
        <div className="flex flex-col h-dvh w-200 gap-5 justify-around rounded-4xl items-center shadow-md bg-slate-200">
        <FriendsList_without_add />
			<button className="flex relative bg-slate-400 w-40 h-10 rounded-full justify-center items-center shadow-md bg-slate-400
              transition-all
              hover:scale-95 hover:bg-slate-500
              active:bg-slate-600" 
              onClick={() => navigate("/home")}> Back to main page </button>
        </div>
	</div>
	</>
    );
}
