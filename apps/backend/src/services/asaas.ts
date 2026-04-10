import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_ENVIRONMENT = process.env.ASAAS_ENVIRONMENT || 'sandbox';
const ASAAS_API_URL = ASAAS_ENVIRONMENT === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY.trim(),
    'Content-Type': 'application/json',
  },
});

export interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}

export interface AsaasPayment {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  postalService?: boolean;
}

export const AsaasService = {
  createCustomer: async (customer: AsaasCustomer) => {
    try {
      const { data } = await asaasClient.post('/customers', customer);
      return data;
    } catch (error: any) {
      console.error('Error creating Asaas customer:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
    }
  },

  createPayment: async (payment: AsaasPayment) => {
    try {
      const { data } = await asaasClient.post('/payments', payment);
      return data;
    } catch (error: any) {
      console.error('Error creating Asaas payment:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas');
    }
  },

  getPayment: async (id: string) => {
    try {
      const { data } = await asaasClient.get(`/payments/${id}`);
      return data;
    } catch (error: any) {
      console.error('Error fetching Asaas payment:', error.response?.data || error.message);
      throw error;
    }
  },

  getPixQrCode: async (paymentId: string) => {
    try {
      const { data } = await asaasClient.get(`/payments/${paymentId}/pixQrCode`);
      return data;
    } catch (error: any) {
      console.error('Error fetching Pix QR Code:', error.response?.data || error.message);
      throw error;
    }
  },
};
