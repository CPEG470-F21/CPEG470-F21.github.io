//FIREBASE IMPORTS AND SET UP
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js"
import * as fbauth from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcOfqOuyRcFYLKhh2oA-WZwTLn7LdFw1E",
  authDomain: "cpeg470-d1108.firebaseapp.com",
  databaseURL: "https://cpeg470-d1108-default-rtdb.firebaseio.com",
  projectId: "cpeg470-d1108",
  storageBucket: "cpeg470-d1108.appspot.com",
  messagingSenderId: "561528315666",
  appId: "1:561528315666:web:7339eae491ef5e53a95dcb",
  measurementId: "G-57025Q0CTL"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
let db = rtdb.getDatabase(app);
let auth = fbauth.getAuth(app);

//END FIREBASE SET UP

//important global vars
let receiver = "";
let userame = "";
let UID = "";
let roomID = "";
let editMessage = false;
let messageID = "";

document.body.style.overflow = 'hidden';

//returns formatted date for message timestamp
let getFormattedDate = function(){
    var d = new Date();
    d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
    return d;
}

//create list of current users/accounts
let addPeople = function(){
  $('#people').html("");
  
  let usersRef = rtdb.ref(db, "/users/");
  rtdb.get(usersRef).then(ss=>{ 
    let data=ss.val();
    
    Object.keys(data).map(id=>{
      if(data[id].isActive){
        $('#people').append(`<div class="tooltip"> <img class='active' src=${data[id].profileImage}></img> <span class="tooltiptext active">${data[id].name}</span> </div>`);
      } else {
        $('#people').append(`<div class="tooltip"> <img class='inactive' src=${data[id].profileImage}></img> <span class="tooltiptext inactive">${data[id].name}</span> </div>`);
      }
    });
  });
}


//Create/update the list of this users current conversations
let addChatrooms = function(){
  $('#chatrooms').html("");
  let userChatsRef = rtdb.ref(db, "/users/" + UID + "/chats");
  
  rtdb.get(userChatsRef).then(ss=>{ 
    let data=ss.val();
    
    Object.keys(data).map(id=>{
      $('#chatrooms').append(`<div class='chat' data-name=${data[id].nickname} data-chatid=${data[id].chatroomID}>${data[id].nickname}</div>`);
    });
  });
}

//function to clear the messages and remake it with the new data
let addMessage = function(data){  
  $('#chats').html("");
  
  Object.keys(data).map(id=>{
    if(data[id].senderID == UID){
      $('#chats').append(`<div class="messageContainer right"> <div class='message youSender' data-sender=${data[id].senderID} data-id=${id}>${data[id].text}</div> <p class="time chatinfo">${data[id].timestamp}</p> </div>`)
    } else {
      $('#chats').append(`<div class="messageContainer left"> <p class="name chatinfo">${data[id].sender}</p> <div class='message otherSender' data-sender=${data[id].senderID} data-id=${id}>${data[id].text}</div> <p class="time chatinfo">${data[id].timestamp}</p>  </div>`);
    }
  });
}

//creates onValue listener to add messages 
//when this specific conversation gets updated
let createListener = function(){
  if(!receiver){
    alert("No user selected. Click a user to send to. If no list is shown, start a new conversation");
  } else {
    let chatRef = rtdb.ref(db, "/chatrooms/" + roomID + "/messages");

    rtdb.onValue(chatRef, ss=>{
      let data = ss.val();
      if(data){
        addMessage(data);
      }
    });
  }
}


//send a message
//update the specific conversation thread with new message 
$('#send').click(()=>{
  let date = getFormattedDate();
  
  if(editMessage){
    let messageRef = rtdb.ref(db, "/chatrooms/" + roomID + "/messages/" + messageID);
    rtdb.set(messageRef, {sender: userame, senderID: UID, text:$('#message').val(), timestamp: date, edited: true});
    editMessage = false;
    messageID = "";
    $("#message").attr("placeholder", "message");
    $("#send").html("Send Message");
    $("#message").val("");
    return;
  }
  
  if(!userame || !UID){
    alert("Please sign in first");
    return;
  }
  
  if(!$('#message').val()){
    alert("cannot send empty message");
    return;
  }
  
  if(!receiver){
    alert("Please enter or select the user you would like to send a message to");
    return;
  } 
    
  let chatRef = rtdb.ref(db, "/chatrooms/" + roomID + "/messages");
  rtdb.push(chatRef, {sender: userame, senderID: UID, text:$('#message').val(), timestamp: date});
  $("#message").val("");
  
});

