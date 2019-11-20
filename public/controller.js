// Fire base configuration
var firebaseConfig = {
  apiKey: "AIzaSyC6lOr9SwReXvI-ZIvmtaKn0uYjioLSh0U",
  authDomain: "jaddit.firebaseapp.com",
  databaseURL: "https://jaddit.firebaseio.com",
  projectId: "jaddit",
  storageBucket: "jaddit.appspot.com",
  messagingSenderId: "445154080416",
  appId: "1:445154080416:web:2de578a6243e1fb18b7bc5",
  measurementId: "G-WRPL7NB5M7"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

//Global user variable
var user;
var frontPage;
$(document).ready(function () {
  var template = document.getElementById('loginPage').innerHTML;
  display.innerHTML = template;
});

var pages = ['loginInfo', 'jadditHome', 'uniqueTopic'];

function signInWithGoogle() {
  var theDB = firebase.database();
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
  firebase.auth().signInWithPopup(provider).then(function (result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    window.user = user;
    handleLogin(user);
  }).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
  });


};

function handleLogin(user) {
  var theDB = firebase.database();
  theDB.ref().child("users/" + user.uid).set({ isadmin: false });

  // Clear current page and switch to jadditHome
  var template = document.getElementById('jadditHome').innerHTML;
  display.innerHTML = template

  document.getElementById('navbar').innerHTML = `<a class="navbar-brand">Hello ${user.displayName}</a> 
  <button class="btn btn-outline-danger" id="logout">Logout</button>`;
  $('#logout').click(function () { logout() });

  loadJaddit();
};

function logout() {
  window.user = "";
  var template = document.getElementById('loginPage').innerHTML;
  display.innerHTML = template;

  //Change navbar
  document.getElementById('navbar').innerHTML = `<ul class="navbar-nav mr-auto"></ul><a class="navbar-brand mx-auto">
    <img src="images/logo.png" style="max-width: 100px;"></a>
    <ul class="navbar-nav ml-auto"><button id="login" onclick="signInWithGoogle()" class="btn btn-outline-danger">Login</button></ul>`;

    $('#login').click(function () { signInWithGoogle() });
};

function backButton() {
  var template = document.getElementById('jadditHome').innerHTML;
  display.innerHTML = template;
  loadJaddit();
}

function loadJaddit() {

  console.log('loading');
  var db = firebase.database();

  db.ref("topics").on("value", function (snap) {
    $("#topics").empty();
    var topics = snap.val();

    // Iterate through and create new database reference
    Object.keys(topics).forEach(function (key) {
      var listItem = $(`<li class="list-group-item" style="margin-bottom:5px;"><div><b>${topics[key].title}</b></div>
        <div style="float:right">Author:  <i>${topics[key].author}</i></div>
        <p>${topics[key].blurb}</p></li>`).addClass('listItem').attr('id', key).click(function () { loadUniqueTopics(key) });
      $("#topics").append(listItem);
    });
  });
};

// Create new topic instance on the database
function createTopic() {

  var topicTitle = $('#topicTitle').val();
  var topicBlurb = $('#topicBlurb').val();

  let newref = firebase.database().ref("topics").push();

  newref.set({
    title: topicTitle,
    blurb: topicBlurb,
    author: window.user.displayName
  });

  document.getElementById('topicTitle').value = "";
  document.getElementById('topicBlurb').value = "";


};

function clearTopicContents(){
  document.getElementById('topicTitle').value = "";
  document.getElementById('topicBlurb').value = "";
}

function clearCommentContents(){
  document.getElementById('commentText').value = "";
}

function clearSubCommentContents(){
  document.getElementById('subCommentText').value = "";
}

// Load unique topic page
function loadUniqueTopics(id) {

  var template = document.getElementById('uniqueTopicPage').innerHTML;
  display.innerHTML = template;

  document.getElementById('createCommentBtn').onclick = function () {
    createNewComment(id);
  };

  // Load database and all of the comments 
  var db = firebase.database();

  db.ref("topics/" + id).on("value", function (snap) {
    var topic = snap.val();

    console.log(topic);

    document.getElementById('topic').innerText = topic.title;
    document.getElementById('topicText').innerText = topic.blurb;
  });

  db.ref("comments").on("value", function (snap) {
    $("#commentList").empty();
    var allComments = snap.val();

    // Iterate through all comments to get only comments for specific topic
    Object.keys(allComments).forEach(function (key) {
      if (allComments[key].parentID != id) {
        delete allComments[key];
      };
    });

    // Now make sure each comment displays the right infromation
    Object.keys(allComments).forEach(function (key) {

      var likes = 0;
      var likeColor;
      //If statement for if user liked it already
      if (allComments[key].votes != null) {
        Object.keys(allComments[key].votes).forEach(function (vote) {
          if (allComments[key].votes[vote].voter == window.user.uid) {
            likeColor = 'red';
          };
          likes++;
        });
      };

      var comment = $(`<div id="${key}" style="width:100%" ><li class="list-group-item" style="margin-bottom:5px;">
      <div><p>${allComments[key].commentText}</p></div>
      <div style="float:right"><button data-toggle="modal" type="button"  data-target="#createSubCommentModal" id="${key}Button" onclick="updateParentReference('${key}')"  
      class="btn btn-default"><span class="fa fa-plus" aria-hidden="true"></span></button><button type="button" id="${key}LikeButton" onclick="likeComment('${key}')"  
      class="btn btn-default"><i class="fa fa-thumbs-o-up"  style="color:${likeColor}" aria-hidden="true"></i></button>${likes}</div></li></div>`)

      $("#commentList").append(comment);
      if (allComments[key].subcomments != null) {
        var path = 'comments/' + key + '/subcomments/';
        loadSubComments(key, path);
      };
    });
  });
};

