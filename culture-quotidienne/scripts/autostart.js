// Lancement automatique de l'app à l'ouverture de session.
//   npm run autostart:install   → installe et démarre tout de suite
//   npm run autostart:remove    → désinstalle
//   node scripts/autostart.js install --dry-run   → affiche ce qui serait fait, sans rien toucher
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'culture-quotidienne';
const LABEL = 'local.culture-quotidienne';
const NODE = process.execPath;
const ARGS = ['--env-file-if-exists=.env', '--no-warnings=ExperimentalWarning', 'server.js'];
const LOG = path.join(ROOT, 'data', 'server.log');

const action = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const home = process.env.AUTOSTART_HOME || os.homedir();

function run(cmd, args, { ignoreError = false } = {}) {
  if (dryRun) return console.log(`$ ${cmd} ${args.join(' ')}`);
  try {
    execFileSync(cmd, args, { stdio: 'inherit' });
  } catch (e) {
    if (!ignoreError) throw e;
  }
}

function write(file, content) {
  if (dryRun) {
    console.log(`--- ${file}\n${content}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`Écrit : ${file}`);
}

function remove(file) {
  if (dryRun) return console.log(`$ rm ${file}`);
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    console.log(`Supprimé : ${file}`);
  }
}

const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const platforms = {
  // macOS : agent launchd, relancé automatiquement en cas d'arrêt.
  darwin: {
    file: path.join(home, 'Library/LaunchAgents', `${LABEL}.plist`),
    content() {
      return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    ${[NODE, ...ARGS].map((a) => `<string>${xml(a)}</string>`).join('\n    ')}
  </array>
  <key>WorkingDirectory</key><string>${xml(ROOT)}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${xml(LOG)}</string>
  <key>StandardErrorPath</key><string>${xml(LOG)}</string>
</dict>
</plist>
`;
    },
    install() {
      run('launchctl', ['unload', this.file], { ignoreError: true });
      run('launchctl', ['load', '-w', this.file]);
    },
    uninstall() {
      run('launchctl', ['unload', '-w', this.file], { ignoreError: true });
    },
  },

  // Linux : service systemd utilisateur.
  linux: {
    file: path.join(home, '.config/systemd/user', `${NAME}.service`),
    content() {
      return `[Unit]
Description=Culture quotidienne (app d'apprentissage locale)
After=network-online.target

[Service]
WorkingDirectory=${ROOT}
ExecStart="${NODE}" ${ARGS.join(' ')}
Restart=on-failure
StandardOutput=append:${LOG}
StandardError=append:${LOG}

[Install]
WantedBy=default.target
`;
    },
    install() {
      run('systemctl', ['--user', 'daemon-reload']);
      run('systemctl', ['--user', 'enable', '--now', `${NAME}.service`]);
    },
    uninstall() {
      run('systemctl', ['--user', 'disable', '--now', `${NAME}.service`], { ignoreError: true });
    },
  },

  // Windows : script dans le dossier « Démarrage », lancé sans fenêtre.
  win32: {
    file: path.join(process.env.APPDATA || path.join(home, 'AppData/Roaming'), 'Microsoft/Windows/Start Menu/Programs/Startup', `${NAME}.vbs`),
    content() {
      const q = (s) => `""${s}""`;
      const cmd = `cmd /c cd /d ${q(ROOT)} && ${q(NODE)} ${ARGS.join(' ')} >> ${q(LOG)} 2>&1`;
      return `' Lance Culture quotidienne au démarrage de la session, sans fenêtre\r\nCreateObject("WScript.Shell").Run "${cmd}", 0, False\r\n`;
    },
    install() {
      run('wscript', [this.file]);
    },
    uninstall() {
      // Arrête le serveur en cours (processus node lancé avec server.js depuis ce dossier).
      const filter = `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*ExperimentalWarning server.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
      run('powershell', ['-NoProfile', '-Command', filter], { ignoreError: true });
    },
  },
};

const target = platforms[process.env.AUTOSTART_PLATFORM || process.platform];
if (!target) {
  console.error(`Système non pris en charge : ${process.platform}`);
  process.exit(1);
}

if (action === 'install') {
  if (!dryRun) fs.mkdirSync(path.dirname(LOG), { recursive: true });
  write(target.file, target.content());
  target.install();
  console.log(`\nC'est installé : l'app démarrera à chaque ouverture de session → http://localhost:${process.env.PORT || 3000}`);
  console.log(`Journal : ${LOG}`);
} else if (action === 'remove') {
  target.uninstall();
  remove(target.file);
  console.log('Lancement automatique désactivé.');
} else {
  console.log('Usage : node scripts/autostart.js install|remove [--dry-run]');
  process.exit(1);
}
