const fs = require('node:fs');
const path = require('node:path');

// Prisma en Windows necesita que exista el archivo antes de db push --force-reset.
// Abrir en modo append no modifica una base existente.
const filename = path.resolve(__dirname, '../server/prisma/taskflow_test.db');
fs.closeSync(fs.openSync(filename, 'a'));
