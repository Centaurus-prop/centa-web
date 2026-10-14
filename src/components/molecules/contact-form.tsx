"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ContactFormProps {
  propertyId?: string;
  defaultMessage?: string;
  onSuccess?: () => void;
  idPrefix?: string;
}

interface FieldErrors {
  name?: string;
  contact?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: { name: string; email: string; phone: string; message: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Tu nombre es requerido";
  if (!values.email.trim() && !values.phone.trim()) {
    errors.contact = "Dejanos un email o teléfono";
  }
  if (values.email && !EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Email inválido";
  }
  if (values.phone && values.phone.length > 30) {
    errors.phone = "Teléfono demasiado largo";
  }
  if (values.message.length > 2000) {
    errors.message = "Mensaje demasiado largo";
  }
  return errors;
}

export function ContactForm({
  propertyId,
  defaultMessage,
  onSuccess,
  idPrefix = propertyId ? `property-contact-${propertyId}` : "contact",
}: ContactFormProps) {
  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const phoneId = `${idPrefix}-phone`;
  const messageId = `${idPrefix}-message`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    const validation = validate({ name, email, phone, message });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          propertyId,
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string; ok?: boolean } | null;

      if (!res.ok || !data?.ok) {
        setServerError(data?.error ?? "No pudimos enviar tu consulta. Intentalo más tarde.");
        return;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      onSuccess?.();
    } catch {
      setServerError("Error de conexión. Verificá tu internet e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-centa-green-3/30 bg-centa-green-3/10 p-4 text-sm text-centa-green-1 flex items-start gap-3">
        <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">¡Consulta enviada!</p>
          <p className="text-centa-green-1/80 mt-0.5">
            Un asesor se va a contactar contigo lo antes posible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1">
        <label htmlFor={nameId} className="text-xs font-medium text-centa-black">
          Nombre
        </label>
        <Input
          id={nameId}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          aria-invalid={Boolean(errors.name)}
          required
          className="h-10"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={emailId} className="text-xs font-medium text-centa-black">
            Email
          </label>
          <Input
            id={emailId}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            aria-invalid={Boolean(errors.email)}
            className="h-10"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor={phoneId} className="text-xs font-medium text-centa-black">
            Teléfono
          </label>
          <Input
            id={phoneId}
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 9 11 ..."
            aria-invalid={Boolean(errors.phone)}
            className="h-10"
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>
      {errors.contact && <p className="text-xs text-destructive">{errors.contact}</p>}

      <div className="space-y-1">
        <label htmlFor={messageId} className="text-xs font-medium text-centa-black">
          Mensaje
        </label>
        <textarea
          id={messageId}
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Hola, me interesa esta propiedad..."
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 resize-none"
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-centa-green-1 text-white font-semibold hover:bg-centa-green-2 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0.5 active:shadow-sm transition-all duration-200 h-10 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {loading ? (
          "Enviando..."
        ) : (
          <>
            <Send className="size-4 mr-2" />
            Enviar consulta
          </>
        )}
      </Button>
    </form>
  );
}
