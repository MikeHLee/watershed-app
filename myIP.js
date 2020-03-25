//npm install canihazip
//https://www.npmjs.com/package/icanhazip
//

var icanhazip = require('icanhazip');
 
icanhazip.IPv4().then(function(myIP) {
  console.log(myIP);
}).catch(function(e) {
  console.error(e.message);
});
