/* eslint-env browser */

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import QuillCursors from "quill-cursors";

Quill.register("modules/cursors", QuillCursors);

let provider;

window.addEventListener("load", () => {
  const ydoc = new Y.Doc();
  provider = new WebsocketProvider("ws://localhost:1234", "only-room-id", ydoc);
  const ymap = ydoc.getMap("transcripts");
  const transcriptsContainer = document.getElementById("transcripts");
  provider.on("status", (event) => {
    console.log("status event", event);
  });
  provider.on("sync", (event) => {
    console.log("sync event", event);
    console.log(Array.from(ymap.entries()).length)
    console.log(Array.from(ymap.values())[0].toString())
    ymap.forEach(transcript=>{
      addBlockEditor(transcriptsContainer,Date.now(), transcript)
      transcript.observe(textEvent=>{
        console.log('Individual change on text', textEvent.target.toString())
      })
    });
  });




  ymap.observe(docChange=>{
    console.log('adding a new transcript entry')
    console.log(ymap.get(docChange.keysChanged.values().next().value).toString())
    ymap.forEach(transcript=>{
      addBlockEditor(transcriptsContainer,Date.now(), transcript)
      transcript.observe(textEvent=>{
        console.log('Individual change on text', textEvent.target.toString())
      })
    });
  })

  /// creates one <p> element for each transcript, and fills it with the transcript text.
  /// then, adds the <p> elements to the container in order of their keys.
  function updateTranscripts(ymap, container) {
    const transcriptElements = [];
    ymap.forEach((transcript, key) => {
      const transcriptElement = document.createElement("p");
      const richText = transcript.get("richText");
      transcriptElement.textContent = richText
        ? richText.toString()
        : "undefined";
      transcriptElements.push({ key, transcriptElement });
    });
    // sort the transcripts by their numeric keys.
    // sort in reverse order to get the last transcript at the top.
    transcriptElements.sort((a, b) => b.key - a.key);
    container.innerHTML = "";
    transcriptElements.forEach(({ transcriptElement }) => {
      container.appendChild(transcriptElement);
    });
  }

  
  // Define user name and user name
  // Check the quill-cursors package on how to change the way cursors are rendered
  provider.awareness.setLocalStateField('user', {
    name: 'ava editor',
    color: 'blue'
  })
  

  const connectBtn = document.getElementById("y-connect-btn");
  connectBtn.addEventListener("click", () => {
    if (provider.shouldConnect) {
      provider.disconnect();
      connectBtn.textContent = "Connect";
    } else {
      provider.connect();
      connectBtn.textContent = "Disconnect";
    }
  });

  // @ts-ignore
  // window.example = { provider, ydoc, ytext, Y }
});

function addBlockEditor(transcriptsContainer, key, richTextDocument) {
  // insert a new <div> with the transcript id at the top of the container
  // TODO: insert it at the correct location according to its id (which is its timestamp)
  const child = document.createElement("div");
  child.setAttribute("id", key);
  transcriptsContainer.prepend(child);

  // bind a new editor to the <div> and the rich text document
  const editor = new Quill(child, {
    modules: {
      cursors: true,
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        ["image", "code-block"],
      ],
      history: {
        userOnly: true,
      },
    },
    placeholder: "Start collaborating...",
    theme: "snow", // or 'bubble'
  });

  const binding = new QuillBinding(richTextDocument, editor);
}
