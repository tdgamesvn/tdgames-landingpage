"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { type FormEvent, useState } from "react";

import { AccentHighlight } from "@/components/accent-highlight";

const CONTACT_EMAIL = "hello@tdgames.com";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Full-bleed section art (no overlay on the image). */
const CONTACT_BG_SRC = "https://cdn.tdgamestudio.com/landing/images/bgcontact.png";

export default function ContactShowcaseSection({
  sectionStep = "05",
  /** When true (e.g. /contact), section height fits one viewport under fixed header. */
  fitBelowHeader = false,
  /** Khi nhĂºng cuá»‘i trang dĂ i (vd. /portfolio): khĂ´ng Ă©p full viewport. */
  embedded = false,
}: {
  sectionStep?: string;
  fitBelowHeader?: boolean;
  embedded?: boolean;
}) {
  const [sentHint, setSentHint] = useState(false);
  const reduceMotion = useReducedMotion();

  const listParent = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.08,
      },
    },
  };

  const flyIn = {
    hidden: reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, x: -52, filter: "blur(6px)" },
    show: reduceMotion
      ? {
          opacity: 1,
          transition: { duration: 0.2, ease: EASE_OUT },
        }
      : {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          transition: { duration: 0.58, ease: EASE_OUT },
        },
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const note = (form.elements.namedItem("note") as HTMLTextAreaElement).value;
    const subject = encodeURIComponent(
      `Project inquiry from ${name || "site"}`,
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${note}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSentHint(true);
    window.setTimeout(() => setSentHint(false), 4000);
  }

  const heightClass = embedded
    ? "min-h-0 py-14 md:py-16 lg:py-20"
    : fitBelowHeader
      ? "min-h-[calc(100svh-4.75rem)] md:min-h-[calc(100svh-5rem)]"
      : "min-h-svh";

  return (
    <section
      id="contact"
      className={`relative flex flex-col overflow-hidden border-t border-[#ff8c3a]/15 bg-black text-white ${heightClass}`}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={CONTACT_BG_SRC}
          alt=""
          fill
          className="object-cover object-left"
          sizes="100vw"
          priority={false}
        />
      </div>

      <div
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col justify-center py-10 md:py-12 lg:py-14 ${
          embedded ? "min-h-0" : fitBelowHeader ? "min-h-[inherit]" : "min-h-svh"
        }`}
        style={{ width: "var(--layout-width, 75%)" }}
      >
        <motion.div
          className="w-full max-w-3xl lg:max-w-[46rem] xl:max-w-[52rem]"
          variants={listParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.22, margin: "0px 0px -40px 0px" }}
        >
          <motion.div variants={flyIn} className="mb-7 flex items-center gap-4 md:mb-8">
            <span className="text-base font-black italic tracking-tighter text-[#ffb04a] md:text-lg">{`// ${sectionStep}`}</span>
            <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12 md:w-14" />
            <span className="text-xs font-bold uppercase tracking-[0.32em] text-[#ffcc8e]/85 md:text-sm">
              Let&apos;s work together
            </span>
          </motion.div>

          <motion.div variants={flyIn}>
            <h2
              className="text-4xl font-black uppercase leading-[1.06] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-5xl md:text-[2.75rem] lg:text-6xl lg:leading-[1.05] xl:text-[3.35rem]"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Ready to bring{" "}
              <AccentHighlight>your vision to life?</AccentHighlight>
            </h2>
          </motion.div>
          <motion.p
            variants={flyIn}
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] md:mt-6 md:text-lg lg:text-xl"
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            Tell us about your project and our team will get back to you within
            24 hours.
          </motion.p>

          <motion.form
            variants={flyIn}
            onSubmit={handleSubmit}
            className="mt-9 flex w-full max-w-2xl flex-col gap-5 md:mt-10 lg:max-w-3xl"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <label className="sr-only" htmlFor="contact-name">
                Full name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                placeholder="Full name"
                autoComplete="name"
                className="rounded-xl border border-white/14 bg-[#12131c]/90 px-4 py-4 text-base text-white placeholder:text-white/38 outline-none ring-0 transition-colors focus:border-[#ff8c3a]/45 focus:bg-[#16171f] md:px-5 md:py-[1.125rem] md:text-lg"
              />
              <label className="sr-only" htmlFor="contact-email-field">
                Email
              </label>
              <input
                id="contact-email-field"
                name="email"
                type="email"
                required
                placeholder="Email"
                autoComplete="email"
                className="rounded-xl border border-white/14 bg-[#12131c]/90 px-4 py-4 text-base text-white placeholder:text-white/38 outline-none transition-colors focus:border-[#ff8c3a]/45 focus:bg-[#16171f] md:px-5 md:py-[1.125rem] md:text-lg"
              />
            </div>
            <label className="sr-only" htmlFor="contact-note">
              Message
            </label>
            <textarea
              id="contact-note"
              name="note"
              rows={4}
              placeholder="Write a note..."
              className="resize-y rounded-xl border border-white/14 bg-[#12131c]/90 px-4 py-4 text-base text-white placeholder:text-white/38 outline-none transition-colors focus:border-[#ff8c3a]/45 focus:bg-[#16171f] md:px-5 md:py-[1.125rem] md:text-lg"
            />
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#f59e0b] px-7 py-5 text-base font-black uppercase tracking-[0.12em] text-black shadow-[0_0_28px_rgba(245,158,11,0.35)] transition-[transform,box-shadow] hover:bg-[#fbbf24] hover:shadow-[0_0_36px_rgba(251,191,36,0.45)] active:scale-[0.99] md:text-lg md:tracking-[0.14em]"
              style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}
            >
              Send a message
              <svg
                className="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 17L17 7M17 7H9M17 7v8"
                />
              </svg>
            </button>
            {sentHint ? (
              <p className="text-sm text-[#ffcc8e]/90 md:text-base">
                Opening your email app… If nothing opens, write us at{" "}
                {CONTACT_EMAIL}
              </p>
            ) : null}
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}
