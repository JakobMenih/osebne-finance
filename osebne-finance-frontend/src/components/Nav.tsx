import { Link, useNavigate } from 'react-router-dom';

export default function Nav() {
    const navigate = useNavigate();

    function logout() {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    }

    return (
        <div className="flex gap-3 p-3 border-b border-gray-800">
            <Link to="/dashboard" className="text-gray-800 no-underline hover:underline">Dashboard</Link>
            <Link to="/transactions" className="text-gray-800 no-underline hover:underline">Transakcije</Link>
            <Link to="/accounts" className="text-gray-800 no-underline hover:underline">Računi</Link>
            <Link to="/budgets" className="text-gray-800 no-underline hover:underline">Proračuni</Link>
            <span className="ml-auto">
                <button onClick={logout} className="border border-gray-800 px-3 py-1 rounded hover:bg-gray-100">
                    Odjava
                </button>
            </span>
        </div>
    );
}
