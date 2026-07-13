import TopBar from './TopBar';

function Privacy_pol() {
	let token = localStorage.getItem("access");
    let logged = false;
    if (token != null)
        logged = true;
    return (
        <div className='flex flex-col w-dvw h-dvh bg-slate-300 bg-slate-200'>
			<TopBar logged={logged} />
            <div className="min-w-sm flex p-25 flex-col mt-10 gap-5 rounded-4xl items-center">
                <h1>Politique de confidentialité</h1>

                <p><strong>Dernière mise à jour :</strong> 10 juin 2026</p>

                <h2> <strong>Données collectées</strong></h2>

                <p>
                    Lors de la connexion au jeu, nous pouvons enregistrer
                    uniquement les informations suivantes :
                </p>

                <ul>
                    <li>Votre adresse e-mail</li>
                    <li>Votre photo de profil publique</li>
                </ul>

                <p>
                    Nous ne collectons pas de données bancaires, de numéro de
                    téléphone, d'adresse postale ou de données de localisation.
                </p>

                <h2><strong>Utilisation des données</strong></h2>

                <p>
                    Ces informations sont utilisées uniquement pour :
                </p>

                <ul>
                    <li>Créer et gérer votre compte joueur</li>
                    <li>Vous identifier lors de la connexion</li>
                    <li>Afficher votre profil dans le jeu</li>
                </ul>

                <p>
                    Vos données ne sont ni vendues ni utilisées à des fins
                    publicitaires.
                </p>

                <h2><strong>Conservation des données</strong></h2>

                <p>
                    Vos données sont conservées tant que votre compte existe.
                </p>

                <p>
                    Vous pouvez demander la suppression de votre compte à tout
                    moment. Les données associées seront alors supprimées dans
                    les meilleurs délais, sauf obligation légale contraire.
                </p>

                <h2><strong>Sécurité</strong></h2>

                <p>
                    Nous mettons en œuvre des mesures raisonnables pour protéger
                    vos données contre tout accès non autorisé ou toute
                    divulgation accidentelle.
                </p>

                <h2><strong>Vos droits</strong></h2>

                <p>
                    Conformément au RGPD, vous pouvez demander :
                </p>

                <ul>
                    <li>L'accès à vos données personnelles</li>
                    <li>La correction de vos données</li>
                    <li>La suppression de votre compte et de vos données</li>
                </ul>

                <h2><strong>Contact</strong></h2>

                <p>
                    Pour toute question concernant cette politique de
                    confidentialité ou vos données personnelles :
                </p>

                <p>
                    Email : group@transcendence_mail.com
                </p>
            </div>
                {/* <div className="flex flex-col w-full justify-center items-center gap-5">	
					<button className="flex relative bg-amber-400 w-40 h-10 rounded-full active:bg-amber-600 justify-center items-center" onClick={() => navigate("/home")}> Back to main page </button>
				</div> */}
        </div>
    );
}


export default Privacy_pol;
