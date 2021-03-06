const { app, BrowserWindow } = require('electron')
const electron = require('electron');
const ipc = electron.ipcMain;
const path = require('path');
var request = require('request');
const jsdom = require("jsdom");
const axios = require('axios');
const find = require('local-devices');
const finddeviceIp = require('./test')
const netList = require('network-list');
const packetsCode = require('./js/packetsCode');
const { exec } = require('child_process');
var sensors = [];
var activateAlgorithm = true;
var eewConfigBuffer;
const { JSDOM } = jsdom;

var arrayMiners = [];
// arrayMiners.push({ip: '192.168.100.6'});
var minerStatus = [];
var firstTimeSearching = false;

// for finding devices ip
var os = require('os');
var ip = require('ip');
var net = require('net');
var servers = getServers();

  let sp;
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win;
  
  function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({ 
       width: 1600, height: 800,
       webPreferences: {
            nodeIntegration: true
        }

       }) //, icon: __dirname+'/icons/raiwan.png'
    win.maximize();
    // and load the index.html of the app.
    win.loadFile('index.html')
  
    // Open the DevTools.
    //win.webContents.openDevTools()

    win.webContents.on('did-finish-load', () => {
        setInterval(referesh,30000);
        referesh();
    });
  
    // Emitted when the window is closed.
    win.on('closed', () => {
      win = null;

    });

  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);
  
  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }

  });

function hasProperty(object, key) {
    return object ? hasOwnProperty.call(object, key) : false;
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


function updateMinersState() {
    console.log("updateMinersState");
    if(minerStatus.length >0) {
        sendMinersInfo(minerStatus)
        minerStatus = [];
    } else {
        if(firstTimeSearching) {
            if(win.webContents !== null) {
                win.webContents.send('noMiner');
            }
        }
    }
    for(var i=0; i< arrayMiners.length; i++) {
        readMinerStatus(arrayMiners[i].ip, '80', 'root', 'root');
    }
    firstTimeSearching = true;
}

function readMinerStatus(host,port, username, password) {
    request.get('http://' + host + ':' + port + '/cgi-bin/minerStatus.cgi', {
        'auth': {
            'user': username,
            'pass': password,
            'sendImmediately': false
        }
    }, function (error, response, body) {
        if(error)
        {
            console.log("error");
            // callback(error, null);
            return;
        }

        const frag = JSDOM.fragment(body);
        if(frag.querySelector("#ant_ghs5s") !== null) {
            var totalHashrate = frag.querySelector("#ant_ghs5s").textContent;
            console.log("totalHashrate"); console.log(totalHashrate);
            // miners name
            var minerName = "unknown";
            if( (parseInt(totalHashrate.replace(',','')) > 14000) && (parseInt(totalHashrate.replace(',','')) < 15000) ) {
                minerName = "S9";
            }
            console.log("minerName"); console.log(minerName);
            // miner fan spedd
            var fanCells = frag.querySelectorAll("table#ant_fans tbody tr.cbi-section-table-row td.cbi-value-field");
            var fanSpeeds = [];
            for(var i = 0; i < fanCells.length; i++) {
                if(fanCells[i].textContent !== "0" && fanCells[i].textContent !== "") {
                    fanSpeeds.push( parseFloat(fanCells[i].textContent.replace(',','')) );
                }
            }
            console.log("fanSpeeds");console.log(fanSpeeds);
            // temperture
            var temperture1Array = []; var temperture2Array = [];
            var temperture1 = frag.querySelectorAll("#cbi-table-1-temp");
            var temperture2 = frag.querySelectorAll("#cbi-table-1-temp2");
            for(var i=0; i< temperture1.length; i++) {
                if(temperture1[i].textContent !== "") {
                    temperture1Array.push(temperture1[i].textContent);
                }
            }
            for(var i=0; i< temperture2.length; i++) {
                if(temperture2[i].textContent !== "") {
                    temperture2Array.push(temperture2[i].textContent);
                }
            }
            console.log("temperture1Array"); console.log(temperture1Array);
            console.log("temperture2Array"); console.log(temperture2Array);
            var upTime = frag.querySelector("#ant_elapsed").textContent;
            console.log("upTime"); console.log(upTime);
            minerStatus.push({"ip": host, "minerName": minerName, "temp1": temperture1Array,
                "temp2": temperture2Array, "fanSpeeds": fanSpeeds, "totalHashrate": totalHashrate, "upTime": upTime});
        }
    });
}

function checkInternet(cb) {
    require('dns').lookup('google.com',function(err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
}


function sendMinersInfo() {
    var minersInfo = {"minersInfo": minerStatus};
    var message = JSON.stringify(minersInfo);
    console.log("sendMinersInfo");console.log(message);
    if(win.webContents !== null) {
        win.webContents.send('minersInfo', message);
    }
    axios.post('https://hashbazaar.com/api/remote', minersInfo).then((response) => {
        console.log("sendMinersInfo response"); console.log(response.data);
  }).catch( (error) => {
        console.log("error sendMinersInfo");console.log(error);
  })
};




function referesh() {
    console.log("referesh");
    // example usage:
    checkInternet(function(isConnected) {
        if (isConnected) {
            // connected to the internet
            console.log("connected") ;
            if(win.webContents !== null) {
                win.webContents.send('connected');
            }
            // refresh ip addresses
            arrayMiners = [];
            for(var i=0; i< servers.length; i++) {
              pingServer(servers[i]).then((address) => {
                 console.log("address ip");console.log(address);
                 arrayMiners.push({ip: address});
              });
            }

            // find().then(devices => {
            //     console.log(devices) ;
            //  if(devices.length === 0) {
            //     console.log("devices.length");console.log(devices.length);
            //     if(win.webContents !== null) {
            //         win.webContents.send('noMiner');
            //     }
            //  }
            //  for(var i=0; i< devices.length; i++) {
            //     arrayMiners.push({ip: devices[i].ip});
            //  }

            // });
        } else {
            // not connected to the internet
            console.log("not connected") ;
            if(win.webContents !== null) {
                win.webContents.send('disconnected');
            }
        }
    });
}



// finddeviceIp.findIps().then((response) => {
//     console.log("finde Ips"); console.log(response)
// }).catch((err)=> {
//    console.log(err);
// });

/**
 * Gets the current list of possible servers in the local networks.
 */
function getServers () {
  var interfaces = os.networkInterfaces()
  var result = []
   console.log("interfaces"); console.log(interfaces);
  for (var key in interfaces) {
    var addresses = interfaces[key]
    for (var i = addresses.length; i--;) {
      var address = addresses[i]
      if (address.family === 'IPv4' && !address.internal) {
        var subnet = ip.subnet(address.address, address.netmask);
        console.log("subnet");console.log(subnet);
        var current = ip.toLong(subnet.firstAddress);
        var last = ip.toLong(subnet.lastAddress) - 1;
        while (current++ < last) result.push(ip.fromLong(current))
      }
    }
  }

  return result
}


/**
 * Pings and individual server to update the arp table.
 */
function pingServer (address) {
  console.log("pingServer");
  return new Promise(function (resolve) {
    var socket = new net.Socket()
    socket.setTimeout(10000, timeOut)
    socket.connect(80, address, close)
    socket.once('error', close)

    function close () {
      socket.destroy()
      resolve(address)
    }

    function timeOut () {
      // console.log("timeOut");
      socket.destroy()
      // resolve(address)
    }
  });
}




