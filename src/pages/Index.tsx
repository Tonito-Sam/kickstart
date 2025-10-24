import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, Calendar, MapPin, Users, Sparkles, Clock, Quote, Target, Lightbulb, Wallet, Handshake, CheckSquare, Bot, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import kickstartLogo from "@/assets/kickstart-logo.png";
import kickstartLogoAlt from "@/assets/kickstart-logo-alt.png";
import bgImage from "@/assets/bg.png";
import princeImg from "@/assets/prince-kaguda.jpg";
import petrusImg from "@/assets/Petrus-Jacobs.png";
import tonitoImg from "@/assets/Tonito-Samuel.png";
import lydiaImg from "@/assets/Lydia Tonito-Samuel.png";
import dianaImg from "@/assets/Diana Wallah-TSV.jpeg";
import claudeImg from "@/assets/Claude-Mashego.png";
import ianImg from "@/assets/Dr.Ian Joule.jpeg";
import nexsqImg from "@/assets/nexsq.png";
import g01 from "@/assets/01.png";
import g02 from "@/assets/02.png";
import g03 from "@/assets/03.png";
import g04 from "@/assets/04.png";
import g05 from "@/assets/05.png";
import g1 from "@/assets/1.jpg";
import g2 from "@/assets/2.jpg";
import g3 from "@/assets/3.jpg";
import g4 from "@/assets/4.jpg";
import g5 from "@/assets/5.jpg";
import g06 from "@/assets/6.jpg";
import g07 from "@/assets/7.jpg";
import g08 from "@/assets/8.jpg";
import g09 from "@/assets/9.jpg";
import g10 from "@/assets/10.jpg";
import kickstartPoster from "@/assets/kickstart2026.png";

// Simple inline SVG icons so we don't need extra deps for social buttons
const IconLinkedIn = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.11 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zM8.5 8h3.84v2.18h.05c.54-1 1.86-2.18 3.83-2.18 4.1 0 4.86 2.7 4.86 6.21V24h-4V14.5c0-2.27-.04-5.19-3.17-5.19-3.17 0-3.65 2.48-3.65 5.04V24h-4V8z" />
  </svg>
);

const IconInstagram = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
  </svg>
);

const IconTikTok = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M9 3v10.5A4.5 4.5 0 1 0 13.5 18V8h3V5H9z" />
  </svg>
);

const IconNexsq = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <img src={nexsqImg} alt="Nexsq" className={className + ' rounded-full object-cover'} />
);

