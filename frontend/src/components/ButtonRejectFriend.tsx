import { useNavigate } from "react-router-dom";
import { BACKEND_URL} from '../config';
import { useState } from "react";

export default function RejectRequest({receiver_id}: {receiver_id: number}) {
	const navigate = useNavigate();
	const [sent, setSent] = useState(false);

	async function rejectRequest(){
		const token = localStorage.getItem('access');
		if (!token) {
			navigate('/login')
			return
		}
		const response = await fetch(`${BACKEND_URL}/api/reject_friend_request/${receiver_id}/`, {
			method: 'POST',
			headers: { 
				'Reject': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});
		if (response.status === 401) {
			localStorage.removeItem('access')
			navigate('/login')
			return
		}
		if (response.ok)
			setSent(true)
	}

	return (
		<button 
			onClick={rejectRequest}
			disabled={sent}
			className="align:center p-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
		>
			{sent ? "Friend request Rejected!" : "Reject friend request"}
		</button>
	)
}