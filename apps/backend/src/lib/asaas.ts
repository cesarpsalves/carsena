import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const apiKey = process.env.ASAAS_API_KEY;
const isProduction = process.env.ASAAS_ENVIRONMENT === 'production';
const baseUrl = isProduction 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

if (!apiKey) {
  console.warn('⚠️ ASAAS_API_KEY missing in .env');
}

const asaasApi = axios.create({
  baseURL: baseUrl,
  headers: {
    'access_token': apiKey || '',
    'Content-Type': 'application/json'
  }
});

export const asaasService = {
  async createCustomer(data: { name: string, email: string, cpfCnpj: string }) {
    try {
      // First, try to find existing customer by document or email (Asaas doesn't have a direct "find" but we can list)
      const listResponse = await asaasApi.get(`/customers?email=${data.email}`);
      if (listResponse.data.data.length > 0) {
        return listResponse.data.data[0];
      }

      const response = await asaasApi.post('/customers', data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Asaas createCustomer error:', error.response?.data || error.message);
      throw error;
    }
  },

  async createPayment(data: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    value: number;
    dueDate: string;
    description: string;
    externalReference?: string;
  }) {
    try {
      const response = await asaasApi.post('/payments', data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Asaas createPayment error:', error.response?.data || error.message);
      throw error;
    }
  },

  async getPaymentStatus(paymentId: string) {
    try {
      const response = await asaasApi.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Asaas getPaymentStatus error:', error.response?.data || error.message);
      throw error;
    }
  },

  async getPixQrCode(paymentId: string) {
    try {
      const response = await asaasApi.get(`/payments/${paymentId}/pixQrCode`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Asaas getPixQrCode error:', error.response?.data || error.message);
      throw error;
    }
  }
};
