import { useState, useEffect } from 'react'
import { useNavigate } from "react-router";
import { BACKEND_URL} from '../config';
import AcceptRequest from '../components/ButtonAcceptFriend.tsx'
import RejectRequest from '../components/ButtonRejectFriend.tsx';

export default function Notification() {
	let navigate = useNavigate();
    
    const [fq, setFq] = useState<any[] | null>(null)
    const [actions, setActions] = useState<{[key: number]: string}>({});

	useEffect(() => {
		const token = localStorage.getItem('access');
		if (!token) {
			navigate('/login');
            return;
		}
	}, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (!token)
            return;
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

    async function handleAction(requestID: number, action: 'accept' | 'reject') {
    const token = localStorage.getItem('access');
    const res = await fetch(`${BACKEND_URL}/api/${action}_friend_request/${requestID}/`, {
        method: 'POST',
        headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        },
    });
    if (res.ok) {
        setActions(prev => ({ ...prev, [requestID]: action }));
    }
    }

    return (
	<>
	<div className="w-dvw h-dvh flex items-center justify-center bg-slate-300">
        <div className="flex flex-col h-dvh w-200 gap-5 rounded-4xl items-center shadow-md bg-slate-200">
			<div className="flex w-full h-7/10 items-center justify-around overflow-scroll">
            {fq && fq.length > 0 ? (fq.map(request => (
                <div key={request.id}>
                    <p>You have a friend request from {request.from_username}</p>
                    {actions[request.id] === 'accept' ? (
                        <p className="text-green-600 font-bold">Accepted ✓</p>
                    ) : actions[request.id] === 'reject' ? (
                        <p className="text-red-600 font-bold">Rejected ✗</p>
                    ) : (
                        <>
                        <button
                            onClick={() => handleAction(request.id, 'accept')}
                            className="p-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleAction(request.id, 'reject')}
                            className="p-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
                        >
                            Reject
                        </button>
                        </>
                    )}
                </div>
            ))) : (
            <p>No friend requests</p>
            )}
			</div>
			<button className="flex relative w-40 h-10 rounded-full justify-center items-center shadow-md bg-slate-400
                    transition-all
                    hover:scale-95 hover:bg-slate-500
                    active:bg-slate-600"
                    onClick={() => navigate("/home")}> Back to main page </button>
        </div>
	</div>
	</>
    );
}
