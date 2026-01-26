import { loadMessages } from './messages.js';

export function loadUser(uid){
  document.getElementById('userArea').classList.remove('hidden');
  document.getElementById('adminArea').classList.add('hidden');
  loadMessages(uid);
}
