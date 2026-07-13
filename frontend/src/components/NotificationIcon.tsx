import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react'
import BellOff from "../../images/notification_bell_off.png";
import BellOn from "../../images/notification_bell_on.png";
import { refresh } from "../utils.tsx";
import { BACKEND_URL} from '../config';

export default function NotificationIcon() {
    const navigate = useNavigate();
    const [fq, setFq] = useState<any[] | null>(null)

    useEffect(() => {
        async function fetchRequests() {
            const res = await fetch(`${BACKEND_URL}/api/friend_requests/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access')}`,
            },
            });
            const data = await res.json();
            setFq(data);
        }
        fetchRequests();
    }, []);
    const icon = fq && fq.length > 0 ? BellOn : BellOff;
    async function notificationState() {
        navigate('/notification')
        return
    }

    return (
		<>
        <div className="flex justify-center items-center">
       	<button className="hover:scale-90" onClick={notificationState}>
          <img src={icon} alt="Notifications" width={24} height={24} />
        </button>
        </div>
		</>
    )
}
