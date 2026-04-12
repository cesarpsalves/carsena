import { supabase } from './supabase';

export interface LandingSettings {
  id: string;
  photographer_id?: string;
  whatsapp_number?: string;
  contact_email?: string;
  instagram_username?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  hero_cta_primary_label?: string;
  hero_cta_secondary_label?: string;
  footer_text?: string;
  instagram_image_1?: string;
  instagram_orientation_1?: 'portrait' | 'landscape';
  instagram_image_2?: string;
  instagram_orientation_2?: 'portrait' | 'landscape';
  instagram_image_3?: string;
  instagram_orientation_3?: 'portrait' | 'landscape';
  show_events?: boolean;
  show_galleries?: boolean;
  show_about?: boolean;
  show_contact?: boolean;
  show_instagram?: boolean;
  show_testimonials?: boolean;
  is_active?: boolean;
  watermark_text?: string;
}

export interface LandingSection {
  id: string;
  photographer_id?: string;
  section_key: string;
  title?: string;
  subtitle?: string;
  content: any;
  display_order: number;
  enabled: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
  usage_limit?: number;
  usage_count: number;
  expires_at?: string;
  created_at: string;
}

export const cmsService = {
  async getSettings(): Promise<LandingSettings> {
    try {
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('landing_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default settings if none found
      return data || {
        id: '',
        is_active: true,
        hero_title: 'Carsena Fotografia',
        hero_subtitle: 'Capturando momentos extraordinários com olhar artístico e atemporal.',
        show_contact: true,
        show_galleries: true
      };
    } catch (error) {
      console.error('Error fetching landing settings:', error);
      return {
        id: '',
        is_active: true,
        hero_title: 'Carsena Fotografia'
      } as LandingSettings;
    }
  },

  async getSections(): Promise<LandingSection[]> {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('landing_sections')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching landing sections:', error);
      return [];
    }
    return data || [];
  },

  async updateSettings(id: string, settings: Partial<LandingSettings>) {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('landing_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  async updateSection(id: string, section: Partial<LandingSection>) {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('landing_sections')
      .update({
        ...section,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  async toggleSectionVisibility(id: string, enabled: boolean) {
    return this.updateSection(id, { enabled });
  },

  async reorderSections(sections: { id: string; display_order: number }[]) {
    const promises = sections.map(s => 
      this.updateSection(s.id, { display_order: s.display_order })
    );
    return Promise.all(promises);
  },

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }
    return data || [];
  },

  async validateCoupon(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();
    
    if (error || !data) return null;

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
    
    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) return null;

    return data;
  },

  async createCoupon(coupon: Omit<Coupon, 'id' | 'created_at' | 'usage_count'>) {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('coupons')
      .insert([{
        ...coupon,
        code: coupon.code.toUpperCase()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCoupon(id: string, coupon: Partial<Coupon>) {
    const { data, error } = await supabase
      .schema('app_carsena')
      .from('coupons')
      .update({
        ...coupon,
        code: coupon.code?.toUpperCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCoupon(id: string) {
    const { error } = await supabase
      .schema('app_carsena')
      .from('coupons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
