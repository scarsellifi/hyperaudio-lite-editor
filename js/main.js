export function main() {
  let editableDiv = document.querySelector('#hypertranscript');

  editableDiv.addEventListener("paste", function(e) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain");
    text.replaceAll("&nbsp;", " ");
    document.execCommand("insertHTML", false, text);
  });

  window.document.addEventListener('hyperaudioInit', hyperaudio, false);

  function hyperaudio() {
    const minimizedMode = false;
    const autoScroll = false;
    const doubleClick = true;
    const webMonetization = false;
    const playOnClick = false;

    const hyperaudioInstance = new HyperaudioLite("hypertranscript", "hyperplayer", minimizedMode, autoScroll, doubleClick, webMonetization, playOnClick);

    let hyperaudioTemplate = "";

    fetch('hyperaudio-template.html')
    .then(function(response) {
        // When the page is loaded convert it to text
        return response.text()
    })
    .then(function(html) {
      hyperaudioTemplate = html;
    })
    .catch(function(err) {
        console.log('Failed to fetch page: ', err);
    });

    const sanitisationCheck = function () {

      let time = 0;
      resetTimer();
      window.onload = resetTimer;
      document.onkeyup = resetTimer;
      document.ontouchend = resetTimer;

      let rootnode = document.querySelector("#hypertranscript");
      let sourceMedia = document.querySelector("#hyperplayer").src;
      let track = document.querySelector('#hyperplayer-vtt');

      function sanitise() {
        let d = new Date();
        let starttime = d.getTime();
        console.log(starttime);

        let walker = document.createTreeWalker(rootnode, NodeFilter.SHOW_TEXT, null, false);

        while (walker.nextNode()) {

          if (walker.currentNode.textContent.replaceAll('\n', '').trim().length > 0
              && walker.currentNode.parentElement.tagName !== "SPAN") {

            // if previousSibling is a span, add the textContent of currentNode to it
            if (walker.currentNode.previousSibling.tagName === "SPAN") {
              walker.currentNode.previousSibling.textContent += walker.currentNode.textContent;
            } else {
              // assume nextSibling is a span for now and add textContent of currentNode to that
              walker.currentNode.nextSibling.textContent += walker.currentNode.textContent;
            }

            // remove currentNode as we've merged its contents
            //walker.currentNode.parentNode.removeChild(walker.currentNode);
            walker.currentNode.textContent = "";
          }
        }

        // look for speakers and break them out into their own spans

        walker = document.createTreeWalker(rootnode, NodeFilter.SHOW_TEXT, null, false);

        while (walker.nextNode()) {
          if (walker.currentNode.textContent.replaceAll('\n', '').replaceAll('  ', ' ').trim().length > 0
              && walker.currentNode.parentElement.tagName === "SPAN" && walker.currentNode.textContent.includes('[') && walker.currentNode.textContent.includes(']')) {

            // if previousSibling is a span, add the textContent of currentNode to it
            if (walker.currentNode.textContent.trim().startsWith('[') === false || walker.currentNode.textContent.trim().endsWith(']') === false) {
              console.log(walker.currentNode.textContent.trim());
            //if (walker.currentNode.textContent.trim().startsWith('[') === false || walker.currentNode.textContent.trim().includes(']') === false) {

              //look for text in square brackets
              const regex = / *\[[^\]]*]/g;
              const found = walker.currentNode.textContent.match(regex);

              let startsWithSpeaker = false;
              if (walker.currentNode.textContent.trim().startsWith('[') === true){
                startsWithSpeaker = true;
              }

              walker.currentNode.textContent = walker.currentNode.textContent.replace(regex, '');

              let span = document.createElement("span");
              span.textContent = found + ' ';

              if (span.textContent.includes('[') && span.textContent.includes(']')) {
                span.classList.add("speaker");
                closedSpeaker = false;
              }

              // add the classes of the current node
              span.classList.add(...walker.currentNode.parentNode.classList);
              //DOMTokenList.prototype.add.apply(span.classList, walker.currentNode.parentNode.classList);

              span.setAttribute("data-d","0");

              if (startsWithSpeaker === true) {
                span.setAttribute("data-m",walker.currentNode.parentNode.getAttribute("data-m"));
                walker.currentNode.parentNode.before(span);
                console.log("startsWithSpeaker");
              } else {
                let nextStart = walker.currentNode.parentNode.nextElementSibling.getAttribute("data-m");
                span.setAttribute("data-m",nextStart);
                let newSpan = document.createElement("span");
                newSpan.setAttribute("data-m",nextStart);

                newSpan.innerHTML = "&nbsp;";
                walker.currentNode.parentNode.after(span);
                span.after(newSpan);
                console.log("setting the cursor");
                // set the cursor
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStartBefore(newSpan.nextElementSibling);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }
        }

        const words = document.querySelectorAll("[data-m]");
        hyperaudioInstance.wordArr = hyperaudioInstance.createWordArray(words);
        hyperaudioInstance.parentElements = hyperaudioInstance.transcript.getElementsByTagName(hyperaudioInstance.parentTag);

        if (hyperaudioInstance.currentTime !== undefined) {
          hyperaudioInstance.updateTranscriptVisualState(hyperaudioInstance.currentTime);
        }

        const cap1 = caption();
        let subs = cap1.init("hypertranscript", "hyperplayer", '37' , '21'); // transcript Id, player Id, max chars, min chars for caption line

        let hypertranscript = rootnode.innerHTML.replace(/ class=".*?"/g, '');

        document.querySelector('#download-vtt').setAttribute('href', 'data:text/vtt,'+encodeURIComponent(subs.vtt));
        document.querySelector('#download-srt').setAttribute('href', 'data:text/srt,'+encodeURIComponent(subs.srt));
        document.querySelector('#download-html').setAttribute('href', 'data:text/html,'+encodeURIComponent(hypertranscript));

        document.querySelector('#download-hypertranscript').setAttribute('href', 'data:text/html,'+encodeURIComponent(hyperaudioTemplate.replace('{hypertranscript}',hypertranscript).replace('{sourcemedia}',sourceMedia).replace('{sourcevtt}', track.src)));

            document
              .querySelector("#download-hypertranscript")
              .setAttribute(
                "href",
                "data:text/html," +
                  encodeURIComponent(
                    hyperaudioTemplate
                      .replace("{hypertranscript}", hypertranscript)
                      .replace("{sourcemedia}", sourceMedia)
                      .replace("{sourcevtt}", track.src)
                  )
              );

        //instead of regexp to remove classes we could use something like...

        // remove all class attributes from html string
        /*const removeClass = html => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const elements = doc.querySelectorAll('*');
          elements.forEach(element => {
            element.removeAttribute('class');
          });
          return doc.body.innerHTML;
        }*/


        track.kind = "captions";
        track.label = "English";
        track.srclang = "en";
        track.src = "data:text/vtt,"+encodeURIComponent(subs.vtt);

        // check to see if it's an mp3, in which case we don't display captions
        if (document.querySelector('#hyperplayer').src.split('.').pop() === "mp3") {
          document.querySelector('#hyperplayer').textTracks[0].mode = "hidden";
        } else {
          document.querySelector('#hyperplayer').textTracks[0].mode = "showing";
        }

        d = new Date();
        console.log("sanitising took "+(d.getTime() - starttime)+"ms");
      }

      function resetTimer() {
        console.log("reset sanitisation timer");
        clearTimeout(time);
        time = setTimeout(sanitise, 1000);
      }

      //longpress to set playhead on mobile

      function longPress(element, callback) {
        let pressTimer;
        element.addEventListener("touchstart", function(e) {
          pressTimer = setTimeout(function() {
            callback(e);
          }, 2000);
        });
        element.addEventListener("touchend", function(e) {
          clearTimeout(pressTimer);
        });
      }

      longPress(rootnode, function(e) {
        const startTime = e.target.getAttribute('data-m');
        if (startTime !== null) {
          e.target.classList.add("active");
          hyperaudioInstance.myPlayer.setTime(startTime/1000);
          hyperaudioInstance.setPlayHead(e);
          hyperaudioInstance.checkPlayHead();
        }
      });
    };

    sanitisationCheck();

    const videoElement = document.querySelector("#hyperplayer");
    let sidebarOpen = true;


    document.querySelector('#sidebar-toggle').addEventListener('click', (e) => {

      if (sidebarOpen === true) {
        console.log("sidebar open");
        document.querySelector('.transcript-holder').style.left = 0;
        document.querySelector('#nav-holder').style.left = 0;
        document.querySelector('#nav-holder').style.width = "100%";
        document.querySelector('#sidebar-close-icon').style.display = "none";
        document.querySelector('#sidebar-open-icon').style.display = "block";
        sidebarOpen = false;
      } else {
        console.log("sidebar closed");
        document.querySelector('.transcript-holder').style.left = "400px";
        document.querySelector('#nav-holder').style.left = "400px";
        document.querySelector('#nav-holder').style.setProperty('width', 'calc(100% - 400px)');
        document.querySelector('#sidebar-close-icon').style.display = "block";
        document.querySelector('#sidebar-open-icon').style.display = "none";
        sidebarOpen = true;
      }

      if(
        document.pictureInPictureEnabled &&
        !videoElement.disablePictureInPicture) {
        try {
          if (sidebarOpen === false) {
            videoElement.requestPictureInPicture();
          } else {
            document.exitPictureInPicture();
          }
        } catch(err) {
            console.error(err);
        }
      }
    });

    let showSpeakers = document.querySelector('#show-speakers');

    showSpeakers.addEventListener('change', function(e) {
      let speakers = document.querySelectorAll('.speaker');
      if (showSpeakers.checked === true) {
        speakers.forEach((speaker) => {
          //speaker.style.display = "inline";
          speaker.removeAttribute("style");
        });
      } else {
        speakers.forEach((speaker) => {
          speaker.style.display = "none";
        });
      }
    });
  }

  hyperaudio();
}