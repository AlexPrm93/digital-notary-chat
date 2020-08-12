require('emojionearea');
const Chat = require('twilio-chat');

$(function() {
  // Get handle to the chat div
  var $chatWindow = $('#messages');

  // Get handle to the chat overlay div
  var $chatOverlay = $('#chat-overlay');

  // Our interface to the Chat service
  var chatClient;

  // A handle to the "general" chat channel - the one and only channel we
  // will have in this sample app
  var generalChannel;

  // The server will assign the client a random username - store that value
  // here
  var username;

  // Helper function to print info messages to the chat window
  function print(infoMessage, asHtml) {
    var $msg = $('<div class="c-info">');
    if (asHtml) {
      $msg.html(infoMessage);
    } else {
      $msg.text(infoMessage);
    }
    $chatOverlay.append($msg);
  }

  // Helper function to get an abbreviation of user name
  const getNameAbbreviation = (username) => username.replace(/([a-z])/g, '');

  // Helper function to print chat message to the chat window
  function printMessage(fromUser, message) {
    const $container = $('<div class="c-message">');
    const $message = $('<span class="c-message__content">').text(message);

    if (fromUser === username) {
      const $user = $(`<div class="c-message__username" title="${fromUser}">`)
        .html('<span">You</span>')
        .addClass('is-owner');

      $container.append($user).append($message);
    } else {
      const userAbbreviation = getNameAbbreviation(fromUser);
      const $user = $(`<div class="c-message__username" title="${fromUser}">`)
        .html(`<span>${userAbbreviation}</span>`);

      $container
        .addClass('is-client-message')
        .append($message)
        .append($user);
    }

    $chatWindow.append($container);
    $chatWindow.scrollTop($chatWindow[0].scrollHeight);
  }

  // Alert the user they have been assigned a random username
  print('Logging in...');

  // Get an access token for the current user, passing a username (identity)
  $.getJSON('/token', function(data) {

    // Initialize the Chat client
    Chat.Client.create(data.token).then(client => {
      console.log('Created chat client');
      chatClient = client;
      chatClient.getSubscribedChannels().then(createOrJoinGeneralChannel);

      // when the access token is about to expire, refresh it
      chatClient.on('tokenAboutToExpire', function() {
        refreshToken(username);
      });

      // if the access token already expired, refresh it
      chatClient.on('tokenExpired', function() {
        refreshToken(username);
      });

    // Alert the user they have been assigned a random username
    username = data.identity;
    print('You have been assigned a random username of: '
    + '<span class="is-owner">' + username + '</span>', true);

    }).catch(error => {
      console.error(error);
      print('There was an error creating the chat client:<br/>' + error, true);
      print('Please check your .env file.', false);
    });
  });

  function refreshToken(identity) {
    console.log('Token about to expire');
    // Make a secure request to your backend to retrieve a refreshed access token.
    // Use an authentication mechanism to prevent token exposure to 3rd parties.
    $.getJSON('/token/' + identity, function(data) {
      console.log('updated token for chat client');
      chatClient.updateToken(data.token);
    });
  }

  function createOrJoinGeneralChannel() {
    // Get the general chat channel, which is where all the messages are
    // sent in this simple application
    print('Attempting to join "general" chat channel...');
    chatClient.getChannelByUniqueName('general')
    .then(function(channel) {
      generalChannel = channel;
      console.log('Found general channel:');
      console.log(generalChannel);
      setupChannel();
    }).catch(function() {
      // If it doesn't exist, let's create it
      console.log('Creating general channel');
      chatClient.createChannel({
        uniqueName: 'general',
        friendlyName: 'General Chat Channel'
      }).then(function(channel) {
        console.log('Created general channel:');
        console.log(channel);
        generalChannel = channel;
        setupChannel();
      }).catch(function(channel) {
        console.log('Channel could not be created:');
        console.log(channel);
      });
    });
  }

  // Set up channel after it has been found
  function setupChannel() {
    // Join the general channel
    generalChannel.join().then(function(channel) {
      print('Joined channel as '
      + '<span class="is-owner">' + username + '</span>.', true);
    });

    setTimeout(() => $chatOverlay.slideUp(), 1000);

    // Listen for new messages sent to the channel
    generalChannel.on('messageAdded', function(message) {
      printMessage(message.author, message.body);
    });
  }

  // Send a new message to the general channel
  const $input = $('#chat-input');
  const $chatBtn = $('#chat-button');

  const emojiField = $input.emojioneArea({
    placeholder: 'Write a message',
    searchPlaceholder: "Search...",
    filtersPosition: "bottom",
    shortnames: true,
    inline: true,
    filters: {
      smileys_people: {
        icon: 'yum'
      }
    }
  });

  const getChatMessage = () => {
    if (generalChannel === undefined) {
      print('The Chat Service is not configured. Please check your .env file.', false);
      return;
    }

    const emojiArea = emojiField[0].emojioneArea;
    const emojiAreaText = emojiField[0].emojioneArea.getText();

    if (emojiAreaText !== '' && $.trim(emojiAreaText.replace(/\s+/g, '')) !== '') {
      generalChannel.sendMessage(emojiAreaText);
      emojiArea.setText('');
    }
  }

  $chatBtn.on('click', getChatMessage);

  emojiField[0].emojioneArea.on('keydown', (el, event) => {
    if (event.keyCode == 13) {
      getChatMessage();
    }
  });

  $chatBtn.on('click', getChatMessage);

  // Get info about chat connection
  $('body').on('keydown', (event) => {
    if (event.keyCode == 112) {
      $chatOverlay.slideToggle();
    }
  });
});