function loadSubComments(commentid, commentPath) {
  var db = firebase.database();

  db.ref(commentPath).on("value", function (snap) {
    var subComments = snap.val();
    recursiveSubLoader(commentid, subComments);
  });
};

// Some weird function to update the reference point of the button
function updateParentReference(parentid) {
  document.getElementById('createSubCommentBtn').onclick = function () {
    createSubComment(parentid);
  };
};

// Recursive function to load comments 
function recursiveSubLoader(parentID, subComments) {
  Object.keys(subComments).forEach(function (key) {

    var likes = 0;
    var likeColor;
    //If statement for if user liked it already
    if (subComments[key].votes != null) {
      Object.keys(subComments[key].votes).forEach(function (vote) {
        if (subComments[key].votes[vote].voter == window.user.uid) {
          likeColor = 'red';
        };
        likes++;
      });
    }

    var subcomment = $(`<div id="${key}" style="width:95%; float: right;" ><li class="list-group-item" style="margin-bottom:5px;">
    <div><p>${subComments[key].commentText}</p></div>
    <div style="float:right"><button data-toggle="modal" type="button"  data-target="#createSubCommentModal" id="${key}Button" onclick="updateParentReference('${key}')"  
    class="btn btn-default"><span class="fa fa-plus" aria-hidden="true"></span></button><button type="button" id="${key}LikeButton" onclick="likeComment('${key}')"  
    class="btn btn-default"><i class="fa fa-thumbs-o-up" style="color:${likeColor}" aria-hidden="true"></i></button>${likes}</div></li></div>`)

    $(`#${parentID}`).append(subcomment);

    if (subComments[key].subcomments != null) {
      recursiveSubLoader(key, subComments[key].subcomments);
    }
  });
};


// Used to create a new comment with a parent id given
function createNewComment(id) {
  let newref = firebase.database().ref("comments").push();
  var commentTxt = $('#commentText').val();

  newref.set({
    parentID: id,
    commentText: commentTxt,
    author: window.user.displayName
  });

  document.getElementById('commentText').value = "";

}

var path = "";

// Used to create subcomments
function createSubComment(commentid) {

  let db = firebase.database();

  db.ref("comments").on("value", function (snap) {
    var allComments = snap.val();
    window.path = 'comments/';

    getPath(window.path, allComments, commentid);

  });

  let newref = firebase.database().ref(window.path + '/subcomments/').push();
  var commentTxt = $('#subCommentText').val();

  newref.set({
    parentID: commentid,
    commentText: commentTxt,
    author: window.user.displayName

  });

  document.getElementById('subCommentText').value = "";

};

// Used to search JSON obj to find path of node
function getPath(path, obj, target) {
  for (var thing in obj) {
    // Initial Check
    if (thing == target) {
      window.path = path + target;
    } else if (obj[thing].hasOwnProperty('subcomments')) {
      getPath(path + thing + '/subcomments/', obj[thing].subcomments, target);
    }
  }
};

// Used to like comment
function likeComment(commentID) {

  //Find path of obj
  let db = firebase.database();
  db.ref("comments").on("value", function (snap) {
    var allComments = snap.val();
    window.path = 'comments/';
    getPath(window.path, allComments, commentID);
  });

  var comment;

  db.ref(window.path).on("value", function (snap) {
    comment = snap.val();
  });

  if (comment.hasOwnProperty('votes')) {
    var allVotes = comment.votes;
    var bool = true;
    Object.keys(allVotes).forEach(function (vote) {
      if (allVotes[vote].voter == window.user.uid) {
        db.ref(window.path + '/votes/' + vote).remove();
        bool = false;
      }
    });
    if (bool == true) {
      let newref = db.ref(window.path + '/votes/').push();
      newref.set({
        voter: window.user.uid
      });
    }

  } else {
    // No votes for this comment so add one
    let newref = db.ref(window.path + '/votes/').push();
    newref.set({
      voter: window.user.uid
    });
  }
}