//start a new conversation between A and B
//update list of current conversations
$('#newThread').click(()=>{
  
  if(!userame || !UID){
    alert("Please sign in first.");
    return;
  }
  
  if($("#recv").val()){
    receiver = $("#recv").val();
    let receiverID = "";

    //get the userID of the username to start new conversation
    let userRef = rtdb.ref(db, `/usernames/${receiver}`);
    rtdb.get(userRef).then(ss=>{ 
      if(ss.val() == null){
        alert("This user does not exist");
      } else {
        receiverID = ss.val().uid;  //getting userID
        
        //create a new chatroom between these two users
        let chatroomsRef = rtdb.ref(db, "/chatrooms/");
        rtdb.push(chatroomsRef, {nickname: "TEMP"}).then((snap) => {
          roomID = snap.key;

          //add chatroom to senders list of chats
          let senderChatsRef = rtdb.ref(db, "/users/" + UID + "/chats/" + roomID);
          rtdb.set(senderChatsRef, {chatroomID:roomID, nickname:receiver});
          //add chatroom to receivers list of chats
          let recvChatsRef = rtdb.ref(db, "/users/" + receiverID + "/chats/" + roomID);
          rtdb.set(recvChatsRef, {chatroomID:roomID, nickname:userame});

          $("#chats").html("");
          addChatrooms();

          alert("If new messages don't show, click chatroom name again");
        });
      }
    });
    
  } else {
    alert("Please enter receiver username");
  }
});


//Listener for clicking a message
//used for edit message
$("#chats").click((e)=> {
  //only let a user edit a message if it was sent by them
  if(e.target.dataset['id'] && e.target.dataset['sender'] == UID){
    editMessage = true;
    messageID = e.target.dataset['id'];
    $("#message").attr("placeholder", "Type edit message here");
    $("#send").html("Send Edit");
  }
  
});

//Click listener to select a conversation thread
$("#chatrooms").click((e)=> {
  if(e.target) {
    receiver = e.target.dataset['name'];
    roomID = e.target.dataset['chatid'];
    createListener();
  }
});

//refresh list of online users when clicked
$("#people-header").click(()=>{
  addPeople();
});


fbauth.onAuthStateChanged(auth, user => {
  console.log(auth);
  console.log(user);
});

//Register a new user
$("#register").on("click", ()=>{
  let email = $("#regemail").val();
  let p1 = $("#regpass1").val();
  let p2 = $("#regpass2").val();
  if (p1 != p2){
    alert("Passwords don't match");
    return;
  }
  
  //check if the username already exists
  userame = $('#regusername').val();
  let userRef = rtdb.ref(db, `/usernames/${userame}`);
  rtdb.get(userRef).then(ss=>{ 
    //if the username does not exist, make a new user
    if(ss.val() == null){
      fbauth.createUserWithEmailAndPassword(auth, email, p1).then(somedata=>{
        UID = somedata.user.uid;
        userame = $('#regusername').val();

        //create the user
        let userRef = rtdb.ref(db, `/users/${UID}`);
        let data = {name:userame, email:$('#regemail').val(), status:"NA", isActive:true, roles: {user: true}, profileImage: "https://static8.depositphotos.com/1009634/988/v/600/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg"};
        rtdb.set(userRef, data);
        //add username
        let usernameRef = rtdb.ref(db, `/usernames/${userame}`);
        data = {uid:UID};
        rtdb.set(usernameRef, data);

        //every user has the main full group chat room
        let userChatsRef = rtdb.ref(db, "/users/" + UID + "/chats/-Mjz_495cBqQw4wt-fgv");
        rtdb.set(userChatsRef, {chatroomID: "-Mjz_495cBqQw4wt-fgv", nickname:"Full Group"});

        setupMainContent();
        
      }).catch(function(error) { });

    } else { alert("Username Taken"); }
  });
  
});


//Log in a user that already exists
$("#login").on("click", ()=>{
  let email = $("#logemail").val();
  let pwd = $("#logpass").val();
  fbauth.signInWithEmailAndPassword(auth, email, pwd).then(
    somedata=>{
      
      console.log(somedata.user);
      UID = somedata.user.uid;
      
      //set user activity to true
      let userRef = rtdb.ref(db, `/users/${UID}`);
      rtdb.update(userRef, {isActive: true});
      //get the users username
      rtdb.get(userRef).then(ss=>{ 
        let data=ss.val();
        userame = data.name;

        $('#currUserImage').attr("src", data.profileImage);
        setupMainContent();
      });
      
    }).catch(function(error) {    });
});

//manipulate the view to go from login/register to displaying main content
let setupMainContent = function(){
  //load this users chatrooms and load the list of users
  receiver = "";
  $("#chats").html("");
  addChatrooms();
  addPeople();
    
  //hide login and register, show main content
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("registerContainer").style.display = "none";
  document.getElementById("mainContainer").style.display = "block";
  document.querySelector("div.currUser").style.display = "block";
  document.getElementById("currentUserName").innerHTML = "Current User: " + userame;
}


//log the current user out
$('#logout').on("click", ()=>{
  //update active status
  let userRef = rtdb.ref(db, `/users/${UID}`);
  rtdb.update(userRef, {isActive: false});

  //sign out
  auth.signOut();

  //manipulate view to display login screen
  document.getElementById("loginContainer").style.display = "flex";
  document.getElementById("registerContainer").style.display = "none";
  document.getElementById("mainContainer").style.display = "none";
  document.querySelector("div.currUser").style.display = "none";
});

$("#clickToRegister").on("click", ()=>{
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("registerContainer").style.display = "flex";
});

$("#clickToLogin").on("click", ()=>{
  document.getElementById("loginContainer").style.display = "flex";
  document.getElementById("registerContainer").style.display = "none";
});

document.getElementById("registerContainer").style.display = "none";

//#655dfe

//#333333
//#323435

//#373e44