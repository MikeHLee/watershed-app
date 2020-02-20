const express = require('express');
const app = express();
const port = 3000;

// Body Parser is ExpressJS middleware that allows
// us to parse data from incoming requests. 
var bodyParser = require('body-parser');
app.use(bodyParser.json());

// This route will respond with the public, static, landing
// page for Oasis at some point. 
app.get('/', (req, res) => res.send('hello world!'));

// This page will serve the dashboard that users can actually use
// to control the unit. 
app.get('/dashboard', (req, res) => res.send('dashboard'));

// This route is for the data coming from the unit. 
app.post('/api/heartbeat', (req, res) => {
	let data = req.body;
	console.log(data);
	res.send(`You sent: ${JSON.stringify(data)}`);
});

app.listen(port, () => console.log('app is running'));
