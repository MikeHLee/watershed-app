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

app.get('/desTemp', (req, res)=>{
	res.send(tempdes);
});


// This route will respond with the public, static, landing
// page for Oasis at some point. 
app.get('/', (req, res) =>{ 
	res.send('server running');
	//res.send('--------------');
	//res.send('check out: chart/ for static full time line chart of temperature readings')
	//	res.send('check out: realtime/ for realtime data of the last 15 temperature readings')

	
});



//this is for saving the data
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'data2.csv',
  header: [
	  {id: 'temperature', title: 'Temp'},
	  {id: 'idealTemp'  , title: 'IdealTemp'}
  ]
});



var visData = [];
// This route is for the data coming from the unit. 
app.post('/api/heartbeat', (req, res) => {
	let data = req.body;
	console.log(data);
	temp = JSON.stringify(data);
	res.send(temp);

	//add data for csv
	visData.push({temperature: data['heat'],
			idealTemp: tempdes['TempDes']});


	//real time data
	var today = new Date();
	io.sockets.emit('temp', {date: (today.getDate()-1)+"-"+(today.getMonth()+1)+"-"+today.getFullYear(), time: (today.getHours())+":"+(today.getMinutes()), temp:data['heat']});
});



// for using shell commands, see 
const { exec } = require("child_process");


// convert lastest data to json -> csv -> html-line chart for display
var path = require('path');
app.get('/chart', (req, res) => {
	//add data to csv
	csvWriter
		.writeRecords(visData)
		.then(()=> console.log('The CSV file was written successfully'));

	
	console.log('user viewing chart')
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
        console.log('------------------')
	console.log(`Server running at http://${myIP}:${port}/`);
	console.log('------------------')
	console.log('check out: chart/ for static full time line chart of temperature readings')
        console.log('check out: realtime/ for realtime data of the last 15 temperature readings')
	console.log('------------------')


}).catch(function(e) {
        console.error(e.message);
});



//start the server
var server = require('http').createServer(app);
//Client setting temperature variable 
var io = require('socket.io')(server); //Bind socket.io to our express server.


var server = app.listen(3000, () => {})


app.use('/realtime', express.static('displayrealtime.html')); //Send index.html page on GET /

//app.use('/setTemp', express.static('setTemp.html'));
app.use(express.static(__dirname + '/node_module'));


app.get('/setTemp', function(req, res,next) {
    res.sendFile(__dirname + '/setTemp.html');
});

io.on('connection', function(client) {
	client.on('set', function(data) {
                console.log(data);
        });
});

//server.listen(3000)

//handleing non existant pages and when something messes up
//https://github.com/sitepoint-editors/node-forms
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})



