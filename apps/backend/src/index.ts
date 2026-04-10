import path from 'path';
import dotenv from 'dotenv';

// 1. CARREGAMENTO DO AMBIENTE (DEVE SER O PRIMEIRO COMANDO)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log(`🌍 Environment loaded from: ${envPath}`);

// 2. IMPORTS LOCAIS (APÓS O ENV)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { cmsRouter } from './routes/cms';
import { galleriesRouter } from './routes/galleries';
import { paymentsRouter } from './routes/payments';
import { webhooksRouter } from './routes/webhooks';
import { eventsRouter } from './routes/events';
import { clientsRouter } from './routes/clients';
import { adminRouter } from './routes/admin';
import storageRouter from './routes/storage';
import authRouter from './routes/auth';
import emailRouter from './routes/emails';
import ticketsRouter from './routes/tickets';

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/cms', cmsRouter);
app.use('/api/galleries', galleriesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/webhooks', webhooksRouter);

app.use('/api/events', eventsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/storage', storageRouter);
app.use('/api/auth', authRouter);
app.use('/api/emails', emailRouter);
app.use('/api/tickets', ticketsRouter);
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'carsena-backend'
  });
});

// App Settings check (Test route for preserved credentials)
app.get('/api/config-check', (req, res) => {
  res.json({
    r2_configured: !!process.env.R2_ACCESS_KEY_ID,
    asaas_configured: !!process.env.ASAAS_API_KEY,
    supabase_configured: !!process.env.SUPABASE_URL,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(port, () => {
  console.log(`🚀 Carsena Backend running at http://localhost:${port}`);
});
