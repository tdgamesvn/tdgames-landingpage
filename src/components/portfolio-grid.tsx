"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nunito_Sans } from "next/font/google";

const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export type ProjectCard = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slug?: string;
  category?: string;
};

type PortfolioGridProps = {
  projects: ProjectCard[];
};

export default function PortfolioGrid({ projects }: PortfolioGridProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className={`w-full ${nunitoSans.className}`}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project, index) => (
          <article
            key={project.id}
            className={`group relative overflow-hidden rounded-xl bg-white/5 shadow-xl transition-all duration-500 hover:scale-105 ${
              isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
            }`}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/50">
              <Image
                src={project.image}
                alt={project.title || "Project"}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>

            <div className="relative p-4">
              <h3 className="mb-1 text-lg font-bold leading-snug text-white">
                {project.title}
              </h3>
              {project.subtitle && (
                <p className="text-sm text-white/70">{project.subtitle}</p>
              )}

              {project.slug && (
                <Link
                  href={`/portfolio/${project.slug}`}
                  className="absolute inset-0"
                  aria-label={`View ${project.title}`}
                >
                  <span className="sr-only">View project</span>
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-xl text-white/60">No projects found.</p>
        </div>
      )}
    </div>
  );
}
