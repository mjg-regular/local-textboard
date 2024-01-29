/* scripts.js */
document.addEventListener("DOMContentLoaded", function(){
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
                const lines = json.content.split('\r\n');
                lines.forEach((line, index) => {
                    const span = document.createElement('span');
                    if (line.startsWith('>')) {
                        span.classList.add('quote');
                    }
                    span.textContent = line;
                    newPost.appendChild(span);
                    if (index !== lines.length - 1) {
                        newPost.appendChild(document.createElement('br'));
                    }
                });
                form.previousElementSibling.appendChild(newPost);
                form.reset();
            }).catch((error) => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        });
    });
});
