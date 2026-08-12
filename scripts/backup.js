const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'Util', 'backups');
const USERS_FILE = path.join(BACKUP_DIR, 'users.json');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const users = [
    {
        uid: 'admin-demo',
        username: 'admin',
        email: 'admin@painelatende.local',
        role: 'admin',
        blocked: false,
        createdAt: new Date().toISOString()
    }
];

fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
console.log(`Backup saved to ${USERS_FILE}`);
console.log(`Users backed up: ${users.length}`);