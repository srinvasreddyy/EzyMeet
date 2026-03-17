//*********** GLOBAL VARIABLES **********//
const extensionStatusJSON = {
  "status": 500,
  "message": "<strong>EzyMeet encountered a new error</strong> <br /> Please report it <a href='https://github.com/sikehish/ezymeet/issues' target='_blank'>here</a>."
}
const mutationConfig = { childList: true, attributes: true, subtree: true }

let userName = "You"
overWriteChromeStorage(["userName"], false)
let transcript = []
let personNameBuffer = "", transcriptTextBuffer = "", timeStampBuffer = undefined
let beforePersonName = "", beforeTranscriptText = ""
let chatMessages = []
overWriteChromeStorage(["chatMessages"], false)

const speakers = new Set();

// Use ISO strings universally to prevent backend parsing errors
let meetingStartTimeStamp = new Date().toISOString()
let meetingEndTimeStamp = ""
let meetingTitle = document.title
overWriteChromeStorage(["meetingStartTimeStamp", "meetingTitle"], false)
let isTranscriptDomErrorCaptured = false
let isChatMessagesDomErrorCaptured = false
let hasMeetingStarted = false
let hasMeetingEnded = false

let extensionStatusJSON_current

checkExtensionStatus().then(() => {
  chrome.storage.local.get(["extensionStatusJSON"], function (result) {
    extensionStatusJSON_current = result.extensionStatusJSON;

    if (extensionStatusJSON_current && extensionStatusJSON_current.status == 200) {
      checkElement(".awLEm").then(() => {
        const captureUserNameInterval = setInterval(() => {
          const nameElement = document.querySelector(".awLEm");
          if (nameElement) {
            userName = nameElement.textContent;
            speakers.add(userName);
            overWriteChromeStorage(["speakers"], false);
            if (userName || hasMeetingStarted) {
              clearInterval(captureUserNameInterval);
              if (userName != "") overWriteChromeStorage(["userName"], false);
            }
          } else if (hasMeetingStarted) {
            clearInterval(captureUserNameInterval);
          }
        }, 100);
      })

      meetingRoutines(1)
      meetingRoutines(2)
    } else {
      showNotification(extensionStatusJSON_current || extensionStatusJSON)
    }
  })
})

async function checkExtensionStatus() {
  chrome.storage.local.set({
    extensionStatusJSON: { status: 200, message: "<strong>EzyMeet is running</strong> <br /> Do not turn off captions" },
  });

  try {
    const response = await fetch("https://ejnana.github.io/transcripto-status/status-prod.json", { cache: "no-store" });
    const result = await response.json();
    result.message = "<strong>EzyMeet is running</strong> <br /> Do not turn off captions";
    chrome.storage.local.set({ extensionStatusJSON: result });
  } catch (err) {
    console.error("Status fetch failed:", err);
  }
}

function meetingRoutines(uiType) {
  const meetingEndIconData = { selector: "", text: "" }
  const captionsIconData = { selector: "", text: "" }

  switch (uiType) {
    case 1:
      meetingEndIconData.selector = ".google-material-icons"
      meetingEndIconData.text = "call_end"
      captionsIconData.selector = ".material-icons-extended"
      captionsIconData.text = "closed_caption_off"
      break;
    case 2:
      meetingEndIconData.selector = ".google-symbols"
      meetingEndIconData.text = "call_end"
      captionsIconData.selector = ".google-symbols"
      captionsIconData.text = "closed_caption_off"
    default:
      break;
  }

  checkElement(meetingEndIconData.selector, meetingEndIconData.text).then(() => {
    console.info(`[EzyMeet Log] Meeting Started precisely at: ${meetingStartTimeStamp}`);
    chrome.runtime.sendMessage({ type: "new_meeting_started" }, function () {
      if (chrome.runtime.lastError) console.warn("Init msg error:", chrome.runtime.lastError.message);
    });
    hasMeetingStarted = true

    try {
      setTimeout(() => updateMeetingTitle(), 5000)

      const captionsButton = contains(captionsIconData.selector, captionsIconData.text)[0]

      chrome.storage.sync.get(["operationMode"], function (result) {
        if (result.operationMode == "manual") {
          console.log("Manual mode selected, leaving transcript off")
        } else if (captionsButton) {
          captionsButton.click()
        }
      })

      let transcriptObserver;
      const observeTranscript = () => {
        const transcriptTargetNode = document.querySelector('.a4cQT')
        if (!transcriptTargetNode) {
          setTimeout(observeTranscript, 1000)
          return
        }

        try {
          if (transcriptTargetNode.firstChild) {
            transcriptTargetNode.firstChild.style.opacity = 0.2
          }
        } catch (error) {
          console.error(error)
        }

        transcriptObserver = new MutationObserver(transcriber)
        transcriptObserver.observe(transcriptTargetNode, mutationConfig)
      }
      observeTranscript()

      const chatMessagesButton = contains(".google-symbols", "chat")[0]
      if (chatMessagesButton) chatMessagesButton.click()
      let chatMessagesObserver

      setTimeout(() => {
        if (chatMessagesButton) chatMessagesButton.click()
        const observeChat = () => {
          try {
            const chatNodes = document.querySelectorAll('div[aria-live="polite"]')
            if (chatNodes.length === 0 || !chatNodes[0]) {
              setTimeout(observeChat, 1000)
              return
            }
            const chatMessagesTargetNode = chatNodes[0]

            chatMessagesObserver = new MutationObserver(chatMessagesRecorder)
            chatMessagesObserver.observe(chatMessagesTargetNode, mutationConfig)
          } catch (error) {
            console.error(error)
          }
        }
        observeChat()
      }, 1500)

      chrome.storage.sync.get(["operationMode"], function (result) {
        if (result.operationMode == "manual")
          showNotification({ status: 400, message: "<strong>EzyMeet is not running</strong> <br /> Turn on captions using the CC icon, if needed" })
        else
          showNotification(extensionStatusJSON_current)
      })

      const meetingEndBtn = contains(meetingEndIconData.selector, meetingEndIconData.text)[0]
      if (meetingEndBtn && meetingEndBtn.parentElement && meetingEndBtn.parentElement.parentElement) {
        meetingEndBtn.parentElement.parentElement.addEventListener("click", () => {
          hasMeetingEnded = true
          if (transcriptObserver) transcriptObserver.disconnect()
          if (chatMessagesObserver) chatMessagesObserver.disconnect()

          if ((personNameBuffer != "") && (transcriptTextBuffer != "")) {
            pushBufferToTranscript()
          }
          
          meetingEndTimeStamp = new Date().toISOString();
          console.info(`[EzyMeet Log] End Call Button Clicked! End time recorded as: ${meetingEndTimeStamp}`);
          overWriteChromeStorage(["transcript", "chatMessages", "meetingEndTimeStamp"], true)
        })
      }
    } catch (error) {
      console.error(error)
    }
  })
}

