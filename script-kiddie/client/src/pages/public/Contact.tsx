import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-[560px] px-6 py-16">
      <h1 className="text-3xl font-semibold text-ink">Contact us</h1>
      <p className="mt-3 text-ink-muted">
        Questions, feedback, or a security report? Reach us directly at{" "}
        <span className="inline-flex items-center gap-1.5 text-ink"><Mail className="h-4 w-4" /> scriptkiddie471@gmail.com</span>,
        or send a message below.
      </p>

      {sent ? (
        <Alert variant="success" className="mt-8">Thanks — we'll get back to you shortly.</Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              required
              rows={5}
              className="w-full rounded-md border border-base-border bg-base-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>
          <Button type="submit">Send message</Button>
        </form>
      )}
    </div>
  );
}
