import { useNavigate } from "react-router";
import TopBar from './TopBar';

function TermsOfService() {
    let navigate = useNavigate();
	let token = localStorage.getItem("access");
	let logged = false;
	if (token != null)
		logged = true;
    return (
        <div className='flex flex-col w-dvw h-full bg-slate-300'>
			<TopBar logged={logged} />
            <div className="h-auto min-w-sm flex flex-col gap-5 rounded-4xl mt-10 items-center justify-begin p-25">
                <h1>Conditions Générales d'Utilisation</h1>

                <p><strong>Dernière mise à jour :</strong> 10 juin 2026</p>

                <h2>1. Introduction</h2>

                <p>
                    En accédant à ce jeu Pokémon et en l'utilisant, vous acceptez
                    les présentes Conditions Générales d'Utilisation.
                </p>

                <p>
                    Nous pouvons modifier ces conditions à tout moment afin
                    d'améliorer le service ou de nous conformer aux obligations
                    légales. Les modifications prendront effet dès leur
                    publication sur cette page.
                </p>

                <h2>2. Politique de confidentialité</h2>

                <p>
                    L'utilisation de vos données personnelles est décrite dans notre{" "}
                    <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() => navigate("/privacy_policy")}
                    >
                        Politique de confidentialité
                    </span>.
                </p>

                <p>
                    En utilisant le Service, vous acceptez également cette
                    Politique de Confidentialité.
                </p>

                <h2>3. Comptes utilisateurs</h2>

                <p>
                    L'accès au jeu nécessite la création d'un compte et peut etre faite via un
                    fournisseur d'authentification pris en charge(42, Google).
                </p>

                <p>
                    Vous êtes responsable de l'utilisation de votre compte et
                    des activités réalisées avec celui-ci.
                </p>

                <h2><strong>4. Règles de comportement</strong></h2>

                <p>
                    Afin de garantir une expérience agréable pour tous les
                    joueurs, vous acceptez de :
                </p>

                <ul>
                    <li>Respecter les autres joueurs.</li>
                    <li>Utiliser un langage courtois dans le chat.</li>
                    <li>Ne pas harceler, insulter ou menacer d'autres utilisateurs.</li>
                    <li>Ne pas publier de contenu offensant, discriminatoire ou illégal.</li>
                    <li>Ne pas spammer ou perturber les discussions.</li>
                    <li>Ne pas tenter de tricher, exploiter des bugs ou contourner les règles du jeu.</li>
                </ul>

                <p>
                    Tout comportement inapproprié peut entraîner une suspension
                    temporaire ou définitive du compte.
                </p>

                <h2>5. Propriété intellectuelle</h2>

                <p>
                    Le code, les éléments graphiques, les interfaces et tout
                    contenu créé pour ce projet sont protégés par le droit
                    d'auteur.
                </p>

                <p>
                    Vous ne pouvez pas copier, redistribuer ou exploiter ces
                    éléments sans autorisation préalable.
                </p>

                <p>
                    Pokémon, les noms des Pokémon et les éléments associés
                    appartiennent à leurs propriétaires respectifs.
                </p>

                <h2>6. Paiements et remboursements</h2>

                <p>
                    Le jeu est gratis et le restera.
                </p>

                <h2>7. Limitation de responsabilité</h2>

                <p>
                    Le Service est fourni « en l'état » sans garantie de
                    disponibilité permanente ou d'absence d'erreurs.
                </p>

                <p>
                    Nous ne pourrons être tenus responsables des pertes de
                    données, interruptions de service ou dommages résultant de
                    l'utilisation du jeu.
                </p>

                <h2>8. Résolution des litiges</h2>

                <p>
                    En cas de désaccord concernant l'utilisation du Service,
                    nous vous invitons à nous contacter en priorité afin de
                    rechercher une solution amiable.
                </p>

                <p>
                    À défaut d'accord, le litige sera soumis aux juridictions
                    compétentes conformément à la législation applicable.
                </p>

                <h2>9. Contact</h2>

                <p>
                    Pour toute question concernant ces Conditions Générales
                    d'Utilisation :
                </p>

                <p>
                    Email : group@transcendence_mail.com
                </p>
            </div>
        </div>
    );
}



export default TermsOfService;