function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
}

const checkElement = async (selector, text) => {
  if (text) {
    while (!Array.from(document.querySelectorAll(selector)).find(element => element.textContent === text)) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  } else {
    while (!document.querySelector(selector)) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
  return document.querySelector(selector);
}

const commonCSS = `
    background: #f3f4f6; 
    backdrop-filter: blur(10px); 
    position: fixed;
    top: 2%; 
    left: 0; 
    right: 0; 
    margin-left: auto; 
    margin-right: auto;
    max-width: 350px;
    z-index: 1000; 
    padding: 0.75rem 1rem;
    border-radius: 8px; 
    display: flex; 
    justify-content: flex-start; 
    align-items: center; 
    gap: 12px;
    font-size: 0.9rem;
    line-height: 1.4;
    font-family: 'Google Sans',Roboto,Arial,sans-serif; 
    box-shadow: rgba(0, 0, 0, 0.12) 0px 4px 12px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px;
    color: black;
  `;
  
const logoCSS = `
    display: flex;
    align-items: center;
    justify-content: center;
`;

const dividerCSS = `
    height: 60px;
    width: 3px;
    background-color: rgba(0, 0, 0, 0.1);
    margin: 0 8px;
`;

const messageCSS = `
    font-size: 0.9rem;
    font-weight: 500;
    color: #2c3e50;
`;

function showNotification(extensionStatusJSON) { 
    let html = document.querySelector("html");
    if (!html) return;

    let obj = document.createElement("div");
    let logoContainer = document.createElement("div");
    logoContainer.style.cssText = logoCSS;
    let logo = document.createElement("img");
    let text = document.createElement("p");
    let divider = document.createElement("div");
    divider.style.cssText = dividerCSS;
  
    logo.setAttribute("src", "https://i.imgur.com/pgOwCjJ.png");
    logo.style.marginRight = "5px";
    logo.style.width = "40px";
    logo.style.height = "40px";
  
    let logoText = document.createElement("span");
    logoText.innerHTML = "EzyMeet";
    logoText.style.fontWeight = "bold";
    logoText.style.fontSize = "16px";
    logoText.style.color = "white";
    
    text.style.cssText = messageCSS;
  
    setTimeout(() => {
      obj.style.display = "none";
    }, 5000);
  
    if (extensionStatusJSON && extensionStatusJSON.status == 200) {
      obj.style.cssText = `background: #e0f7fa; color: black; ${commonCSS}`;
      text.innerHTML = "Don't disable captions!";
    } else {
      obj.style.cssText = `background: #ffebee; color: orange; ${commonCSS}`;
      text.innerHTML = extensionStatusJSON ? extensionStatusJSON.message : "Error";
    }
  
    logoContainer.append(logo);
    logoContainer.append(logoText);
    obj.append(logoContainer);
    obj.append(divider);
    obj.append(text);
  
    html.append(obj);
}

function transcriber(mutationsList, observer) {
  mutationsList.forEach(mutation => {
    try {
      const transcriptBox = document.querySelector('.a4cQT');
      if (!transcriptBox || !transcriptBox.firstChild || !transcriptBox.firstChild.firstChild) return;

      const people = transcriptBox.firstChild.firstChild.childNodes;
      if (people.length > 0) {
        const person = people[people.length - 1]
        const currentPersonName = person.childNodes[0]?.textContent || "";
        if (!currentPersonName) return;
        
        if(currentPersonName != "You") {
          speakers.add(currentPersonName)          
          overWriteChromeStorage(["speakers"], false)
        }

        const currentTranscriptText = person.childNodes[1]?.lastChild?.textContent;
        if (!currentTranscriptText) return;

        if (beforeTranscriptText == "") {
          personNameBuffer = currentPersonName
          timeStampBuffer = new Date().toISOString()
          beforeTranscriptText = currentTranscriptText
          transcriptTextBuffer = currentTranscriptText
        } else {
          if (personNameBuffer != currentPersonName) {
            pushBufferToTranscript()
            overWriteChromeStorage(["transcript"], false)
            beforeTranscriptText = currentTranscriptText
            personNameBuffer = currentPersonName
            timeStampBuffer = new Date().toISOString()
            transcriptTextBuffer = currentTranscriptText
          } else {
            transcriptTextBuffer = currentTranscriptText
            beforeTranscriptText = currentTranscriptText
            if (currentTranscriptText.length > 250) {
              person.remove()
            }
          }
        }
      } else {
        if ((personNameBuffer != "") && (transcriptTextBuffer != "")) {
          pushBufferToTranscript()
          overWriteChromeStorage(["transcript"], false)
        }
        beforePersonName = ""
        beforeTranscriptText = ""
        personNameBuffer = ""
        transcriptTextBuffer = ""
      }
    } catch (error) {
      isTranscriptDomErrorCaptured = true
    }
  })
}

function chatMessagesRecorder(mutationsList, observer) {
  mutationsList.forEach(mutation => {
    try {
      const chatNodes = document.querySelectorAll('div[aria-live="polite"]');
      const chatMessagesElement = chatNodes.length > 0 ? chatNodes[0] : null;

      if (chatMessagesElement && chatMessagesElement.children.length > 0) {
        const chatMessageElement = chatMessagesElement.lastChild
        const personName = chatMessageElement?.firstChild?.firstChild?.textContent
        const timeStamp = new Date().toISOString()
        const chatMessageText = chatMessageElement?.lastChild?.lastChild?.textContent

        if (!personName || !chatMessageText) return;

        const chatMessageBlock = {
          personName: personName,
          timeStamp: timeStamp,
          chatMessageText: chatMessageText
        }

        pushUniqueChatBlock(chatMessageBlock)
        overWriteChromeStorage(["chatMessages"], false)
      }
    } catch (error) {
      isChatMessagesDomErrorCaptured = true
    }
  })
}

function pushBufferToTranscript() {
  transcript.push({
    "personName": personNameBuffer,
    "timeStamp": timeStampBuffer,
    "personTranscript": transcriptTextBuffer
  })
}

function pushUniqueChatBlock(chatBlock) {
  const isExisting = chatMessages.some(item =>
    item.personName == chatBlock.personName &&
    item.timeStamp == chatBlock.timeStamp &&
    chatBlock.chatMessageText.includes(item.chatMessageText)
  )
  if (!isExisting) chatMessages.push(chatBlock);
}

function overWriteChromeStorage(keys, endMeeting) {
  const objectToSave = {}
  if (keys.includes("userName")) objectToSave.userName = userName
  if (keys.includes("transcript")) objectToSave.transcript = transcript
  if (keys.includes("meetingTitle")) objectToSave.meetingTitle = meetingTitle
  if (keys.includes("meetingStartTimeStamp")) objectToSave.meetingStartTimeStamp = meetingStartTimeStamp
  if (keys.includes("chatMessages")) objectToSave.chatMessages = chatMessages
  if (keys.includes("speakers")) objectToSave.speakers = Array.from(speakers);
    
  if (keys.includes("meetingEndTimeStamp")) {
    objectToSave.meetingEndTimeStamp = meetingEndTimeStamp;
  }

  if (endMeeting) {
    const attendeesArr = []
    const attendees = document.querySelectorAll('div.dwSJ2e')
    for (const attendee of attendees) {
      if(attendee && attendee.textContent) attendeesArr.push(attendee.textContent); 
    }
    objectToSave.attendees = attendeesArr 
  }

  chrome.storage.local.set(objectToSave, function () {
    if (endMeeting) {
      console.info(`[EzyMeet Log] Triggering backend dispatch. Total transcripts captured: ${transcript.length}`);
      chrome.runtime.sendMessage({ type: "end_meeting" }, function () {
          if (chrome.runtime.lastError) console.warn("Communication error during meeting end:", chrome.runtime.lastError.message);
      });
    }
  })
}

function updateMeetingTitle() {
  try {
    const titleNode = document.querySelector(".u6vdEc");
    if (titleNode) {
      const title = titleNode.textContent;
      const invalidFilenameRegex = /[^\w\-_.() ]/g;
      meetingTitle = title.replace(invalidFilenameRegex, '_');
      overWriteChromeStorage(["meetingTitle"], false);
    }
  } catch (error) {}
}