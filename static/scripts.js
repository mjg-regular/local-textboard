/* scripts.js */
function linkify(text) {
    const urlRegex = /(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
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
});
