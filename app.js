const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const amountInput = document.getElementById("amount");
const resultDiv = document.getElementById("result");
const fromFlag = document.getElementById("from-flag");
const toFlag = document.getElementById("to-flag");
const swapBtn = document.getElementById("swapBtn");
const form = document.getElementById("converterForm");

const apiURL = "https://api.exchangerate-api.com/v4/latest";

//load currency dropdowns
window.addEventListener("load", () => {
    loadCurrencyOptions();
    //Don't call getExchangeRate on load - wait for user input
    resultDiv.textContent = "Enter an amount and click 'Get Exchange Rate'";
});

function loadCurrencyOptions() {
    for (let code in countryList){
        let opt1 = document.createElement("option");
        let opt2 = document.createElement("option");

        opt1.value = opt2.value = code;
        opt1.textContent = opt2.textContent = code;

        if(code === "USD") opt1.selected = true;
        if(code === "INR") opt2.selected = true;

        fromCurrency.appendChild(opt1);
        toCurrency.appendChild(opt2);
    }
    updateFlag(fromCurrency, fromFlag);
    updateFlag(toCurrency, toFlag);
}

function updateFlag(select, flagImg){
    let countryCode = countryList[select.value];
    flagImg.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
}

//Dropdown change events
fromCurrency.addEventListener("change", () => {
    updateFlag(fromCurrency, fromFlag);
    //only get exchange rate if amount is entered
    if(amountInput.value && amountInput.value > 0){
        getExchangeRate();
    }
});

toCurrency.addEventListener("change", () => {
    updateFlag(toCurrency, toFlag);
    //only get exchange rate if amount is entered
    if(amountInput.value && amountInput.value > 0){
        getExchangeRate();
    }
});

//swap button
swapBtn.addEventListener("click", () => {
    let temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;

    updateFlag(fromCurrency, fromFlag);
    updateFlag(toCurrency, toFlag);

    //only get exchange rate if amount is entered
    if(amountInput.value && amountInput.value > 0){
        getExchangeRate();
    }
});

//form submit
form.addEventListener("submit", (e) => {
    e.preventDefault();
    getExchangeRate();
});

//fetch exchange rate (no api key needed)
async function getExchangeRate(){
    let amount = parseFloat(amountInput.value);

    if(!amount || amount <= 0) {
        resultDiv.textContent = "Please enter a valid amount greater than 0.";
        return;
    }

    console.log(`Fetching exchange rate for ${amount} ${fromCurrency.value} to ${toCurrency.value}`);
    resultDiv.textContent = "Getting exchange rate...";

    try{
        //try the primary api first
        console.log("Trying primary API:", `${apiURL}/${fromCurrency.value}`);
        let res = await fetch(`${apiURL}/${fromCurrency.value}`);

        if(!res.ok){
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        let data = await res.json();
        console.log("Primary API response:", data);

        if(data.rates && data.rates[toCurrency.value]){
            let rate = data.rates[toCurrency.value];
            let total = (amount * rate).toFixed(2);
            resultDiv.textContent = `${amount} ${fromCurrency.value} = ${total} ${toCurrency.value}`;
            console.log(`Exchange rate: ${rate}, Total: ${total}`);
        } else {
            console.log("Primary API doesn't have the target currency, trying fallback");
            //fallback to alternative api
            await getExchangeRateFallback(amount);
        }
    } catch (err){
        console.error("Primary API failed:", err);
        //try fallback API
        await getExchangeRateFallback(amount);
    }
}

//fallback API function
async function getExchangeRateFallback(amount) {
    try{
        const fallbackURL = `https://api.exchangerate.host/latest?base=${fromCurrency.value}&symbols=${toCurrency.value}`;
        console.log("Trying fallback API:", fallbackURL);

        let res = await fetch(fallbackURL);

        if(!res.ok){
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        let data = await res.json();
        console.log("Fallback API response:", data);

        if(data.rates && data.rates[toCurrency.value]){
            let rate = data.rates[toCurrency.value];
            let total = (amount * rate).toFixed(2);
            resultDiv.textContent = `${amount} ${fromCurrency.value} = ${total} ${toCurrency.value}`;
            console.log(`Fallback exchange rate: ${rate}, Total: ${total}`);
        } else {
            resultDiv.textContent = "Unable to get exchange rate. Please try again.";
            console.log("Fallback API doesn't have the target currency");
        }
    } catch (err) {
        console.error("Fallback API also failed:", err);
        resultDiv.textContent = "Error fetching exchange rate. Please check your internet connection and try again.";
    }
}