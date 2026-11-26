/* WHEEP · phone → exhibition screen. me.html sends the visitor's name; live.html listens and plays their story.
   The relay is ntfy.sh (a free public message relay: no account, no server of ours). Only the first name passes
   through it, on this topic; anyone who knows the topic could read it, so it is long and random.
   Messages are not replayed: the screen only sees names sent while it is open. */
const SYNC_URL = 'https://ntfy.sh/wheep-live-69014ed37b83';
const syncClean = s => String(s).trim().replace(/\s+/g, ' ').slice(0, 20);

function syncSend(name) {
  fetch(SYNC_URL, { method: 'POST', body: syncClean(name) }).catch(() => {});   // the phone's own story never waits on it
}

function syncListen(onName) {
  const es = new EventSource(SYNC_URL + '/sse');   // reconnects by itself if the network drops
  es.onmessage = e => {
    try { const m = JSON.parse(e.data); if (m.event === 'message' && m.message) onName(syncClean(m.message)); } catch (err) {}
  };
  return es;
}
