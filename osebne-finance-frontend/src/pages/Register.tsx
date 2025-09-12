import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

const schema = z.object({
    firstName: z.string().min(1, "Vnesite ime"),
    lastName: z.string().min(1, "Vnesite priimek"),
    email: z.string().email("Neveljaven e-poštni naslov"),
    password: z.string().min(6, "Najmanj 6 znakov"),
    confirmPassword: z.string().min(6, "Najmanj 6 znakov"),
}).refine((d) => d.password === d.confirmPassword, { message: "Gesli se ne ujemata", path: ["confirmPassword"] });
type FormValues = z.infer<typeof schema>;

export default function Register() {
    const navigate = useNavigate();
    const [err, setErr] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    async function onSubmit(v: FormValues) {
        setErr(null);
        try {
            await api.post("/auth/register", {
                firstName: v.firstName, lastName: v.lastName, email: v.email, password: v.password
            });
            navigate("/login");
        } catch (e: any) {
            setErr(e?.response?.data?.message || "Registracija ni uspela");
        }
    }

    return (
        <div className="auth-wrap">
            <form onSubmit={handleSubmit(onSubmit)} className="card stack">
                <h2>Registracija</h2>
                {err && <div className="error">{err}</div>}
                <div className="field"><label>Ime</label><input type="text" {...register("firstName")} placeholder="Ime" />{errors.firstName && <span className="error">{errors.firstName.message}</span>}</div>
                <div className="field"><label>Priimek</label><input type="text" {...register("lastName")} placeholder="Priimek" />{errors.lastName && <span className="error">{errors.lastName.message}</span>}</div>
                <div className="field"><label>E-pošta</label><input type="email" {...register("email")} placeholder="email@domena.si" />{errors.email && <span className="error">{errors.email.message}</span>}</div>
                <div className="field"><label>Geslo</label><input type="password" {...register("password")} placeholder="••••••••" />{errors.password && <span className="error">{errors.password.message}</span>}</div>
                <div className="field"><label>Potrdi geslo</label><input type="password" {...register("confirmPassword")} placeholder="••••••••" />{errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}</div>
                <div className="actions">
                    <button type="submit" disabled={isSubmitting}>Ustvari račun</button>
                    <Link to="/login" className="link-btn">Nazaj na prijavo</Link>
                </div>
            </form>
        </div>
    );
}
