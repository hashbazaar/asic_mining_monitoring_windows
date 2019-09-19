var ping = require('ping');

var devices = [];

findIps = function () {
    var i=0;  devices = [];
  return ( new Promise(function(resolve, reject) {
      // not taking our time to do the job
      for(i=0; i< 1; i++) {
          setTimeout( function (i) {
              var subnet =  '192.168.'+i;
              if(i===256) {
                  resolve(devices);
              } else {
                  getPingSubnet(subnet);
              }
          }, 10000 * i, i);
      }
       // immediately give the result: 123
  }));
}




// hosts.forEach(function(host){
//     ping.sys.probe(host, function(isAlive){
//         var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
//         console.log(msg);
//     });
// });


function getPingSubnet(subnet) {
    console.log("getPingSubnet");console.log(subnet);
    for(var j=0; j<256; j++) {
        var host = subnet+'.'+j ;
        // console.log(host)
        getPing(host);
    }
}

function getPing(host) {
    console.log(host);
    ping.sys.probe(host, {
        timeout: 3,
    }, function(isAlive){
        var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        if(isAlive) {console.log(msg);devices.push(host);}

    });
}

findIps();