// Reusable social button (icon + optional label) with a modern subtle style
const SocialButton = ({ href, title, children }: { href?: string; title: string; children: React.ReactNode }) => {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" title={title}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/6 text-sm text-foreground/90 hover:bg-white/6 transition transform hover:-translate-y-0.5">
      {children}
    </a>
  );
};

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [selectedSpeaker, setSelectedSpeaker] = useState<null | {
    name: string;
    role: string;
    topic?: string;
    blurb?: string;
    featured?: boolean;
    image?: string;
    linkedin?: string;
    instagram?: string;
    tiktok?: string;
    nexsq?: string;
  }>(null);

  const [currentHero, setCurrentHero] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [posterOpen, setPosterOpen] = useState(false);
  const posterModalRef = useRef<HTMLDivElement | null>(null);
  const posterCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentHero((s) => (s + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // keyboard handlers for gallery lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!galleryOpen) return;
      if (e.key === 'Escape') setGalleryOpen(false);
      if (e.key === 'ArrowRight') setGalleryIndex((i) => (i + 1) % galleryImages.length);
      if (e.key === 'ArrowLeft') setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen]);

  // close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSpeaker(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus trap for poster modal
  useEffect(() => {
    if (!posterOpen) return;
    const modal = posterModalRef.current;
    const closeBtn = posterCloseRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // focus the close button
    closeBtn?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && modal) {
        const focusable = modal.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
      if (e.key === 'Escape') {
        setPosterOpen(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      previouslyFocused?.focus();
    };
  }, [posterOpen]);

  // Calendar helpers (Google Calendar link and ICS download)
  const eventTitle = encodeURIComponent('Kickstart 2026 — Goals to Growth');
  const eventDetails = encodeURIComponent('Building systems beyond goals — 10x your bottom line using AI');
  const eventLocation = encodeURIComponent('The Knowledge Base, CNR 131, 33 Grossvenor Rd, Cumberland Ave, Bryanston, Sandton, 2191');
  const start = new Date(Date.UTC(2026, 0, 31, 8, 0, 0)); // Jan 31, 2026 08:00 UTC
  const end = new Date(Date.UTC(2026, 0, 31, 14, 0, 0)); // Jan 31, 2026 14:00 UTC

  const toGCalDate = (d: Date) => {
    return d.toISOString().replace(/[-:]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  };

  const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${eventDetails}&location=${eventLocation}&dates=${toGCalDate(start)}/${toGCalDate(end)}`;

  const downloadICS = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatICSDate = (d: Date) => {
      return d.getUTCFullYear().toString() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
    };

    const uid = `kickstart-${Date.now()}@kickstart.events`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kickstart//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${decodeURIComponent(eventTitle)}`,
      `DESCRIPTION:${decodeURIComponent(eventDetails)}`,
      `LOCATION:${decodeURIComponent(eventLocation)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kickstart-2026.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const speakers = [
  { name: "Prince Kaguda", role: "Principal Engineer, Pryteq", topic: "AI Tools You Can Learn and Use to Optimize Your Business Processes", blurb: "Prince demystifies accessible AI tools and workflows entrepreneurs can use to automate tasks, increase efficiency and boost performance.", image: princeImg, linkedin: "https://www.linkedin.com/in/prince-kaguda", instagram: "https://www.instagram.com/princekaguda", tiktok: "https://www.tiktok.com/@princekaguda", nexsq: "https://nexsq.com/profile/prince" },
  { name: "Dr. Claude Mashego", role: "Medical Doctor | Founder, Young Leaders Network Africa", topic: "Leadership and Systems Thinking", blurb: "Leadership frameworks and systems thinking to prepare emerging leaders for the AI economy.", image: claudeImg, linkedin: "https://www.linkedin.com/in/claude-mashego", instagram: "https://www.instagram.com/claudemashego", tiktok: "https://www.tiktok.com/@claudemashego", nexsq: "https://nexsq.com/profile/claude" },
  { name: "Lydia Tonito-Samuel", role: "Founder & CEO, Amira Luxury Collections | Executive Director, Verax Pty Ltd", topic: "The Business of Creativity", blurb: "How creatives can build scalable income systems around talent and craft sustainable businesses.", image: lydiaImg, linkedin: "https://www.linkedin.com/in/lydia-tonito-samuel", instagram: "https://www.instagram.com/lydiatonito", tiktok: "https://www.tiktok.com/@lydiatonito", nexsq: "https://nexsq.com/profile/lydia" },
  { name: "Petrus Jacobs", role: "Founder Petrus Jacobs Live", topic: "Rebonding in the Age of AI", blurb: "Rebuilding trust, empathy, and human-centered relationships to work with AI-enabled systems.", image: petrusImg, linkedin: "https://www.linkedin.com/in/petrus-jacobs", instagram: "https://www.instagram.com/petrusjacobs", tiktok: "https://www.tiktok.com/@petrusjacobs", nexsq: "https://nexsq.com/profile/petrus" },
  { name: "Diana Wallah-TSV", role: "Founder & Principal Consultant, Mishimi Consulting", topic: "Where Else Is Money Outside Tech & AI", blurb: "Exploring high-growth sectors beyond tech and AI and practical entry strategies.", image: dianaImg, linkedin: "https://www.linkedin.com/in/diana-wallah", instagram: "https://www.instagram.com/dianawallah", tiktok: "https://www.tiktok.com/@dianawallah", nexsq: "https://nexsq.com/profile/diana" },
  { name: "Dr. Ian Joule", role: "Executive Director, Diamond Information Systems", topic: "The Science of Scale", blurb: "Using data analytics and decision intelligence to drive measurable growth and profitability.", image: ianImg, linkedin: "https://www.linkedin.com/in/ian-joule", instagram: "https://www.instagram.com/ianjoule", tiktok: "https://www.tiktok.com/@ianjoule", nexsq: "https://nexsq.com/profile/ian" },
  { name: "Tonito Samuel", role: "Convener, Kickstart Conference & Founder, Nexsq", topic: "Systems & Structures", blurb: "Practical frameworks for turning goals into repeatable, systemized outcomes." , featured: true, image: tonitoImg, linkedin: "https://www.linkedin.com/in/tonito-samuel", instagram: "https://www.instagram.com/tonitosamuel", tiktok: "https://www.tiktok.com/@tonitosamuel", nexsq: "https://nexsq.com/profile/tonito"},
  { name: "To Be Announced", role: "TBA", topic: "The Power Network", blurb: "Building influential networks that fund and fuel your vision.", image: '' , linkedin: "https://www.linkedin.com/company/kickstart-events", instagram: "https://www.instagram.com/kickstart.events", tiktok: "https://www.tiktok.com/@kickstart.events", nexsq: "https://nexsq.com/profile/kickstart"},
  ];

  const featuredSpeaker = speakers.find(s => s.featured) || null;
  const otherSpeakers = speakers.filter(s => !s.featured);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Account for the fixed header so the section isn't hidden behind it.
      const header = document.querySelector('header');
      const headerHeight = header ? (header as HTMLElement).offsetHeight : 80;
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop - headerHeight - 12; // small gap

      window.scrollTo({ top: targetY, behavior: 'smooth' });
      // update the hash so link is shareable
      try { history.replaceState(null, '', `#${id}`); } catch (e) { /* ignore */ }
      setIsMenuOpen(false);
    }
  };

  const goToAgenda = () => {
    // prefer the schedule section; fallback to about if not present
    const target = document.getElementById('schedule') ? 'schedule' : 'about';
    scrollToSection(target);
  };

  const heroSlides = [
    {
      title: "Goals to Growth",
      subtitle: "Success is built on structure and systems",
      description: "A Business and Career Workshop",
      badge: "2026 Edition",
      showLogo: true
    },


     {
      title: "10x Your Bottom Line with AI",
      subtitle: "Disrupt quicker, easier and cheaper",
      description: "Everything you need to know about leveraging AI for exponential growth",
      badge: "2026 Edition",
      showLogo: true
    },
    {
      title: "Your Mindset Rules Your Life",
      subtitle: "Everything starts with the right mindset",
      description: "Master the art of turning goals into measurable results",
      badge: "Power of Collaborative Relationships",
      showLogo: false
    },
    {
      title: "The Future is Now",
      subtitle: "AI-Powered Growth Strategies",
      description: "Learn how to leverage AI for exponential business growth",
      badge: "Network & Learn",
      showLogo: false
    }
  ];
  
  // gallery image list (01 - 10)
  const galleryImages = [
    g01, g02, g03, g04, g05,
    g1, g2, g3, g4, g5,
    g06, g07, g08, g09, g10,
  ];

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const prevGallery = () => setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const nextGallery = () => setGalleryIndex((i) => (i + 1) % galleryImages.length);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 320ms ease; } .animate-fade-in-fast { animation: fadeIn 200ms ease; }`}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center">
              <img src={kickstartLogo} alt="Kickstart" className="h-14" />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('about')} className="text-white hover:text-accent transition-colors font-medium">About</button>
              <button onClick={() => scrollToSection('speakers')} className="text-white hover:text-accent transition-colors font-medium">Speakers</button>
              <button onClick={() => scrollToSection('schedule')} className="text-white hover:text-accent transition-colors font-medium">Schedules</button>
              <button onClick={() => scrollToSection('gallery')} className="text-white hover:text-accent transition-colors font-medium">Gallery</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-white hover:text-accent transition-colors font-medium">Testimonials</button>
              <Link to="/register">
                <Button className="bg-accent hover:bg-accent/90">Book Ticket</Button>
              </Link>
            </nav>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
              {isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md rounded-lg mt-2 mx-4">
            <nav className="px-4 py-4 flex flex-col gap-4">
              <button onClick={() => { scrollToSection('about'); setIsMenuOpen(false); }} className="text-foreground/80 hover:text-primary transition-colors font-medium text-left py-2">About</button>
              <button onClick={() => { scrollToSection('speakers'); setIsMenuOpen(false); }} className="text-foreground/80 hover:text-primary transition-colors font-medium text-left py-2">Speakers</button>
              <button onClick={() => { scrollToSection('schedule'); setIsMenuOpen(false); }} className="text-foreground/80 hover:text-primary transition-colors font-medium text-left py-2">Schedules</button>
              <button onClick={() => { scrollToSection('gallery'); setIsMenuOpen(false); }} className="text-foreground/80 hover:text-primary transition-colors font-medium text-left py-2">Gallery</button>
              <button onClick={() => { scrollToSection('testimonials'); setIsMenuOpen(false); }} className="text-foreground/80 hover:text-primary transition-colors font-medium text-left py-2">Testimonials</button>
              <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-accent hover:bg-accent/90">Book Ticket</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

  {/* Hero (fade-in/out) */}
  <section className="relative overflow-hidden">{/* header overlays hero */}
        <div className="relative w-full min-h-[600px] md:min-h-[700px]">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentHero ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              aria-hidden={index === currentHero ? 'false' : 'true'}
            >
              <div className="relative min-h-[600px] md:min-h-[700px] flex items-center">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})`, opacity: 0.26, filter: 'brightness(0.9) contrast(0.95)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-mid))] to-[hsl(var(--gradient-end))] mix-blend-overlay" style={{ opacity: 0.5 }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.06),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.04),transparent_50%)]" />

                <div className="container mx-auto px-4 relative z-20">
                  <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-white">{slide.badge}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight drop-shadow-2xl">
                      {slide.title}
                    </h1>

                    <p className="text-xl md:text-3xl font-semibold text-white/95 drop-shadow-lg max-w-3xl mx-auto">
                      {slide.subtitle}
                    </p>

                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto drop-shadow-md">
                      {slide.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                      <Link to="/register">
                        <Button size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 group shadow-lg">
                          Get Your Free Ticket
                          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                        View Agenda
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Poster Lightbox Modal */}
      {posterOpen && (
        <div role="dialog" aria-modal="true" aria-label="Kickstart 2026 poster" className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setPosterOpen(false)}>
          <div ref={posterModalRef} className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button ref={posterCloseRef} onClick={() => setPosterOpen(false)} className="absolute top-2 right-2 z-50 p-2 rounded-md bg-white/6 hover:bg-white/8">Close</button>
            <div className="bg-black rounded-md overflow-hidden animate-fade-in">
              <img src={kickstartPoster} alt="Kickstart 2026 poster enlarged" className="w-full h-[80vh] object-contain bg-black" />
            </div>
          </div>
        </div>
      )}

          {/* CTA Section (Poster + Synopsis) - moved directly under Hero */}
          <section className="w-full mt-2 md:mt-4 py-6 bg-gradient-to-br from-primary/8 via-secondary/6 to-accent/6">
            <div className="max-w-7xl mx-auto px-4">
              <div className="w-full bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl overflow-hidden border flex flex-col md:flex-row items-stretch">
                  <div className="w-full md:w-1/3 flex-shrink-0">
                    <button onClick={() => setPosterOpen(true)} aria-label="Open poster" className="relative w-full h-full block overflow-hidden transform transition-transform hover:scale-105 focus:outline-none">
                      <img src={kickstartPoster} alt="Kickstart 2026 poster — Goals to Growth: Building systems beyond goals and 10x your bottom line using AI" className="w-full h-full shadow-lg object-cover rounded-none block" />
                      {/* poster (click to enlarge) - badges removed per request */}
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col justify-center text-center md:text-left p-4 md:p-6">
               
                   <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Goals to Growth - 2026
              </h2>
                  <p className="text-lg text-muted-foreground mt-3 max-w-3xl">
                    Building systems beyond goals — learn how to design repeatable business systems and leverage AI to 10x your bottom line. Join keynote talks, hands-on sessions, and focused networking designed to turn ideas into reliable, revenue-driving systems.
                  </p>

                  <div className="mt-6 flex justify-end">
                    <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
                      <Link to="/register">
                        <Button size="lg" className="text-lg px-8 bg-accent">Register Now - It's Free!</Button>
                      </Link>
                      <Button size="lg" variant="outline" className="text-lg px-8" onClick={goToAgenda}>View Agenda</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

      {/* Event Details */}
  <section className="py-12 md:py-16 mt-6">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card border rounded-lg p-6 text-center hover-scale">
              <a href={googleCalendarUrl} target="_blank" rel="noreferrer" className="inline-flex flex-col items-center" aria-label="Add event date to Google Calendar">
                <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Date</h3>
                <p className="text-muted-foreground font-medium">January 31, 2026</p>
                <p className="text-sm text-muted-foreground">Last Saturday of January</p>
                <span className="mt-3 inline-block px-3 py-1 rounded-full bg-primary text-white text-sm font-medium">Add to Calendar</span>
              </a>
            </div>

            <div className="bg-card border rounded-lg p-6 text-center hover-scale">
              <div className="inline-flex flex-col items-center">
                <button onClick={downloadICS} className="inline-flex flex-col items-center" aria-label="Download event to calendar">
                  <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Time</h3>
                  <p className="text-muted-foreground font-medium">8:00 AM - 2:00 PM</p>
                  <p className="text-sm text-muted-foreground">Please arrive 15 minutes early for check-in</p>
                </button>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-8 text-center hover-scale">
              <MapPin className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Venue</h3>
              <p className="text-muted-foreground font-medium">The Knowledge Base</p>
              <p className="text-sm text-muted-foreground">CNR 131, 33 Grossvenor Rd</p>
              <p className="text-sm text-muted-foreground">Cumberland Ave, Bryanston</p>
              <p className="text-sm text-muted-foreground">Sandton, 2191</p>
            </div>
          </div>
        </div>
      </section>

      {/* Speakers Carousel Section */}
      <section id="speakers" className="py-24 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Meet Our Experts</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Featured Speakers 2026
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Learn from industry leaders and innovators shaping the future of business
              </p>
            </div>

            <Carousel
              opts={{ loop: true, align: "start" }}
              plugins={[Autoplay({ delay: 3000 })]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {[
                  { 
                    name: "Tonito Samuel", 
                    role: "Convener, Kickstart Conference & Founder, Nexsq",
                    featured: true,
                    quote: "Systems and Structures That Make Goals Achievable and Attainable",
                    image: tonitoImg,
                  },
                  { 
                    name: "Dr. Claude Mashego", 
                    role: "Medical Doctor | Founder, Young Leaders Network Africa",
                    quote: "Leadership and systems thinking to prepare Africa's next generation for the AI economy",
                    image: claudeImg,
                  },
                  { 
                    name: "Diana Wallah-TSV", 
                    role: "Founder & Principal Consultant, Mishimi Consulting",
                    quote: "Where else is money outside tech and AI in the future? Opportunities in emerging sectors",
                    image: dianaImg,
                  },
                  { 
                    name: "Lydia Tonito-Samuel", 
                    role: "Founder & CEO, Amira Luxury Collections | Executive Director, Verax Pty Ltd",
                    quote: "The Business of Creativity — building sustainable income systems around your talent",
                    image: lydiaImg,
                  },
                  { 
                    name: "Prince Kaguda", 
                    role: "Principal Engineer, Pryteq",
                    quote: "AI tools you can learn and use to optimize business processes and boost performance",
                    image: princeImg,
                  },
                  { 
                    name: "Dr. Ian Joule", 
                    role: "Executive Director, Diamond Information Systems",
                    quote: "The Science of Scale — using data analytics to 10x your bottom line",
                    image: ianImg,
                  },
                  { 
                    name: "Petrus Jacobs", 
                    role: "Founder Petrus Jacobs Live",
                    quote: "Rebonding in the Age of AI — building human-centered relationships and their importance",
                    image: petrusImg,
                  },
                  { 
                    name: "To Be Announced",
                    role: "TBA",
                    quote: "The Power Network — building relationships that fund and fuel your vision",
                    image: ''
                  },
                ].map((speaker, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="h-full">
                      <div className={`group bg-card border rounded-2xl p-8 h-full hover-scale transition-all ${
                        speaker.featured ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5' : ''
                      }`}>
                        <div className="flex flex-col h-full space-y-6">
                          <div className={`w-24 h-24 rounded-full mx-auto overflow-hidden shadow-lg group-hover:scale-110 transition-transform ${
                            speaker.featured ? 'w-28 h-28' : ''
                          }`}>
                            {speaker.image ? (
                              <img src={speaker.image} alt={`${speaker.name} photo`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-3xl font-bold text-white">
                                {speaker.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>

                          <div className="text-center flex-1 space-y-3">
                            <h3 className={`font-bold ${speaker.featured ? 'text-2xl' : 'text-xl'}`}>
                              <span className="whitespace-nowrap">{speaker.name}</span>
                            </h3>
                            <p className="text-primary font-semibold">{speaker.role}</p>

                            <div className="pt-4 border-t">
                              <Quote className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground italic">
                                "{speaker.quote}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold">About Kickstart Events</h2>
                  <p className="text-xl text-muted-foreground">
                    Personal & Business Goals Year Planner & Strategic Execution Workshop
                  </p>
                </div>
                
                <div className="prose prose-lg max-w-none text-foreground/80 space-y-6">
                  <p className="text-lg leading-relaxed">
                    KICKSTART is an annual event targeted at individuals and businesses who want to increase 
                    personal and business productivity, realign personal and business goals on tailor-made 
                    strategies/models for starting and sustaining good and great ventures on a refreshed 
                    frame of mind engineered to spark up the right atmosphere for achieving, attaining and 
                    accomplishing the set goals for the new year.
                  </p>
                  
                  <p className="text-lg leading-relaxed">
                    Since 2020, we have been bringing together entrepreneurs, innovators, and business leaders 
                    to explore cutting-edge strategies that drive exponential growth. Our 2026 edition focuses 
                    on the transformative power of AI and how businesses can leverage intelligent systems to 
                    achieve unprecedented results.
                  </p>
                </div>
              </TabsContent>

              {/* Speakers Tab */}
              <TabsContent value="speakers" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold">Our Expert Speakers</h2>
                  <p className="text-xl text-muted-foreground">
                    Learn from industry leaders and innovators
                  </p>
                </div>

                <div>
                  {/* Featured speaker hero */}
                  {featuredSpeaker && (
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 border mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                      <div className="w-40 h-40 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                        {featuredSpeaker.image ? (
                          // eslint-disable-next-line jsx-a11y/img-redundant-alt
                          <img src={featuredSpeaker.image} alt={`${featuredSpeaker.name} photo`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-4xl">{featuredSpeaker.name.split(' ').map(n => n[0]).join('')}</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div>
                          <h3 className="font-bold text-2xl"><span className="whitespace-nowrap">{featuredSpeaker.name}</span></h3>
                          <p className="text-sm text-muted-foreground mt-1">{featuredSpeaker.role}</p>

                          <div className="mt-3 flex items-center gap-2">
                            <SocialButton href={featuredSpeaker.linkedin} title="LinkedIn"><IconLinkedIn /></SocialButton>
                            <SocialButton href={featuredSpeaker.instagram} title="Instagram"><IconInstagram /></SocialButton>
                            <SocialButton href={featuredSpeaker.tiktok} title="TikTok"><IconTikTok /></SocialButton>
                            <SocialButton href={featuredSpeaker.nexsq} title="Nexsq"><IconNexsq /></SocialButton>
                          </div>

                          <p className="text-lg font-semibold mt-4">{featuredSpeaker.topic}</p>
                        </div>

                        <p className="mt-4 text-foreground/80">{featuredSpeaker.blurb}</p>

                        <div className="mt-6">
                          <button onClick={() => setSelectedSpeaker({ ...featuredSpeaker })} className="w-full md:w-auto px-5 py-3 bg-accent text-white rounded-full font-semibold">Connect & Reserve</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modern speaker cards grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherSpeakers.map((s, i) => (
                      <div key={i} className="bg-card border rounded-2xl p-6 hover:shadow-xl transition-transform">
                        {/* Use a two-column grid: auto column for image, 1fr for meta. Topic + blurb span both columns so they start under the image's left edge */}
                        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
                          <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden flex-shrink-0 shadow-md mx-auto md:mx-0">
                            {s.image ? (
                              // eslint-disable-next-line jsx-a11y/img-redundant-alt
                              <img src={s.image} alt={`${s.name} photo`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                                {s.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col text-center md:text-left">
                            <div>
                              <h4 className="font-bold text-lg"><span className="whitespace-nowrap">{s.name}</span></h4>
                              <p className="text-sm text-muted-foreground mt-1 ml-20 md:ml-0">{s.role}</p>

                              <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                                <SocialButton href={s.linkedin} title="LinkedIn"><IconLinkedIn /></SocialButton>
                                <SocialButton href={s.instagram} title="Instagram"><IconInstagram /></SocialButton>
                                <SocialButton href={s.tiktok} title="TikTok"><IconTikTok /></SocialButton>
                              </div>
                            </div>

                            <div className="mt-3">
                              <button onClick={() => setSelectedSpeaker({ ...s })} className="w-full md:w-auto px-4 py-2 bg-accent text-white rounded-md">Connect</button>
                            </div>
                          </div>

                          {/* Topic and blurb start under the image (span both columns) */}
                          <div className="col-span-2 mt-4">
                            <p className="text-foreground/80 line-clamp-4">{s.blurb}</p>

                            <div className="mt-3">
                              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-sm font-medium">{s.topic}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Speaker details modal */}
                  {selectedSpeaker && (
                    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                      <div className="relative w-full max-w-3xl bg-transparent rounded-xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[80vh]">
                        {/* Image / visual */}
                        <div className="w-full md:w-1/2 h-56 md:h-auto bg-cover bg-center relative" style={{ backgroundImage: `url(${selectedSpeaker.image || bgImage})` }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="w-full md:w-1/2 bg-card p-6 md:p-10 overflow-auto relative">
                          <button onClick={() => setSelectedSpeaker(null)} className="absolute top-3 right-3 p-2 rounded-md bg-white/6 hover:bg-white/8 z-10">
                            <X className="w-5 h-5" />
                          </button>

                          <div className="pt-2">
                            <h2 className="text-2xl md:text-3xl font-bold"><span className="whitespace-nowrap">{selectedSpeaker.name}</span></h2>
                            <p className="text-muted-foreground mt-1">{selectedSpeaker.role}</p>
                          </div>

                          <p className="mt-4 text-lg font-semibold">{selectedSpeaker.topic}</p>
                          <p className="mt-4 text-foreground/80">{selectedSpeaker.blurb}</p>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <SocialButton href={selectedSpeaker.linkedin} title="LinkedIn"><IconLinkedIn /></SocialButton>
                            <SocialButton href={selectedSpeaker.instagram} title="Instagram"><IconInstagram /></SocialButton>
                            <SocialButton href={selectedSpeaker.tiktok} title="TikTok"><IconTikTok /></SocialButton>
                            <SocialButton href={selectedSpeaker.nexsq} title="Nexsq"><IconNexsq /></SocialButton>
                          </div>

                          <div className="mt-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                            <button onClick={() => { /* reserve action */ }} className="w-full md:w-auto px-5 py-3 bg-accent text-white rounded-md text-lg font-semibold">Reserve 1:1</button>
                            <a href="/register" className="w-full md:w-auto px-5 py-3 border rounded-md text-lg text-center">Register</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent id="schedule" value="schedule" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold">Event Schedule</h2>
                  <p className="text-xl text-muted-foreground">
                    January 31, 2026 • 8:00 AM - 2:00 PM
                  </p>
                  <p className="text-sm text-muted-foreground">Theme: Building Systems Beyond Goals — 10x Your Bottom Line Using AI</p>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                  {[
                    { time: "8:00 AM - 8:30 AM", title: "Registration & Networking", description: "Check-in, collect your materials, and connect with fellow attendees" },
                      { time: "8:30 AM - 8:40 AM", title: "Opening Speech", description: "Welcome & theme framing by Tonito Samuel — 10 minutes: Building Systems Beyond Goals" },
                      { time: "8:40 AM - 9:20 AM", title: "Prince Kaguda — AI Tools You Can Use", description: "Practical, accessible AI tools and workflows entrepreneurs can use to automate tasks and scale operations (40 minutes)" },
                      { time: "9:20 AM - 10:00 AM", title: "Dr. Claude Mashego — Leadership & Systems Thinking", description: "Preparing Africa's next generation for the AI economy through leadership and systems approaches (40 minutes)" },
                      { time: "10:00 AM - 10:07 AM", title: "Movement Therapy / Networking Break", description: "Short break to stretch, network, or join AI collaboration tables (7 minutes)" },
                      { time: "10:07 AM - 10:47 AM", title: "Lydia Tonito-Samuel — The Business of Creativity", description: "How to build sustainable income systems around creative talent and scale creative ventures (40 minutes)" },
                      { time: "10:47 AM - 11:27 AM", title: "Petrus Jacobs — Rebonding in the Age of AI", description: "Human-centered relationships and rebuilding trust to work alongside AI (40 minutes)" },
                      { time: "11:27 AM - 11:34 AM", title: "Movement Therapy / Networking Break", description: "Recharge and connect (7 minutes)" },
                      { time: "11:34 AM - 12:14 PM", title: "Diana Wallah-TSV — Where Else Is Money Outside Tech & AI", description: "High-growth sectors beyond tech and AI: sustainability, creative economies, and emerging African markets (40 minutes)" },
                      { time: "12:14 PM - 12:54 PM", title: "Dr. Ian Joule — The Science of Scale", description: "Using data analytics and intelligence to scale operations and 10x your bottom line (40 minutes)" },
                      { time: "12:54 PM - 1:01 PM", title: "Movement Therapy / Networking Break", description: "Short movement or networking break (7 minutes)" },
                      { time: "1:01 PM - 1:41 PM", title: "Tonito Samuel — Systems & Structures That Make Goals Achievable", description: "Practical frameworks and systems to turn goals into repeatable outcomes (40 minutes)" },
                      { time: "1:41 PM - 2:21 PM", title: "To Be Announced — The Power Network", description: "Building relationships that fund and fuel your vision (40 minutes)" },
                      { time: "2:21 PM - 2:51 PM", title: "Panel Discussion: The Marketplace of the Future", description: "Speakers discuss systems, AI adoption, funding and scaling — audience Q&A (30 minutes)" },
                      { time: "2:51 PM - 3:00 PM", title: "Closing Remarks & Next Steps", description: "Final thoughts, call-to-action, and sign-ups for post-event micro-sessions" },
                  ].map((item, index) => (
                    <div key={index} className="bg-card border rounded-lg p-6 hover-scale flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                          <Clock className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-primary mb-1">{item.time}</div>
                        <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

               
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section id="gallery" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Event Highlights
              </h2>
              <p className="text-xl text-muted-foreground">Theme: Goals to Growth — Build Systems that 10x Your Bottom Line Using AI</p>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
              <div className="prose prose-lg text-foreground/90 mx-auto">
                <p>
                  Kickstart Conference 2026 is a high-impact business and career development workshop designed to help professionals, entrepreneurs, and creatives move beyond short-term goals into building sustainable systems for growth, profitability, and impact.
                </p>
                <p>
                  This year’s edition explores how artificial intelligence, data analytics, creativity, and leadership intersect to create the next generation of business excellence. Through keynote talks, strategy sessions, and networking opportunities, attendees will gain practical insights, AI-driven tools, and system-thinking frameworks to 10x their results in 2026 and beyond.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-card border rounded-xl p-8 hover-scale group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Transformative Keynotes</h3>
                  <p className="text-muted-foreground mb-3">Thought leaders share real-world strategies for scaling businesses, mastering systems, and leveraging AI.</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Frameworks for system design and operational scaling</li>
                    <li>Case studies on AI-driven revenue growth</li>
                    <li>Actionable next steps to implement within 90 days</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-xl p-8 hover-scale group">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Hands-On Insights</h3>
                  <p className="text-muted-foreground mb-3">Learn practical AI tools and data analytics techniques that optimize business performance and decision-making.</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Live tool demos and downloadable cheat-sheets</li>
                    <li>Workflows to automate common business tasks</li>
                    <li>Data-driven decision templates for faster outcomes</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-xl p-8 hover-scale group">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Creative Innovation</h3>
                  <p className="text-muted-foreground mb-3">Discover how to turn talent and creativity into structured, income-generating enterprises.</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Blueprints for monetizing creative skills</li>
                    <li>Systems to scale creative teams and outputs</li>
                    <li>Branding and productization checklists</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-xl p-8 hover-scale group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Leadership for the Future</h3>
                  <p className="text-muted-foreground mb-3">Gain frameworks for building adaptable, values-driven leadership in the AI economy.</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>People-first systems for high-performing teams</li>
                    <li>Decision-making models under uncertainty</li>
                    <li>Leadership playbooks for rapid adaptation</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-xl p-8 hover-scale group">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Wealth Pathways Beyond Tech</h3>
                  <p className="text-muted-foreground mb-3">Explore profitable opportunities in emerging industries, creative economies, and sustainability.</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Sector primers and opportunity maps</li>
                    <li>Investor signal checklists and go-to-market tips</li>
                    <li>Paths to diversify revenue beyond core tech</li>
                  </ul>
                </div>

                <div className="bg-card border rounded-xl p-8 hover-scale group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Handshake className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Power Networking</h3>
                  <p className="text-muted-foreground mb-3">Connect with investors, mentors, and decision-makers who can help fund and fuel your next big move.</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Structured networking rounds and investor tables</li>
                    <li>Pitch and feedback clinics</li>
                    <li>Follow-up playbooks to convert connections into deals</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-8 border">
            {/* Gallery lightbox modal */}
            {galleryOpen && (
              <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
                <div className="relative max-w-5xl w-full">
                  <button onClick={() => setGalleryOpen(false)} className="absolute top-2 right-2 z-50 p-2 rounded-md bg-white/6 hover:bg-white/8">Close</button>
                  <button onClick={prevGallery} className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-md bg-white/6 hover:bg-white/8">Prev</button>
                  <button onClick={nextGallery} className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-md bg-white/6 hover:bg-white/8">Next</button>

                  <div className="bg-black rounded-md overflow-hidden">
                    <img src={galleryImages[galleryIndex]} alt={`Gallery ${galleryIndex + 1}`} className="w-full h-[70vh] object-contain bg-black" />
                  </div>
                </div>
              </div>
            )}
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Who Should Attend</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-muted-foreground">
                  <div>• Business Owners & CEOs</div>
                  <div>• Entrepreneurs & Startups</div>
                  <div>• Career Professionals</div>
                  <div>• Team Leaders & Managers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {galleryOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full">
            <button onClick={() => setGalleryOpen(false)} className="absolute top-2 right-2 z-50 p-2 rounded-md bg-white/6 hover:bg-white/8">Close</button>
            <button onClick={prevGallery} className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-md bg-white/6 hover:bg-white/8">Prev</button>
            <button onClick={nextGallery} className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-md bg-white/6 hover:bg-white/8">Next</button>

            <div className="bg-black rounded-md overflow-hidden">
              <img src={galleryImages[galleryIndex]} alt={`Gallery ${galleryIndex + 1}`} className="w-full h-[70vh] object-contain bg-black" />
            </div>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Attendees Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from past participants who transformed their business and career through Kickstart
            </p>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {[
                {
                  name: "Sarah Johnson",
                  role: "CEO, TechStart",
                  content: "Kickstart 2025 was a game-changer for my business. The AI integration workshop alone helped us increase efficiency by 300%.",
                },
                {
                  name: "Michael Chen",
                  role: "Entrepreneur",
                  content: "The business simulation exercises provided practical insights I could implement immediately. Highly recommend!",
                },
                {
                  name: "Amara Nkosi",
                  role: "Marketing Director",
                  content: "The networking opportunities and relationship management sessions opened doors I never knew existed.",
                },
                {
                  name: "David Williams",
                  role: "Financial Advisor",
                  content: "The funding and money management session gave me the confidence to secure investment for my startup.",
                },
              ].map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-6 bg-card rounded-xl border h-full">
                    <div className="flex flex-col gap-4">
                      <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>
      </section>

      {/* CTA Section with Poster + Synopsis */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-6 md:p-10 border flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/3 flex-shrink-0">
              <img src={kickstartPoster} alt="Kickstart 2026 Poster" className="w-full shadow-lg object-cover rounded-none" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold">Goals to Growth — 2026</h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl">
                Building systems beyond goals — learn how to design repeatable business systems and leverage AI to 10x your bottom line. Join keynote talks, hands-on sessions, and networking tables designed to turn ideas into systems that scale.
              </p>

              <div className="mt-6 flex justify-end">
                <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
                  <Link to="/register">
                    <Button size="lg" className="text-lg px-8 bg-accent">Register Now - It's Free!</Button>
                  </Link>
                  <Button size="lg" variant="outline" className="text-lg px-8" onClick={goToAgenda}>View Agenda</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Gallery Section: Snapshots of past event */}
      <section id="gallery" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Snapshots of past event</h2>
              <p className="text-xl text-muted-foreground">Moments from previous Kickstart workshops and conferences</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {galleryImages.map((src, i) => (
                <button key={i} onClick={() => openGallery(i)} className="overflow-hidden rounded-lg bg-card border p-0 focus:outline-none">
                  <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-b from-background to-muted/50 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-6">
            <img src={kickstartLogoAlt} alt="Kickstart Career & Business Conference" className="h-16 md:h-20" />
            <p className="text-center text-muted-foreground max-w-2xl text-sm md:text-base">
              Activating dreams through innovative business and career solutions powered by AI
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>© 2026 Kickstart Events</span>
              <span>•</span>
              <span>All Rights Reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
