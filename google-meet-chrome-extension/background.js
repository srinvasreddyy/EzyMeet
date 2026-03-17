chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: 'http://localhost:5173/welcome' });
});

function downloadScreenshot(dataUrl) {
    chrome.downloads.download({
      url: dataUrl,
      filename: 'screenshot.png',
      saveAs: false  
    }, () => {
      if (chrome.runtime.lastError) console.error('Error downloading screenshot:', chrome.runtime.lastError.message);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "authenticate") {
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            if (chrome.runtime.lastError || !token) {
                console.error("Auth error:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Authentication failed" });
                return;
            }

            fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: { Authorization: 'Bearer ' + token }
            })
            .then(response => response.json())
            .then(data => {
                chrome.storage.local.set({ oauthEmail: data.email, oauthName: data.name }, function () {
                    fetch('http://localhost:3000/api/register-from-extension', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: data.email, name: data.name })
                    })
                    .then(() => sendResponse({ success: true, email: data.email }))
                    .catch(error => {
                        console.error('Error registering user:', error);
                        sendResponse({ success: true, email: data.email });
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching user info:', error);
                sendResponse({ success: false, error: error.message });
            });
        });
        return true; 
    }

    if (message.action === "capture_screenshot") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs || tabs.length === 0 || !tabs[0]) {
              sendResponse({ success: false });
              return;
          }
          const meetUrlRegex = /^https:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})$/;
          if (meetUrlRegex.test(tabs[0].url)) {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
              if (chrome.runtime.lastError || !dataUrl) {
                sendResponse({ success: false }); 
              } else {
                downloadScreenshot(dataUrl);
                storeScreenshotUrl(dataUrl); 
                sendResponse({ success: true }); 
              }
            });
          } else { sendResponse({ success: false }); }
        });
        return true; 
    }      

    if (message.type === "new_meeting_started") {
        const tabId = (sender && sender.tab) ? sender.tab.id : null;
        if (tabId) {
            chrome.storage.local.set({ meetingTabId: tabId }, () => sendResponse({ success: true }));
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs && tabs.length > 0 && tabs[0].id) {
                    chrome.storage.local.set({ meetingTabId: tabs[0].id }, () => sendResponse({ success: true }));
                } else { sendResponse({ success: false }); }
            });
        }
        return true;
    }

    if (message.type === "end_meeting") {
        // Atomic processing to prevent duplicate backend sends
        chrome.storage.local.get(["meetingTabId"], function (data) {
            if (data.meetingTabId) {
                chrome.storage.local.set({ meetingTabId: null }, function() {
                    sendToBackend();
                    clearScreenshots();
                    sendResponse({ success: true });
                });
            } else {
                sendResponse({ success: true, ignored: true });
            }
        });
        return true;
    }
});
  
