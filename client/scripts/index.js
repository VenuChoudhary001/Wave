import { io } from "socket.io-client";
import { Peer } from "peerjs";

(function () {
  const loading = (message) => {
    return `<main class="loading-screen w-screen h-screen bg-zinc-800 absolute z-50 flex items-center justify-center text-white">
        <main class="flex items-center gap-3">

            <div class="w-6 h-6 border-white border-l-2 border-t-2 rounded-full animate-spin opacity-75" ></div>
            <span class="text-white text-xl font-['Manrope'] font-thin">${message}</span>
        </main>
    </main>`;
  };

  window.addEventListener("DOMContentLoaded", async () => {
    const myVideo = document.getElementById("my-video");
    const videoGrid = document.getElementById("video-grid");
    const hideVideoBtn = document.getElementById("hide-video");
    let roomId = 1234;
    let constraints = {
      video: true,
      audio: true,
    };
    const peers = {};
    let socket = io(`${SOCKET_SERVER_URL}`);
    const myPeer = new Peer(undefined, {
      host: "/",
      port: "9000",
    });
    document.body.insertAdjacentHTML("afterbegin", loading("Starting meeting"));
    const loadingScreen = document.querySelector(".loading-screen");
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.remove();
      }
    }, 3000);
    const getMediaAccess = async (constraints) => {
      let mediaConnection = undefined;
      if (constraints.audio || constraints.video) {
        try {
          mediaConnection = await navigator.mediaDevices.getUserMedia(
            constraints
          );
        } catch (error) {
          alert(error);
        }
      }

      myVideo.srcObject = mediaConnection;
      myPeer.on("call", function (call) {
        call.answer(mediaConnection);
        console.log("From call 1");
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          if (userVideoStream == undefined) console.log("first");
          addVideoStream(video, userVideoStream);
        });
      });
      socket.on("user-connected", (userId) => {
        console.log("user-connected : ", userId);
        connectToNewUser(userId, mediaConnection);
      });
    };
    getMediaAccess(constraints);

    hideVideoBtn.addEventListener("click", () => {
      constraints.video = !constraints.video;
      getMediaAccess(constraints);
      if (!constraints.video) {
        hideVideoBtn.classList.add("bg-rose-800");
        hideVideoBtn.classList.remove("bg-transparent");
        hideVideoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-video-off"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      } else {
        hideVideoBtn.classList.remove("bg-green-800");
        hideVideoBtn.classList.add("bg-transparent");
        hideVideoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-video"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
      }
    });

    myPeer.on("open", (id) => {
      console.log(id, roomId);
      socket.emit("join-room", roomId, id);
    });
    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) peers[userId].close();
    });
    function connectToNewUser(userId, stream) {
      if (stream) {
        const mediaConnection = myPeer.call(userId, stream);
        // console.log(mediaConnection)
        const video = document.createElement("video");
        video.style.height = "150px";
        video.setAttribute("muted", true);
        console.log("connectToNewUser");
        mediaConnection.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });

        mediaConnection.on("close", () => {
          video.remove();
        });
        peers[userId] = mediaConnection;
      } else {
      }
    }

    function addVideoStream(video, stream) {
      console.log(video);
      video.srcObject = stream;
      video.muted = true;

      video.addEventListener("loadedmetadata", () => {
        // Play the video as it loads
        video.play();
      });
      // const div=document.createElement("div");

      videoGrid.append(video); // Append video element to videoGrid
    }

    document
      .getElementById("capture-screen")
      .addEventListener("click", async () => {
        try {
          // Request user media (camera) permission
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          const track = stream.getVideoTracks()[0];

          // Create a video element to display the captured screen
          const videoElement = document.createElement("video");
          videoElement.srcObject = new MediaStream([track]);
          videoElement.autoplay = true;

          // Append the video element to the document (hidden)
          document.body.appendChild(videoElement);

          // Wait for the video to load and play for a short time
          await videoElement.play();

          // Create a canvas and draw the video frame onto it
          const canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const context = canvas.getContext("2d");
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          // Convert canvas to image data URL
          const imageDataURL = canvas.toDataURL("image/png");

          // Create a link and trigger download
          const link = document.createElement("a");
          link.href = imageDataURL;
          link.download = "screenshot.png";
          link.click();

          // Clean up: stop the video stream and remove the video element
          track.stop();
          videoElement.remove();
        } catch (error) {
          console.error("Error capturing screenshot:", error);
        }
      });

    // let chunks=[];
    // const deviceList=await navigator.mediaDevices.enumerateDevices();
    // console.log(deviceList);
    // const recorder= new MediaRecorder(stream);

    // recorder.addEventListener("dataavailable",(media)=>{
    //     chunks.push(media.data)
    // })

    // recordBtn.addEventListener("click",()=>{
    //     chunks=[];
    //     recorder.start();
    //     console.log(recorder.state);
    //     recordBtn.style.background = "red";
    //     recordBtn.setAttribute("disabled",true);
    // })

    // stopBtn.onclick=()=>{
    //     recorder.stop();
    //     recordBtn.setAttribute("disabled",false);

    //     let blob=new Blob(chunks,{type:"video/mp4"});
    //     let videoURL=URL.createObjectURL(blob);

    //     let a=document.createElement("a");
    //     a.href=videoURL;
    //     a.download="stream.mp4"
    //     a.click();

    // }
  });
})();
