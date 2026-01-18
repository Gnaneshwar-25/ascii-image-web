const form = document.getElementById("ascii-form");
const output = document.getElementById("output");
const presetSelect = document.getElementById("preset");

presetSelect.addEventListener("change", () => {
  switch (presetSelect.value) {
    case "small":
      form.width.value = 60;
      form.height.value = "";
      break;
    case "medium":
      form.width.value = 80;
      form.height.value = "";
      break;
    case "large":
      form.width.value = 100;
      form.height.value = "";
      break;
    case "square":
      form.width.value = 60;
      form.height.value = 60;
      break;
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Generating…";
  output.textContent = "Processing image…";

  const formData = new FormData();
  formData.append("image", form.image.files[0]);

  if (form.width.value) formData.append("width", form.width.value);
  if (form.height.value) formData.append("height", form.height.value);

  formData.append("braille", form.braille.checked ? "true" : "false");
  formData.append("color", form.color.checked ? "true" : "false");
  formData.append("threshold", form.threshold.value);

  try {
    const res = await fetch("/convert", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    output.textContent = data.ascii || "No ASCII returned";
  } catch (err) {
    output.textContent = "ERROR: " + err.message;
  } finally {
    button.disabled = false;
    button.textContent = "Generate ASCII";
  }
});
