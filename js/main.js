const electron = require("electron");
// const notifier = require('node-notifier');
var sensorCounter = 0;
var connected = true;
var firstTime = false;


// Get the modal
var modal = document.getElementById("Modal-mv");

// Get the <span> element that closes the modal
// var span = document.getElementsByClassName("close-mv")[0];

// When the user clicks on <span> (x), close the modal
// span.onclick = function() {
//     modal.style.display = "none";
// };

// When the user clicks anywhere outside of the modal, close it
// window.onclick = function(event) {
//     if (event.target == modal) {
//         modal.style.display = "none";
//     }
// }
//
function notFound() {
    modal.style.display = "block";
    $('#modalHeader').removeClass('greenBackground');
    $('#modalHeader').addClass('redBackground');
    $('#waitingModal').hide();
    $('#disconnectedModal').hide();
    $('#notFoundModal').show();
    $('#modalHeader h2').text("متاسفانه دستگاهی یافت نشد.");
}

function showSearchingModal() {
    modal.style.display = "block";
    $('#modalHeader').removeClass('redBackground');
    $('#modalHeader').addClass('greenBackground');
    $('#notFoundModal').hide();
    $('#disconnectedModal').hide();
    $('#waitingModal').show();
    $('#modalHeader h2').text("در حال جست و جو دستگاه ها");
}


function disconnected() {
    modal.style.display = "block";
    $('#modalHeader').removeClass('greenBackground');
    $('#modalHeader').addClass('redBackground');
    $('#notFoundModal').hide();
    $('#waitingModal').hide();
    $('#disconnectedModal').show();
    $('#modalHeader h2').text("اینترنت قطع است");
}
// search btn
const searchBtn = document.getElementById('searchBtn');

searchBtn.addEventListener('click', function () {
    showSearchingModal();
});

// connected
ipc.on('connected',function(event,arg) {
    if(!firstTime) {showSearchingModal();firstTime = true;}
    if(!connected) {
        console.log("connected");
        showSearchingModal();
    }
    connected = true;
});

// disconnected
ipc.on('disconnected',function(event,arg) {
    if(!firstTime) {disconnected();firstTime = true;}
    if(connected) {
        console.log("disconnected");
        disconnected();
    }
    connected = false;
});

// noMiner
ipc.on('noMiner',function(event,arg) {
    notFound();
});
