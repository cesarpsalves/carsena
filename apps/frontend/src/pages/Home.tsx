import { useState, useEffect } from "react";
import { Hero } from "../components/sections/Hero";
import { Portfolio } from "../components/sections/Portfolio";
import { Events } from "../components/sections/Events";
import { Services } from "../components/sections/Services";
import { Contact } from "../components/sections/Contact";
import { Philosophy } from "../components/sections/Philosophy";
import { cmsService } from "@/lib/cms";
import type { LandingSettings, LandingSection } from "@/lib/cms";

const SECTION_COMPONENTS: Record<string, React.FC<any>> = {
  hero: Hero,
  philosophy: Philosophy,
  portfolio: Portfolio,
  events: Events,
  services: Services,
  contact: Contact,
};

const Home = () => {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const [settingsData, sectionsData] = await Promise.all([
          cmsService.getSettings(),
          cmsService.getSections(),
        ]);
        setSettings(settingsData);
        setSections(sectionsData);
      } catch (error) {
        console.error("Error loading home content:", error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="w-12 h-[1px] bg-luxury-gold animate-pulse" />
      </div>
    );
  }

  // Se não houver configurações, renderiza pelo menos o Hero com dados padrão
  if (!settings && sections.length === 0) {
    return (
      <div className="flex flex-col">
        <Hero />
        <Portfolio />
        <Events />
        <Services />
        <Contact />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 
        O Hero é especial e geralmente fica no topo, vindo de settings ou de uma seção específica.
        Se existir uma seção 'hero' habilitada, ela será renderizada na ordem definida.
        Caso contrário, usamos os dados de 'settings' para o Hero padrão no topo.
      */}
      {!sections.find(s => s.section_key === 'hero' && s.enabled) && (
        <Hero 
          title={settings?.hero_title}
          subtitle={settings?.hero_subtitle}
          imageUrl={settings?.hero_image_url}
          primaryCtaLabel={settings?.hero_cta_primary_label}
          secondaryCtaLabel={settings?.hero_cta_secondary_label}
        />
      )}

      {sections
        .filter(section => section.enabled)
        .map((section) => {
          const Component = SECTION_COMPONENTS[section.section_key];
          if (!Component) return null;

          // Props específicos por componente
          const componentProps: any = {
            title: section.title,
            subtitle: section.subtitle,
          };

          if (section.section_key === 'hero') {
            componentProps.imageUrl = settings?.hero_image_url;
            componentProps.primaryCtaLabel = settings?.hero_cta_primary_label;
            componentProps.secondaryCtaLabel = settings?.hero_cta_secondary_label;
          }

          if (section.section_key === 'services') {
            componentProps.data = section.content?.services;
          }

          if (section.section_key === 'contact') {
            componentProps.data = {
              email: settings?.contact_email || "carsena2007@gmail.com",
              phone: settings?.whatsapp_number,
              address: section.content?.address,
            };
          }

          return <Component key={section.id} {...componentProps} />;
        })}

    </div>
  );
};

export default Home;
