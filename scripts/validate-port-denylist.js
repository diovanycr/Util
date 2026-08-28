import { existsSync, readFileSync, readdirSync } from 'node:fs';

const SOURCE_FILES = ['index.html', 'sw.js', 'manifest.json'];
const SOURCE_DIRECTORIES = ['js', 'css'];
const FORBIDDEN_ENDPOINT = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i;

function collectFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const filePath = `${directory}/${entry.name}`;
        if (entry.isDirectory()) return collectFiles(filePath);
        return entry.isFile() ? [filePath] : [];
    });
}

const files = [
    ...SOURCE_FILES.filter(existsSync),
    ...SOURCE_DIRECTORIES.flatMap(collectFiles),
];
const violations = files.flatMap((file) => {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    return lines.flatMap((line, index) => FORBIDDEN_ENDPOINT.test(line) ? [`${file}:${index + 1}`] : []);
});

if (violations.length > 0) {
    console.error('Forbidden local development endpoint(s) found:');
    violations.forEach((violation) => console.error(`- ${violation}`));
    process.exit(1);
}

console.log(`Port denylist validation passed for ${files.length} application files.`);
