const express = require('express');
const app = express();
const port = 3000;


// Body Parser is ExpressJS middleware that allows
// us to parse data from incoming requests. 
var bodyParser = require('body-parser');
app.use(bodyParser.json());

//create placeholder global variables
var temp = 0;


//load desired setpoints
var tempdes = {'TempDes':76} //evantually going to load this info from the client

// This route will respond with the public, static, landing
// page for Oasis at some point. 
app.get('/', (req, res) => res.send('hello world!'));



//this is for saving the data
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'data2.csv',
  header: [
    {id: 't', title: 'Temp'},
  ]
});


// This page will serve the dashboard that users can actually use
// to control the unit. 
app.get('/dashboard', (req, res) => {
        let data = temp;
        res.send(`You sent: ${data}`);
});


var visData = [];
// This route is for the data coming from the unit. 
app.post('/api/heartbeat', (req, res) => {
	let data = req.body;
	console.log(data);
	temp = JSON.stringify(data);
	res.send(temp);
	visData.push({t: data['heat'] });
});

// This route is for the data coming from the unit. 
app.get('/displayData', (req, res) => {
        res.send('fake data: [1,2,3,4]');
});



// for using shell commands, see 
const { exec } = require("child_process");

// convert lastest data to json -> csv -> html-line chart for display
var path = require('path');
app.get('/displayData2', (req, res) => {
	//add data to csv
	csvWriter
		.writeRecords(visData)
		.then(()=> console.log('The CSV file was written successfully'));
	
	//clear visData
	visData=[];

	//convert csv to html
	//https://www.npmjs.com/package/chart-csv
	//using shell commands
	//https://stackabuse.com/executing-shell-commands-with-node-js/
	exec("cat data2.csv | chart-csv > data2.html");


	//visualize data
        res.sendFile(path.join(__dirname +'/data2.html'));

});


// This is the route to send the setpoints to the unit.
app.get('/api/params', (req, res) => {
	let data = tempdes;
	res.send(data);
});


//AJS93 -- added functionality to automatically tell when 
//install: npm install canihazip
var icanhazip = require('icanhazip');
icanhazip.IPv4().then(function(myIP) {
        console.log(`Server running at http://${myIP}:${port}/`);
	//uses
	console.log('dashboard: most resent datum')
	console.log('dashboard: most resent datum')
	console.log('')
	console.log('displayData2: static data chart')
}).catch(function(e) {
        console.error(e.message);
});

//start the server
app.listen(port );

; //why is this here.. it needs to be tho...
