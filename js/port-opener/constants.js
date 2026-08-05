// ============================================================
//  port-opener/constants.js — Portas comuns e estado inicial
// ============================================================

export const COMMON_PORTS = {
  20:'FTP Data',21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',
  80:'HTTP',110:'POP3',143:'IMAP',443:'HTTPS',465:'SMTPS',587:'SMTP',
  993:'IMAPS',995:'POP3S',1433:'SQL Server',3000:'Node.js',3306:'MySQL',
  3389:'RDP',4200:'Angular',5000:'Flask',5173:'Vite',5432:'PostgreSQL',
  5601:'Kibana',5672:'RabbitMQ',6379:'Redis',6443:'Kubernetes',
  8000:'Django',8080:'HTTP Alt',8443:'HTTPS Alt',8888:'Jupyter',
  9000:'PHP-FPM',9090:'Prometheus',9200:'Elasticsearch',27017:'MongoDB'
};

export const QUICK_PORTS = [
  {port:80,label:'HTTP'},{port:443,label:'HTTPS'},{port:3000,label:'Node.js'},
  {port:8080,label:'HTTP Alt'},{port:8000,label:'Django'},{port:5000,label:'Flask'},
  {port:5173,label:'Vite'},{port:4200,label:'Angular'},{port:3306,label:'MySQL'},
  {port:5432,label:'Postgres'},{port:6379,label:'Redis'},{port:27017,label:'MongoDB'},
  {port:22,label:'SSH'},{port:3389,label:'RDP'},
];

export const DEFAULT_STATE = {
  ports: [],
  proto: 'TCP',
  dir: 'IN',
};
