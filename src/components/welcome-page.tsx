import Image from "next/image";
import Link from "next/link";
import {
  PAYMENT_BRANDS,
  PaymentBrandMark,
} from "@/components/payment-brands";
import { ShareLink } from "@/components/share-link";
import { APP_NAME } from "@/lib/config";
import { FEATURES, STEPS, TRUST, USE_CASES } from "@/lib/marketing";
import { PLANS } from "@/lib/plans";
import { memberStartUrl } from "@/lib/public-url";

export function WelcomePage() {
  return (
    <div className="welcome">
      <div className="welcome-landscape" aria-hidden>
        <Image
          src="/welcome/landscape.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="welcome-landscape-img"
        />
        <div className="welcome-landscape-veil" />
      </div>

      <section
        id="hero"
        className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20"
      >
        <div>
          <div className="welcome-mark mb-6 h-16 w-16 overflow-hidden rounded-[var(--radius-lg)] shadow-lg shadow-navy/20">
            <Image
              src="/brand/mark.png"
              alt=""
              width={64}
              height={64}
              className="h-16 w-16"
              priority
            />
          </div>
          <p
            className="welcome-rise text-sm font-medium uppercase tracking-[0.18em] text-azure"
            style={{ animationDelay: "120ms" }}
          >
            Welcome to {APP_NAME}
          </p>
          <h1
            className="welcome-rise mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "240ms" }}
          >
            Your money, finally in one calm place.
          </h1>
          <p
            className="welcome-rise mt-5 max-w-lg text-lg leading-7 text-mute"
            style={{ animationDelay: "380ms" }}
          >
            Record income and expenses in FCFA, watch the month take shape, and
            see savings goals fill in — without a spreadsheet.
          </p>
          <div
            className="welcome-rise mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "520ms" }}
          >
            <Link href="/signup" className="btn-primary px-5 py-2.5">
              Create a free account
            </Link>
            <Link href="/#how-it-works" className="btn-secondary px-5 py-2.5">
              See how it works
            </Link>
          </div>
          <div
            className="welcome-rise mt-8 max-w-lg"
            style={{ animationDelay: "640ms" }}
          >
            <p className="text-sm font-medium">Pay with</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAYMENT_BRANDS.map((item) => (
                <Link
                  key={item.id}
                  href="/checkout"
                  className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2"
                >
                  <PaymentBrandMark id={item.id} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <p
            className="welcome-rise mt-4 text-sm text-mute"
            style={{ animationDelay: "720ms" }}
          >
            Already tracking?{" "}
            <Link href="/login" className="text-azure">
              Log in
            </Link>
          </p>
          <div
            className="welcome-rise mt-8 max-w-lg rounded-2xl border border-line bg-card px-4 py-4"
            style={{ animationDelay: "760ms" }}
          >
            <p className="text-sm font-medium">Send this link</p>
            <p className="mt-1 text-sm leading-6 text-mute">
              Anyone who opens it can create an account and start tracking,
              from any phone.
            </p>
            <ShareLink url={memberStartUrl()} />
          </div>
        </div>

        <div className="welcome-stage welcome-rise" style={{ animationDelay: "360ms" }}>
          <figure className="welcome-stage-main">
            <Image
              src="/welcome/markets.jpg"
              alt="A tablet showing a financial chart beside a market screen"
              fill
              sizes="(max-width: 1024px) 92vw, 420px"
              className="object-cover object-[center_42%]"
            />
            <figcaption className="welcome-stage-label">The month, in one view</figcaption>
          </figure>
          <figure className="welcome-stage-aside">
            <Image
              src="/welcome/ledger.jpg"
              alt="A phone calculator held over household papers"
              fill
              sizes="(max-width: 1024px) 92vw, 360px"
              className="object-cover object-[center_35%]"
            />
            <figcaption className="welcome-stage-label">The everyday numbers</figcaption>
          </figure>
        </div>
      </section>

      <section
        id="features"
        className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-azure">
          What you get
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
          The books, clearly — income, expenses, and goals.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">
          No bank sync, no crypto, no shared wallets. Tempora is for people who
          want a daily money habit they will actually keep.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="card">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-azure">
          How it works
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
          Five steps from signup to a calmer month.
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-azure-strong text-sm text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="trust"
        className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-azure">
          Built to be trusted
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
          Honest numbers. Your records stay yours.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item) => (
            <article key={item.label} className="card">
              <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
              <p className="mt-2 text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-sm text-mute">{item.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="stories"
        className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <p className="text-center text-sm font-medium uppercase tracking-[0.18em] text-azure">
          How people use Tempora
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight">
          A quieter way to save, in real life.
        </h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {USE_CASES.map((story) => (
            <article key={story.src} className="welcome-story">
              <div className="welcome-story-frame">
                <Image
                  src={story.src}
                  alt={story.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: story.focus }}
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{story.title}</h3>
              <p className="mt-2 text-sm italic leading-6 text-ink">“{story.quote}”</p>
              <p className="mt-2 text-sm text-mute">{story.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="cta"
        className="relative mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 pt-8 sm:px-6"
      >
        <div className="card flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Start with Standard. Upgrade when the month gets busy.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
              {PLANS.free.blurb} Premium is {PLANS.premium.priceLabel}/month when
              you need unlimited transactions, goals, and CSV export.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">
              Create a free account
            </Link>
            <Link href="/pricing" className="btn-secondary">
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
