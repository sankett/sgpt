import { LitElement, html } from 'lit-element';
import { Configuration, OpenAIApi } from 'openai';
import { chatgptStyles } from './chatgptstyles.js';
import {marked} from 'marked';
import hljs from 'highlight.js';
import {unsafeHTML} from './unsafe-html.js';
//import { unsafeHTML } from 'lit-html/development/directives/unsafe-html';
//import { unsafeHTML } from 'https://jspm.dev/lit-html/directives/unsafe-html.js';


class ChatGPT extends LitElement { 

  

    static properties = {
        prompt: {},
        chatList: [],
        arr:[],
        responseData:{ 
          /*hasChanged(newVal, oldVal) {
            const hasChanged = newVal !== oldVal;            
            return hasChanged;
          },*/
        },
        timeInterval: {},
        loading: { type: Boolean },
        apikey: { type: String },
        openai: { type: Object },
        showSettings: { type: Boolean },
        errorMessage: { 
          hasChanged(newVal, oldVal) {
            const hasChanged = newVal !== oldVal;            
            return hasChanged;
          } },
        speechRecognition: {},
        transcript: {}

    };

    static styles = [chatgptStyles];


    constructor() {
        super();
        this.prompt =  'Compare in table format for USA, India, China in terms of population, GDP, economy';
        this.chatList = [];
        this.arr = [];
        this.responseData = '';
        this.timeInterval = null;
        this.loading = false;
        this.apikey = localStorage.getItem('openai-apikey');
        this.errorMessage = "";
        this.transcript = "";
        if(this.apikey === null || this.apikey === undefined || this.apikey === ''){
          this.showSettings = true;
        }
        else{
          this.showSettings = false;
          const configuration = new Configuration({
            apiKey: this.apikey,
          });
          this.openai = new OpenAIApi(configuration)
        }
        this.showSettings = false;

        this.speechInit()
        
    }

    get responseItem() {
      return this.renderRoot?.querySelector('#response') ?? null;
    }

      get input() {
        return this.renderRoot?.querySelector('#newitem') ?? null;
      }

    changePrompt(event) {          
      
      this.responseData = '' ;  
        this.prompt = event.target.value;
        this.errorMessage = event.target.value.length + " characters.";
    }

