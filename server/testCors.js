async function test() {
  try {
    const res = await fetch("https://studynotion-le5w.onrender.com/api/v1/course/showAllCategories", {
      method: "OPTIONS",
      headers: { "Origin": "https://studynotion-liard-zeta.vercel.app" }
    });
    console.log("Status:", res.status);
    console.log("Headers:");
    res.headers.forEach((v, k) => console.log(k, v));
  } catch (err) {
    console.log("Error:", err);
  }
}
test();
