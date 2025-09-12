import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { setToken } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { normalizeUser } from "@/lib/user";

const schema = z.object({
    email: z.string().email("Vnesite veljaven e-poštni naslov"),
    password: z.string().min(6, "Najmanj 6 znakov"),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

    async function onSubmit(data: FormData) {
        setError(null);
        try {
            const r = await api.post("/auth/login", data);
            const token: string | undefined = r.data?.token || r.data?.access_token || r.data?.accessToken;
            if (!token) { setError("Neveljaven odgovor strežnika."); return; }
            setToken(token);
            const me = await api.post("/auth/profile");
            const u = normalizeUser(me.data);
            useAuth.getState().setAuth(u, token);
            navigate("/");
        } catch (e: any) {
            setError(e?.response?.data?.message || "Napačen e-poštni naslov ali geslo.");
        }
    }

    return (
        <div className="auth-wrap">
            <form className="card stack" onSubmit={handleSubmit(onSubmit)}>
                <h2>Prijava</h2>
                {error && <div className="error">{error}</div>}
                <div className="field">
                    <label>E-pošta</label>
                    <input type="email" placeholder="vnesi e-pošto" {...register("email")} />
                    {errors.email && <div className="error">{errors.email.message}</div>}
                </div>
                <div className="field">
                    <label>Geslo</label>
                    <input type="password" placeholder="vnesi geslo" {...register("password")} />
                    {errors.password && <div className="error">{errors.password.message}</div>}
                </div>
                <div className="actions">
                    <button type="submit" disabled={isSubmitting}>Prijava</button>
                    <Link to="/register" className="secondary">Ustvari račun</Link>
                </div>
            </form>
        </div>
    );
}
