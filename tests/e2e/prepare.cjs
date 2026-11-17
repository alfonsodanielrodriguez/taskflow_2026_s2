const fs = require('node:fs');
// This database is exclusive to browser tests; never reset dev.db.
fs.closeSync(fs.openSync('server/prisma/e2e.db', 'a'));
