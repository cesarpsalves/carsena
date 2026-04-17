import { supabase } from './supabase';

export const analyticsService = {
  async trackPageView(path: string) {
    try {
      // Prevent double counting the exact same path in the current session
      const sessionKey = `tracked_page_${path}`;
      if (sessionStorage.getItem(sessionKey)) return;

      const referrer = document.referrer || null;
      const user_agent = navigator.userAgent;

      const { error } = await supabase
        .schema('app_carsena')
        .from('analytics_page_views')
        .insert([{ path, referrer, user_agent }]);

      if (error) throw error;
      
      sessionStorage.setItem(sessionKey, 'true');
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  },

  async trackPortfolioClick(imageId: string, category: string) {
    try {
      const { error } = await supabase
        .schema('app_carsena')
        .from('analytics_portfolio_clicks')
        .insert([{ image_id: imageId, category }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking portfolio click:', error);
    }
  },
  
  async getPageViewsMetrics() {
    try {
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('analytics_page_views')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting page views metrics:', error);
      return [];
    }
  },
  
  async getPortfolioClickMetrics() {
    try {
      const { data, error } = await supabase
        .schema('app_carsena')
        .from('analytics_portfolio_clicks')
        .select(`
          *,
          portfolio_images (
            storage_path
          )
        `);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting portfolio metrics:', error);
      return [];
    }
  }
};