    async fetchData(url,payload) {
        return await fetch(url, {
            method: 'POST',
            headers: {
              "Authorization": 'Bearer ' + this.apikey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
    }

   scrollToBottom() {
    const element = this.renderRoot?.querySelector('#sgptResult');                
    element.scrollTop = element.scrollHeight;    
   }

   async moderation() {
    var payload = {
      input: this.prompt,
    }  
    var res = await  this.fetchData('http://localhost:4000/api/moderation',payload);
    const responseData = await res.json();
    var result = { message: "", code: -1};
    if(responseData.error === undefined){
      result.code = 0
    }
    else{
      result.code = 1;
      result.message = responseData.error.message ? responseData.error.message : "Something went wrong. Please try again";
    }
    return result;
   }
    
    loader() {
      let textContent = "Hold on, we're waiting for the server to respond. This shouldn't take too long";
      //this.responseData = textContent;
      this.responseItem.innerHTML = textContent;
      this.timeInterval = setInterval(() => {
          
          textContent += '.';        
          if (textContent === "Hold on, we're waiting for the server to respond. This shouldn't take too long......") {
              textContent = "Hold on, we're waiting for the server to respond. This shouldn't take too long";
          }
          //this.responseData = textContent;
          this.responseItem.innerHTML = textContent;
      }, 20);
      
    }

completion() {
      
      const self = this;
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:4000/api/chat");
      xhr.setRequestHeader("Content-Type", "application/json");
      let content = "";
      xhr.onreadystatechange = function () {
        
        if (xhr.readyState === 3) {
          console.log("datetime", new Date().toLocaleString());
          const newData = xhr.response.substr(xhr.seenBytes);             
          content =  newData;       
             
            self.responseItem.innerHTML = marked(content);
             self.scrollToBottom();
          
          
        }

        if (xhr.readyState === 4 && xhr.status === 200) {   
          console.log("datetime", new Date().toLocaleString());
          setTimeout(() => {
            self.scrollToBottom();      
            self.responseItem.innerHTML = " ";           
            self.chatList.push({"role": "assistant", "content": content});
            self.loading = false;            
            self.input.value = ""
          }, 20);
          
          
        }
      }
      let payload = {
        chatList: this.chatList
      };

      console.log("datetime", new Date().toLocaleString());
      xhr.send(JSON.stringify(payload));
    }
  

    async onSend(event)   {        
        this.responseData = "";
        this.errorMessage = "";
        const text =this.prompt;
        if(text === "" || text === null || text === undefined){
          this.errorMessage = "Please enter a prompt."
          return;
        }

        if(text.length < 6){
          this.errorMessage = "Please enter a valid data more than 6 characters."
          return;
        }
        this.loading = true;
        this.chatList.push({ "role": "user", "content": text});     
        this.responseItem.innerHTML = "Hold on, we're waiting for the server to respond. This shouldn't take too long";  
        this.scrollToBottom();
        this.requestUpdate();
       
        const result =  await this.moderation();
        
        if(result.code === 0){                 
            this.completion() 
                    
        }      
        else{
          this.responseItem.innerHTML = result.message;          
          this.loading = false;
        }  
    }

    onClear(event) {
        this.chatList = [];
        this.responseData = '';
        this.input.value = '';
        this.prompt = "";
        this.errorMessage = "";
        this.requestUpdate();
    }

   
    onSetting(event) {
      this.showSettings = true;
    }

    onSave(event) {
      
      if(this.apikey === null || this.apikey === undefined || this.apikey === ''){
        return;
      }
      localStorage.setItem('openai-apikey', this.apikey);
     
      this.openai = new OpenAIApi(new Configuration({
        apiKey: this.apikey,
      }))

      this.showSettings = false;
    }

    onCancel(event) {          
      
      if(this.apikey === null || this.apikey === undefined || this.apikey === ''){
        this.showSettings = true;
      }
      else{
        this.showSettings = false;
      }
      
  }

    changeKey(event) {           
        this.apikey = event.target.value;
    }

   formatcode(content){
    const regex = /```(.|\n)*?```/g;
    content = content.replace(regex, match => {
      const code = match.replace(/```/g, '');
      return `<code class="language-javascript">${code}</code>`;
    });
    return content;
   }

   renderMarkdown1(content) {
    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      },
    });
  
    return html`${marked(content)}`;
  }

   renderMarkdown(content) {
    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(lang, code).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      },
    });
  
    return html`${unsafeHTML(marked(content))}`;
  }

  speechInit(){
    if ("webkitSpeechRecognition" in window) {
      this.speechRecognition = new window.webkitSpeechRecognition();
          
      this.speechRecognition.continuous = true;
      //this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = "en-US";

      this.speechRecognition.onstart = () => {
        //document.querySelector("#status").style.display = "block";
        this.errorMessage  = "On start";
        this.prompt = "";
        this.transcript = "";
        this.requestUpdate();
      };
      this.speechRecognition.onerror = () => {
        //document.querySelector("#status").style.display = "none";
        //console.log("Speech Recognition Error");
        this.errorMessage  = "Speech Recognition Error";
      };
      this.speechRecognition.onend = () => {
        //document.querySelector("#status").style.display = "none";
        //console.log("Speech Recognition Ended");
        
        if(this.prompt.length >= 15) {
          this.errorMessage  = "Speech Recognition Ended";
          this.onSend()
          this.prompt = "";
          this.transcript ="";
        }
        else{
          this.errorMessage = "Prompt should be greater than 15"
        }
       
      };

      this.speechRecognition.onresult = (event) => {
        // get the latest result
        const result = event.results[event.results.length - 1];
        // get the transcript
       
        console.log(this.transcript)
                   
        
        this.prompt = result[0].transcript;
        setTimeout(() => {
          this.requestUpdate();
        },50)
       
      };

      
    }else {
      console.log("Speech Recognition Not Available")
    }
  }

  onStart() {
    
    this.speechRecognition.start();
  }

  onStop(){
    this.speechRecognition.stop();
    
    
  }
  render() {
      
      

      return html` 
        <div class="sgptContainer darkTheme">
            <div class="sgptHeader">
              <span class="headerLeft">ChatGPT Turbo</span>
              <span class="headerMiddle"><button class="customButton darkTheme" id="sgptButton" @click=${this.onSetting}>Settings</button></span>
              <span class="headerRight">
              <img src="https://storybook7.blob.core.windows.net/images/sanketterdal.png" alt="Sanket" 
              
              width="120" height="28"/>&nbsp;
              </span>
            </div>
           <div class="sgptSettings hideSettings">
           
              <input type="text" class="sgptKeyText darkTheme" id="apikey" placeholder="Enter API Key" 
              @input=${this.changeKey}
              value=${this.apikey} />

              <button class="customActionButton darkTheme"  @click=${this.onSave}>Save</button>
              <button class="customActionButton darkTheme"  @click=${this.onCancel}>Cancel</button><br>
             
           </div>
           <div class="sgptSettings">
           <a href="https://platform.openai.com/account/api-keys"  class="sgptLink"            
           target="_blank">Get OpenAI Key</a>
          </div>
           <div class="sgptResult ${this.showSettings ? 'hideSettings': 'showSettings'}" id="sgptResult">
              ${this.chatList.map((item) => html`<span class="${item.role === 'user' ? 'userspan' : 'assistspan darkresult' }">
              ${this.renderMarkdown(item.content)}</span>`)}
               
              <span class="responsespan darkresult" id="response">
              &nbsp;
              </span>
             
           </div>
           <div class="sgptCommand ${this.loading ? 'overlay' : '' } ${this.showSettings ? 'hideSettings': 'showSettings'}">
              <textarea class="sgptTextPrompt darkTheme" @input=${this.changePrompt} 
              id="newitem"  placeholder="Enter Prompt.."
              value=${this.prompt}>${this.prompt}</textarea>
                <div class="divAction">
                <span class="divActionLeft">
                <button class="sgptVoiceButton darkTheme" id="sgptButton3" @click=${this.onStart}>S</button>
                <button class="sgptVoiceButton darkTheme" id="sgptButton4" @click=${this.onStop}>E</button>
              </span>
                 
                  <span class="divActionCenter">${this.errorMessage} </span>
                  <span class="divActionRight">
                    <button class="sgptButton  darkTheme" id="sgptButton1" @click=${this.onSend} name="sgptButton">Send</button>
                    <button class="sgptButton sgptButtonMargin darkTheme" id="sgptButton2" @click=${this.onClear}>Clear</button>
                  </span>
                </div>
                
           </div>
           
        </div>
      `;
    }

   
  }
  
  customElements.define('sanket-chatgpt', ChatGPT);