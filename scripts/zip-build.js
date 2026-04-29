import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para obter a versão (mesma lógica do vite.config.ts)
const getVersion = () => {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
        const baseVersion = pkg.version.split('.').slice(0, 2).join('.');
        const count = execSync('git rev-list --count HEAD').toString().trim();
        return `${baseVersion}.${count}`;
    } catch (e) {
        return '1.0.unknown';
    }
};

const version = getVersion();
const outputFileName = `nix-v${version}.zip`;
const outputFilePath = path.resolve(__dirname, `../${outputFileName}`);
const sourceDir = path.resolve(__dirname, '../dist');

// Garante que o diretório dist existe
if (!fs.existsSync(sourceDir)) {
    console.error('Erro: Diretório "dist" não encontrado. Execute "npm run build" primeiro.');
    process.exit(1);
}

const output = fs.createWriteStream(outputFilePath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Nível de compressão máximo
});

output.on('close', () => {
    console.log(`\n✅ ZIP criado com sucesso!`);
    console.log(`Arquivo: ${outputFileName}`);
    console.log(`Tamanho total: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
        console.warn(err);
    } else {
        throw err;
    }
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);

// Adiciona o conteúdo da pasta dist ao zip (sem a própria pasta dist no caminho interno)
archive.directory(sourceDir, false);

console.log(`Criando ZIP para a versão ${version}...`);
archive.finalize();
