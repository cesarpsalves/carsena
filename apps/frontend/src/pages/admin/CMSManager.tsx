import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { 
  Save, 
  Eye, 
  Type, 
  ImageIcon, 
  CheckCircle2,
  Plus,
  ArrowUp,
  ArrowDown,
  Settings as SettingsIcon,
  LayoutGrid,
  Calendar,
  Trash2,
  Ticket,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { cmsService } from "@/lib/cms";
import type { LandingSettings, LandingSection } from "@/lib/cms";
import { eventService } from "@/lib/events";
import type { Event, TicketTier } from "@/lib/events";
import { getStoragePublicUrl } from '@/lib/storage';

const tabs = [
  { id: "identity", label: "Identidade", icon: <SettingsIcon size={18} /> },
  { id: "sections", label: "Seções & Ordem", icon: <LayoutGrid size={18} /> },
  { id: "content", label: "Conteúdo", icon: <Type size={18} /> },
  { id: "events", label: "Eventos & Ingressos", icon: <Calendar size={18} /> },
  { id: "coupons", label: "Cupons", icon: <Ticket size={18} /> },
  { id: "premium", label: "Premium", icon: <ShieldCheck size={18} /> },
];

export const CMSManager = () => {
  const [activeTab, setActiveTab ] = useState("identity");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsData, sectionsData, eventsData, couponsData] = await Promise.all([
        cmsService.getSettings(),
        cmsService.getSections(),
        eventService.getAllEventsAdmin(),
        cmsService.getCoupons(),
      ]);
      setSettings(settingsData);
      setSections(sectionsData);
      setEvents(eventsData);
      setCoupons(couponsData);
    } catch (error) {
      console.error("Error fetching CMS data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    
    try {
      await Promise.all([
        cmsService.updateSettings(settings.id, settings),
        ...sections.map(s => cmsService.updateSection(s.id, s))
      ]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving CMS:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    // Atualiza display_order de todos baseados na nova ordem do array
    const reorderedSections = newSections.map((s, i) => ({
      ...s,
      display_order: i
    }));
    
    setSections(reorderedSections);
  };

  const handleToggleSection = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-[1px] bg-luxury-gold animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-12">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-12">
          <div className="space-y-2">
            <h1 className="text-serif text-4xl text-luxury-cream">Minha <span className="italic opacity-80">Vitrine</span></h1>
            <p className="text-luxury-cream/40 font-sans text-[10px] tracking-widest uppercase">Personalize a identidade do seu site oficial</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">
              <Eye size={16} />
              Ver Site
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-luxury-gold text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : (
                <>
                  <Save size={16} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 border transition-all text-[10px] font-bold uppercase tracking-widest",
                activeTab === tab.id 
                  ? "bg-luxury-cream/5 border-luxury-gold text-luxury-gold" 
                  : "bg-transparent border-white/5 text-luxury-cream/40 hover:text-luxury-cream hover:border-white/20"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="bg-white/5 border border-white/5 p-8 md:p-12 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === "identity" && settings && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-serif text-2xl text-luxury-cream italic">Hero / Impacto</h3>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold block">Título Principal</label>
                      <input 
                        type="text" 
                        value={settings.hero_title || ""}
                        onChange={(e) => setSettings({...settings, hero_title: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 px-4 py-4 text-luxury-cream font-serif text-lg focus:border-luxury-gold outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold block">Subtítulo</label>
                      <textarea 
                        rows={3}
                        value={settings.hero_subtitle || ""}
                        onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 px-4 py-4 text-luxury-cream font-sans text-sm focus:border-luxury-gold outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-serif text-2xl text-luxury-cream italic">Contato da Vitrine</h3>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold block">WhatsApp / Telefone</label>
                      <input 
                        type="text" 
                        value={settings.whatsapp_number || ""}
                        onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                        placeholder="Ex: 5511999999999"
                        className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs outline-none focus:border-luxury-gold transition-colors"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold block">E-mail de Contato</label>
                      <input 
                        type="email" 
                        value={settings.contact_email || ""}
                        onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                        placeholder="contato@exemplo.com"
                        className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs outline-none focus:border-luxury-gold transition-colors"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold block">Instagram (@usuario)</label>
                      <input 
                        type="text" 
                        value={settings.instagram_username || ""}
                        onChange={(e) => setSettings({...settings, instagram_username: e.target.value})}
                        placeholder="@seu-perfil"
                        className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs outline-none focus:border-luxury-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6 pt-8 border-t border-white/5">
                    <h3 className="text-serif text-2xl text-luxury-cream italic">Proteção de Mídia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold block">Texto da Marca d'água</label>
                        <input 
                          type="text" 
                          value={settings.watermark_text || ""}
                          onChange={(e) => setSettings({...settings, watermark_text: e.target.value})}
                          placeholder="EX: CARSENA DIGITAL"
                          className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs outline-none focus:border-luxury-gold"
                        />
                        <p className="text-[9px] text-luxury-cream/40 italic">Este texto aparecerá repetido sobre as fotos nas galerias.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "sections" && (
              <motion.div
                key="sections"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h3 className="text-serif text-2xl text-luxury-cream italic">Estrutura do Site</h3>
                  <p className="text-xs text-luxury-cream/40 max-w-lg">Ative, desative e mude a ordem das seções na sua página principal.</p>
                </div>

                <div className="space-y-4">
                  {sections.map((section, i) => (
                    <div key={section.id} className={cn(
                      "p-6 border flex items-center justify-between transition-all group",
                      section.enabled ? "bg-black/40 border-white/10" : "bg-black/10 border-white/5 opacity-50"
                    )}>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                          <button 
                            disabled={i === 0}
                            onClick={() => handleMoveSection(section.id, 'up')}
                            className="p-1 hover:text-luxury-gold disabled:opacity-0 transition-opacity"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            disabled={i === sections.length - 1}
                            onClick={() => handleMoveSection(section.id, 'down')}
                            className="p-1 hover:text-luxury-gold disabled:opacity-0 transition-opacity"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-luxury-cream">{section.section_key}</p>
                          <h4 className="text-serif text-lg text-luxury-gold/80">{section.title || "Sem Título"}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id={`enabled-${section.id}`}
                            checked={section.enabled}
                            onChange={() => handleToggleSection(section.id)}
                            className="accent-luxury-gold"
                          />
                          <label htmlFor={`enabled-${section.id}`} className="text-[9px] uppercase tracking-widest text-luxury-cream/40">Visível</label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "content" && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <h3 className="text-serif text-2xl text-luxury-cream italic">Conteúdo Detalhado</h3>
                  <p className="text-xs text-luxury-cream/40 max-w-lg">Edite os textos de cada seção habilitada.</p>
                </div>

                <div className="space-y-12">
                  {sections.filter(s => s.enabled).map((section) => (
                    <div key={section.id} className="space-y-6 border-l border-luxury-gold/20 pl-8 ml-2">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-luxury-gold uppercase tracking-[0.4em]">Seção: {section.section_key}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-cream/40">Título da Seção</label>
                          <input 
                            type="text" 
                            value={section.title || ""}
                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? {...s, title: e.target.value} : s))}
                            className="w-full bg-black/40 border border-white/5 px-4 py-3 text-[11px] font-serif text-luxury-cream focus:border-luxury-gold outline-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-cream/40">Subtítulo / Descrição</label>
                          <textarea 
                            rows={2}
                            value={section.subtitle || ""}
                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? {...s, subtitle: e.target.value} : s))}
                            className="w-full bg-black/40 border border-white/5 px-4 py-3 text-[11px] font-sans text-luxury-cream focus:border-luxury-gold outline-none resize-none"
                          />
                        </div>

                        {/* Campos específicos por tipo de seção podem ser adicionados aqui */}
                        {section.section_key === 'contact' && (
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-cream/40">Endereço (opcional)</label>
                            <input 
                              type="text" 
                              value={section.content?.address || ""}
                              onChange={(e) => setSections(sections.map(s => s.id === section.id ? {...s, content: {...s.content, address: e.target.value}} : s))}
                              className="w-full bg-black/40 border border-white/5 px-4 py-3 text-[11px] text-luxury-cream focus:border-luxury-gold outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "events" && (
              <motion.div
                key="events"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-12"
              >
                {!editingEvent ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-4">
                        <h3 className="text-serif text-2xl text-luxury-cream italic">Agenda de Eventos</h3>
                        <p className="text-xs text-luxury-cream/40 max-w-lg">Gerencie workshops, vernissages e sessões exclusivas.</p>
                      </div>
                      <button 
                        onClick={() => setEditingEvent({ 
                          title: '', 
                          date: '', 
                          location: '', 
                          description: '', 
                          status: 'active', 
                          event_type: 'event', 
                          ticket_tiers: [{ 
                            name: 'Lote Único', 
                            price: 0, 
                            capacity: 50, 
                            sold_count: 0, 
                            active: true 
                          }] 
                        })}
                        className="flex items-center gap-2 px-6 py-3 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-[10px] font-bold uppercase tracking-widest hover:bg-luxury-gold hover:text-black transition-all"
                      >
                        <Plus size={16} />
                        Novo Evento
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {events.map((event) => (
                        <div key={event.id} className="p-6 bg-black/40 border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-20 bg-white/5 border border-white/10 overflow-hidden">
                              {event.thumbnail_url ? (
                                <img src={getStoragePublicUrl(event.thumbnail_url)} alt="" className="w-full h-full object-cover grayscale" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon size={20} /></div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-serif text-lg text-luxury-cream">{event.title}</h4>
                              <p className="text-[9px] uppercase tracking-widest text-luxury-gold/60">{new Date(event.date).toLocaleDateString()} — {event.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setEditingEvent(event)}
                              className="p-3 text-luxury-cream/40 hover:text-luxury-gold transition-colors"
                            >
                              <SettingsIcon size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (event.id && confirm('Deseja realmente desativar este evento?')) {
                                  await eventService.deleteEvent(event.id);
                                  fetchData();
                                }
                              }}
                              className="p-3 text-luxury-cream/40 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {events.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-white/10">
                          <p className="text-luxury-cream/20 text-xs uppercase tracking-widest italic">Nenhum evento cadastrado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in slide-in-from-left-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <h3 className="text-serif text-2xl text-luxury-cream italic">
                        {editingEvent.id ? 'Editar Evento' : 'Novo Evento'}
                      </h3>
                      <button 
                        onClick={() => setEditingEvent(null)}
                        className="text-[10px] font-bold uppercase tracking-widest text-luxury-cream/40 hover:text-luxury-cream transition-colors"
                      >
                        Voltar para lista
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Título do Evento</label>
                          <input 
                            type="text" 
                            value={editingEvent.title || ""}
                            onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 px-4 py-4 text-luxury-cream font-serif text-lg focus:border-luxury-gold outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Data</label>
                            <input 
                              type="date" 
                              value={editingEvent.date || ""}
                              onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Tipo</label>
                            <select 
                              value={editingEvent.event_type}
                              onChange={(e) => setEditingEvent({...editingEvent, event_type: e.target.value as any})}
                              className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none"
                            >
                              <option value="event">Evento / Ingressos</option>
                              <option value="session">Sessão / Agenda</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Local</label>
                          <input 
                            type="text" 
                            value={editingEvent.location || ""}
                            onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Descrição</label>
                          <textarea 
                            rows={4}
                            value={editingEvent.description || ""}
                            onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none resize-none"
                          />
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                           <div className="flex-1 space-y-3">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">URL da Imagem de Capa</label>
                            <input 
                              type="text" 
                              value={editingEvent.thumbnail_url || ""}
                              onChange={(e) => setEditingEvent({...editingEvent, thumbnail_url: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-[10px] focus:border-luxury-gold outline-none"
                              placeholder="https://exemplo.com/foto.jpg"
                            />
                          </div>
                          {editingEvent.thumbnail_url && (
                             <div className="w-24 h-24 bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                               <img 
                                 src={getStoragePublicUrl(editingEvent.thumbnail_url)} 
                                 className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" 
                                 alt="preview"
                               />
                             </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-serif text-xl text-luxury-gold italic">Gestão de Tiers / Ingressos</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {(editingEvent.ticket_tiers || []).map((tier: any, tIdx: number) => (
                          <div key={tIdx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/5 items-end">
                            <div className="space-y-3 col-span-1">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-luxury-cream/40">Nome do Tier</label>
                              <input 
                                type="text"
                                value={tier.name}
                                onChange={(e) => {
                                  const newTiers = [...(editingEvent.ticket_tiers || [])];
                                  newTiers[tIdx] = { ...tier, name: e.target.value };
                                  setEditingEvent({ ...editingEvent, ticket_tiers: newTiers });
                                }}
                                className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-luxury-cream focus:border-luxury-gold outline-none"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-luxury-cream/40">Preço (R$)</label>
                              <div className="relative group">
                                <input 
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const newTiers = [...(editingEvent.ticket_tiers || [])];
                                    newTiers[tIdx] = { ...tier, price: Number(e.target.value) };
                                    setEditingEvent({ ...editingEvent, ticket_tiers: newTiers });
                                  }}
                                  className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-luxury-cream focus:border-luxury-gold outline-none"
                                />
                                <span className="absolute right-0 bottom-2 text-[8px] text-luxury-gold/40 group-focus-within:text-luxury-gold transition-colors">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tier.price)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-luxury-cream/40">Capacidade</label>
                              <input 
                                type="number"
                                value={tier.stock_total || tier.capacity || 0}
                                onChange={(e) => {
                                  const newTiers = [...(editingEvent.ticket_tiers || [])];
                                  newTiers[tIdx] = { ...tier, stock_total: Number(e.target.value), capacity: Number(e.target.value) };
                                  setEditingEvent({ ...editingEvent, ticket_tiers: newTiers });
                                }}
                                className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-luxury-cream focus:border-luxury-gold outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              {editingEvent.ticket_tiers && editingEvent.ticket_tiers.length > 1 && (
                                <button 
                                  onClick={() => {
                                    const newTiers = editingEvent.ticket_tiers?.filter((_: any, i: number) => i !== tIdx);
                                    setEditingEvent({ ...editingEvent, ticket_tiers: newTiers });
                                  }}
                                  className="p-2 text-red-500/50 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                         <button 
                          onClick={() => {
                            const currentTiers = editingEvent.ticket_tiers || [];
                            const newTier: Partial<TicketTier> = { 
                              name: 'Novo Tier', 
                              price: 0, 
                              stock_total: 50, 
                              stock_sold: 0, 
                              active: true 
                            };
                            setEditingEvent({ 
                              ...editingEvent, 
                              ticket_tiers: [...currentTiers, newTier] 
                            });
                          }}
                          className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                          <Plus size={14} /> Adicionar Tier
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-10 border-t border-white/5">
                      <button 
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            await eventService.saveEvent(editingEvent, editingEvent.ticket_tiers || []);
                            setEditingEvent(null);
                            fetchData();
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 3000);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        className="px-12 py-4 bg-luxury-gold text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                      >
                        {isSaving ? "Salvando..." : "Salvar Evento"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "coupons" && (
              <motion.div
                key="coupons"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-12"
              >
                {!editingCoupon ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-4">
                        <h3 className="text-serif text-2xl text-luxury-cream italic">Cupons de Desconto</h3>
                        <p className="text-xs text-luxury-cream/40 max-w-lg">Crie códigos promocionais para seus clientes.</p>
                      </div>
                      <button 
                        onClick={() => setEditingCoupon({ 
                          code: '', 
                          type: 'percentage', 
                          value: 0, 
                          active: true 
                        })}
                        className="flex items-center gap-2 px-6 py-3 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-[10px] font-bold uppercase tracking-widest hover:bg-luxury-gold hover:text-black transition-all"
                      >
                        <Plus size={16} />
                        Novo Cupom
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {coupons.map((coupon) => (
                        <div key={coupon.id} className="p-6 bg-black/40 border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/20">
                              <Ticket className="text-luxury-gold" size={20} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-serif text-lg text-luxury-cream tracking-widest">{coupon.code}</h4>
                              <p className="text-[9px] uppercase tracking-widest text-luxury-gold/60">
                                {coupon.type === 'percentage' 
                                  ? `${coupon.value}% de desconto` 
                                  : `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coupon.value)} de desconto`}
                                {coupon.usage_limit ? ` — Limite: ${coupon.usage_count}/${coupon.usage_limit}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setEditingCoupon(coupon)}
                              className="p-3 text-luxury-cream/40 hover:text-luxury-gold transition-colors"
                            >
                              <SettingsIcon size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (coupon.id && confirm('Deseja realmente excluir este cupom?')) {
                                  await cmsService.deleteCoupon(coupon.id);
                                  fetchData();
                                }
                              }}
                              className="p-3 text-luxury-cream/40 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {coupons.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-white/10">
                          <p className="text-luxury-cream/20 text-xs uppercase tracking-widest italic">Nenhum cupom cadastrado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in slide-in-from-left-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <h3 className="text-serif text-2xl text-luxury-cream italic">
                        {editingCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}
                      </h3>
                      <button 
                        onClick={() => setEditingCoupon(null)}
                        className="text-[10px] font-bold uppercase tracking-widest text-luxury-cream/40 hover:text-luxury-cream transition-colors"
                      >
                        Voltar para lista
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Código do Cupom</label>
                          <input 
                            type="text" 
                            placeholder="EX: BEMVINDO10"
                            value={editingCoupon.code || ""}
                            onChange={(e) => setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()})}
                            className="w-full bg-black/40 border border-white/10 px-4 py-4 text-luxury-cream font-serif text-lg focus:border-luxury-gold outline-none tracking-widest"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Tipo</label>
                            <select 
                              value={editingCoupon.type}
                              onChange={(e) => setEditingCoupon({...editingCoupon, type: e.target.value as any})}
                              className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none"
                            >
                              <option value="percentage">Porcentagem (%)</option>
                              <option value="fixed">Valor Fixo (R$)</option>
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Valor</label>
                            <input 
                              type="number" 
                              value={editingCoupon.value}
                              onChange={(e) => setEditingCoupon({...editingCoupon, value: Number(e.target.value)})}
                              className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Limite de Uso (Opcional)</label>
                          <input 
                            type="number" 
                            placeholder="Ilimitado se vazio"
                            value={editingCoupon.usage_limit || ""}
                            onChange={(e) => setEditingCoupon({...editingCoupon, usage_limit: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold">Data de Expiração (Opcional)</label>
                          <input 
                            type="date" 
                            value={editingCoupon.expires_at?.split('T')[0] || ""}
                            onChange={(e) => setEditingCoupon({...editingCoupon, expires_at: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 px-4 py-3 text-luxury-cream text-xs focus:border-luxury-gold outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-10 border-t border-white/5">
                      <button 
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            if (editingCoupon.id) {
                              await cmsService.updateCoupon(editingCoupon.id, editingCoupon);
                            } else {
                              await cmsService.createCoupon(editingCoupon);
                            }
                            setEditingCoupon(null);
                            fetchData();
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 3000);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        className="px-12 py-4 bg-luxury-gold text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                      >
                        {isSaving ? "Salvando..." : "Salvar Cupom"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "premium" && (
              <motion.div
                key="premium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <h3 className="text-serif text-2xl text-luxury-cream italic">Experiências Premium</h3>
                  <p className="text-xs text-luxury-cream/40 max-w-lg">Integrações de alto nível para valorizar seu serviço.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Google Wallet */}
                  <div className="p-8 bg-black/40 border border-white/5 space-y-6 group hover:border-luxury-gold/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 flex items-center justify-center rounded-full">
                          <CreditCard className="text-luxury-gold" size={20} />
                        </div>
                        <h4 className="text-serif text-lg text-luxury-cream">Google Wallet</h4>
                      </div>
                      <div className="px-3 py-1 bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold text-[8px] font-bold uppercase tracking-widest">
                        Em breve
                      </div>
                    </div>
                    <p className="text-[10px] text-luxury-cream/40 leading-relaxed">
                      Permita que seus clientes adicionem ingressos e passes diretamente ao Google Wallet com um clique.
                    </p>
                    <div className="pt-4 opacity-30 pointer-events-none">
                      <label className="text-[8px] font-bold uppercase tracking-widest text-luxury-gold block mb-2">Issuer ID</label>
                      <input type="text" disabled className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs" />
                    </div>
                  </div>

                  {/* Apple Wallet */}
                  <div className="p-8 bg-black/40 border border-white/5 space-y-6 group hover:border-luxury-gold/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 flex items-center justify-center rounded-full">
                          <CreditCard className="text-luxury-gold" size={20} />
                        </div>
                        <h4 className="text-serif text-lg text-luxury-cream">Apple Wallet</h4>
                      </div>
                      <div className="px-3 py-1 bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold text-[8px] font-bold uppercase tracking-widest">
                        Em breve
                      </div>
                    </div>
                    <p className="text-[10px] text-luxury-cream/40 leading-relaxed">
                      Integração nativa com iOS para exibição de ingressos e notificações baseadas em localização.
                    </p>
                    <div className="pt-4 opacity-30 pointer-events-none">
                      <label className="text-[8px] font-bold uppercase tracking-widest text-luxury-gold block mb-2">Pass Type ID</label>
                      <input type="text" disabled className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Success Feedback */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-12 right-12 bg-luxury-gold text-black px-8 py-4 flex items-center gap-3 shadow-2xl z-50 border border-white/20"
            >
              <CheckCircle2 size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Vitrine atualizada com sucesso!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};
