const { get } = require("../../routes/api");

let db;

// a request to the current db.
const request = indexedDB.open('progressive-web-app', 1);

// event handler that updates the version based on the db
// and automatically increments it in the indexdb
request.onupgradeneeded = function (event) {
   const db = event.target.result;
   db.createObjectStore('new_record', { autoIncrement: true });
};

// if the request is successful
request.onsuccess = function (event) {

   // a saved refence to the object store.
   db = event.target.result;

   // if the app is online upload
   if (navigator.onLine) uploadRecord();
};

// if there is an error, log it
request.onerror = function (event) {
   console.log(event.target.errorCode);
};

// a function to save the record
function saveRecord(record) {
   //opens a temporary connection to the object store.
   const transaction = db.transaction(['new_record'], 'readwrite');
   const recordObjectStore = transaction.objectStore('new_record');

   // adds the record to the object store
   recordObjectStore.add(record);

   // logs that the data is saving for later
   console.log(record + 'is saving');
};

function uploadRecord() {
   //opens a temporary connection to the object store.
   const transaction = db.transaction(['new_record'], 'readwrite');
   const recordObjectStore = transaction.objectStore('new_record');

   // gets all of the currently saved data, and stores it.
   const getAll = recordObjectStore.getAll();

   // event listener for if getting all the saved data was successful
   getAll.onsuccess = function () {
      // if there is one item saved
      if (getAll.result.length === 1) {
         //post that item
         fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
               Accept: 'application/json, text/plain, */*',
               'Content-Type': 'application/json'
            }
         })
            .then(response => response.json())
            .then(serverResponse => {
               //if there is an error, throw it
               if(serverResponse.message) throw new Error(serverResponse);

               // creates a temporary connection and clears it because it has been saved.
               const transaction = db.transaction(['new_record'], 'readwrite');
               const recordObjectStore = transaction.objectStore('new_record');
               recordObjectStore.clear();

               //alerts the user that saved data was submitted.
               alert("You are now online. Your progress was updated.");
            })
            .catch(err => console.log(err));
      } 
      // if there is more than 1 item saved
      else if (getAll.result.length > 1) {
         // posts all of them
         fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
               Accept: 'application/json, text/plain, */*',
               'Content-Type': 'application/json'
            }
         })
            .then(response => response.json())
            .then(serverResponse => {
               //if there is an error, throw it
               if(serverResponse.message) throw new Error(serverResponse);

               // creates a temporary connection and clears it because it has been saved.
               const transaction = db.transaction(['new_record'], 'readwrite');
               const recordObjectStore = transaction.objectStore('new_record');
               recordObjectStore.clear();

               //alerts the user that saved data was submitted.
               alert("You are now online. Your progress was updated.");
            })
            .catch(err => console.log(err));
      }
   }
};

window.addEventListener('online', uploadRecord);