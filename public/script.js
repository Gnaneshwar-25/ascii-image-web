const form = document.getElementById("ascii-form");
const output = document.getElementById("output");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  output.textContent = "Generating...";

  const formData = new FormData();

  // Image (required)
  formData.append("image", form.image.files[0]);

  // Numbers (only if provided)
  if (form.width.value) {
    formData.append("width", form.width.value);
  }
  if (form.height.value) {
    formData.append("height", form.height.value);
  }

  // Boolean flags (ALWAYS sent)
  formData.append("braille", form.braille.checked ? "true" : "false");
  formData.append("color", form.color.checked ? "true" : "false");

  // Threshold (always sent)
  formData.append("threshold", form.threshold.value);

  try {
    const res = await fetch("/convert", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log("SERVER RESPONSE:", data);

    output.textContent = data.ascii || "No ASCII returned";
  } catch (err) {
    output.textContent = "ERROR: " + err.message;
  }
});
