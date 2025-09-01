const result = document.getElementById("result");

function appendValue(value) {
  result.value += value;
}

function clearResult() {
  result.value = "";
}

function calculate() {
  try {
    result.value = eval(result.value) || "";
  } catch {
    result.value = "Error";
  }
}

function square() {
  if (result.value !== "") {
    let num = Number(result.value);
    result.value = num * num;
  }
}

function cube() {
  if (result.value !== "") {
    let num = Number(result.value);
    result.value = num * num * num;
  }
}

function factorial() {
  let num = Number(result.value);
  if (isNaN(num) || num < 0) {
    result.value = "Error";
    return;
  }
  let fact = 1;
  for (let i = 1; i <= num; i++) {
    fact *= i;
  }
  result.value = fact;
}

function evenOdd() {
  let num = Number(result.value);
  if (isNaN(num)) {
    result.value = "Error";
    return;
  }
  result.value = num % 2 === 0 ? "Even" : "Odd";
}
