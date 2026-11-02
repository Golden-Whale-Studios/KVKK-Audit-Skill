// Fake data for the scanner tests only.
export function showUser(user) {
  console.log("user", user.email);
  return { tcKimlikNo: "10000000146", name: "Test" };
}
