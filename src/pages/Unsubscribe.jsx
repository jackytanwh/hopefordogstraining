import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function Unsubscribe() {
    const [status, setStatus] = useState("loading"); // loading | success | error | already

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("id");

        if (!id) {
            setStatus("error");
            return;
        }

        base44.functions.invoke("unsubscribeLead", { id })
            .then(() => setStatus("success"))
            .catch(() => setStatus("error"));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-10 max-w-md w-full text-center">
                <img
                    src="https://media.base44.com/images/public/690f36a014bb3e1119479c64/48f54971a_DogLogonew.png"
                    alt="Hopefordogs"
                    className="h-14 w-auto object-contain mx-auto mb-6"
                />

                {status === "loading" && (
                    <>
                        <Loader2 className="w-10 h-10 text-slate-400 animate-spin mx-auto mb-4" />
                        <p className="text-slate-600 text-sm">Processing your request...</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-slate-900 mb-2">You've been unsubscribed</h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            You will no longer receive birthday emails from Hopefordogs Canine Training.
                        </p>
                        <p className="text-slate-400 text-xs mt-4">
                            If this was a mistake, please contact us at{" "}
                            <a href="https://bookings.hopefordogs.sg" className="text-blue-500 underline">
                                bookings.hopefordogs.sg
                            </a>
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            We couldn't process your unsubscribe request. The link may be invalid or already used.
                        </p>
                        <p className="text-slate-400 text-xs mt-4">
                            Please contact us at WhatsApp: +65 8222 8376
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}