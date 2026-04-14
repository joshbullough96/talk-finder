var talksArr = [];
var talkObject = {};
var talkTitles = [];
var activeTalk = {};
var savedItem;
let selectedTalkType = '';
let renderTalkToken = 0;
const monthOrder = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december'
];
const monthLabels = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

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

function showAppAlert({ title = 'Heads up', text = '', icon = 'info', confirmButtonText = 'Okay' } = {}) {
  if (typeof Swal === 'undefined') {
    alert(text || title);
    return Promise.resolve();
  }

  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    buttonsStyling: false,
    customClass: {
      popup: 'talk-swal',
      title: 'talk-swal-title',
      confirmButton: 'talk-swal-confirm'
    }
  });
}

function showAppConfirm({
  title = 'Are you sure?',
  text = '',
  icon = 'question',
  confirmButtonText = 'Continue',
  cancelButtonText = 'Cancel'
} = {}) {
  if (typeof Swal === 'undefined') {
    return Promise.resolve({ isConfirmed: confirm(text || title) });
  }

  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: 'talk-swal',
      title: 'talk-swal-title',
      confirmButton: 'talk-swal-confirm',
      cancelButton: 'talk-swal-cancel'
    }
  });
}

function applyTalkMedia(talk, youtubeLink, ldsLink, iframe) {
  const youtube = (talk.youtube || '').trim();
  const url = (talk.url || '').trim();
  const byuSpeech = (talk.byuspeech || '').trim();

  if (youtube) {
    youtubeLink.style.display = 'flex';
    youtubeLink.href = youtube;
  } else {
    youtubeLink.style.display = 'none';
    youtubeLink.removeAttribute('href');
  }

  if (!url && !byuSpeech) {
    ldsLink.style.display = 'none';
    ldsLink.removeAttribute('href');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    return;
  }

  ldsLink.style.display = 'flex';

  if (!url) {
    ldsLink.innerText = 'BYU Speeches';
    ldsLink.href = byuSpeech;
    iframe.style.display = 'block';
    iframe.src = 'https://www.churchofjesuschrist.org/?lang=eng';
    return;
  }

  ldsLink.innerText = getWildCardLinkText();
  ldsLink.href = url;
  iframe.style.display = 'block';
  iframe.src = url;
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

function normalizeSearchText(text) {
  return (text || '').trim().toLowerCase();
}

function normalizeTypeValue(typeValue) {
  const normalizedType = normalizeSearchText(typeValue);

  if (normalizedType === 'general conference' || normalizedType === 'conference' || normalizedType === 'gc') {
    return 'general conference';
  }

  if (normalizedType === 'devo' || normalizedType === 'devotional' || normalizedType === 'devotionals') {
    return 'devo';
  }

  return normalizedType;
}

function getTypeLabel(typeValue) {
  const normalizedType = normalizeTypeValue(typeValue);

  if (normalizedType === 'general conference') {
    return 'General Conference';
  }

  if (normalizedType === 'devo') {
    return 'Devotionals';
  }

  return typeValue;
}

function getMonthLabel(monthValue) {
  const normalizedMonth = normalizeSearchText(monthValue);
  const monthNumber = Number(normalizedMonth);

  if (!Number.isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    return monthLabels[monthNumber - 1];
  }

  const monthIndex = monthOrder.indexOf(normalizedMonth);
  if (monthIndex >= 0) {
    return monthLabels[monthIndex];
  }

  return monthValue;
}

function normalizeMonthValue(monthValue) {
  return normalizeSearchText(getMonthLabel(monthValue));
}

function parseDateAdded(dateText) {
  if (!dateText) {
    return null;
  }

  const parsedDate = new Date(dateText);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function getMostRecentlyAddedTalk() {
  const talksWithDates = talksArr
    .filter(talk => talk.dateAdded)
    .map(talk => ({
      talk,
      parsedDate: parseDateAdded(talk.dateAdded)
    }))
    .filter(item => item.parsedDate);

  if (talksWithDates.length === 0) {
    return null;
  }

  talksWithDates.sort((a, b) => b.parsedDate - a.parsedDate);
  return talksWithDates[0].talk;
}

function getCalendarDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function hashString(text) {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getTalkOfTheDay(date = new Date()) {
  if (talksArr.length === 0) {
    return null;
  }

  const dateKey = getCalendarDateKey(date);
  const talkIndex = hashString(dateKey) % talksArr.length;
  return talksArr[talkIndex];
}

function setSelectOptions(selectId, placeholder, values) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">${placeholder}</option>`;

  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function getUniqueValues(items, key) {
  return [...new Set(items
    .map(item => (item[key] || '').trim())
    .filter(Boolean))];
}

function sortMonths(months) {
  return [...months].sort((a, b) => {
    return monthOrder.indexOf(normalizeMonthValue(a)) - monthOrder.indexOf(normalizeMonthValue(b));
  });
}

function sortYears(years) {
  return [...years].sort((a, b) => Number(b) - Number(a));
}

function getCurrentBrowseFilters() {
  return {
    type: selectedTalkType,
    month: document.getElementById('monthSelect')?.value || '',
    year: document.getElementById('yearSelect')?.value || '',
    author: document.getElementById('authorSelect')?.value || ''
  };
}

function getTalksMatchingFilters({
  type = selectedTalkType,
  month = '',
  year = '',
  author = ''
} = {}) {
  return talksArr.filter(talk => {
    const sameType = !type || normalizeTypeValue(talk.type) === normalizeTypeValue(type);
    const sameMonth = !month || normalizeMonthValue(talk.month) === normalizeMonthValue(month);
    const sameYear = !year || normalizeSearchText(talk.year) === normalizeSearchText(year);
    const sameAuthor = !author || normalizeSearchText(talk.speaker) === normalizeSearchText(author);

    return sameType && sameMonth && sameYear && sameAuthor;
  });
}

function getMonthOptions(filters = getCurrentBrowseFilters()) {
  return sortMonths(getUniqueValues(getTalksMatchingFilters({ ...filters, month: '' }), 'month')).map(getMonthLabel);
}

function getYearOptions(filters = getCurrentBrowseFilters()) {
  return sortYears(getUniqueValues(getTalksMatchingFilters({ ...filters, year: '' }), 'year'));
}

function getAuthorOptions(filters = getCurrentBrowseFilters()) {
  return getUniqueValues(getTalksMatchingFilters({ ...filters, author: '' }), 'speaker').sort((a, b) => a.localeCompare(b));
}

function applyBrowseSelectOptions(selectId, placeholder, values, selectedValue) {
  const select = document.getElementById(selectId);

  if (!select) {
    return;
  }

  setSelectOptions(selectId, placeholder, values);
  select.disabled = values.length === 0;
  select.value = values.includes(selectedValue) ? selectedValue : '';
}

function updateBrowseFilterAvailability() {
  const filterSearchBtn = document.getElementById('filterSearchBtn');
  const { type, month, year, author } = getCurrentBrowseFilters();

  if (!filterSearchBtn) {
    return;
  }

  filterSearchBtn.disabled = !type && !month && !year && !author;
}

function syncBrowseFilterOptions() {
  const filters = getCurrentBrowseFilters();
  let previousSnapshot = '';
  let nextSnapshot = JSON.stringify(filters);

  while (previousSnapshot !== nextSnapshot) {
    previousSnapshot = nextSnapshot;

    const authorOptions = getAuthorOptions(filters);
    if (filters.author && !authorOptions.includes(filters.author)) {
      filters.author = '';
    }

    const monthOptions = getMonthOptions(filters);
    if (filters.month && !monthOptions.includes(filters.month)) {
      filters.month = '';
    }

    const yearOptions = getYearOptions(filters);
    if (filters.year && !yearOptions.includes(filters.year)) {
      filters.year = '';
    }

    nextSnapshot = JSON.stringify(filters);
  }

  applyBrowseSelectOptions('monthSelect', 'Choose Month', getMonthOptions(filters), filters.month);
  applyBrowseSelectOptions('yearSelect', 'Choose Year', getYearOptions(filters), filters.year);
  applyBrowseSelectOptions('authorSelect', 'Choose Author', getAuthorOptions(filters), filters.author);
  updateBrowseFilterAvailability();
}

function updateTypeButtons() {
  const typeButtons = document.querySelectorAll('.chip-button[data-type]');
  typeButtons.forEach(button => {
    const isActive = normalizeTypeValue(button.dataset.type) === selectedTalkType;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function updateTypeSelectionStatus() {
  const status = document.getElementById('typeSelectionStatus');

  if (!status) {
    return;
  }

  if (!selectedTalkType) {
    status.innerText = 'Collection is optional. Choose one to narrow the filters below.';
    return;
  }

  status.innerText = `${getTypeLabel(selectedTalkType)} selected. The filters below are now narrowed to this collection.`;
}

function loadMostRecentTalk() {
  const recentTalk = getMostRecentlyAddedTalk();

  if (!recentTalk) {
    showAppAlert({
      title: 'Nothing Recent Yet',
      text: 'No recently added talk is available right now.',
      icon: 'info'
    });
    return;
  }

  renderTalk(recentTalk);
}

function loadTalkOfTheDay() {
  const talkOfTheDay = getTalkOfTheDay();

  if (!talkOfTheDay) {
    showAppAlert({
      title: 'Nothing To Load Yet',
      text: 'No talk of the day is available right now.',
      icon: 'info'
    });
    return;
  }

  renderTalk(talkOfTheDay);
}

function selectTalkType(typeValue) {
  const normalizedType = normalizeTypeValue(typeValue);

  if (selectedTalkType === normalizedType) {
    selectedTalkType = '';
    syncBrowseFilterOptions();
    updateTypeButtons();
    updateTypeSelectionStatus();
    return;
  }

  selectedTalkType = normalizedType;
  syncBrowseFilterOptions();
  updateTypeButtons();
  updateTypeSelectionStatus();
}

function initializeBrowseFilters() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  const authorSelect = document.getElementById('authorSelect');
  const typeButtons = document.querySelectorAll('.chip-button[data-type]');
  const recentButton = document.getElementById('recentTalkBtn');
  const talkOfDayButton = document.getElementById('talkOfDayBtn');

  syncBrowseFilterOptions();
  updateTypeButtons();
  updateTypeSelectionStatus();

  typeButtons.forEach(button => {
    button.addEventListener('click', function () {
      selectTalkType(this.dataset.type);
    });
  });

  if (recentButton) {
    recentButton.addEventListener('click', function () {
      loadMostRecentTalk();
    });
  }

  if (talkOfDayButton) {
    talkOfDayButton.addEventListener('click', function () {
      loadTalkOfTheDay();
    });
  }

  monthSelect.addEventListener('change', function () {
    syncBrowseFilterOptions();
  });

  yearSelect.addEventListener('change', function () {
    syncBrowseFilterOptions();
  });

  authorSelect.addEventListener('change', function () {
    syncBrowseFilterOptions();
  });
}

function setTalkLoadingState(isLoading) {
  const talkcard = document.getElementById('talkcard');

  if (!talkcard) {
    return;
  }

  talkcard.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  talkcard.classList.toggle('is-loading', isLoading);
}

function scrollToLoadedTalk() {
  const talkcard = document.getElementById('talkcard');

  if (!talkcard || !window.matchMedia('(max-width: 760px)').matches) {
    return;
  }

  const activeElement = document.activeElement;
  if (activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeElement.tagName)) {
    activeElement.blur();
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.setTimeout(() => {
    const top = Math.max(talkcard.getBoundingClientRect().top + window.scrollY - 16, 0);
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, 140);
}

function renderTalk(talk) {
  const talkcard = document.getElementById('talkcard');
  const title = document.getElementById('Title');
  const speaker = document.getElementById('Speaker');
  const youtubeLink = document.getElementById('YoutubeLink');
  const ldsLink = document.getElementById('Url');
  const iframe = document.getElementById('TalkIframe');
  const currentToken = ++renderTalkToken;

  talkcard.style.display = 'block';
  setTalkLoadingState(true);

  activeTalk = talk;
  title.innerText = talk.title;
  speaker.innerText = talk.speaker;
  applyTalkMedia(talk, youtubeLink, ldsLink, iframe);
  scrollToLoadedTalk();

  if (iframe.style.display === 'none' || iframe.src === 'about:blank') {
    requestAnimationFrame(() => {
      if (currentToken === renderTalkToken) {
        setTalkLoadingState(false);
      }
    });
    return;
  }

  const finishLoading = () => {
    if (currentToken === renderTalkToken) {
      setTalkLoadingState(false);
    }
  };

  iframe.addEventListener('load', finishLoading, { once: true });
  setTimeout(finishLoading, 900);
}

function searchByFilters() {
  const filters = getCurrentBrowseFilters();

  if (!filters.type && !filters.month && !filters.year && !filters.author) {
    showAppAlert({
      title: 'Choose a Filter',
      text: 'Choose a collection, month, year, or author first.',
      icon: 'warning'
    });
    return;
  }

  const matches = getTalksMatchingFilters(filters);

  if (matches.length === 0) {
    showAppAlert({
      title: 'No Matches Found',
      text: 'No talks matched those filters.',
      icon: 'info'
    });
    return;
  }

  const randomMatch = matches[Math.floor(Math.random() * matches.length)];
  renderTalk(randomMatch);
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
    const [title, speaker, url, youtube, byuspeech, dateAdded, month, year, type] = row;
    lines.push(row);
    obj['title'] = title;
    obj['speaker'] = speaker;
    obj['url'] = url;
    obj['youtube'] = youtube;
    obj['byuspeech'] = byuspeech;
    obj['dateAdded'] = dateAdded;
    obj['month'] = month;
    obj['year'] = year;
    obj['type'] = type;
    talkTitles.push(title);
    talksArr.push(obj)
    talkObject[normalizeSearchText(obj['title'])] = obj;
  });

  return;

}

function loadRandomTalk() {
  const listenedToArr = getWithExpiry('listenedTo');
  let availableTalks = talksArr;

  if (listenedToArr) {
    availableTalks = talksArr.filter(x => !listenedToArr.includes(x.title));
  }

  if (availableTalks.length === 0) {
    showAppAlert({
      title: 'No Talks Available',
      text: 'There are no talks available right now. Try clearing your listened list.',
      icon: 'warning'
    });
    return;
  }

  const rand = Math.floor(Math.random() * availableTalks.length);
  const talk = availableTalks[rand];
  renderTalk(talk);

}

function searchTalk() {
  const text = document.getElementById('myInput').value;
  try {
    let talk = talkObject[normalizeSearchText(text)];
    if (talk != undefined) {
      renderTalk(talk);
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
    document.getElementById('savedTalks').style.display = 'inline-flex';
    activeTalk = JSON.parse(savedTalk);
  }
}

async function saveTalk() {
  const savedTalk = localStorage.getItem('savedTalk');
  if (savedTalk != null) {
    const result = await showAppConfirm({
      title: 'Replace Saved Talk?',
      text: 'You already have a talk saved. Do you want to replace it with this one?',
      icon: 'question',
      confirmButtonText: 'Replace It',
      cancelButtonText: 'Keep Current'
    });

    if (!result.isConfirmed) {
      return //they didn't want to everride the saved talk.
    }

    localStorage.setItem('savedTalk', JSON.stringify(activeTalk));
    document.getElementById('saveBtn').innerText = 'Saved!'
    setTimeout(()=>{
      document.getElementById('saveBtn').innerText = 'Save This Talk For Later';
      showPlaySavedTalk();
    },1500)
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
  const talk = JSON.parse(localStorage.getItem('savedTalk')); //activeTalk;
  localStorage.removeItem('savedTalk');
  renderTalk(talk);
  showPlaySavedTalk();
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

async function alreadyListened(){
  let listenedToArr = getWithExpiry('listenedTo')
  if(listenedToArr){
    listenedToArr.push(activeTalk.title)
  } else {
    listenedToArr = [activeTalk.title]
  }
  setWithExpiry('listenedTo', listenedToArr, 2592000000);
  await showAppAlert({
    title: 'Marked as Listened',
    text: 'This talk has been added to your already listened to stash. It will remain there for 30 days.',
    icon: 'success'
  });
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
  document.getElementById('calculatedResponseDiv') && !document.getElementById('calculatedResponseDiv').classList.contains('hidden') ? document.getElementById('calculatedResponseDiv').classList.add('hidden') : '';

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

const suggestionForm = document.getElementById('suggestionForm');
const suggestionName = document.getElementById('name');
const suggestionLink = document.getElementById('suggestion');


showPlaySavedTalk();

loadTalks().then(() => {
  /*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
  autocomplete(document.getElementById("myInput"), talksArr);
  initializeBrowseFilters();
});


if (suggestionForm && suggestionName && suggestionLink) {
  suggestionForm.addEventListener('submit', async (e) => {
    if (!suggestionName.value.trim() || !suggestionLink.value.trim()) {
      e.preventDefault();
      await showAppAlert({
        title: 'Missing Information',
        text: 'Please fill in your name and a talk link.',
        icon: 'warning'
      });
    }
  });
}
