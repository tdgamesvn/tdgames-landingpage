"use client";

import { useState, useEffect } from "react";
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

type PortfolioGridApiProps = {
  itemsPerPage?: number;
};

export default function PortfolioGridApi({
  itemsPerPage = 12,
}: PortfolioGridApiProps) {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [total, setTotal] = useState(0);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const params = new URLSearchParams({
          limit: itemsPerPage.toString(),
          offset: offset.toString(),
        });

        if (selectedCategory !== "all") {
          params.append("category", selectedCategory);
        }

        const response = await fetch(`/api/projects?${params}`);
        if (!response.ok) throw new Error("Failed to fetch projects");

        const data = (await response.json()) as { projects: ProjectCard[]; total: number };
        setProjects(data.projects);
        setTotal(data.total);

        // Extract unique categories (only on first load)
        if (categories.length === 1) {
          const categoryList: string[] = data.projects
            .map((p) => p.category)
            .filter((cat): cat is string => typeof cat === "string");
          const uniqueCategories: string[] = ["all", ...Array.from(new Set(categoryList))];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentPage, selectedCategory, itemsPerPage, categories.length]);

  const totalPages = Math.ceil(total / itemsPerPage);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl text-red-400">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border-2 border-amber-500 bg-amber-500 px-6 py-2 text-sm font-semibold text-black transition-all hover:bg-transparent hover:text-amber-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${nunitoSans.className}`}>
      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            disabled={loading}
            className={`rounded-lg px-6 py-2 text-sm font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 ${
              selectedCategory === category
                ? "bg-amber-500 text-black shadow-lg"
                : "border-2 border-white/20 bg-transparent text-white hover:border-amber-500/50"
            }`}
          >
            {category === "all" ? "All Projects" : category}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl bg-white/5"
            >
              <div className="aspect-[4/3] w-full bg-white/10" />
              <div className="p-4">
                <div className="mb-2 h-4 w-20 rounded bg-white/10" />
                <div className="mb-2 h-6 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <article
              key={project.id}
              className="group relative overflow-hidden rounded-xl bg-white/5 shadow-xl transition-all duration-500 hover:scale-105"
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
                {project.category && (
                  <span className="mb-2 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase text-amber-400">
                    {project.category}
                  </span>
                )}
                <h3 className="mb-1 text-lg font-bold text-white">
                  {project.title}
                </h3>
                <p className="text-sm text-white/70">{project.subtitle}</p>

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
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-xl text-white/60">No projects in this category.</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border-2 border-white/20 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const showPage =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1;

              const showEllipsis =
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2);

              if (!showPage && !showEllipsis) return null;

              if (showEllipsis) {
                return (
                  <span
                    key={`ellipsis-${page}`}
                    className="px-2 py-2 text-white/40"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[40px] rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    currentPage === page
                      ? "bg-amber-500 text-black"
                      : "border-2 border-white/20 text-white hover:border-amber-500"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border-2 border-white/20 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Results Info */}
      {!loading && total > 0 && (
        <div className="mt-6 text-center text-sm text-white/60">
          Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
          {Math.min(currentPage * itemsPerPage, total)} of {total} projects
        </div>
      )}
    </div>
  );
}
