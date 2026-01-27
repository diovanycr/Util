import { initAuth } from './auth.js';
import { initMessages } from './messages.js';
import { initAdmin } from './admin.js';
import { initUser } from './user.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initMessages();
  initAdmin();
  initUser();
});
