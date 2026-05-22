"use client";

import SiteHeader from "@/components/site-header";
import PortfolioGrid, { ProjectCard } from "@/components/portfolio-grid";
import { Changa_One } from "next/font/google";

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });

// Mock data - in production, fetch from API/database
const MOCK_PROJECTS: ProjectCard[] = [
  {
    id: "1",
    title: "Summoners Era",
    subtitle: "Mobile RPG Game",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/3067c837-e030-403f-b7c5-0c7246bfe15f.png",
    slug: "summoner-era",
    category: "3D Art",
  },
  {
    id: "2",
    title: "Overdrive",
    subtitle: "Racing Game Assets",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
    slug: "overdrive",
    category: "3D Art",
  },
  {
    id: "3",
    title: "Environment Design",
    subtitle: "Fantasy World",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
    category: "Environment",
  },
  {
    id: "4",
    title: "Character Art",
    subtitle: "Hero Designs",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/IMG_4352.png",
    category: "2D Art",
  },
  {
    id: "5",
    title: "Casual Art Props",
    subtitle: "Game Assets",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Casual_Art_Props-1024x683.jpg",
    category: "2D Art",
  },
  {
    id: "6",
    title: "Casual Character",
    subtitle: "Character Design",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Casual_character-1024x683.jpg",
    category: "2D Art",
  },
  {
    id: "7",
    title: "Character Concept",
    subtitle: "Concept Art",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Character_Concept-1024x683.jpg",
    category: "Concept Art",
  },
  {
    id: "8",
    title: "Environment Art",
    subtitle: "Level Design",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Environment_Art-1024x683.jpg",
    category: "Environment",
  },
  {
    id: "9",
    title: "Isometry Art",
    subtitle: "Isometric Design",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Isometry_art-1024x683.jpg",
    category: "2D Art",
  },
  {
    id: "10",
    title: "Slot Art",
    subtitle: "Casino Game",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Slot_Art-1024x683.jpg",
    category: "2D Art",
  },
  {
    id: "11",
    title: "Game Animation",
    subtitle: "Character Animation",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/sinspired/Game_Animation-min-1024x612.jpg",
    category: "Animation",
  },
  {
    id: "12",
    title: "2D Character",
    subtitle: "Character Design",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/sinspired/2D-Art-min-947x1024.jpg",
    category: "2D Art",
  },
  {
    id: "13",
    title: "Character Design 1",
    subtitle: "Hero Concept",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/sinspired/character_1-min-1024x970.jpg",
    category: "Concept Art",
  },
  {
    id: "14",
    title: "Character Design 2",
    subtitle: "Warrior Concept",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/sinspired/character_5-min-1024x970.jpg",
    category: "Concept Art",
  },
  {
    id: "15",
    title: "Character Design 3",
    subtitle: "Mage Concept",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/sinspired/character_6-min-1024x970.jpg",
    category: "Concept Art",
  },
];

export default function PortfolioGridExamplePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black py-24 pt-32">
          <div className="absolute inset-0 bg-[url('https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/bgright.png')] bg-cover bg-center opacity-10" />
          
          <div className="container relative z-10 mx-auto px-4">
            <div className="text-center">
              <h1
                className={`mb-4 text-6xl font-black uppercase leading-tight text-white md:text-7xl lg:text-8xl ${changaOne.className}`}
              >
                OUR{" "}
                <span className="text-amber-500">PROJECTS</span>
              </h1>
              
              <div className="mx-auto mb-6 flex max-w-2xl items-center justify-center gap-4">
                <div className="h-0.5 w-12 bg-amber-500" />
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-500 md:text-base">
                  Browse Our Portfolio
                </p>
                <div className="h-0.5 w-12 bg-amber-500" />
              </div>

              <p className="mx-auto max-w-3xl text-base text-gray-300 md:text-lg">
                Explore our collection of game art projects. From 2D character designs 
                to 3D environments, we bring creative visions to life.
              </p>
            </div>
          </div>
        </section>

        {/* Portfolio Grid Section */}
        <section className="bg-black py-16">
          <div className="container mx-auto px-4">
            <PortfolioGrid projects={MOCK_PROJECTS} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-t from-black via-gray-900 to-black py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
              Ready to Start Your Project?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-gray-300">
              Let&apos;s collaborate and create something amazing together.
            </p>
            <a
              href="#contact"
              className="inline-block rounded-xl border-2 border-amber-500 bg-amber-500 px-8 py-4 text-lg font-bold uppercase tracking-wider text-black transition-all duration-300 hover:bg-transparent hover:text-amber-500"
            >
              Get in Touch
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
