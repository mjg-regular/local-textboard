function linkify(text) {
    const urlRegex = /(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
}

function updateBoardList(display = true) {
    fetch('/board-list').then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network response was not ok.');
    }).then(boards => {
        const boardListElement = document.createElement('div');
        boardListElement.id = 'board-list';
        boards.forEach(board => {
            const boardLink = document.createElement('a');
            boardLink.href = `/?board_file=${board.filename}`;
            boardLink.textContent = board.title;
            boardLink.className = 'board-link';  // Apply the new class to board links
            boardLink.dataset.filename = board.filename; // Optional: store filename as data-attribute for further actions
            boardListElement.appendChild(boardLink);
        });
        const sidebarContent = document.querySelector('.sidebar-content');
        const currentBoardList = document.getElementById('board-list');
        if (currentBoardList) currentBoardList.remove();
        if (display) sidebarContent.appendChild(boardListElement);
    }).catch(error => {
        console.error('Error:', error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Process existing posts on page load
    document.querySelectorAll('.post-content').forEach(function (postContentElement) {
        postContentElement.innerHTML = linkify(postContentElement.innerHTML);
    });

    const forms = document.querySelectorAll("form.reply-form");
    forms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: data,
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok.');
            }).then(json => {
                const newPost = document.createElement('div');
                newPost.classList.add('post');
                newPost.setAttribute('id', `post-${json.number}`);

                const postDetails = document.createElement('div');
                postDetails.classList.add('post-details');

                const anonymous = document.createElement('strong');
                anonymous.textContent = 'Anonymous';
                postDetails.appendChild(anonymous);

                const date = document.createElement('span');
                date.textContent = ` ${json.date} No.${json.number} `;
                postDetails.appendChild(date);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'x';
                deleteBtn.className = 'delete-btn';
                deleteBtn.setAttribute('data-thread-id', json.thread_id);
                deleteBtn.setAttribute('data-post-number', json.number);
                postDetails.appendChild(deleteBtn);

                newPost.appendChild(postDetails);

                const postContent = document.createElement('div');
                postContent.classList.add('post-content');

                // Apply linkify function and add quote class if the line starts with '>'
                const lines = json.content.split('\n');
                lines.forEach(line => {
                    const span = document.createElement('span');
                    if (line.startsWith('>')) {
                        span.classList.add('quote'); // Apply greentext styling
                    }
                    span.innerHTML = linkify(line); // Apply linkify to the line
                    postContent.appendChild(span);
                    postContent.appendChild(document.createElement('br'));
                });

                newPost.appendChild(postContent);

                let lastPost = form.parentElement.querySelector('.post:last-of-type');
                if (!lastPost) {
                    lastPost = form.parentElement.querySelector('.opening-post');
                }
                lastPost.after(newPost);
                form.reset();
            }).catch(error => {
                console.error('Error:', error);
            });
        });
    });

    document.addEventListener('click', function (event) {
        if (event.target.matches('.delete-btn')) {
            event.preventDefault();
            const confirmation = confirm('Delete this post, jannie?');
            if (!confirmation) {
                return; // If the user did not confirm, we exit here, and the rest of the delete code will not execute.
            }
            const postNumber = event.target.dataset.postNumber;
            const threadId = event.target.dataset.threadId;
            fetch(`/delete-post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `thread_id=${threadId}&post_number=${postNumber}`,
            }).then(response => {
                if (response.ok) {
                    const postElement = document.getElementById(`post-${postNumber}`);
                    if (postElement && postElement.classList.contains('opening-post')) {
                        postElement.parentNode.remove();
                        const sidebarLink = document.querySelector(`.sidebar-thread-link[href="#post-${postNumber}"]`);
                        if (sidebarLink) {
                            sidebarLink.remove();
                        }
                    } else {
                        postElement.remove();
                    }
                } else {
                    console.error('Failed to delete the post');
                }
            }).catch(error => {
                console.error('Error:', error);
            });
        }
    });
    const settingsBtn = document.getElementById('settings-btn');
    const settingsForm = document.getElementById('settings-form');

    settingsBtn.addEventListener('click', function() {
        settingsForm.style.display = settingsForm.style.display === 'none' ? 'block' : 'none';
        this.classList.toggle('active-btn', settingsForm.style.display === 'block');
    });
    const toggleBoardListLink = document.getElementById('toggle-board-list');
    const catalogHeader = document.getElementById('catalog-header');
    const threadsContainer = document.querySelector('.threads-content'); // Adjusted target here

    toggleBoardListLink.addEventListener('click', function(event) {
        event.preventDefault();  // Prevent the default anchor action

        const isBoardsViewActive = this.textContent.includes('show catalog');
        if (isBoardsViewActive) {
            // Hide the board list and change the text to "show boards"
            this.textContent = 'show boards';
            catalogHeader.innerText = 'Catalog';  // Added line to update header text
            threadsContainer.style.display = 'block';  // Show the threads container
            updateBoardList(false); // Call updateBoardList with false to hide it
        } else {
            // Show the board list and change the text to "show catalog"
            this.textContent = 'show catalog';
            catalogHeader.innerText = 'Boards';  // Added line to update header text
            threadsContainer.style.display = 'none';  // Hide the threads container
            updateBoardList(true); // Call updateBoardList with true to show it
        }
    });

    // Scroll to Top Event Listener
    document.getElementById('top-link').addEventListener('click', function(e) {
        e.preventDefault();  // Prevent default anchor behavior
        window.scrollTo({ top: 0, behavior: 'smooth' });  // Smoothly scroll to the top of the page
    });

});
