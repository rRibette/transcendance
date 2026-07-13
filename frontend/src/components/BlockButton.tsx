import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from '../config';
import { useState, useEffect } from "react";

export default function BlockUser({receiver_id, isBlocked, setIsBlocked}: 
    {receiver_id: number, isBlocked: boolean, setIsBlocked: (isBlocked: boolean) => void}) {
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchRequests() {
			const token = localStorage.getItem('access');
			if (!token)
				return;
            const res = await fetch(`${BACKEND_URL}/api/blocked_status/${receiver_id}`, {
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
        fetchRequests();
    }, [receiver_id]);

    async function sendBlockRequest() {
        const token = localStorage.getItem('access');
        if (!token) {
            navigate('/login');
            return;
        }
        const endpoint = isBlocked ? 'unblock_user' : 'block_user';
        const response = await fetch(`${BACKEND_URL}/api/${endpoint}/${receiver_id}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        if (response.status === 401) {
            localStorage.removeItem('access');
            navigate('/login');
            return;
        }
        if (response.ok) 
			setIsBlocked(!isBlocked);
    }

    return (
        <button
            onClick={sendBlockRequest}
            className="align:center p-4 rounded-full shadow-md bg-slate-400
            transition-all
            hover:scale-95 hover:bg-blue-500 hover:bg-slate-500
            active:bg-slate-600"
            onClick={sendBlockRequest}>
            {isBlocked ? "Unblock" : "Block"}
        </button>
    );
}
