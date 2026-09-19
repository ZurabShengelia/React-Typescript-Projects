export default function Privacy() {
  return (
    <div className="mx-auto max-w-[820px] px-6 py-16">
      <h1 className="text-3xl font-semibold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated: September 2026</p>

      <div className="prose-section mt-10 space-y-8 text-base leading-relaxed text-ink-muted">
        <section>
          <h2 className="text-lg font-semibold text-ink">1. Information we collect</h2>
          <p className="mt-2">
            When you create an account we collect your name, email address, and a securely hashed
            version of your password. We never store your password in plaintext and never return
            your password hash through any API response.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">2. Assessment data</h2>
          <p className="mt-2">
            When you take a test, we record which test you attempted, your selected answers, your
            score, and timing information. This data powers your dashboard, progress tracking, and
            attempt history, and is only visible to you and, where legally required, our
            administrators.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">3. Technical and log data</h2>
          <p className="mt-2">
            Our servers automatically log request metadata (such as timestamps and IP address) for
            security monitoring, rate limiting, and abuse prevention. This data is retained only as
            long as necessary for those purposes.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">4. Cookies and session handling</h2>
          <p className="mt-2">
            We use HTTP-only cookies to store your authentication session. These cookies are
            required for the application to function and are not used for advertising or
            cross-site tracking.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">5. Why we collect this data</h2>
          <p className="mt-2">
            We collect the minimum data required to operate the platform: authenticate you, score
            your attempts, show your progress over time, and keep the service secure and reliable.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">6. How your data is protected</h2>
          <p className="mt-2">
            Passwords are hashed with bcrypt. Traffic between your browser and our servers is
            encrypted in production. Access to your account data requires a valid authenticated
            session tied to your account; other users cannot access your attempts or profile data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">7. Data retention</h2>
          <p className="mt-2">
            We retain your account and assessment history for as long as your account remains
            active. If you request account deletion, we will process that request and remove or
            anonymize your personal data within a reasonable period, subject to any data we are
            legally required to retain.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">8. Your rights</h2>
          <p className="mt-2">
            You can review and update your profile information from your account settings at any
            time, and you can request deletion of your account from the Account settings page. If
            you have questions about your data, contact us using the details below.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">9. Third-party services</h2>
          <p className="mt-2">
            Script Kiddie does not sell your data or share it with third-party advertisers. Should
            we introduce any third-party processor in the future (for example, an email delivery
            provider for password resets), we will update this policy to reflect that.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">10. Contact</h2>
          <p className="mt-2">
            Questions about this policy can be sent to <span className="text-ink">scriptkiddie471@gmail.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
