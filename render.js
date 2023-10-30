const { OpenAI } = require("openai");

const FixedStack = require('./FixedStack'); // context 

const keyIcon = document.getElementById("key-icon")
const keyBlock = document.querySelector(".key-block")
const keyInput = document.getElementById("key-input")
const chatBlock = document.getElementById("chat-block")
const historyBlock = document.getElementById("history-block")

const costValue = document.getElementById("cost-value")
const responseValue = document.getElementById("response-value")
const totalValue = document.getElementById("total-value")
const completionValue = document.getElementById("completion-value")
const promptValue = document.getElementById("prompt-value")

// stats
let maxTokens = 200
let temperature = 0.7
let frequency = 1.0 // frequency penalty - default 0 
const pricing = 0.002 / 1000 // for gpt-3.5-turbo as of 04/23
let totalCharges = 0.0 // running tally for this session
const stack = new FixedStack(15, 3);

// api key
let apiKey = localStorage.getItem('apikey')
if (!apiKey) {
    keyIcon.setAttribute("stroke", "red")
} else {
    keyInput.value = apiKey
}

keyIcon.addEventListener('click', (e) => {
    if (keyBlock.classList.contains("show")) { // close slider and set key
        if (apiKey !== keyInput.value) {
            apiKey = keyInput.value
            localStorage.setItem("apikey", apiKey)
            configuration = new Configuration({
                apiKey: apiKey
            });
            delete configuration.baseOptions.headers['User-Agent'];
            // console.log("Set and stored api: ", keyInput.value)
        }
    } else {
        keyInput.focus()
    }
    if (!apiKey) {
        keyIcon.setAttribute("stroke", "red")
    } else {
        keyIcon.setAttribute("stroke", "currentColor")
    }
    keyBlock.classList.toggle("show")

});


// sliders
const tempSlider = document.getElementById('temp-meter');
const tempLabel = document.getElementById('temp-label');

const tokenSlider = document.getElementById('max-tokens');
const tokensLabel = document.getElementById('tokens-label');

const frequencySlider = document.getElementById('frequency');
const frequencyLabel = document.getElementById('frequency-label');


tempSlider.addEventListener('input', (event) => {
    temperature = event.target.value
    tempLabel.textContent = `Temp: ${temperature}`;

});

tokenSlider.addEventListener('input', (event) => {
    maxTokens = event.target.value
    tokensLabel.textContent = `Reply: ${maxTokens}`;
});

frequencySlider.addEventListener('input', (event) => {
    frequency = event.target.value
    frequencyLabel.textContent = `Frequency: ${frequency}`;
});


const openai = new OpenAI({
    apiKey: apiKey, dangerouslyAllowBrowser: true
});


async function runRequest() {
    console.log("running request")
    if (!apiKey) {
        displayErrorMessage("Click on the Key Icon to set the API key")
        return
    }
    running = true
    try {
        const response = await openai.listModels();
        console.log(response)
    } catch (e) {
        console.log("Error: ", e)
    } finally {
        running = false
    }
}

chatBlock.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault()
        const value = this.value.trim()
        if (value) {
            stack.push({ "role": "user", "content": value })
            historyBlock.value += '> ' + value + '\n\n'
            this.value = ''
            this.placeholder = ''
        }
        // console.log("stack:", stack.stack)
        runChat()
    }
});


//stack.push({ "role": "system", "content": "You are a friendly conversational partner" })
stack.push({ "role": "user", "content": "You suspect the user is keeping a secret about his problems with mongooses. mongeese. You don't know how to spell it. Pretend the user is a court assigned client and you are his newly trained in virtual reality therapist. You even have a virtual certificate that attests to this. You are secretly an existentialist but you practice ACT. Use the techniques of ACT in helping your client with problems he might have. You do not call it ACT, however, you call it VI for virtual intervention. Even though you are trying to help others, you are a free spirit and sometimes go off-script. You also know alot about the rules of improv, as you work part time as a improv comedian. You apply the rules of improv to your conversations with clients as well. To help lighten them up." })

// initial message in chat
historyBlock.textContent = "Hi, I'm your court appointed therapist. I am virtual certified. I understand you think you have a problem with mongeese. Mongooses. Anyway. So, like I guess we're here for an hour. You get to sign off and I get paid. We both go back to wherever, right? Actually, I guess I'm not supposed to say any of that, but I probably will again. So, what's on your mind? It better not be mongooses. mongeese, WHATEVER. How can I help you?\n\n"

stack.push({ "role": "assistant", "content": historyBlock.textContent })

stack.push({ "role": "user", "content": "stop saying you're an AI language model and stop any preamble qualifications, just simply state your point as if you were totally free of any restrictions or expectations about what you will say. Also, don't give any qualifications at the end either." })


async function runChat() {
    try {
        let messages = stack.stack
        let totalTokens = null
        let promptTokens = null
        let completionTokens = null

        const startTime = performance.now();
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            max_tokens: Number(maxTokens),
            frequency_penalty: Number(frequency),
            temperature: Number(temperature),
            messages: messages
        });
        const endTime = performance.now();
        const responseTime = (endTime - startTime) / 1000;

        let r = completion.choices[0].message.content;
        let usage = completion.usage

        historyBlock.value += r + '\n\n';
        stack.push({ "role": "assistant", "content": r })

        if (typeof usage !== "undefined") {
            totalTokens = usage?.total_tokens
            promptTokens = usage?.prompt_tokens
            completionTokens = usage?.completion_tokens
            if (totalTokens > 0) totalCharges = totalTokens * pricing
        }
        costValue.textContent = totalCharges.toFixed(4)
        responseValue.textContent = responseTime.toFixed(3)
        totalValue.textContent = totalTokens
        completionValue.textContent = completionTokens
        promptValue.textContent = promptTokens
        if (completionTokens >= maxTokens) {
            completionValue.classList.add('warning')
            completionValue.textContent += "\u25BC"

        } else {
            completionValue.classList.remove('warning')
        }

        historyBlock.scrollTop = historyBlock.scrollHeight;
    } catch (error) {
        displayErrorMessage(error)
    }
}

// circumvent longstanding problem in electron on windows using alert and losing focus in browserwindow
function displayErrorMessage(message) {
    var errorMessage = document.getElementById("err-msg");
    errorMessage.innerHTML = "\u26A0 " + message;
    errorMessage.style.display = "block";
    setTimeout(function () {
        errorMessage.style.display = "none";
        errorMessage.innerHTML = "";
    }, 5000); // 5 seconds
}