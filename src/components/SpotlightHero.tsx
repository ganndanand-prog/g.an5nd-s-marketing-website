import React from 'react';
import { ArrowUpRight, Instagram, Mail, Eye, TrendingUp, MessageCircle, Users, Video, CheckCircle2 } from 'lucide-react';
import { PortfolioProfile } from '../types/portfolio';
import { instagramStats } from '../data/portfolioData';

interface SpotlightHeroProps {
  profile: PortfolioProfile;
  onExploreProjects: () => void;
}

export const SpotlightHero: React.FC<SpotlightHeroProps> = ({
  profile,
  onExploreProjects
}) => {
  const getStatIcon = (icon: string) => {
    switch (icon) {
      case 'Eye':
        return <Eye className="w-4 h-4 text-pink-500" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'MessageCircle':
        return <MessageCircle className="w-4 h-4 text-sky-500" />;
      default:
        return <Users className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <section id="home" className="relative min-h-[90vh] pt-28 pb-16 flex items-center justify-center overflow-hidden">
      {/* Background radial gradient & ambient glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,#e0f2fe_0%,#dbeafe_35%,#f1f5f9_70%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_50%_25%,#0f172a_0%,#020617_80%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-300/25 dark:bg-sky-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Ghost Typography */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-1 overflow-hidden opacity-35 dark:opacity-15">
        <span className="text-[14vw] font-black tracking-tighter text-slate-400/30 whitespace-nowrap">
          ANAND
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Танилцуулга ба Текстүүд */}
          <div className="lg:col-span-7 flex flex-col items-start z-10 text-left">
            {/* Greeting badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-pink-500/10 border border-sky-300/40 dark:border-sky-700/50 backdrop-blur-md shadow-sm mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                {profile.greeting || 'Сайн байна уу, та Анандын вэбсайттай холбогдлоо!'}
              </span>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <a
                href={profile.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-400/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram: {profile.instagramHandle}</span>
              </a>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Ананд · 16 настай
              </span>
              <span className="text-xs font-mono text-pink-600 dark:text-pink-400 font-semibold px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800">
                Fun & Creative Reels
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-6">
              {profile.name}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-sky-500 dark:from-pink-400 dark:via-purple-300 dark:to-sky-300">
                Instagram Reels & Маркетинг
              </span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-8">
              Сайн байна уу! Би Инстаграм дээр богино бичлэг, Reels хийдэг бөгөөд хүмүүст бичлэгээ сонирхолтой, хөгжилтэй (fun) байдлаар хүргэхийг зорьдог. Брэнд, байгууллагуудтай хамтран залууст зориулсан сонирхолтой, өндөр хандалттай маркетинг Reels хийхэд бэлэн байна.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8 w-full sm:w-auto">
              <button
                type="button"
                onClick={onExploreProjects}
                className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Маркетинг & Reels хамтрал</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <a
                href={profile.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-pink-600 dark:text-pink-300 font-semibold text-sm border border-pink-200 dark:border-pink-900/60 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram {profile.instagramHandle}</span>
              </a>

              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm border border-slate-200/80 dark:border-slate-700 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail className="w-4 h-4" />
                <span>Холбоо барих</span>
              </a>
            </div>

            {/* Clean Collab Availability Summary Card */}
            <div className="w-full max-w-lg p-5 rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold tracking-wider">
                    REELS CREATOR
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Байгууллагын хамтын ажиллагаа нээлттэй
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Цаг сайн баримталдаг</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Fun & органик өгүүлэмж</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{profile.location}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Instagram Creator Card for Anand */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-full max-w-[440px] rounded-[36px] p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-white/15 shadow-[0_25px_60px_-15px_rgba(236,72,153,0.22)] overflow-hidden">
              {/* Ambient corner glows */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-pink-500/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* Profile Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-lg">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white font-black text-2xl">
                        A
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white tracking-tight">
                        {profile.name}
                      </h2>
                      <a
                        href={profile.socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>{profile.instagramHandle}</span>
                      </a>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Нээлттэй
                  </span>
                </div>

                {/* Stats 2x2 grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {instagramStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-xl bg-white/10">
                          {getStatIcon(stat.icon)}
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {stat.value}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Creator Highlights */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-pink-300 uppercase tracking-wider">
                    <Video className="w-3.5 h-3.5" />
                    <span>Контентын чиглэл</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Брэнд, бүтээгдэхүүнийг залуусын сонирхол татах, хөгжилтэй (fun) бөгөөд үнэн зөв хэлбэрээр Reels болгон хүргэнэ.
                  </p>
                </div>

                {/* Bottom CTA */}
                <a
                  href={profile.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition-all"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Reels бүтээлүүдийг үзэх ({profile.instagramHandle})</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
