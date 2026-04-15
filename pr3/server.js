const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const file = path.join(__dirname, 'data', 'consumers.json');

function read() {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
}

function write(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get('/api', (req, res) => {
    res.json(read());
});

app.post('/api', (req, res) => {
    const data = read();
    data.push({ id: Date.now(), ...req.body });
    write(data);
    res.json({ ok: true });
});

app.put('/api/:id', (req, res) => {
    let data = read();
    data = data.map(i => i.id == req.params.id ? { ...i, ...req.body } : i);
    write(data);
    res.json({ ok: true });
});

app.delete('/api/:id', (req, res) => {
    const data = read().filter(i => i.id != req.params.id);
    write(data);
    res.json({ ok: true });
});

app.listen(PORT, () => console.log('http://localhost:' + PORT));