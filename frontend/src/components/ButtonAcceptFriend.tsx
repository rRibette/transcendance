import { useNavigate } from "react-router-dom";
import { BACKEND_URL} from '../config';
import { useState } from "react";

export default function AcceptRequest({receiver_id}: {receiver_id: number}) {
	const navigate = useNavigate();
	const [sent, setSent] = useState(false);

	async function sendacceptRequest(){
		const token = localStorage.getItem('access');
		if (!token) {
			navigate('/login');
			return;
		}
		const response = await fetch(`${BACKEND_URL}/api/accept_friend_request/${receiver_id}/`, {
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
			setSent(true);
	}

	return (
		<button 
			onClick={sendacceptRequest}
			disabled={sent}
			className="align:center p-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
		>
			{sent ? "Friend request accepted!" : "Accept friend request"}
		</button>
	)
}