"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type FooterConfig = {
  description1: string;
  description2: string;
  socials: { linkedin: string; facebook: string; instagram: string; behance: string; artstation: string };
  contacts: { address: string; discord: string; email: string };
};

const FOOTER_DEFAULT: FooterConfig = {
  description1:
    "Founded in 2019, TD Games emerged from a shared passion for creating visually stunning game experiences. What started as a small team of artists has grown into a full-service game art studio trusted by developers worldwide.",
  description2:
    "We believe that great art is the foundation of memorable games. Our mission is to help developers bring their creative visions to life with professional-grade assets that enhance gameplay and captivate players.",
  socials: { linkedin: "", facebook: "", instagram: "", behance: "", artstation: "" },
  contacts: {
    address: "505 Minh Khai, Hanoi, Vietnam",
    discord: "https://discord.com",
    email: "contact@tdgames.vn",
  },
};

function ContactIconBox({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ff8c3a]/40 bg-[#ff8c3a]/10 text-[#ff8c3a] shadow-[0_0_20px_rgba(255,140,58,0.12)] transition-colors ${className}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

export default function SiteFooter() {
  const [cfg, setCfg] = useState<FooterConfig>(FOOTER_DEFAULT);

  useEffect(() => {
    fetch("/api/footer")
      .then((r) => r.json())
      .then((d) => {
        if (d.footer && typeof d.footer === "object") {
          setCfg({
            ...FOOTER_DEFAULT,
            ...d.footer,
            socials: { ...FOOTER_DEFAULT.socials, ...d.footer.socials },
            contacts: { ...FOOTER_DEFAULT.contacts, ...d.footer.contacts },
          });
        }
      })
      .catch(() => {/* giữ default */});
  }, []);

  return (
    <motion.footer
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="border-t border-white/10 bg-[#070709] py-16"
    >
      <div
        className="mx-auto"
        style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
      >
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr] lg:gap-x-12 xl:gap-x-16">
          <div>
            <div className="relative h-10 w-[170px]">
              <Image
                src="https://cdn.tdgamestudio.com/landing/logoCompany/logo_td2.png"
                alt="TD Games"
                fill
                className="object-contain"
                sizes="170px"
              />
            </div>
            <div
              className="mt-4 h-[2px] w-20 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,180,0,0) 0%, rgba(255,180,0,1) 22%, rgba(255,140,58,1) 78%, rgba(255,140,58,0) 100%)",
              }}
            />
            <p className="mt-5 text-sm leading-7 text-white/58">
              {cfg.description1}
            </p>
            {cfg.description2 ? (
              <p className="mt-4 text-sm leading-7 text-white/58">
                {cfg.description2}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {[
                {
                  id: "in",
                  label: "LinkedIn",
                  href: cfg.socials.linkedin,
                  icon: (
                    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5C0 2.12 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.1c.53-1 1.84-2.1 3.79-2.1 4.05 0 4.8 2.67 4.8 6.14V23h-4v-7.32c0-1.75-.03-4-2.44-4-2.44 0-2.81 1.9-2.81 3.87V23h-4V8.5z" />
                  ),
                },
                {
                  id: "fb",
                  label: "Facebook",
                  href: cfg.socials.facebook,
                  icon: (
                    <path d="M13.5 24v-8.7h2.9l.4-3.4h-3.3V9.7c0-1 .3-1.7 1.8-1.7h1.6V5c-.3 0-1.5-.1-2.9-.1-2.9 0-4.9 1.8-4.9 5v2.9H6.4v3.4h2.7V24h4.4z" />
                  ),
                },
                {
                  id: "ig",
                  label: "Instagram",
                  href: cfg.socials.instagram,
                  icon: (
                    <>
                      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9z" />
                      <path d="M12 7.3A4.7 4.7 0 1 1 7.3 12 4.7 4.7 0 0 1 12 7.3zm0 2A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3z" />
                      <path d="M17.6 6.2a1.1 1.1 0 1 1-1.1-1.1 1.1 1.1 0 0 1 1.1 1.1z" />
                    </>
                  ),
                },
                {
                  id: "be",
                  label: "Behance",
                  href: cfg.socials.behance,
                  icon: (
                    <>
                      <path d="M10.8 12.1c1.1-.6 1.8-1.7 1.8-3 0-2.4-1.8-3.6-4.3-3.6H2V23h6.6c3 0 4.9-1.3 4.9-4.2 0-1.9-1.1-3.4-2.7-3.9zm-6.5-4h3.8c1.3 0 2 .5 2 1.6 0 1.2-.8 1.7-2.1 1.7H4.3V8.1zm4.2 12.3H4.3v-5.2h4.3c1.6 0 2.4.8 2.4 2.6 0 1.8-.9 2.6-2.5 2.6z" />
                      <path d="M14.6 10.1h6.2V8.3h-6.2v1.8z" />
                      <path d="M18.4 10.9c-3.2 0-5.3 2.3-5.3 6.1 0 3.9 2 6.1 5.4 6.1 2.6 0 4.4-1.4 4.9-3.7h-2.3c-.3 1-1.1 1.6-2.5 1.6-1.7 0-2.7-1.1-2.8-3.1h7.6c.2-3.9-1.7-7-5-7zm2.6 5h-5.2c.2-1.9 1.2-3 2.6-3 1.6 0 2.5 1 2.6 3z" />
                    </>
                  ),
                },
                {
                  id: "as",
                  label: "ArtStation",
                  href: cfg.socials.artstation,
                  icon: (
                    <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728A2.424 2.424 0 0 0 13.564 1.4H9.419L21.598 22.54l1.92-3.325c.378-.637.482-.919.482-1.467zM13.589 9.03l4.941 8.557H8.648z" />
                  ),
                },
              ].map((s) => (
                <a
                  key={s.id}
                  href={s.href || "#"}
                  target={s.href ? "_blank" : undefined}
                  rel={s.href ? "noopener noreferrer" : undefined}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition-colors hover:border-[#ff8c3a]/45 hover:text-white"
                  aria-label={s.label}
                  title={s.label}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                    aria-hidden
                  >
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-8 xl:gap-x-14">
            <div className="min-w-0 sm:max-lg:col-span-2">
              <div
                className="text-sm font-black uppercase tracking-[0.14em] text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Contacts
              </div>
              <ul className="mt-4 space-y-3.5 text-sm text-white/65">
                <li className="flex min-w-0 items-start gap-3">
                  <ContactIconBox>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.85}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </ContactIconBox>
                  <span className="min-w-0 pt-1.5 leading-snug">
                    {cfg.contacts.address}
                  </span>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="group flex min-w-0 items-start gap-3 transition-colors hover:text-white"
                  >
                    <ContactIconBox>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.85}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                        />
                      </svg>
                    </ContactIconBox>
                    <span className="min-w-0 pt-1.5 leading-snug font-medium text-white/75 underline-offset-2 group-hover:text-white group-hover:underline">
                      Contact us
                    </span>
                  </Link>
                </li>
                <li>
                  <a
                    href={cfg.contacts.discord || "https://discord.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-w-0 items-start gap-3 text-white/65 transition-colors hover:text-[#5865F2]"
                  >
                    <ContactIconBox className="group-hover:border-[#5865F2]/45 group-hover:bg-[#5865F2]/12 group-hover:text-[#5865F2] group-hover:shadow-[0_0_20px_rgba(88,101,242,0.2)]">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.078.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.078-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    </ContactIconBox>
                    <span className="min-w-0 pt-1.5 leading-snug underline-offset-2 group-hover:underline">
                      Discord
                    </span>
                  </a>
                </li>
                <li className="min-w-0">
                  <a
                    href={`mailto:${cfg.contacts.email}`}
                    className="group flex min-w-0 items-start gap-3 transition-colors hover:text-white"
                  >
                    <ContactIconBox>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.85}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </ContactIconBox>
                    <span className="pt-1.5 leading-snug underline-offset-2 group-hover:underline">
                      {cfg.contacts.email}
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <div
                className="text-sm font-black uppercase tracking-[0.14em] text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Services
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/55">
                <Link
                  href="/services/2d-art"
                  className="block transition-colors hover:text-white"
                >
                  2D Art
                </Link>
                <Link
                  href="/services/2d-animation"
                  className="block transition-colors hover:text-white"
                >
                  2D Animation
                </Link>
                <Link
                  href="/services/2d-vfx"
                  className="block transition-colors hover:text-white"
                >
                  2D VFX
                </Link>
                <Link
                  href="/contact"
                  className="block transition-colors hover:text-white"
                >
                  Game UI
                </Link>
              </div>
            </div>

            <div className="min-w-0">
              <div
                className="text-sm font-black uppercase tracking-[0.14em] text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Company
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/55">
                <Link
                  href="/"
                  className="block transition-colors hover:text-white"
                >
                  Company
                </Link>
                <Link
                  href="/portfolio"
                  className="block transition-colors hover:text-white"
                >
                  Our projects
                </Link>
                <a
                  href="/#careers"
                  className="block transition-colors hover:text-white"
                >
                  Careers
                </a>
                <a
                  href="/#blog"
                  className="block transition-colors hover:text-white"
                >
                  Blog
                </a>
              </div>
            </div>

            <div className="min-w-0">
              <div
                className="text-sm font-black uppercase tracking-[0.14em] text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Info
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/55">
                {["Privacy policy", "Terms of use", "FAQ", "Glossary"].map(
                  (t) => (
                    <a
                      key={t}
                      href="#"
                      className="block transition-colors hover:text-white"
                    >
                      {t}
                    </a>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
          <div>Â© {new Date().getFullYear()} TD Games. All rights reserved.</div>
          <div className="mt-2 text-[10px] text-white/28">
            Running icon by{" "}
            <a
              href="https://www.flaticon.com/authors/freepik"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white/55"
            >
              Freepik
            </a>{" "}
            from{" "}
            <a
              href="https://www.flaticon.com/free-icons/runner"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white/55"
            >
              Flaticon
            </a>
            .
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
