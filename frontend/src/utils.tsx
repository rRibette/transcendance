import {useEffect, useState } from 'react';
import {useNavigate} from 'react-router';
import { BACKEND_URL } from './config';


export function logOut() {
	localStorage.clear();
	window.location.href = '/home'
}

export async function refresh() {
	const token = localStorage.getItem('refresh');
	if (!token){
		logOut();
		return (false);
	}
	const response = await fetch (`${BACKEND_URL}/api/auth/refresh/`, {
		method: 'POST',
		credentials: 'omit',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			refresh: token
		}),
	});
	if (response.ok){
		const data = await response.json();
		localStorage.setItem("access", data.access);
		return (true);
	}
	else
		{
			logOut();
			return (false);
	}
}
