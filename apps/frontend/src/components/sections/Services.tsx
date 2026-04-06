import { Camera, Heart, Star, Layout } from "lucide-react";

interface ServiceData {
  title: string;
  description: string;
  active: boolean;
}

interface ServicesProps {
  title?: string;
  subtitle?: string;
  data?: ServiceData[];
}

const defaultIcons = [
  <Heart size={32} className="text-luxury-gold" />,
  <Star size={32} className="text-luxury-gold" />,
  <Camera size={32} className="text-luxury-gold" />,
  <Layout size={32} className="text-luxury-gold" />
];

export const Services = ({ title, subtitle, data }: ServicesProps) => {
  const displayServices = data && data.length > 0 
    ? data.filter(s => s.active).map((s, i) => ({ ...s, icon: defaultIcons[i % defaultIcons.length] }))
    : [
        {
          icon: <Heart size={32} className="text-luxury-gold" />,
          title: "Casamentos",
          description: "Cobertura completa com olhar documental e artístico para o seu grande dia."
        },
        {
          icon: <Star size={32} className="text-luxury-gold" />,
          title: "Ensaios Premium",
          description: "Retratos que revelam sua melhor versão em locações exclusivas."
        },
        {
          icon: <Camera size={32} className="text-luxury-gold" />,
          title: "Eventos Sociais",
          description: "Capturando a energia e a emoção de celebrações especiais."
        },
        {
          icon: <Layout size={32} className="text-luxury-gold" />,
          title: "Galerias Privativas",
          description: "Entrega digital elegante com proteção por senha e seleção intuitiva."
        }
      ];

  return (
    <section id="servicos" className="section-padding bg-luxury-black text-luxury-cream">
      <div className="container-premium lg:px-12">
        <div className="max-w-3xl mb-20 space-y-6">
          <p className="text-luxury-gold font-bold text-[10px] uppercase tracking-[0.4em]">Nossos Serviços</p>
          <h2 className="text-editorial text-5xl md:text-7xl">
            {title || <>Experiências <br />Sob Medida</>}
          </h2>
          <p className="text-luxury-cream/60 text-lg leading-relaxed font-sans max-w-xl italic">
            "{subtitle || "Não fotografamos apenas imagens, fotografamos sentimentos."}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
          {displayServices.map((service, index) => (
            <div key={index} className="space-y-6 group cursor-default">
              <div className="transform group-hover:scale-110 transition-transform duration-500 origin-left">
                {service.icon}
              </div>
              <h3 className="font-serif text-2xl group-hover:text-luxury-gold transition-colors">{service.title}</h3>
              <p className="text-sm text-luxury-cream/40 leading-relaxed font-sans">
                {service.description}
              </p>
              <div className="w-10 h-1 bg-luxury-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
