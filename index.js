const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('hello world!'));
app.get('/dashboard', (req, res) => res.send('dashboard'));

app.get('/api/heartbeat', (req, res) => {
	let temp = req.query.temp;
	res.send(`The temperature is ${temp}`);
});

app.listen(port, () => console.log('app is running'));
