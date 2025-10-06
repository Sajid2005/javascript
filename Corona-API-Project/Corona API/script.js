const btn = document.querySelector(".btn");
const inputElement = document.querySelector(".inputElement");
btn.addEventListener("click", getData);
function getData() {
  let country = inputElement.value;
  fetch(`https://covid-193.p.rapidapi.com/statistics?country=${country}`, {
    method: "GET",
    headers: {
      "x-rapidapi-host": "covid-193.p.rapidapi.com",
      "x-rapidapi-key": "454edf1445msh6661a5c9cdd229dp1e5aaejsn1f284afc67f1",
    },
  })
    .then((response) => response.json())
    .then((json) => {
      let data = json.response[0];
      document.querySelector(".activeCases").innerHTML = data.cases.active;
      document.querySelector(".newCases").innerHTML = data.cases.new;
      document.querySelector(".recoveredCases").innerHTML =
        data.cases.recovered;
      document.querySelector(".totalCases").innerHTML = data.cases.total;
      document.querySelector(".totalDeaths").innerHTML = data.deaths.total;
      document.querySelector(".totalTests").innerHTML = data.tests.total;
    });
}
