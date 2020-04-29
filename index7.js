const express = require('express');
const app = express();
const port = 3000;

var server = require('http').createServer(app);
var io = require('socket.io')(server);


// Body Parser is ExpressJS middleware that allows
// us to parse data from incoming requests.
var bodyParser = require('body-parser');

//app settings?
app.use(bodyParser.json());
app.use(express.static(__dirname + '/node_modules'));

//Page for checking that server is running
app.get('/', (req, res) =>{
        res.send('server running');
});


//create placeholder global variables
var temp = 0;
var hum = 0;

//load desired setpoints
var tempdes = 70 //evantually going to load this info from the client
var humdes = 90

//Page For checking what the temperature is set to
app.get('/desTemp', (req, res)=>{
        res.send('Temperature set to: ' + String(tempdes) + ' degrees \n' + 'Humidity set to: ' + String(humdes) + ' percent');
});


//Page for Setting the temperature
app.get('/setParams', function(req, res,next) {
    res.sendFile(__dirname + '/setParams.html');
});


//this page shows real time data of the last 15 data received
app.use('/realtime', express.static('displayrealtime.html'));

//this page shows the entire dashboard
app.use('/allInOne', express.static('allInOne.html'));


//handles how client enteracts with server, what info it sends
io.on('connection', function(client) {

    console.log('client did something');


    client.on('messages1', function(data) {
	    console.log(data); //prints users input to server log
	    data = parseInt(data); //string to intiger
	    tempdes = data;
    });


    client.on('messages2', function(data) {
            console.log(data); //prints users input to server log
            data = parseInt(data); //string to intiger
	    humdes = data;
    });

});



//
//// for using shell commands, see
const { exec } = require("child_process");

//this is for saving the data
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'data2.csv',
  header: [
          {id: 'temperature', title: 'Temp'},
          {id: 'idealTemp'  , title: 'IdealTemp'},
	  {id: 'humidity'   , title: 'Hum'},
	  {id: 'idealHum'   , title: 'IdealHum'}
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
                        idealTemp: tempdes['TempDes'],
			 humidity: data['hum'],
			 idealHum: humdes['HumDes']});

        //real time data
        var today = new Date();
        io.sockets.emit('temp', {date: (today.getDate()-1)+"-"+(today.getMonth()+1)+"-"+today.getFullYear(), time: (today.getHours())+":"+(today.getMinutes()), temp:data['heat']});
});


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

//
//app.use('/realtime', express.static('displayrealtime.html'));


// This is the route to send the setpoints to the unit.
app.get('/api/params', (req, res) => {
        let data = {'TempDes': tempdes, 'HumDes': humdes};
        res.send(data);
});



//AJS93 -- added functionality to automatically tell when 
//install: npm install canihazip
//Prints info to 
var icanhazip = require('icanhazip');
icanhazip.IPv4().then(function(myIP) {
        console.log('------------------')
        console.log(`Server running at http://${myIP}:${port}/`);
        console.log('------------------')
	console.log('pages:')
        console.log('/ ---- will let you know if server is running')
        console.log('/desTemp ---- will let you know what the desired tempurture is set to')
	console.log('/setParams')
	console.log('/chart')
	console.log('/realtime')
        console.log('------------------')


}).catch(function(e) {
        console.error(e.message);
});



server.listen(3000);

//handleing non existant pages and when something messes up
//https://github.com/sitepoint-editors/node-forms
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})







