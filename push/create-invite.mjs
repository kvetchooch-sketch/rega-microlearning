// Operator-only: requires the owner's authenticated Wrangler. Never shipped to the client.
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const wrangler=process.argv[2];
if(!wrangler){console.error('Usage: node push/create-invite.mjs PATH_TO_WRANGLER_JS [--remote]');process.exit(1);}
const code=randomBytes(24).toString('base64url'),hash=createHash('sha256').update(code).digest('hex'),expires=Date.now()+7*86400000;
const sql=`INSERT INTO invitations(code_hash,expires_at) VALUES ('${hash}',${expires})`;
const result=spawnSync(process.execPath,[wrangler,'d1','execute','rega-push',process.argv.includes('--remote')?'--remote':'--local','--command',sql],{cwd:fileURLToPath(new URL('./',import.meta.url)),stdio:['ignore','pipe','pipe'],encoding:'utf8'});
if(result.error||result.status!==0){console.error('Invitation was not created. Check Wrangler authentication, migrations and permissions.');process.exit(1);}
console.log('Single-device invitation, valid until '+new Date(expires).toISOString()+':\n'+code+'\nShare privately. Do not commit this code.');
