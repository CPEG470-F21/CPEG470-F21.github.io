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
let senderName = "";
let senderID = "";
let roomID = "";
let users = [];
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
  users = [];
  
  let peopleRef = rtdb.ref(db, "/users/");
  rtdb.get(peopleRef).then(ss=>{ 
    let data=ss.val();
    
    Object.keys(data).map(id=>{
      //if(data[id].isActive)
      $('#people').append(`<li>${data[id].name}</li>`);
      users.push(data[id].name);
    });
  });
}


//Create/update the list of current conversations
let addChatrooms = function(){
  $('#chatrooms').html("");
  let peopleRef = rtdb.ref(db, "/users/" + senderID + "/chats");
  
  rtdb.get(peopleRef).then(ss=>{ 
    let data=ss.val();
    
    Object.keys(data).map(id=>{
      $('#chatrooms').append(`<li data-chatid=${data[id].chatroomID}>${data[id].nickname}</li>`);
    });
  });
}


//function to clear the messages and remake it with the new data
let addMessage = function(data){  
  $('#chats').html("");
  
  Object.keys(data).map(id=>{
    if(data[id].senderID == senderID){
      $('#chats').append(`<div class="messageContainer right"> <div class='message youSender' data-sender=${data[id].senderID} data-id=${id}>${data[id].text}</div> <p class="time">${data[id].timestamp}</p> </div>`)
    } else {
      $('#chats').append(`<div class="messageContainer left"> <p class="name">${data[id].sender}</p> <div class='message otherSender' data-sender=${data[id].senderID} data-id=${id}>${data[id].text}</div> <p class="time">${data[id].timestamp}</p>  </div>`);
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
    let chatroomRef = rtdb.ref(db, "/chatrooms/" + roomID + "/messages/" + messageID);
    rtdb.set(chatroomRef, {sender: senderName, senderID: senderID, text:$('#message').val(), timestamp: date, edited: true});
    editMessage = false;
    messageID = "";
    $("#message").attr("placeholder", "message");
    $("#send").html("Send Message");
    $("#message").val("");
    return;
  }
  
  if(!senderName || !senderID){
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
    
  let chatroomRef = rtdb.ref(db, "/chatrooms/" + roomID + "/messages");
  rtdb.push(chatroomRef, {sender: senderName, senderID: senderID, text:$('#message').val(), timestamp: date});
  $("#message").val("");
  
});

//start a new conversation between A and B
//update list of current conversations
$('#newThread').click(()=>{
  
  if(!senderName || !senderID){
    alert("Please sign in first.");
    return;
  }
  
  if($("#recv").val()){
    receiver = $("#recv").val();
    let receiverID = "";
    let userRef = rtdb.ref(db, `/usernames/${receiver}`);
    rtdb.get(userRef).then(ss=>{ 
      if(ss.val() == null){
        alert("This user does not exist");
      } else {
        receiverID = ss.val().uid;
        
        let theRef = rtdb.ref(db, "/chatrooms/");
        rtdb.push(theRef, {nickname: "TEMP"}).then((snap) => {
          roomID = snap.key;

          //add chatroom to senders chats
          let peopleRef = rtdb.ref(db, "/users/" + senderID + "/chats");
          rtdb.push(peopleRef, {chatroomID:roomID, nickname:receiver});
          //add chatroom to receivers chats
          peopleRef = rtdb.ref(db, "/users/" + receiverID + "/chats");
          rtdb.push(peopleRef, {chatroomID:roomID, nickname:senderName});

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
$("#chats").click((e)=> {
  if(e.target.dataset['id'] && e.target.dataset['sender'] == senderID){
    editMessage = true;
    messageID = e.target.dataset['id'];
    $("#message").attr("placeholder", "Type edit message here");
    $("#send").html("Send Edit");
  }
  
});

//Click listener to select a conversation thread
$("#chatrooms").click((e)=> {
  if(e.target && e.target.nodeName == "LI") {
    receiver = e.target.innerText;
    roomID = e.target.dataset['chatid'];
    createListener();
  }
});


addPeople();
$("#people-header").click(()=>{
  addPeople();
});



fbauth.onAuthStateChanged(auth, user => {
  //$('#login').style.display = "none";
});


$("#register").on("click", ()=>{
  let email = $("#regemail").val();
  let p1 = $("#regpass1").val();
  let p2 = $("#regpass2").val();
  if (p1 != p2){
    alert("Passwords don't match");
    return;
  }
  
  senderName = $('#regusername').val();
  let userRef = rtdb.ref(db, `/usernames/${senderName}`);
  rtdb.get(userRef).then(ss=>{ 
    if(ss.val() == null){
      fbauth.createUserWithEmailAndPassword(auth, email, p1).then(somedata=>{
        senderID = somedata.user.uid;
        senderName = $('#regusername').val(); //this will be a nickname

        let userRef = rtdb.ref(db, `/users/${senderID}`);
        let data = {name:senderName, email:$('#regemail').val(), status:"NA", isActive:true, roles: {user: true}};
        rtdb.set(userRef, data);

        let usernameRef = rtdb.ref(db, `/usernames/${senderName}`);
        data = {uid:senderID};
        rtdb.set(usernameRef, data);

        //every user has the main full group chat room
        let userChatRef = rtdb.ref(db, "/users/" + senderID + "/chats");
        rtdb.push(userChatRef, {chatroomID: "-Mjz_495cBqQw4wt-fgv", nickname:"Full Group"});

        receiver = "";
        $("#chats").html(""); 
        addChatrooms();
        addPeople();
        
        
        document.querySelector("div.login").style.display = "none";
        document.querySelector("div.currUser").style.display = "block";
        document.getElementById("currentUserName").innerHTML = "Current User: " + senderName;
        

      }).catch(function(error) { });

    } else { alert("Username Taken"); }
  });
  
});


$("#login").on("click", ()=>{
  let email = $("#logemail").val();
  let pwd = $("#logpass").val();
  fbauth.signInWithEmailAndPassword(auth, email, pwd).then(
    somedata=>{
      receiver = "";
      $("#chats").html("");
      
      console.log(somedata.user);
      senderID = somedata.user.uid;
      
      addChatrooms();
     
      let userRef = rtdb.ref(db, `/users/${senderID}`);
      rtdb.get(userRef).then(ss=>{ 
        let data=ss.val();
        senderName = data.name;
        
        document.querySelector("div.login").style.display = "none";
        document.querySelector("div.currUser").style.display = "block";
        document.getElementById("currentUserName").innerHTML = "Current User: " + senderName;
      });
      
      
      
    }).catch(function(error) {    });
})