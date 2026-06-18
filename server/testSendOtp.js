async function test() {
  try {
    const res = await fetch("https://studynotion-le5w.onrender.com/api/v1/auth/sendotp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "vishalsahani4747@gmail.com" })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.log("Error:", err);
  }
}
test();
