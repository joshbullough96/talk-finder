let talks = [];

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

  return typeValue || 'Talk';
}

function getCleanTags(tags) {
  if (typeof tags === 'string') {
    tags = tags.split('|');
  }

  if (!Array.isArray(tags)) {
    return [];
  }

  const tagsByKey = new Map();
  tags.forEach(tag => {
    const cleanTag = (tag || '').trim();
    const tagKey = normalizeSearchText(cleanTag);

    if (cleanTag && !tagsByKey.has(tagKey)) {
      tagsByKey.set(tagKey, cleanTag);
    }
  });

  return [...tagsByKey.values()];
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
    console.error('Error fetching talk index data:', error);
    return { values: [] };
  }
}

function parseTalkRows(data) {
  const rows = data.values ? data.values.slice(1) : [];

  return rows
    .map(row => {
      const [title, speaker, url, youtube, byuspeech, dateAdded, month, year, type, tags] = row;

      return {
        title,
        speaker,
        url,
        youtube,
        byuspeech,
        dateAdded,
        month,
        year,
        type,
        tags: getCleanTags(tags)
      };
    })
    .filter(talk => talk.title)
    .sort((a, b) => a.title.localeCompare(b.title));
}

function getTalkHref(talk) {
  return (talk.url || talk.byuspeech || talk.youtube || '').trim();
}

function getTalkLetter(talk) {
  const firstCharacter = normalizeSearchText(talk.title).charAt(0);
  return /^[a-z]$/.test(firstCharacter) ? firstCharacter.toUpperCase() : '#';
}

function getUniqueTypes() {
  const typesByKey = new Map();

  talks.forEach(talk => {
    const typeKey = normalizeTypeValue(talk.type);

    if (typeKey && !typesByKey.has(typeKey)) {
      typesByKey.set(typeKey, getTypeLabel(talk.type));
    }
  });

  return [...typesByKey.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getUniqueTags() {
  const tagsByKey = new Map();

  talks.forEach(talk => {
    talk.tags.forEach(tag => {
      const tagKey = normalizeSearchText(tag);

      if (tagKey && !tagsByKey.has(tagKey)) {
        tagsByKey.set(tagKey, tag);
      }
    });
  });

  return [...tagsByKey.values()].sort((a, b) => a.localeCompare(b));
}

function populateSelect(selectId, placeholder, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">${placeholder}</option>`;

  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value || option;
    optionElement.textContent = option.label || option;
    select.appendChild(optionElement);
  });

  select.disabled = options.length === 0;
}

function getFilteredTalks() {
  const query = normalizeSearchText(document.getElementById('indexSearchInput').value);
  const selectedType = document.getElementById('indexTypeSelect').value;
  const selectedTag = normalizeSearchText(document.getElementById('indexTagSelect').value);

  return talks.filter(talk => {
    const haystack = [
      talk.title,
      talk.speaker,
      talk.month,
      talk.year,
      getTypeLabel(talk.type),
      ...talk.tags
    ].map(normalizeSearchText).join(' ');

    const matchesQuery = !query || haystack.includes(query);
    const matchesType = !selectedType || normalizeTypeValue(talk.type) === selectedType;
    const matchesTag = !selectedTag || talk.tags.some(tag => normalizeSearchText(tag) === selectedTag);

    return matchesQuery && matchesType && matchesTag;
  });
}

function renderAlphabetNav(filteredTalks) {
  const alphabetNav = document.getElementById('alphabetNav');
  const activeLetters = new Set(filteredTalks.map(getTalkLetter));
  const letters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  alphabetNav.innerHTML = '';

  letters.forEach(letter => {
    if (!activeLetters.has(letter)) {
      return;
    }

    const link = document.createElement('a');
    link.href = `#letter-${letter}`;
    link.textContent = letter;
    alphabetNav.appendChild(link);
  });
}

function createTalkCard(talk) {
  const card = document.createElement('article');
  card.className = 'index-talk-card';

  const talkHref = getTalkHref(talk);
  const title = talkHref ? document.createElement('a') : document.createElement('span');
  title.className = 'index-talk-title';
  title.textContent = talk.title;

  if (talkHref) {
    title.href = talkHref;
    title.target = '_blank';
    title.rel = 'noopener';
  }

  const speaker = document.createElement('p');
  speaker.className = 'index-talk-speaker';
  speaker.textContent = talk.speaker || 'Unknown Speaker';

  const meta = document.createElement('p');
  meta.className = 'index-talk-meta';
  meta.textContent = [getTypeLabel(talk.type), talk.month, talk.year].filter(Boolean).join(' | ');

  card.append(title, speaker, meta);

  if (talk.tags.length > 0) {
    const tags = document.createElement('div');
    tags.className = 'index-tag-list';
    tags.setAttribute('aria-label', `Tags for ${talk.title}`);

    talk.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'chip index-tag';
      tagElement.textContent = tag;
      tags.appendChild(tagElement);
    });

    card.appendChild(tags);
  }

  return card;
}

function renderTalkGroups() {
  const groupsContainer = document.getElementById('talkIndexGroups');
  const status = document.getElementById('indexStatus');
  const filteredTalks = getFilteredTalks();
  const groups = new Map();

  filteredTalks.forEach(talk => {
    const letter = getTalkLetter(talk);

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }

    groups.get(letter).push(talk);
  });

  groupsContainer.innerHTML = '';
  renderAlphabetNav(filteredTalks);

  if (filteredTalks.length === 0) {
    status.textContent = 'No talks match those filters.';
    return;
  }

  status.textContent = `Showing ${filteredTalks.length} of ${talks.length} talks.`;

  [...groups.entries()].forEach(([letter, groupTalks]) => {
    const section = document.createElement('section');
    section.className = 'index-letter-group';
    section.id = `letter-${letter}`;

    const heading = document.createElement('h2');
    heading.textContent = letter;

    const list = document.createElement('div');
    list.className = 'index-talk-list';

    groupTalks.forEach(talk => {
      list.appendChild(createTalkCard(talk));
    });

    section.append(heading, list);
    groupsContainer.appendChild(section);
  });
}

function updateSummary() {
  const summary = document.getElementById('indexSummary');
  const taggedCount = talks.filter(talk => talk.tags.length > 0).length;
  summary.textContent = `${talks.length} talks loaded. ${taggedCount} currently have tags.`;
}

function bindIndexControls() {
  document.getElementById('indexSearchInput').addEventListener('input', renderTalkGroups);
  document.getElementById('indexTypeSelect').addEventListener('change', renderTalkGroups);
  document.getElementById('indexTagSelect').addEventListener('change', renderTalkGroups);
}

async function initializeTalkIndex() {
  const status = document.getElementById('indexStatus');

  const data = await fetchData({
    spreadsheet: 'TalkFinder',
    sheetName: 'Sheet1'
  });

  talks = parseTalkRows(data);
  populateSelect('indexTypeSelect', 'All Collections', getUniqueTypes());
  populateSelect('indexTagSelect', 'All Tags', getUniqueTags());
  updateSummary();
  bindIndexControls();
  renderTalkGroups();

  if (talks.length === 0) {
    status.textContent = 'No talks are available right now.';
  }
}

initializeTalkIndex();