function storeScreenshotUrl(dataUrl) {
    const uniqueFilename = `screenshot_${Date.now()}.png`;

    chrome.storage.local.get('oauthEmail', (result) => {
        if (result.oauthEmail) {
            const payload = {
                filename: uniqueFilename,
                imageData: dataUrl,
                email: result.oauthEmail 
            };

            fetch('http://localhost:3000/api/upload-screenshot', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(() => updateScreenshotsInStorage(uniqueFilename, result.oauthEmail))
            .catch((error) => console.error('Error sending screenshot to backend:', error));
        }
    });
}

function updateScreenshotsInStorage(uniqueFilename, ezymeetEmail) {
    const timestamp = new Date().toISOString();
    chrome.storage.local.get({ screenshots: [] }, (result) => {
        const screenshots = result.screenshots || [];
        screenshots.push({ filename: uniqueFilename, timestamp: timestamp, takenBy: ezymeetEmail }); 
        chrome.storage.local.set({ screenshots: screenshots });
    });
}
  
// Failsafe: if they close the tab instead of clicking the end call button
chrome.tabs.onRemoved.addListener(function (tabid) {
    chrome.storage.local.get(["meetingTabId"], function (data) {
        if (tabid === data.meetingTabId) {
            chrome.storage.local.set({ meetingTabId: null }, function() {
                console.info("[EzyMeet Log] User closed meeting tab directly. Triggering backend dispatch...");
                sendToBackend();
                clearScreenshots();
            });
        }
    });
});

function sendToBackend() {
    console.info("[EzyMeet Log] Processing Meeting Data Generation...");

    chrome.storage.local.get(["userName", "transcript", "chatMessages", "meetingTitle", "meetingStartTimeStamp", "meetingEndTimeStamp", "attendees", "speakers","oauthEmail", "oauthName", "screenshots"], function (result) {
        const speakerDuration = {};
        
        // Removed `&& result.transcript` check, allows saving empty meetings if they just used chat/attendance.
        if (result.userName) {
            const lines = [];
            const averageWPM = 170;
            const fallbackIsoDate = new Date().toISOString();
            const transcriptArray = result.transcript || [];
            const chatArray = result.chatMessages || [];
            
            transcriptArray.forEach(entry => {
                if (!entry.personTranscript) return;
                const wordCount = entry.personTranscript.split(' ').length;
                const durationInSeconds = Math.round((wordCount / averageWPM) * 60); 
                const transcriptEntry = {
                    name: (entry.personName === "You" ? result.userName : entry.personName),
                    timeStamp: entry.timeStamp || fallbackIsoDate, // Direct ISO
                    type: "transcript",
                    duration: durationInSeconds,
                    content: entry.personTranscript
                };
                
                lines.push(transcriptEntry);
                const speakerName = transcriptEntry.name;
                if (speakerDuration[speakerName]) speakerDuration[speakerName] += transcriptEntry.duration;
                else speakerDuration[speakerName] = transcriptEntry.duration;
            });

            if (chatArray.length > 0) {
                chatArray.forEach(entry => {
                    lines.push({
                        name: (entry.personName === "You" ? result.userName : entry.personName),
                        timeStamp: entry.timeStamp || fallbackIsoDate, // Direct ISO
                        type: "chat",
                        duration: 0,
                        content: entry.chatMessageText
                    });
                });
            }

            const speakersArray = Array.from(result.speakers || []).map(speaker => speaker.trim()).filter(speaker => speaker !== "");
            const attendeesList = result.attendees || [];
            
            // Build the payload
            const payload = {
                blabberEmail: result.oauthEmail,
                blabberName: result.oauthName,
                screenshots: result.screenshots || [],
                convenor: result.userName || "You",
                meetingTitle: result.meetingTitle || "Untitled Meeting",
                meetingStartTimeStamp: result.meetingStartTimeStamp || fallbackIsoDate,
                meetingEndTimeStamp: result.meetingEndTimeStamp || fallbackIsoDate,
                speakers: speakersArray,
                attendees: attendeesList.filter(attendee => attendee && !attendee.includes("(Presentation)")),
                transcriptData: lines,
                speakerDuration
            };

            // Requested Logs 
            console.group("[EzyMeet Log] Final Payload Created");
            console.info(`-> Started At: ${payload.meetingStartTimeStamp}`);
            console.info(`-> Ended At: ${payload.meetingEndTimeStamp}`);
            console.info(`-> Total Screenshots Generated: ${payload.screenshots.length}`);
            console.info(`-> Total Timeline Entries Generated (Chat + Transcripts): ${payload.transcriptData.length}`);
            console.info(`-> Total Attendees Detected: ${payload.attendees.length}`);
            console.log("-> Full Payload JSON:", JSON.stringify(payload, null, 2));
            console.groupEnd();

            // Send to DB
            fetch('http://localhost:3000/api/meet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => console.info('[EzyMeet Log] Successfully created meeting in database:', data))
            .catch(error => console.error('[EzyMeet Error] Failed to send payload to backend:', error));
        } else {
            console.warn("[EzyMeet Warning] Missing User Name context. Payload aborted.");
        }
    });
}
  
function clearScreenshots() {
    chrome.storage.local.remove('screenshots');
}