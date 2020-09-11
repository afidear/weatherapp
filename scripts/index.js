var CACHE_NAME = 'weather.app.cache.v1';
var urlsToCache = [
'./',
'index.html',
'/styles/index.css',
'/styles/bootstrap.min.css',
'/scripts/bootstrap.min.js',
'/scripts/jquery.min.js',
'/scripts/popper.min.js',
'/scripts/index.js',
'add.html',
'/image/logo.png',
'/image/icons8-cloud-48.png',
'/image/icons8-24.png'
];

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/index.js').then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });

}

self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

    
self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Cache hit - return response
          if (response) {
            return response;
          }
  
          return fetch(event.request).then(
            function(response) {
              // Check if we received a valid response
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
  
              // IMPORTANT: Clone the response. A response is a stream
              // and because we want the browser to consume the response
              // as well as the cache consuming the response, we need
              // to clone it so we have two streams.
              var responseToCache = response.clone();
  
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
  
              return response;
            }
          );
        })
      );
  });
  
      
      
  
function getDatabase(){
    // In the following line, you should include the prefixes of implementations you want to test.
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // DON'T use "var indexedDB = ..." if you're not in a function.
    // Moreover, you may need references to some window.IDB* objects:
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

    if (!window.indexedDB) {
        console.log("Your browser doesn't support a stable version of IndexedDB. So the software will perform slower.");
    }

    let db = null;
    let dbrequest = window.indexedDB.open("weather.app.db");
    dbrequest.onerror = function(event) {
        console.log("Database connection failed!");
    };
    dbrequest.onsuccess = function(event) {
        console.log("Database connection successful!");
        return event.target.result;
    };
}

async function initializeDb(){
    if(document.location.pathname === '/add.html'){
        console.log('add page');
        const cityCount = localStorage.getItem('cities');
        console.log({cityCount});
        if(cityCount === 0 || !cityCount){
            console.log('About to seed cities');
            //load the cities from the json file into local storage
            const db_file = 'data/cities.json';        
            fetch(db_file)
                .then(resp => resp.json())
                .then(cities => {
                    console.log(`Cities ready for db, first city is ${cities[0].name}`);
                    // console.log('Calling seedDatabase');
                    let seedResult = seedDatabase('cities', cities, 'id', ['name', 'country'], null);
                    // console.log({seedResult});
                    // if(seedResult && seedResult.completed){
                    //     console.log(`Added ${seedResult.count} cities to the database`);
                    // }                    
                })
                .catch(e => {
                    console.log(e);
                });
        }
    }
}
initializeDb();


function seedDatabase(tableName, records, primaryKey, indexes, uniqueIndexes){
    console.log({tableName, fr:records[0], primaryKey, indexes, uniqueIndexes});
    let request = window.indexedDB.open("weather.app.db");
    request.onerror = function(event) {
        console.log("seedDatabase: Database connection failed!");
    };
    console.log(`seedDatabase: Database ready, seeding ${tableName}`);
    request.onupgradeneeded = function(event) {
        console.log(`Running upgrade function for ${tableName}`);
        let db = event.target.result;
      
        let objectStore = db.createObjectStore(tableName, { keyPath: primaryKey });
      
        //create regular indexes
        indexes.forEach( index => {
            objectStore.createIndex("name", index, { unique: false });
        })

        //create unique indexes
        uniqueIndexes.forEach( index => {
            objectStore.createIndex("name", index, { unique: true });
        })
      
        // Use transaction oncomplete to make sure the objectStore creation is 
        // finished before adding data into it.
        objectStore.transaction.oncomplete = function(event) {
          // Store values in the newly created objectStore.
          /*let store = db.transaction(tableName, "readwrite").objectStore(tableName);
          records.forEach(function(record) {
            store.add(record);
          });*/
          let result = addToDatabase(tableName, records);
          console.log({addToDatabaseCallResult: result});
          return result;
        };
    };
}

function addToDatabase(tableName, records){
    let dbrequest = window.indexedDB.open("weather.app.db");
    dbrequest.onerror = function(event) {
        console.log("Database connection failed!");
    };
    dbrequest.onsuccess = function(event) {
        console.log("Database connection successful!");
        let db = event.target.result;
        console.log(`addToDatabase: Database ready, seeding ${tableName}`);
        //console.log(db);
        let transaction = db.transaction(tableName, "readwrite");    
        console.log(transaction);
        let objectStore = transaction.objectStore(tableName);
        console.log(objectStore);
        //let objectStore = db.transaction(tableName, "readwrite").objectStore(tableName);
        let count = 0;
        records.forEach(function(record) {
            var request = objectStore.add(record);
            request.onsuccess = function(event) {
                event.target.result === record.id;
                console.log(`Just saved ${record.name} to db`);
                count++;
            };
        });
        localStorage.setItem(tableName, count);
        // Do something when all the data is added to the database.
        transaction.oncomplete = function(event) {
            console.log("All done!");
            return { completed: true, count, message: 'Records added successfully'};
        };
    
        transaction.onerror = function(event) {
            console.log('An error occured');
            console.log(event);
            return { completed: false, count, message: 'An error occured'};
        };
    }
}

