import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Uploads from './pages/Uploads';
import Transactions from './pages/Transactions';
import TransactionDetails from './pages/TransactionDetails';
import Budgets from './pages/Budgets';
import AuditLogs from './pages/AuditLogs';
import type {ReactElement} from "react";

function Protected({ children }: { children: ReactElement }) {
    return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}
export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/accounts" replace />} />
            <Route path="/accounts" element={<Protected><Accounts /></Protected>} />
            <Route path="/categories" element={<Protected><Categories /></Protected>} />
            <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
            <Route path="/transactions/:id" element={<Protected><TransactionDetails /></Protected>} />
            <Route path="/budgets" element={<Protected><Budgets /></Protected>} />
            <Route path="/uploads" element={<Protected><Uploads /></Protected>} />
            <Route path="/audit-logs" element={<Protected><AuditLogs /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
