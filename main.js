let num1 = 28;
let num2 = 35;
let operator = "*";

var output = operator == "+" ? num1 + num2
           : operator == "-" ? num1 - num2
           : operator == "*" ? num1 * num2
           : operator == "/" ? num1 / num2
           : operator == "%" ? num1 % num2
           : "Invalid Operator";
console.log("Your Calculation is: " + num1 + " " + operator + " " + num2 + " = " + output);