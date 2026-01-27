// js/app.js

import { initAuth } from './auth.js';
import { initAdmin } from './admin.js';
import { initMessages } from './messages.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initAdmin();
  initMessages();
});
