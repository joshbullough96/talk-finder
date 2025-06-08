var talksArr = [];
var talkObject = {};
var talkTitles = [];
var activeTalk = {};
var savedItem;

// manualRemoveAllListenedTo('listenedTo') //comment out when done.

function getWildCardLinkText(){
  let text;
  if(navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")) {
    text = 'Gospel Library App'
  } else {
    text = 'churchofjesuschrist.org'
  }
  return text
}

async function fetchData(sheet) {
  try {
    const res = await fetch(`https://getsheet.josh-bullough12.workers.dev?spreadsheet=${sheet.spreadsheet}&sheet=${sheet.sheetName}`);
    if (!res.ok) {
      throw new Error(`Network response was not ok: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    if (!json || !json.values) {
      throw new Error('Invalid data format received from API');
    }
    return json;
  } catch (error) {
    console.error('Error fetching data:', error);
    return { values: [] };
  }
}

function ParseData(data, hasHeaders = true) {

    const headers = hasHeaders ? data.values[0] : null;

    const rows = hasHeaders ? data.values.slice(1) : data.values;

    return [headers, rows];

}

async function loadTalks() { 
  
  const sheet = {
    spreadsheet: 'TalkFinder',
    sheetName: 'Sheet1'
  }

  const data = await fetchData(sheet);

  const [headers, rows] = ParseData(data);

  let lines = [];

  rows.forEach(row => {
    let obj = {};
    const [join, title, speaker, url, youtube, byuspeech, totd] = row;
    lines.push(row);
    obj['title'] = title;
    obj['speaker'] = speaker;
    obj['url'] = url;
    obj['youtube'] = youtube;
    obj['byuspeech'] = byuspeech;
    obj['totd'] = totd;
    talkTitles.push(title);
    talksArr.push(obj)
    talkObject[obj['title'].toLowerCase()] = obj;
  });

  return;

}

function loadRandomTalk() {
  const talkcard = document.getElementById('talkcard');
  const loadingscreen = document.getElementById('loadingScreen');
  const title = document.getElementById('Title');
  const speaker = document.getElementById('Speaker');
  const youtubeLink = document.getElementById('YoutubeLink');
  const ldsLink = document.getElementById('Url');
  const iframe = document.getElementById('TalkIframe');

  loadingscreen.style.display = 'block';
  talkcard.style.display = 'none';

  setTimeout(() => {

    const listenedToArr = getWithExpiry('listenedTo');
    const rand = Math.floor(Math.random() * talksArr.length)
    if(listenedToArr) {
      talksArr = talksArr.filter(x=>!listenedToArr.includes(x.title));
    }

    const talk = talksArr[rand];
    activeTalk = talk;

    title.innerText = talk.title;
    speaker.innerText = talk.speaker;
    youtubeLink.href = talk.youtube;

    if (talk.url == "" && talk.byuspeech == ""){
      ldsLink.style.display = "none"
    }
    else if (talk.url == "") {
      ldsLink.style.display = "flex"
      ldsLink.innerText = 'BYU Speeches'
      ldsLink.href = talk.byuspeech
      iframe.src = 'https://www.churchofjesuschrist.org/?lang=eng'
    } else {
      ldsLink.style.display = "flex"
      ldsLink.innerText = getWildCardLinkText();
      ldsLink.href = talk.url
      iframe.src = talk.url
    }

    // iframe.src = talk.url;
    iframe.style.display = 'block';
    talkcard.style.display = 'block';
    loadingscreen.style.display = 'none';

    return

  }
    , 3000)

}

function searchTalk() {
  const text = document.getElementById('myInput').value;
  try {
    talk = talkObject[text.toLowerCase()]
    if (talk != undefined) {
      const talkcard = document.getElementById('talkcard');
      const loadingscreen = document.getElementById('loadingScreen');
      const title = document.getElementById('Title');
      const speaker = document.getElementById('Speaker');
      const youtubeLink = document.getElementById('YoutubeLink');
      const ldsLink = document.getElementById('Url');
      const iframe = document.getElementById('TalkIframe');

      loadingscreen.style.display = 'block';
      talkcard.style.display = 'none';

      setTimeout(() => {

        activeTalk = talk;
        title.innerText = talk.title;
        speaker.innerText = talk.speaker;
        youtubeLink.href = talk.youtube;

        if (talk.url == "" && talk.byuspeech == ""){
          ldsLink.style.display = "none"
        }
        else if (talk.url == "") {
          ldsLink.style.display = "flex"
          ldsLink.innerText = 'BYU Speeches'
          ldsLink.href = talk.byuspeech
          iframe.src = 'https://www.churchofjesuschrist.org/?lang=eng'
        } else {
          ldsLink.style.display = "flex"
          ldsLink.innerText = getWildCardLinkText();
          ldsLink.href = talk.url
          iframe.src = talk.url
        }

        // iframe.src = talk.url;
        iframe.style.display = 'block';
        talkcard.style.display = 'block';
        loadingscreen.style.display = 'none';
        return

      }
        , 3000)
    } else {
      document.getElementById('myInput').style.border = '2px solid red';
      setTimeout(()=>{
        document.getElementById('myInput').style.border = 'none';
      },2000)
    }
  } catch (e) {
    document.getElementById('myInput').style.border = '1px solid red';
    setTimeout(()=>{
      document.getElementById('myInput').style.border = 'none';
    },2000)
    return
  }

}

function showPlaySavedTalk() {
  const savedTalk = localStorage.getItem('savedTalk');
  if (!savedTalk) {
    // no saved talks yet.
    document.getElementById('savedTalks').style.display = 'none';
  } else {
    document.getElementById('savedTalks').style.display = 'block';
    activeTalk = JSON.parse(savedTalk);
  }
}

function saveTalk() {
  const savedTalk = localStorage.getItem('savedTalk');
  if (savedTalk != null) {
    if (confirm('You already have a talk saved, would you like to save over it?')) {
    localStorage.setItem('savedTalk', JSON.stringify(activeTalk));
    document.getElementById('saveBtn').innerText = 'Saved!'
    setTimeout(()=>{
      document.getElementById('saveBtn').innerText = 'Save This Talk For Later';
      showPlaySavedTalk();
    },1500)
    } else {
      return //they didn't want to everride the saved talk.
    }
  } else {
    localStorage.setItem('savedTalk', JSON.stringify(activeTalk));
    document.getElementById('saveBtn').innerText = 'Saved!'
    setTimeout(()=>{
      document.getElementById('saveBtn').innerText = 'Save This Talk For Later';
      showPlaySavedTalk();
    },3000)
  }
}

function loadSavedTalk() {
  const talkcard = document.getElementById('talkcard');
  const loadingscreen = document.getElementById('loadingScreen');
  const title = document.getElementById('Title');
  const speaker = document.getElementById('Speaker');
  const youtubeLink = document.getElementById('YoutubeLink');
  const ldsLink = document.getElementById('Url');
  const iframe = document.getElementById('TalkIframe');

  loadingscreen.style.display = 'block';
  talkcard.style.display = 'none';

  setTimeout(() => {

    const talk = JSON.parse(localStorage.getItem('savedTalk')); //activeTalk;
    localStorage.removeItem('savedTalk');
    title.innerText = talk.title;
    speaker.innerText = talk.speaker;
    youtubeLink.href = talk.youtube;

    if (talk.url == "" && talk.byuspeech == ""){
      ldsLink.style.display = "none"
    }
    else if (talk.url == "") {
      ldsLink.style.display = "flex"
      ldsLink.innerText = 'BYU Speeches'
      ldsLink.href = talk.byuspeech
      iframe.src = 'https://www.churchofjesuschrist.org/?lang=eng'
    } else {
      ldsLink.style.display = "flex"
      ldsLink.innerText = getWildCardLinkText();
      ldsLink.href = talk.url
      iframe.src = talk.url
    }

    // iframe.src = talk.url;
    iframe.style.display = 'block';
    talkcard.style.display = 'block';
    loadingscreen.style.display = 'none';

    showPlaySavedTalk();

    return

  }
    , 3000)
}

function setWithExpiry(key, value, ttl) {
  const now = new Date();
  const item = {
    value: value.map(item => ({val: item, expiry: now.getTime() + ttl})),
  };
  localStorage.setItem(key, JSON.stringify(item));
}

function updateWithoutExpiry(key, valueObj) {
  const item = {
    value: valueObj.map(x => ({val: x.val, expiry: x.expiry})),
  };
  localStorage.setItem(key, JSON.stringify(item));
}

function manualRemoveAllListenedTo(key) {
  localStorage.removeItem(key);
}

function getWithExpiry(key) {
  const remainingListenedTo = [];
  const itemStr = localStorage.getItem(key);

  if (!itemStr) {
    return null;
  }

  const items = JSON.parse(itemStr).value;
  const now = new Date();

  for (let item of items) {
    if (!(now.getTime() > item.expiry)) {
      remainingListenedTo.push(item);
    }
  }

  updateWithoutExpiry(key, remainingListenedTo);
  return remainingListenedTo.map(x => x.val);
}

function alreadyListened(){
  let listenedToArr = getWithExpiry('listenedTo')
  if(listenedToArr){
    listenedToArr.push(activeTalk.title)
  } else {
    listenedToArr = [activeTalk.title]
  }
  setWithExpiry('listenedTo', listenedToArr, 2592000000);
  alert('This talk has been added to your already listened to stash. It will remain there for 30 days.')
  loadRandomTalk();
}

// function sendInSuggestion(){
//   const suggestion = document.getElementById('suggestion');
//   if(suggestion.value != ''){
//     addSuggestion(suggestion.value)
//   }
// }

// function addSuggestion(suggestion){
//   const date = new Date();
//   const line = suggestion + ',' + date + '\n'
//   const options = {
//     encoding: 'utf8',
//     flag: 'a'
//   }
//   const file = new File([suggestion,date], "suggestion.txt", {
//   type: "text/plain",
// });

//   const writer = new FileWriter(file, { append: true });

//   writer.write(line);

//   writer.close();
// }

///dropdown menu///
function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a, b, i, val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) { return false; }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      let title = arr[i].title;
      let newarr = title.toUpperCase(); //**UPDATED**//
      if (newarr.includes(val.toUpperCase())) { //**UPDATED**//
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        //**UPDATED**//
        // find the index of where the value is found in the string.
        const startindex = newarr.indexOf(val.toUpperCase());
        // store the length of the value.
        const endindex = val.length;

        // add the string up to the point that matches the value sent through.
        if(startindex > 0){
          b.innerHTML += title.substr(0, startindex);
        }
      
        // bold and add the part that matches the value to the part of the array item.
        b.innerHTML += "<strong>" + title.substr(startindex, endindex) + "</strong>";
        
        //this is the text that is left over after what is matched by the value
        const leftOver = (startindex  + endindex) - 0;

        // add the part left onto the div so you can get the full text written out.
        if(leftOver < title.length){
          b.innerHTML += title.substr(leftOver, title.length);
        }
        //**UPDATED**//

        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + title + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function (e) {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName("input")[0].value;
          /*close the list of autocompleted values,
          (or any other open lists of autocompleted values:*/
          closeAllLists();
        });
        a.appendChild(b);
      }
    }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
      increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) { //up
      /*If the arrow UP key is pressed,
      decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

async function calculateBookOfMormonProgress(){

  document.getElementById('loadingScreen2').classList.contains('hidden') ? document.getElementById('loadingScreen2').classList.remove('hidden') : '';
  document.getElementById('calculatedResponseDiv') && !document.getElementById('calculatedResponseDiv').classList.contains('hidden') ? document.getElementById('calculatedResponseDiv').classList.add('hidden') : '';

  await setTimeout(()=>{console.log('waiting')},2000);

  const lastPage = 531;
  const pageOn = document.getElementById('pageOn').value;
  const today = new Date();
  const dayOfTheYear = dayOfYear(today)
  const daysLeftInAYear = 365 - dayOfTheYear;
  const pagesToGo = lastPage - Number(pageOn);
  const percentComplete = (Number(pageOn)/lastPage) * 100;
  const pagesPerDay = roundHalf(pagesToGo/daysLeftInAYear) //(pagesToGo/daysLeftInAYear).toFixed(1);
  
  document.getElementById('pagesLeft').innerText = 'Pages Left: ' + pagesToGo;
  document.getElementById('percentageComplete').innerText = 'Percent Complete: ' +  percentComplete.toFixed(2) + '%';
  document.getElementById('pagesPerDay').innerText = pagesPerDay;
  document.getElementById('slider1').value = pagesPerDay;
  
  fillFinishByDate();

  document.getElementById('calculatedResponseDiv') && document.getElementById('calculatedResponseDiv').classList.contains('hidden') ? document.getElementById('calculatedResponseDiv').classList.remove('hidden') : '';
  document.getElementById('loadingScreen2') && !document.getElementById('loadingScreen2').classList.contains('hidden') ? document.getElementById('loadingScreen2').classList.add('hidden') : '';
  
  return pagesPerDay

}

function roundHalf(num) {
    return Math.ceil(num*2)/2;
}

function dayOfYear(date) {
  // Create a new date object for the first day of the year
  var firstDay = new Date(date.getFullYear(), 0, 1);
  // Calculate the difference in milliseconds between the given date and the first day
  var diff = date - firstDay;
  // Convert the difference to days and round down
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  // Return the day in a year, adding 1 since the first day is 1 and not 0
  return day + 1;
}

function finishByDate(pageOn, pagesPerDay) {
  // Create a new date object for the current date
  var today = new Date();
  // Get the days left in a year
  var daysLeftInAYear = 365 - dayOfYear(today);
  // Get the pages left to read
  var pagesLeft = 531 - Number(pageOn);
  // Calculate how many days it will take to finish reading
  var daysToFinish = Math.ceil(pagesLeft / pagesPerDay);
  // Set the date to the future date by adding the days to finish
  today.setDate(today.getDate() + daysToFinish);
  // Format the date as yyyy-mm-dd
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Months are zero-based
  var day = today.getDate();
  // Add leading zeros if needed
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;
  // Return the formatted date
  return month + "/" + day + "/" + year;
}

function fillFinishByDate(){
    const pageOn = document.getElementById('pageOn').value;
    const pagesPerDay = document.getElementById('slider1').value;
    const finishDate = finishByDate(pageOn, pagesPerDay);
    document.getElementById('finishByDate').innerText = finishDate;
}

function loadTalkOfTheDay(){

      const talkcard = document.getElementById('talkcard');
      const loadingscreen = document.getElementById('loadingScreen');
      const title = document.getElementById('Title');
      const speaker = document.getElementById('Speaker');
      const youtubeLink = document.getElementById('YoutubeLink');
      const ldsLink = document.getElementById('Url');
      const iframe = document.getElementById('TalkIframe');
      // const text = 'Motions of a Hidden Fire';
      const today = new Date().toLocaleDateString();
      loadingscreen.style.display = 'block';
      talkcard.style.display = 'none';

      setTimeout(() => {
      talk = talksArr.find(x => x.totd === today) || talksArr[0]; //talkObject[text.toLowerCase()
      
      activeTalk = talk;
      title.innerText = talk.title;
      speaker.innerText = talk.speaker;
      youtubeLink.href = talk.youtube;

      ldsLink.style.display = "flex"
      ldsLink.innerText = getWildCardLinkText();
      ldsLink.href = talk.url
      iframe.src = talk.url

      // iframe.src = talk.url;
      iframe.style.display = 'block';
      talkcard.style.display = 'block';
      loadingscreen.style.display = 'none';
      return
      }
      , 3000)
}

const form = document.querySelector('form');
const username = document.getElementById('name');
const email = document.getElementById('email');
const message = document.getElementById('message');


showPlaySavedTalk();

loadTalks().then(() => {
  /*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
  autocomplete(document.getElementById("myInput"), talksArr);
});


form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!username.value || !email.value || !message.value) {
        alert('Please fill in all fields');
        return;
    }
    if (!isValidEmail(email.value)) {
        alert('Please enter a valid email');
        return;
    }
    alert(`Name: ${username.value}\nEmail: ${email.value}\nMessage: ${message.value}`);
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}