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

function signInWithGoogle() {
  var theDB = firebase.database();
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).then(function (result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
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
  console.log(user)
  theDB.ref().child("users/" + user.uid).set({ isadmin: false });

  // Clear current page and switch to jadditHome
  var template = document.getElementById('jadditHome').innerHTML;
  display.innerHTML = template

  document.getElementById('navbar').innerHTML = `<a class="navbar-brand">Hello ${user.displayName}</a> <img src="${user.photoURL}" style="height:50px"></img>`;
  loadJaddit();
};

function loadJaddit() {

  var db = firebase.database();

  db.ref("topics").on("value", function (snap) {
    $("#topics").empty();
    var topics = snap.val();

    // Iterate through and create new database reference
    Object.keys(topics).forEach(function (key) {
      var listItem = $(`<div><li><b>${topics[key].title}</b><p>${topics[key].blurb}</p></li></div>`).addClass('listItem').attr('id', key).click(function () { loadUniqueTopics(key) });
      $("#topics").append(listItem);
    });
  });
};

// Create new topic instance on the database
function createTopic() {

  var topicTitle = $('#topicTitle').val();
  var topicImage = $('#topicImage').val();
  var topicBlurb = $('#topicBlurb').val();
  var topicLink = $('#topicLink').val();

  let newref = firebase.database().ref("topics").push();

  newref.set({
    title: topicTitle,
    image: topicImage,
    blurb: topicBlurb,
    link: topicLink,
  });


};

// Load unique topic page
function loadUniqueTopics(id) {

  var template = document.getElementById('uniqueTopicPage').innerHTML;
  display.innerHTML = template;

  document.getElementById('createCommentBtn').onclick = function () {
    createNewComment(id);
  };

  // Load database and all of the comments 
  var db = firebase.database();

  db.ref("comments").on("value", function (snap) {
    $("#comments").empty();
    var allComments = snap.val();

    // Iterate through all comments to get only comments for specific topic
    Object.keys(allComments).forEach(function (key) {
      if (allComments[key].parentID != id) {
        delete allComments[key];
      };
    });

    // Now make sure each comment displays the right infromation
    Object.keys(allComments).forEach(function (key) {
      var comment = $(`<div id="${key}"><p>${allComments[key].commentText}</p>
        <button data-toggle="modal" type="button"  data-target="#createSubCommentModal" id="${key}Button" onclick="updateParentReference('${key}')"  
        class="btn btn-default"><span class="fa fa-plus" aria-hidden="true"></span></button></div>`);
      
      $("#comments").append(comment);
      if(allComments[key].subcomments != null){
        loadSubComments(key);
      };
    });

  });


};

// Some weird function to update the reference point of the button
function updateParentReference(parentid){
  console.log(parentid);
  document.getElementById('createSubCommentBtn').onclick = function(){
    createSubComment(parentid);
  };
};

// Recursive function to load comments 
function recursiveSubLoader(subs, parentID){
  Object.keys(subs).forEach(function(key){
    

    var subcomment =  $(`<div id="${key}"><p>${subs[key].commentText}</p>
    <button data-toggle="modal" type="button"  data-target="#createSubCommentModal" id="${key}Button" onclick="updateParentReference('${key}')"  
    class="btn btn-default"><span class="fa fa-plus" aria-hidden="true"></span></button></div>`);

    $(`#${parentID}`).append(subcomment);

    if(subs[key].subcomments != null){
      recursiveSubLoader(subs[key].subcomments);
    }
  });
};

function loadSubComments(commentid){
  var db = firebase.database();

  db.ref('comments/' + commentid + '/subcomments').on("value", function (snap) {
    var subs = snap.val();
    recursiveSubLoader(subs, commentid);
  });
};

// Used to create a new comment with a parent id given
function createNewComment(id) {
  let newref = firebase.database().ref("comments").push();
  var commentTxt = $('#commentText').val();

  newref.set({
    parentID: id,
    commentText: commentTxt
  });
}

// Used to create subcomments
function createSubComment(commentid){
  let newref = firebase.database().ref('comments/' + commentid + '/subcomments').push();
  var commentTxt = $('#subCommentText').val();

  // FIND WAY TO CREATE SUBCOMMENT OF SUBCOMMENT EASILY

  newref.set({
    parentID: commentid,
    commentText: commentTxt
  });

  document.getElementById('subCommentText').value = "";
};