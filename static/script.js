document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatHistory = document.getElementById("chat-history");
    const sendBtn = document.getElementById("send-btn");
    const clearChatBtn = document.getElementById("clear-chat");
    const toggleSidebarBtn = document.getElementById("toggle-sidebar");
    const closeSidebarBtn = document.getElementById("close-sidebar");
    const sidebar = document.getElementById("sidebar");
    const suggestionChips = document.querySelectorAll(".suggestion-chip");

    // Clear history to initial state (keep only welcome message)
    const welcomeMsgHTML = chatHistory.innerHTML;

    // Toggle sidebar on mobile with backdrop overlay
    const sidebarOverlay = document.getElementById("sidebar-overlay");

    function openSidebar() {
        if (sidebar) sidebar.classList.add("active");
        if (sidebarOverlay) sidebarOverlay.classList.add("active");
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("active");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    }

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener("click", openSidebar);
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    // Close sidebar on window resize if moving to desktop width
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Clear chat handler
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the conversation?")) {
                chatHistory.innerHTML = welcomeMsgHTML;
                // Re-bind suggestion chips because we reset innerHTML
                bindSuggestionChips();
            }
        });
    }

    // Chip suggestions helper
    function bindSuggestionChips() {
        const activeChips = document.querySelectorAll(".suggestion-chip");
        activeChips.forEach(chip => {
            // Remove existing listener to prevent double binding
            chip.replaceWith(chip.cloneNode(true));
        });
        
        // Re-query and bind fresh listeners
        document.querySelectorAll(".suggestion-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const question = chip.getAttribute("data-question");
                if (question) {
                    chatInput.value = question;
                    chatForm.dispatchEvent(new Event("submit"));
                    closeSidebar();
                }
            });
        });
    }

    bindSuggestionChips();

    // Handle form submit
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // Clear input field
        chatInput.value = "";

        // Append User Message to history
        appendMessage("user", messageText);

        // Show loading/typing indicator
        const typingIndicator = appendTypingIndicator();
        scrollToBottom();

        // Disable input and button
        setUIState(false);

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: messageText })
            });

            const data = await response.json();

            // Remove loading state
            typingIndicator.remove();

            if (response.ok && data.answer) {
                appendMessage("assistant", data.answer);
            } else {
                appendMessage("assistant", data.error || "An error occurred while fetching the response.", true);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            typingIndicator.remove();
            appendMessage("assistant", "Could not connect to the server. Please check your internet connection and try again.", true);
        } finally {
            setUIState(true);
            scrollToBottom();
            chatInput.focus();
        }
    });

    // Append user or assistant messages
    function appendMessage(sender, text, isError = false) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;
        
        // Formatted content (convert newlines to paragraphs)
        const formattedContent = formatMessageText(text);

        // SVG Icons
        let avatarIcon = "";
        if (sender === "user") {
            avatarIcon = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        } else {
            avatarIcon = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${avatarIcon}
            </div>
            <div class="message-content ${isError ? 'error-msg' : ''}">
                ${formattedContent}
            </div>
        `;

        chatHistory.appendChild(messageDiv);
        scrollToBottom();
    }

    // Append the typing indicator
    function appendTypingIndicator() {
        const indicatorDiv = document.createElement("div");
        indicatorDiv.className = "message assistant-message";
        indicatorDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        chatHistory.appendChild(indicatorDiv);
        return indicatorDiv;
    }

    // Enable/Disable form controls
    function setUIState(enabled) {
        chatInput.disabled = !enabled;
        sendBtn.disabled = !enabled;
    }

    // Scroll chat area to bottom
    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Simple formatting: markdown parsing and newlines to HTML paragraphs
    function formatMessageText(text) {
        if (!text) return "";
        // Escape HTML to prevent XSS
        let processed = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // Parse bold (**text** to <strong>text</strong>)
        processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Parse italics (*text* to <em>text</em>)
        processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");

        // Parse inline code (`code` to <code>code</code>)
        processed = processed.replace(/`(.*?)`/g, "<code>$1</code>");

        // Split by double newline to form paragraphs, and convert single newlines to <br>
        return processed
            .split(/\n\n+/)
            .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
            .join("");
    }
});
