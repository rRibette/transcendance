import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from '../config';
import { useState, useEffect } from "react";
import { logOut, refresh } from "../utils.tsx";

export default function FriendRequest({receiver_id, isBlocked}: {receiver_id: number, isBlocked: boolean}) {
    const navigate = useNavigate();
    const [sent, setSent] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const token = localStorage.getItem('access');
    
    if (!token) {
        return;
    }
    useEffect(() => {
        async function fetchRequests() {
            const res = await fetch(`${BACKEND_URL}/api/friend_request_status/${receiver_id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access')}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setSent(data.sent);
                setIsFriend(data.is_friend);
            }
			else if (res.status == 401) {
				if (refresh())
					fetchRequests();
			}
        }
        fetchRequests();
    }, [receiver_id]);

    async function sendRequest() {
        const token = localStorage.getItem('access');
        if (!token) {
            navigate('/login');
            return;
        }
        const response = await fetch(`${BACKEND_URL}/api/send_friend_request/${receiver_id}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        if (response.status === 401) {
			if (refresh())
				sendRequest();
        }
        if (response.ok) 
			setSent(true);
    }

    async function removeFriend() {
        const token = localStorage.getItem('access');
        if (!token) {
            navigate('/login');
            return;
        }
        const response = await fetch(`${BACKEND_URL}/api/delete_friend/${receiver_id}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        if (response.status === 401) {
			if (refresh())
				removeFriend()
        }
        if (response.ok) {
            setIsFriend(false);
            setSent(false);
        }
    }

    return (
        <button
            onClick={isBlocked ? undefined : (isFriend ? removeFriend : sendRequest)}
            disabled={isBlocked || (sent && !isFriend)}
            className={`align:center p-4 rounded-full shadow-md transition-all ${
                isBlocked
                    ? "bg-gray-800 cursor-not-allowed text-slate-100"
                    : "bg-slate-400 hover:scale-95 hover:bg-slate-500 active:bg-slate-600"
            }`}
        >
            {isBlocked
                ? "Blocked"
                : isFriend
                ? "Remove friend"
                : sent
                ? "Request sent"
                : "Send a friend request"}
        </button>
);
}
