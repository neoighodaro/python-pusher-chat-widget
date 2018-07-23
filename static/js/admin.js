(function () {
    'use strict';

    // ----------------------------------------------------
    // Configure Pusher instance
    // ----------------------------------------------------

    var pusher = new Pusher('PUSHER_APP_KEY', {
        authEndpoint: '/pusher/auth',
        cluster: 'PUSHER_APP_CLUSTER',
        encrypted: true
      });

    // ----------------------------------------------------
    // Chat Details
    // ----------------------------------------------------

    let chat = {
        messages: [],
        currentRoom: '',
        currentChannel: '',
        subscribedChannels: [],
        subscribedUsers: []
    }

    // ----------------------------------------------------
    // Subscribe to the generalChannel
    // ----------------------------------------------------

    var generalChannel = pusher.subscribe('general-channel');

    // ----------------------------------------------------
    // Targeted Elements
    // ----------------------------------------------------

    const chatBody = $(document)
    const chatRoomsList = $('#rooms')
    const chatReplyMessage = $('#replyMessage')

    // ----------------------------------------------------
    // Register helpers
    // ----------------------------------------------------

    const helpers = {

    // ------------------------------------------------------------------
    // Clear the chat messages UI
    // ------------------------------------------------------------------

        clearChatMessages: () => $('#chat-msgs').html(''),

    // ------------------------------------------------------------------
    // Add a new chat message to the chat window.
    // ------------------------------------------------------------------

        displayChatMessage: (message) => {
            if (message.email === chat.currentRoom) {

                $('#chat-msgs').prepend(
                    `<tr>
                        <td>
                            <div class="sender">${message.sender} @ <span class="date">${message.createdAt}</span></div>
                            <div class="message">${message.text}</div>
                        </td>
                    </tr>`
                )
            }
        },

    // ------------------------------------------------------------------
    // Select a new guest chatroom
    // ------------------------------------------------------------------

        loadChatRoom: evt => {
            chat.currentRoom = evt.target.dataset.roomId
            chat.currentChannel = evt.target.dataset.channelId

            if (chat.currentRoom !== undefined) {
                $('.response').show()
                $('#room-title').text(evt.target.dataset.roomId)
            }

            evt.preventDefault()
            helpers.clearChatMessages()
        },

    // ------------------------------------------------------------------
    // Reply a message
    // ------------------------------------------------------------------
        replyMessage: evt => {
            evt.preventDefault()

            let createdAt = new Date()
            createdAt = createdAt.toLocaleString()

            const message = $('#replyMessage input').val().trim()

            chat.subscribedChannels[chat.currentChannel].trigger('client-support-new-message', {
                'name': 'Admin',
                'email': chat.currentRoom,
                'text': message,
                'createdAt': createdAt
            });

            helpers.displayChatMessage({
                'email': chat.currentRoom,
                'sender': 'Support',
                'text': message,
                'createdAt': createdAt
            })


            $('#replyMessage input').val('')
        },
    }


    // ------------------------------------------------------------------
    // Listen to the event that returns the details of a new guest user
    // ------------------------------------------------------------------
      generalChannel.bind('new-guest-details', function(data) {

        chat.subscribedChannels.push(pusher.subscribe('private-' + data.email));

        chat.subscribedUsers.push(data);

        // render the new list of subscribed users and clear the former
        $('#rooms').html("");
        chat.subscribedUsers.forEach(function (user, index) {

                $('#rooms').append(
                    `<li class="nav-item"><a data-room-id="${user.email}" data-channel-id="${index}" class="nav-link" href="#">${user.name}</a></li>`
                )
        })

      })


    // ------------------------------------------------------------------
    // Listen for a new message event from a guest
    // ------------------------------------------------------------------
      pusher.bind('client-guest-new-message', function(data){
          helpers.displayChatMessage(data)
      })


    // ----------------------------------------------------
    // Register page event listeners
    // ----------------------------------------------------
    chatReplyMessage.on('submit', helpers.replyMessage)
    chatRoomsList.on('click', 'li', helpers.loadChatRoom)
}())
