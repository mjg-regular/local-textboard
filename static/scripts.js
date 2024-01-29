/* scripts.js */
document.addEventListener("DOMContentLoaded", function () {
    const forms = document.querySelectorAll("form.reply-form");
    forms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: data,
            }).then((response) => {
                if(response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok.');
            }).then((json) => {
                const newPost = document.createElement('div');
                newPost.classList.add('post');
                newPost.setAttribute('id', `post-${json.number}`);

                const anonymous = document.createElement('strong');
                anonymous.textContent = 'Anonymous';
                newPost.appendChild(anonymous);

                const date = document.createElement('span');
                date.textContent = ' ' + json.date + ' No.' + json.number;
                newPost.appendChild(date);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'x';
                deleteBtn.className = 'delete-btn';
                deleteBtn.setAttribute('data-thread-id', json.thread_id);
                deleteBtn.setAttribute('data-post-number', json.number);
                newPost.appendChild(deleteBtn);

                const postContent = document.createElement('div');
                postContent.classList.add('post-content');

                const lines = json.content.split('\n');
                lines.forEach((line, index) => {
                    const span = document.createElement('span');
                    if (line.startsWith('>')) {
                        span.classList.add('quote');
                    }
                    span.textContent = line;
                    postContent.appendChild(span);
                    if (index !== lines.length - 1) {
                        postContent.appendChild(document.createElement('br'));
                    }
                });

                newPost.appendChild(postContent);

                // Find the last '.post' or '.opening-post' in the '.thread' and insert the new post after it
                let lastPost = form.parentElement.querySelector('.post:last-of-type');
                if (!lastPost) { // If there are no '.post', this must be a new thread, find '.opening-post' instead
                    lastPost = form.parentElement.querySelector('.opening-post');
                }
                lastPost.after(newPost);
                form.reset();
            }).catch((error) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        });
    });

    // Event delegation to handle click events on delete buttons
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
                    // Check if the post to be deleted is an opening post
                    // If so, delete the whole thread container
                    const postElement = document.getElementById(`post-${postNumber}`);
                    if(postElement && postElement.classList.contains('opening-post')) {
                        postElement.parentNode.remove();
                    } else {
                        // If it's a reply, just remove that post
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
