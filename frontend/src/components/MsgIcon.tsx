import {useNavigate} from "react-router-dom"
import {useState, useEffect, useRef} from 'react'
import {refresh } from "../utils.tsx";
import Icon from "../assets/message-square-svgrepo-com.svg";

export default function MsgIcon() {
	let navigate = useNavigate();
	return (
		<>
			<div className="flex justify-center items-center">
				<button onClick={() => navigate("/messages")} className="rounded-full w-6 h-6
				transition-all duration-100
				hover:scale-90">
					<img src={Icon} />
				</button>
			</div>
		</>
	);
}
