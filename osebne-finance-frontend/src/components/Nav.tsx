import { Link, useNavigate } from 'react-router-dom';

export default function Nav() {
    const navigate = useNavigate();
    function logout() {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    }

    return (
        <div className="flex gap-3 p-3 border-b border-gray-800">
            <Link to="/dashboard"    className="text-gray-800 no-underline hover:underline">Dashboard</Link>
            <Link to="/transactions" className="text-gray-800 no-underline hover:underline">Transakcije</Link>
            <Link to="/accounts"     className="text-gray-800 no-underline hover:underline">Računi</Link>
            <Link to="/categories"   className="text-gray-800 no-underline hover:underline">Kategorije</Link>
            <Link to="/budgets"      className="text-gray-800 no-underline hover:underline">Proračuni</Link>
            <Link to="/uploads"      className="text-gray-800 no-underline hover:underline">Datoteke</Link>
            <Link to="/converter"    className="text-gray-800 no-underline hover:underline">Pretvornik valut</Link>
            <Link to="/audit-logs"   className="text-gray-800 no-underline hover:underline">Revizijski zapisi</Link>
            <span className="ml-auto">
                <button onClick={logout} className="border border-gray-800 px-3 py-1 rounded hover:bg-gray-100">
                    Odjava
                </button>
            </span>
        </div>
    );
}
