//https://stackabuse.com/reading-and-writing-csv-files-with-node-js/

const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const csvWriter = createCsvWriter({
  path: 'data2.csv',
  header: [
    {id: 'temp', title: 'Temp'}
  ]
});

var data = [];


//https://www.geeksforgeeks.org/how-to-add-an-object-to-an-array-in-javascript/
data.push({temp:73});

csvWriter
  .writeRecords(data)
  .then(()=> console.log('The CSV file was written successfully'));
