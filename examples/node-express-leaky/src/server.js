import express from 'express';
import * as Sentry from '@sentry/node';
import { config } from './config.js';
import { auth } from './routes/auth.js';

Sentry.init({ dsn: config.sentryDsn, sendDefaultPii: true });

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/auth', auth);
app.listen(3000);
