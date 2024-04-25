const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

if (!process.env.BW_SERVER) throw Error("ENV BW_SERVER required.");
if (!process.env.BW_CLIENTID) throw Error("ENV BW_CLIENTID required.");
if (!process.env.BW_CLIENTSECRET) throw Error("ENV BW_CLIENTSECRET required.");
if (!process.env.BW_PASSWORD) throw Error("ENV BW_PASSWORD required.");
if (!process.env.KP_PATH) throw Error("ENV KP_PATH required.");

const dir = path.dirname(process.env.KP_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const tempPath = `${dir}/temp`;

function createDB() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        try {
            const child = spawn('keepassxc-cli', ['db-create', '-p', tempPath]);
            child.stdout.on('data', (data) => {
                const prompt = data.toString();
                if (prompt.includes('Success')){ child.kill('SIGINT'); return resolve(true);}
            });
            child.stderr.on('data', (data) => {
              const prompt = data.toString();
              if (prompt.includes('password')) return child.stdin.write(`${process.env.BW_PASSWORD}\n`);
            });
        } catch (e) { reject(e); }
    });
}

function createFolder(name) {
    return new Promise((resolve, reject) => {
        try {
            const child = spawn('keepassxc-cli', ['mkdir', tempPath, name]);
            child.stdout.on('data', (data) => {
                const prompt = data.toString();
                if (prompt.includes('Success')){ child.kill('SIGINT'); return resolve(true);}
            });
            child.stderr.on('data', (data) => {
              const prompt = data.toString();
              if (prompt.includes('password')) return child.stdin.write(`${process.env.BW_PASSWORD}\n`);
            });
        } catch (e) { reject(e); }
    });
}

function createEntry(name, username, password, url, notes) {
    return new Promise((resolve, reject) => {
        try {
            const params = [];
            if (username) params.push(`-u ${username}`);
            if (url){ params.push('--url'); params.push(url); }
            if (notes){ params.push('--notes'); params.push(notes); }
            const child = spawn('keepassxc-cli', [ 'add', '-p', tempPath, name, ...params ]);
            child.stdout.on('data', (data) => {
                const prompt = data.toString();
                if (prompt.includes('Success')){ child.kill('SIGINT'); return resolve(true);}
                if (prompt.includes('password for new entry')) return child.stdin.write(`${password}\n`);
            });
            child.stderr.on('data', (data) => {
              const prompt = data.toString();
              if (prompt.includes('password')) return child.stdin.write(`${process.env.BW_PASSWORD}\n`);
            });
        } catch (e) { reject(e); }
    });
}

function execProm(command, allowedErr = []) {
    return new Promise((resolve, reject) => {
        try {
            exec(command, function(err, stdout, stderr){
                if (stderr||err) {
                    let allowed = false;
                    for (const err of allowedErr) {
                        if ((stderr||err).includes(err)) allowed = true;
                    } if (!allowed) return reject(stderr||err);
                } return resolve(stdout);
            });
        } catch (e) { reject(e); }
    });
}

async function init() {
    await execProm(`bw config server ${process.env.BW_SERVER}`, ['creating']);
    console.log(`Server set to ${process.env.BW_SERVER}.`);
    await execProm('bw logout', ['You are not logged in']);
    await execProm('bw login --apikey', ['logged in']);
    console.log(`Logged in as ${process.env.BW_CLIENTID}.`);
    await execProm('bw lock');
    const session = await execProm('bw unlock --passwordenv BW_PASSWORD');
    if (!(session).includes('BW_SESSION="')) throw Error(session);
    console.log(`Vault unlocked.`);
    const BW_SESSION = session.split('BW_SESSION="')[1].split('"')[0];
    process.env.BW_SESSION = BW_SESSION;
    await createDB();
    console.log(`${tempPath} created.`);
    const list_folders = await execProm('bw list folders');
    const folder_json = JSON.parse(list_folders)||[];
    const folders = {};
    console.log(`${folder_json.length} folders to create.`);
    for (const folder of folder_json) {
        if (!folder.id||!folder.name) continue;
        folders[folder.id] = folder.name;
        await createFolder(folder.name);
    }
    const list_items = await execProm('bw list items');
    const item_json = JSON.parse(list_items)||[];
    console.log(`${item_json.length} items to create.`);
    for (const item of item_json) {
        const name = item.folderId ? `${folders[item.folderId]}/${item.name}` : item.name;
        const url = item.login.uris[0].uri;
        const note = `${item.notes||""}\n${JSON.stringify(item, null, 2)}`
        await createEntry(name, item.login.username, item.login.password, url, note );
    }
    if (fs.existsSync(process.env.KP_PATH)) fs.unlinkSync(process.env.KP_PATH);
    fs.renameSync(tempPath, process.env.KP_PATH);
    console.log(`${tempPath} renamed to ${process.env.KP_PATH}.`);
    await execProm(`bw lock`);
    console.log(`Vault locked.`);
    await execProm(`bw logout`);
    console.log(`Logged out.`);
}

init();