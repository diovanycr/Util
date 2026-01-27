// js/app.js

import { initAuth } from './auth.js';
import { initAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initAdmin();
});