async function getRecord(tableName, recordId){
    let db = await getDatabase();
    if(!db){
        console.log(`Couldn't connect to database task aborted!`);
    }
    console.log(`Database ready, seeding ${tableName}`);
    let transaction = db.transaction(tableName);
    let objectStore = transaction.objectStore(tableName);
    let request = objectStore.get(recordId);
    request.onerror = function(event) {
        console.log(`An error occured while trying to read ${recordId} from ${tableName}`);
        console.log(event);
    };
    request.onsuccess = function(event) {
        return request.result;
    };
}

function buildDataList(tableName, dataList){
    let dbrequest = window.indexedDB.open("weather.app.db");
    dbrequest.onerror = function(event) {
        console.log("Database connection failed!");
        console.log(`Couldn't connect to database build data list task aborted!`);
    };
    dbrequest.onsuccess = function(event) {    
        let db = event.target.result;
        try{
            let objectStore = db.transaction(tableName).objectStore(tableName);
            objectStore.openCursor().onsuccess = function(event) {
                let cursor = event.target.result;
                if (cursor) {
                    let option = document.createElement('option');
                    option.value = `${result.city} -${city.id}`;
                    option.textContent = `${result.city}, ${result.state}, ${result.country}`;
                    dataList.appendChild(option);
                    cursor.continue();
                }
                else {
                    console.log("No more entries!");
                }
            };
        }catch(error){
            console.log(error);
            buildDataListFromFile();
        }
    };
}

function buildDataListFromFile(){
    console.log('building cities from file');
    const db_file = 'data/cities.json';        
    const dataList = document.querySelector('#cities');
    let count = 0;
    fetch(db_file)
        .then(resp => resp.json())
        .then(cities => {
            //cities.forEach( city => {
            for(let i = 0; i < 5000; i++){
                let city = cities[i];
                let option = document.createElement('option');
                console.log(option)
                option.value = `${city.name} -${city.id}`;
                if(city.state){
                    option.textContent = `${city.name}, ${city.state}, ${city.country}`;
                }else{
                    option.textContent = `${city.name}, ${city.country}`;
                }
                dataList.appendChild(option);
                count++;
            }
            //})
            console.log(dataList)
        })
        .catch(e => {
            console.log(e);
        });
}

const key ='913dbf7142450522f990d31bfac5d1a3'
const days = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
//const hours = []

//weather fetcher function
const getWeatherUsingCoordinates = (lat, lon, name) => {
    console.log({lat, lon});
    if(!lat || !lon){
        return;
    }
    let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${key}`
    console.log(url)
    fetch(url)
    .then(res => res.json())
    .then(data => {
        console.log('Full Weather data for ' + name + ' received');
        localStorage.setItem('current.city.uvi', data.current.uvi);
        localStorage.setItem('current.city.dew_point', data.current.dew_point);
        localStorage.setItem('current.city.wind_speed', data.current.wind_speed);
        localStorage.setItem('current.city.wind_deg', data.current.wind_deg);
        localStorage.setItem('current.city.clouds', data.current.clouds);

        ui = document.querySelector('#uvi');
        if(ui)ui.textContent = data.current.uvi;

        ui = document.querySelector('#pop');
        if(ui){
            const pop = 'pop' in data.current ? data.current.pop : 0;
            ui.textContent = pop + '%';
        }
        let this_hour = new Date().getHours();
        let index = 1;
        for(let i = this_hour; i < 48; i+=3){
            let hour = data.hourly[i];
            console.log(hour.weather[0].icon);
            if(hour){
                localStorage.setItem(`current.city.hour.${index}`, hour.temp);
                localStorage.setItem(`current.city.hour.${index}_name`, i);
                localStorage.setItem(`current.city.hour.${index}_imageUrl`, getImageUrl(hour.weather[0].icon));
                localStorage.setItem(`current.city.hour.${index}_imageAlt`, hour.weather[0].description);
            }

            const image = document.querySelector(`#hourly-img-${index}`);
            if(image){
                image.src = getImageUrl(hour.weather[0].icon);
                image.alt = hour.weather[0].description;
                image.title = hour.weather[0].description;
            }

            const lable = document.querySelector(`#hourly-name-${index}`);
            if(lable){
                lable.textContent = index;
            }
            index++;
        }
        index = new Date().getDay();
        for(let i = 0; i < 7; i++){
            let entry = data.daily[i];
            if(entry){
                localStorage.setItem(`current.city.daily.${index}`, entry.temp.day);
                localStorage.setItem(`current.city.daily.${index}_name`, days[index]);
                localStorage.setItem(`current.city.daily.${index}_imageUrl`, getImageUrl(entry.weather[0].icon));
                localStorage.setItem(`current.city.daily.${index}_imageAlt`, entry.weather[0].description);

                const image = document.querySelector(`#daily-img-${i}`);
                if(image){
                    image.src = getImageUrl(entry.weather[0].icon);
                    image.alt = entry.weather[0].description;
                    image.title = entry.weather[0].description;
                }

                const lable = document.querySelector(`#daily-label-${i}`);
                if(lable){
                    lable.textContent = days[index]
                }
            }
            index++;
            if(index >= 6){
                index = 0;
            }
        }
    })
    .catch(error => {
        console.log(error);
    })
}

