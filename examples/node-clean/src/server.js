import express from 'express';
import { account, store } from './routes/account.js';
import { startRetentionJob } from './jobs/retention.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use('/account', account);
startRetentionJob(store);
app.listen(3000);
