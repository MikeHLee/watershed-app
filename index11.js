const express = require('express');
const app = express();
const port = 3000;

var server = require('http').createServer(app);
var io = require('socket.io')(server);

// Body Parser is ExpressJS middleware that allows
// us to parse data from incoming requests.
var bodyParser = require('body-parser');

//filesystem allows us to look at files on the server
var fs = require('fs');

//app settings?
app.use(bodyParser.json());
app.use(express.static(__dirname + '/node_modules'));

//Page for chekcing that server is runnign
app.get('/', (req, res) =>{
        res.send('server running');
});


//default sensor data
var sensorData = {'temp': 0,
		  'hum': 0}

//default desired setpoints
var paramDes = {'tempDes': 70,
		'humDes': 70} //formerly tempdesevantually going to load this info from the client

//Page For checking what the temperature is set to
app.get('/desParams', (req, res)=>{
        res.send('STATUS:' + '<br/>' +
		 'Temperature set to: '+JSON.stringify(paramDes['tempDes'])+' degrees' +'<br/>' +
		 'Humidity set to: '+JSON.stringify(paramDes['humDes'])+' percent' +'<br/>');
});


//Page for Setting the temperature
app.get('/setParams', function(req, res,next) {
    res.sendFile(__dirname + '/setParams1.html');
});


//this page shows real time data of the last 15 data received
app.use('/realtime', express.static('displayrealtime4.html'));


//dashboard that brings it all together. May replace with react later
app.use('/allInOne', express.static('allInOne.html'));

//handles how client enteracts with server, what info it sents (listens for an event from the client)
io.on('connection', function(client) {

    console.log('client did something');

    client.on('messages1', function(data) {
	    console.log(data); //prints users input to server log
	    data = parseInt(data); //string to intiger
	    paramDes['tempDes'] = data; //updates desired temperature
    });

    client.on('messages2', function(data) {
            console.log(data); //prints users input to server log
            data = parseInt(data); //string to intiger
            paramDes['humDes'] = data; //updates desired temperature
    });

});



//
//// for using shell commands, see
const { exec } = require("child_process");

//this is for saving the data
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'data4.csv',
  header: [
          {id: 'Temperature', title: 'Temp'},
          {id: 'idealTemp'  , title: 'IdealTemp'},
	  {id: 'Humidity', title: 'Hum'},
          {id: 'idealHum'  , title: 'IdealHum'}
  ]
});


var visData = [];

// This route is for the data coming from the unit.
app.post('/api/heartbeat', (req, res) => {
        let data = req.body;
        sensorData['temp'] = data['temp'];
	sensorData['hum'] = data['hum'];
        console.log(sensorData);
	res.send(sensorData);

        //add data for csv
        visData.push({	Temperature: sensorData['temp'],
                      	idealTemp: paramDes['tempDes'],
			Humidity: sensorData['hum'],
                        idealHum: paramDes['humDes']}
			);

	//add data to csv
        csvWriter
                .writeRecords(visData)
                .then(()=> console.log('The CSV file was written successfully'));

	//clear visData
        visData=[];

        //real time data
        var today = new Date();

	//emit websockets event for realtime graph
	io.sockets.emit('sensorData',

			{date: (today.getDate()-1)+"-"+(today.getMonth()+1)+"-"+today.getFullYear(),
			time: (today.getHours())+":"+(today.getMinutes()),
			temp: sensorData['temp'],
 			hum: sensorData['hum']}

			);

	var record = fs.readFileSync('data4.csv','utf8')

	console.log(record);

	//emit websockets event for cumulative graph
	io.sockets.emit('cumulativeData', {cumulative: record});
});


// Tell the bodyparser middleware to accept more data
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));;

const uploadImage = async (req, res, next) => {

    try {

        // to declare some path to store your converted image
        //const path = './images/'+Date.now()+'.png';
        const path = './images/pic.jpg';

        let imageString = req.body['image'];

        fs.writeFileSync(path, imageString,  {encoding: 'base64'});
        console.log('new image sent')

        return res.send(path);

    } catch (e) {
        next(e);
    }
}

app.post('/upload/image', uploadImage)


// display image
var path = require('path');
app.get('/image', (req, res) => {

        //see image
        res.sendFile(path.join(__dirname +'/images/pic.jpg'));

});



// convert lastest data to json -> csv -> html-line chart for display
var path = require('path');
app.get('/chart', (req, res) => {
        console.log('user viewing chart')
        //convert csv to html
        //https://www.npmjs.com/package/chart-csv
        //using shell commands
        //https://stackabuse.com/executing-shell-commands-with-node-js/;

        //visualize data
        res.sendFile(path.join(__dirname +'/data4.html'));

});

//
//app.use('/realtime', express.static('displayrealtime.html'));


// This is the route to send the setpoints to the unit.
app.get('/api/params', (req, res) => {
        let data = paramDes;
        res.send(data);
});



//AJS93 -- added functionality to automatically tell when
//install: npm install canihazip
//Prints info to the console
var icanhazip = require('icanhazip');
icanhazip.IPv4().then(function(myIP) {
        console.log('------------------')
        console.log(`Server running at http://${myIP}:${port}/`);
        console.log('------------------')
	console.log('pages:')
        console.log('/ ---- will let you know if server is running')
        console.log('/allInOne provides the master dashboard view')
	console.log('/desParams ---- will let you know what the desired tempurture is set to')
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








