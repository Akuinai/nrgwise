let loading = false; // Houdt bij of een vraag bezig is

// PDF uploaden
async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const files = fileInput.files;

    if (files.length === 0) {
        alert("Selecteer een bestand om te uploaden.");
        return;
    }

    for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            alert(`Bestand "${file.name}" geüpload: ${data.message}`);
        } catch (error) {
            console.error(error);
            alert(`Fout bij uploaden van "${file.name}".`);
        }
    }
}

// Vraag stellen aan server
async function stelVraag(e) {
    e.preventDefault();

    if (loading) {
        alert("Wacht tot het vorige antwoord klaar is!");
        return;
    }

    const chatfield = document.getElementById("chatfield");
    const vraag = chatfield.value.trim();
    if (!vraag) {
        alert("Typ eerst een vraag.");
        return;
    }

    const responseBox = document.getElementById("response");
    responseBox.innerText = "";
    loading = true;

    try {
        const res = await fetch("http://localhost:3000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vraag }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        // Streaming antwoord stukje voor stukje ontvangen
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.replace("data: ", "").trim();
                    if (data === "[DONE]") {
                        loading = false;
                        return;
                    }
                    responseBox.innerText += data + " ";
                }
            }
        }
    } catch (error) {
        console.error(error);
        responseBox.innerText = "Er ging iets mis!";
        loading = false;
    }
}

// Event listeners voor de knoppen
document.getElementById("uploadButton").addEventListener("click", uploadFile);
document.getElementById("questionForm").addEventListener("submit", stelVraag);