const getWeatherUsingId = (cityId) => {
    let url = `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${key}`
    console.log(url);
    fetch(url)
    .then(res => res.json())
    .then(data => { 
        console.log('Weather Update for ' + data.name + ' received');
        
        //save weather info to local storage
        localStorage.setItem('current.city.lat', data.coord.lat);
        localStorage.setItem('current.city.lon', data.coord.lon);
        localStorage.setItem('current.city.name', data.name);
        localStorage.setItem('current.city.weather.main', data.weather[0].main);
        localStorage.setItem('current.city.weather.description', data.weather[0].description);
        localStorage.setItem('current.city.weather.icon', data.weather[0].icon);
        localStorage.setItem('current.city.weather.imageUrl', getImageUrl(data.weather[0].icon));
        localStorage.setItem('current.city.main.temp', data.main.temp);
        localStorage.setItem('current.city.main.humidity', data.main.humidity);
        localStorage.setItem('current.city.main.visibility', data.main.visibility);
        localStorage.setItem('current.city.main.wind', data.main.temp);
        localStorage.setItem('current.city.updated', data.dt);
        localStorage.setItem('current.city.weather.icon', data.dt);
        
        //fill out the page
        let ui = document.querySelector('#city');
        if(ui)ui.textContent = data.name;

        ui = document.querySelector('#main_icon');
        if(ui){
            ui.src = getImageUrl(data.weather[0].icon);
            ui.title = data.weather[0].description;
            ui.alt = data.weather[0].description;
        }

        ui = document.querySelector('#temp');
        if(ui)ui.textContent = data.main.temp;

        ui = document.querySelector('#date');
        if(ui)ui.textContent = new Date(data.dt * 1000);

        ui = document.querySelector('#description');
        if(ui)ui.textContent = data.weather[0].description;
       
        
        //get remaining data
        getWeatherUsingCoordinates(data.coord.lat, data.coord.lon, data.name);

    })
    .catch(e => {
        console.log(e);
    })
}

function getImageUrl(icon){
    if(icon)
    return `http://openweathermap.org/img/wn/${icon}@2x.png`;
}

function getCities(name){
    const db_file = 'data/cities.json';    
    const cities = fetch(db_file)
        .then(resp => resp.json())
        .then(cities => {
            console.log(cities[0]);
            return cities.filter(city => {
                city.name.startsWith(name);
            })
        })
        .catch(e => {
            console.log(e)
            return null;
        });
    console.log(cities);
    return cities;
}

document.addEventListener('DOMContentLoaded', (event) => {
    //Ensure that when users start typing, we begin searching the database
    const city_search_box = document.querySelector('#cityname');
    if(city_search_box){
        city_search_box.addEventListener('change', e => {
            console.log(city_search_box.value);
            if(city_search_box.value.length){
                let parts = city_search_box.value.split('-');
                let cityId = '';
                if(parts.length > 1){
                    cityId = parts[parts.length-1];
                }
                if(cityId && isNaN(cityId) === false){
                    //1. Get weather for that city
                    localStorage.setItem('current_city', parts);
                    localStorage.setItem('current_city_id', cityId);
                    window.location = 'index.html?cityId=' + cityId;                
                }
            }
        });
    }

    //build the datalist if we are on the add page
    if(document.location.pathname === '/add.html'){
        const dataList = document.querySelector('#cities');
        if(dataList){
            buildDataList('cities', dataList);            
            console.log(dataList);
        }
    }

    //fetch the weather
    if(document.location.pathname === '/index.html'){
        let cityId = 'cityId';
        let urlParams = new URLSearchParams(window.location.search);
        if(urlParams.has(cityId)){
            let id = urlParams.get(cityId)
            getWeatherUsingId(id);
        }
    }
})

function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
}

function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    var dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

//this function will find city by name
/*async function findCityByName(name){
    const cities = await getCities();
    console.log(typeof(cities));
    for(let i = 0; i < cities.length; i++){
        if(cities[i].name.startsWith(name)){
            console.log(cities[i]);
            return cities[i];
        }
    }
    return null;
    return cities.find(city => {
        city.name.startsWith(name);
    })
}

function findCityById(id){
    const cities = getCities();
    console.log(typeof(cities));
    return cities.find(city => {
        city.id === id;
    })
}*/

//load database from local storage
// const getCitiesFromCache = () => {
//     //get from local storage
//     let cities = localStorage.getItem('cities');
//     if(!cities){
//         cities = JSON.parse(getCities());
//     }    
//     console.log({fn:'cache', 'first':cities[0]});
//     return cities;
// }
