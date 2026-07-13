// import { useNavigate } from "react-router-dom";
import NotificationIcon from "../components/NotificationIcon"
// 
export default function Header({username}: {username: string}) {
  return (
    <header className="w-full bg-sky-900 shadow-lg p-4">
      <h1 className="font-bold text-right text-white">
         Logged in as {username}
      </h1>
      <NotificationIcon></NotificationIcon>
      
    </header>
  )
}