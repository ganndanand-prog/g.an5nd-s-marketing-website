import React from 'react';
import { Briefcase, ArrowUpRight, Tag } from 'lucide-react';
import { servicesList } from '../data/portfolioData';
import { ServiceItem } from '../types/portfolio';

interface ServicesSectionProps {
  onSelectService: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  return (
    <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Services</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Үйлчилгээнүүд
        </h2>

        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Танай брэнд, бүтээгдэхүүнд тохирох үйлчилгээг сонгон шууд захиалга илгээнэ үү. Илгээсэн хүсэлт тань Gmail болон Discord сувгаар шуурхай хүрнэ.
        </p>
      </div>

      {/* Services Grid mapped from single array */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {servicesList.map((service: ServiceItem) => (
          <div
            key={service.id}
            className="flex flex-col justify-between p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-pink-300 dark:hover:border-pink-800 hover:-translate-y-1 transition-all duration-300"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-4">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {service.name}
                </h3>
                {service.badge && (
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 text-[10px] font-bold uppercase tracking-wider">
                    {service.badge}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {service.description}
              </p>
            </div>

            <div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60 mb-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
                  <Tag className="w-3 h-3 text-pink-500" />
                  <span>Үнэ</span>
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {service.price}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectService(service.name)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Захиалах</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
