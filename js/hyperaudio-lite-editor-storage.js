/*
 * HyperTranscriptStorage class
 * @param {string} hypertranscript - the html of the hypertranscript
 * @param {string} video - the url of the video
 * @param {string} summary - the text of the summary
 * @param {array} summary - an array of topics
 * @return {void}
 */
class HyperTranscriptStorage {
  constructor(hypertranscript, video, summary, topics) {
    this.hypertranscript = hypertranscript;
    this.video = video;
    this.summary = summary;
    this.topics = topics;
  }
}

// We should move these from global scope
const fileExtension = ".hyperaudio";
let lastFilename = null;

/*
 * Render the HyperTranscript in the DOM
 * @return {void}
 */
function renderTranscript(
  hypertranscriptstorage,
  hypertranscriptDomId = 'hypertranscript',
  videoDomId = 'hyperplayer'
) {
  document.getElementById(hypertranscriptDomId).innerHTML = hypertranscriptstorage['hypertranscript'];
  document.getElementById(videoDomId).src = hypertranscriptstorage['video'];
  document.getElementById("summary").innerHTML = hypertranscriptstorage['summary'];
  document.getElementById("topics").innerHTML = getTopicsString(hypertranscriptstorage['topics']);

  hyperaudio();
}

export function getLocalStorageSaveFilename(url){
  let filename = null;

  if (lastFilename === null) {
    //by default just the media filename
    filename = url.substring(url.lastIndexOf("/")+1);
    lastFilename = filename;
  } else {
    // if it's been saved before this session, use the last filename
    filename = lastFilename;
  }

  return filename;
}

function getTopicsString(topics) {
  let topicsString = "";
  if (topics && topics !== "undefined" && Object.keys(topics).length > 0) {
    topicsString = topics.join(", ");
  }
  return topicsString;
}

/*
 * Save the current HyperTranscript in the local storage
 * @param {string} filename - the name of the transcript file
 * @param {string} hypertranscriptDomId - the id of the hypertranscript dom element
 * @param {string} videoDomId - the id of the video dom element
 * @return {void}
 */

export function saveHyperTranscriptToLocalStorage(
  filename,
  hypertranscriptDomId = 'hypertranscript',
  videoDomId = 'hyperplayer',
  storage = window.localStorage
) {
  console.log("saving");
  let hypertranscript = document.getElementById(hypertranscriptDomId).innerHTML;
  let video = document.getElementById(videoDomId).src;
  let summary = document.getElementById("summary").innerHTML;
  let topics = document.getElementById("topics").innerHTML.split(", ");
  let hypertranscriptstorage = new HyperTranscriptStorage(hypertranscript, video, summary, topics);

  storage.setItem(filename+fileExtension, JSON.stringify(hypertranscriptstorage));
}

export function loadLocalStorageOptions(storage = window.localStorage) {

  let fileSelect = document.querySelector("#load-localstorage-filename");
  let filePicker = document.querySelector("#file-picker");

  fileSelect.innerHTML = '<option value="default">Select file…</option>';
  filePicker.innerHTML = "";

  for (let i = 0; i < storage.length; i++) {
    if (storage.key(i).indexOf(fileExtension) > 0) {
      let filename = storage.key(i).substring(0,storage.key(i).lastIndexOf(fileExtension));
      fileSelect.insertAdjacentHTML("beforeend", `<option value=${i}>${filename}</option>`);
      filePicker.insertAdjacentHTML("beforeend", `<li><a class="file-item" title="..." href=${i}>${filename}</a></li>`);
    }
  }

 setFileSelectListeners();

  if (storage.length === 0) {
    filePicker.insertAdjacentHTML("beforeend", `<li style="padding-left:16px; padding-top:16px">No files saved.</li>`);
  }
}

export function setFileSelectListeners() {
  let files = document.querySelectorAll('.file-item');

  console.log("setting listeners");

  files.forEach(file => {
    file.removeEventListener('click', fileSelectHandleClick);
    file.addEventListener('click', fileSelectHandleClick);
    file.removeEventListener('mouseover', fileSelectHandleHover);
    file.addEventListener('mouseover', fileSelectHandleHover);
  });
}

function fileSelectHandleClick(event) {
  loadHyperTranscriptFromLocalStorage(event.target.getAttribute("href"));

  let files = document.querySelectorAll('.file-item');

  files.forEach(file => {
    file.classList.remove("active");
  });

  event.target.classList.add("active");
  event.preventDefault();
  return false;
}

function fileSelectHandleHover(event) {
  console.log("hover");
  loadSummaryFromLocalStorage(event.target.getAttribute("href"), event.target);
  event.preventDefault();
  return false;
}

export function loadHyperTranscriptFromLocalStorage(fileindex, storage = window.localStorage){
  let hypertranscriptstorage = JSON.parse(storage.getItem(storage.key(fileindex)));

  if (hypertranscriptstorage) {
    renderTranscript(hypertranscriptstorage);
    lastFilename = storage.key(fileindex).substring(0,storage.key(fileindex).lastIndexOf(fileExtension));
    document.querySelector('#save-localstorage-filename').value = lastFilename;
  }
}

function loadSummaryFromLocalStorage(fileindex, target, storage = window.localStorage){

  let hypertranscriptstorage = JSON.parse(storage.getItem(storage.key(fileindex)));

  console.log("hypertranscriptstorage");
  console.log(hypertranscriptstorage);

  console.log("topics");
  console.log(hypertranscriptstorage.topics);

  if (hypertranscriptstorage) {
    target.setAttribute("title", hypertranscriptstorage.summary + "\n\nTopics: " + getTopicsString(hypertranscriptstorage.topics));
  }
}