import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

function NavBar({state, setState}) {
	let navigate = useNavigate();
	return (
		<>
			<div className="flex flex-col h-full border-t-50 min-h-100 w-1/10 min-w-20 border-slate-200 bg-slate-200 pt-20 gap-10 shadow-md">
				<button className="
					flex h-20 w-full rounded-full justify-center items-center
					text-slate-700
					transition-all duration-300
					hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800
					active:scale-80" onClick={() => navigate("/game")}>
					Play game
				</button>
				<button className="
					flex h-20 w-full rounded-full justify-center items-center
					text-slate-700
					transition-all duration-300
					hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800
					active:scale-80" onClick={() => navigate("/messages")}>
					Chat
				</button>
				<button className="
					mt-auto flex h-20 w-full rounded-full justify-center items-center
					text-slate-700
					transition-all duration-300
					hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800
					active:scale-80" onClick ={() => navigate("/Privacy_policy")}>
					Privacy Policy
				</button>
				<button className="
					flex h-20 w-full rounded-full justify-center items-center
					text-slate-700
					transition-all duration-300
					hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800
					active:scale-80" onClick ={() => navigate("/TermsOfService")}>
					Terms of Service
				</button>
			</div>
		</>
	)
}

export default NavBar;
